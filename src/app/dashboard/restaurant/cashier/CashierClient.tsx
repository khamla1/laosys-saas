"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  History, Loader2, Printer, Banknote, ScanLine, Coffee, Lock, Unlock,
  Sparkles, Plus, Minus, Trash2, CreditCard, Utensils, Clock,
  Tag, RefreshCw, X, SplitSquareHorizontal, Map, PackagePlus, Search,
  PlusCircle, Receipt, ArrowRightLeft, Users, Check, AlertCircle,
  Percent, ChevronRight, Layers, FileText, CheckCircle2, ArrowRight,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  payTableOrder,
  createDemoTableOrdersAction,
  splitTableOrderAction,
  mergeTableOrdersAction
} from "@/app/actions/pos";
import { ActionModal, StatusPopup } from "@/components/ui/action-popup";
import Link from "next/link";

export default function CashierClient({
  orgSlug,
  storeInfo,
  paymentQrCode,
  promptPayId,
  paymentAccountInfo
}: {
  orgSlug?: string;
  storeInfo?: {
    name: string;
    slug?: string;
    logo?: string | null;
    phone?: string;
    address?: string;
    exchangeRateThb?: number;
    exchangeRateUsd?: number;
    receiptHeader?: string;
    receiptFooter?: string;
  };
  paymentQrCode?: string;
  promptPayId?: string;
  paymentAccountInfo?: string;
}) {
  const safeFormatDateTime = (input?: any): string => {
    try {
      const d = input ? new Date(input) : new Date();
      if (isNaN(d.getTime())) return "-";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return String(input || "-");
    }
  };

  const [tables, setTables] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected Table & Bill Index State
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "OCCUPIED" | "BILL_REQUESTED" | "STANDALONE">("ALL");

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [autoPrintAfterPay, setAutoPrintAfterPay] = useState(true);
  const [success, setSuccess] = useState(false);

  // Add Service / Item / Service Charge Modal
  const [serviceFeeModalOpen, setServiceFeeModalOpen] = useState(false);
  const [serviceModalTab, setServiceModalTab] = useState<"CUSTOM_ITEM" | "CATALOG" | "SERVICE_CHARGE">("CUSTOM_ITEM");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<string>("50000");
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customServiceFeeAmount, setCustomServiceFeeAmount] = useState<number>(20000);
  const [customServiceFeeLabel, setCustomServiceFeeLabel] = useState<string>("ຄ່າບໍລິການພິເສດ / ຄ່າເປີດຫ້ອງ");

  // Open New Bill Modal
  const [openBillModal, setOpenBillModal] = useState(false);
  const [newBillTableId, setNewBillTableId] = useState<string>("STANDALONE");
  const [newBillCustomerName, setNewBillCustomerName] = useState<string>("");
  const [newTableNameInput, setNewTableNameInput] = useState<string>("");

  // Split Bill Modal
  const [splitBillModalOpen, setSplitBillModalOpen] = useState(false);
  const [splitBillMode, setSplitBillMode] = useState<"ITEMS" | "EQUAL">("ITEMS");
  const [splitQuantities, setSplitQuantities] = useState<Record<string, number>>({});
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(2);

  // Merge Bill Modal
  const [mergeBillModalOpen, setMergeBillModalOpen] = useState(false);
  const [targetMergeTableId, setTargetMergeTableId] = useState<string>("");

  // Move Table Modal
  const [moveTableModalOpen, setMoveTableModalOpen] = useState(false);
  const [targetMoveTableId, setTargetMoveTableId] = useState<string>("");

  // Coupon / Discount State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Confirm Pay & Cancel Modals
  const [confirmPayModalOpen, setConfirmPayModalOpen] = useState(false);
  const [cancelTableModalOpen, setCancelTableModalOpen] = useState(false);

  // ─── BILL AUDIT HISTORY MODAL STATE ───
  const [billAuditModalOpen, setBillAuditModalOpen] = useState(false);
  const [billAuditLogs, setBillAuditLogs] = useState<any[]>([]);
  const [loadingBillAudit, setLoadingBillAudit] = useState(false);

  const openBillAuditModal = async (orderId?: string) => {
    if (!orderId) {
      toast.error("ບໍ່ພົບບິນ");
      return;
    }
    setBillAuditModalOpen(true);
    setLoadingBillAudit(true);
    try {
      const res = await fetch(`/api/audit?entityId=${encodeURIComponent(orderId)}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setBillAuditLogs(json.data || []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດປະຫວັດບິນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດປະຫວັດບິນ");
    } finally {
      setLoadingBillAudit(false);
    }
  };

  // ─── HIGH QUALITY PRINT PREVIEW MODAL STATE ───
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<"SLIP" | "A4">("SLIP");
  const [printScope, setPrintScope] = useState<"CURRENT" | "ALL_SPLIT" | "SUMMARY">("CURRENT");
  const [isReceiptPaid, setIsReceiptPaid] = useState(false);
  const [paidReceivedAmount, setPaidReceivedAmount] = useState<number>(0);
  const [paidChangeAmount, setPaidChangeAmount] = useState<number>(0);

  // Status popup
  const [statusPopup, setStatusPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
    actionButton?: {
      label: string;
      onClick: () => void;
    };
  }>({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  // Effective Store Branding & Currency Settings
  const effectiveStoreName = storeInfo?.name || orgSlug?.toUpperCase() || "RESTAURANT & BAR";
  const effectiveStoreLogo = storeInfo?.logo || null;
  const effectiveStorePhone = storeInfo?.phone || "";
  const effectiveStoreAddress = storeInfo?.address || "";
  const rateThb = storeInfo?.exchangeRateThb || 650;
  const rateUsd = storeInfo?.exchangeRateUsd || 22000;
  const effectiveStoreReceiptHeader = storeInfo?.receiptHeader || "";
  const effectiveStoreReceiptFooter = storeInfo?.receiptFooter || "";

  // Polling loop for active bills
  useEffect(() => {
    fetchActiveTables(true);

    const interval = setInterval(() => {
      const isAnyModalOpen =
        isProcessingPayment ||
        success ||
        serviceFeeModalOpen ||
        confirmPayModalOpen ||
        openBillModal ||
        splitBillModalOpen ||
        mergeBillModalOpen ||
        moveTableModalOpen ||
        cancelTableModalOpen ||
        printModalOpen;

      if (!isAnyModalOpen) {
        fetchActiveTables(false);
      }
    }, 4000);

    const handleSync = () => {
      fetchActiveTables(false);
    };
    window.addEventListener("refresh-orders", handleSync);
    window.addEventListener("new-orders-detected", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-orders", handleSync);
      window.removeEventListener("new-orders-detected", handleSync);
    };
  }, [
    isProcessingPayment,
    success,
    serviceFeeModalOpen,
    confirmPayModalOpen,
    openBillModal,
    splitBillModalOpen,
    mergeBillModalOpen,
    moveTableModalOpen,
    cancelTableModalOpen,
    printModalOpen
  ]);

  const fetchActiveTables = async (withMeta = false) => {
    try {
      const res = await fetch(withMeta ? "/api/restaurant/cashier?meta=true" : "/api/restaurant/cashier");
      if (res.ok) {
        const json = await res.json();
        const tableList = Array.isArray(json) ? json : (json.tables || []);
        setTables(tableList);

        if (!Array.isArray(json)) {
          if (json.allTables) setAllTables(json.allTables);
          if (json.products) setProducts(json.products);
        }

        setSelectedTable((prev: any) => {
          if (prev) {
            const updatedTable = tableList.find((t: any) => t.id === prev.id);
            return updatedTable || null;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to load cashier tables", error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = selectedTable?.orders || [];
  const activeOrder = activeOrders[selectedOrderIndex] || activeOrders[0] || null;
  const orderMeta = (activeOrder?.metadata as Record<string, any>) || {};
  const subtotal = activeOrder?.totalAmount || 0;

  const savedServiceFee = orderMeta.serviceFeeAmount > 0
    ? {
        label: orderMeta.serviceFeeLabel || "ຄ່າບໍລິການເສີມ (Service Charge)",
        amount: Number(orderMeta.serviceFeeAmount) || 0,
        type: orderMeta.serviceFeeType || "CUSTOM"
      }
    : null;

  const serviceFeeAmount = savedServiceFee?.amount || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalNetTotal = Math.max(0, subtotal + serviceFeeAmount - discountAmount);

  // Helper: Code39 SVG Barcode Generator (Pure SVG, zero dependency)
  const renderCode39SVG = (text: string, height = 30) => {
    const clean = text.toUpperCase().replace(/[^0-9A-Z\-]/g, "");
    const full = `*${clean}*`;
    const CODE39: Record<string, string> = {
      '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
      '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
      '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
      'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
      'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
      'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
      'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
      'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
      'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
      '-': '010000101', '*': '010010100'
    };

    const bars: { isBlack: boolean; width: number }[] = [];
    for (let i = 0; i < full.length; i++) {
      const pattern = CODE39[full[i]];
      if (!pattern) continue;
      for (let j = 0; j < 9; j++) {
        const isBlack = j % 2 === 0;
        const isWide = pattern[j] === '1';
        bars.push({ isBlack, width: isWide ? 2.5 : 1 });
      }
      if (i < full.length - 1) {
        bars.push({ isBlack: false, width: 1 });
      }
    }

    const totalWidth = bars.reduce((sum, b) => sum + b.width, 0);
    let currentX = 0;

    return (
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto max-h-7"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#000"
            />
          );
        })}
      </svg>
    );
  };

  // Quick preset suggestions for Cash Tendering
  const generateCashPresets = (total: number) => {
    if (total <= 0) return [];
    const presets = new Set<number>();
    presets.add(total); // Exact

    const roundedTo10k = Math.ceil(total / 10000) * 10000;
    if (roundedTo10k > total) presets.add(roundedTo10k);

    const roundedTo50k = Math.ceil(total / 50000) * 50000;
    if (roundedTo50k > total) presets.add(roundedTo50k);

    const roundedTo100k = Math.ceil(total / 100000) * 100000;
    if (roundedTo100k > total) presets.add(roundedTo100k);

    const roundedTo500k = Math.ceil(total / 500000) * 500000;
    if (roundedTo500k > total && roundedTo500k <= 2000000) presets.add(roundedTo500k);

    return Array.from(presets).sort((a, b) => a - b).slice(0, 5);
  };

  // 1. Lock / Unlock Table
  const handleLockTable = async (tableId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === "BILL_REQUESTED" ? "OCCUPIED" : "BILL_REQUESTED";
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOCK_TABLE",
          tableId,
          status: nextStatus
        })
      });
      if (res.ok) {
        await fetchActiveTables(false);
        toast.success(
          nextStatus === "BILL_REQUESTED"
            ? "ລັອກບິນເປັນສະຖານະ 'ລໍຖ້າເຊັກບິນ' ແລ້ວ"
            : "ປົດລັອກບິນກັບມາເປັນສະຖານະ 'ກຳລັງໃຊ້ບໍລິການ' ແລ້ວ"
        );
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໂຕະໄດ້");
      }
    } catch {
      toast.error("Failed to update table status");
    }
  };

  // 2. Open New Bill
  const handleOpenNewBill = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OPEN_NEW_BILL",
          tableId: newBillTableId,
          customerName: newBillCustomerName,
          newTableName: newTableNameInput
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOpenBillModal(false);
        setNewBillCustomerName("");
        setNewTableNameInput("");
        await fetchActiveTables(true);
        toast.success("ເປີດບິນໃໝ່ສຳເລັດແລ້ວ!");
      } else {
        toast.error(data.error || "ບໍ່ສາມາດເປີດບິນໃໝ່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເປີດບິນໃໝ່");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Create Demo Bills
  const handleCreateDemoBills = async () => {
    setActionLoading(true);
    try {
      const res = await createDemoTableOrdersAction();
      if (res.success) {
        await fetchActiveTables(true);
        toast.success("ສ້າງບິນຕົວຢ່າງສຳເລັດແລ້ວ!");
      } else {
        toast.error(res.error || "ບໍ່ສາມາດສ້າງບິນຕົວຢ່າງໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Add Store Product or Custom Service Item to Bill
  const handleAddItemToBill = async (opts: {
    productId?: string;
    customServiceName?: string;
    customServicePrice?: number;
    quantity?: number;
  }) => {
    if (!selectedTable) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ITEM_TO_BILL",
          orderId: activeOrder?.id,
          tableId: selectedTable.id,
          customerName: selectedTable.name,
          ...opts
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchActiveTables(true);
        toast.success("ເພີ່ມລາຍການເຂົ້າບິນສຳເລັດແລ້ວ!");
        if (opts.customServiceName) {
          setCustomItemName("");
          setCustomItemQty(1);
          setServiceFeeModalOpen(false);
        }
      } else {
        toast.error(data.error || "ບໍ່ສາມາດເພີ່ມລາຍການໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມລາຍການ");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Update Item Quantity in Bill
  const handleUpdateItemQty = async (itemId: string, newQty: number) => {
    if (!activeOrder) return;
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: newQty <= 0 ? "REMOVE_ITEM_FROM_BILL" : "UPDATE_ITEM_QTY",
          orderId: activeOrder.id,
          itemId,
          quantity: newQty
        })
      });
      if (res.ok) {
        await fetchActiveTables(false);
      } else {
        toast.error("ບໍ່ສາມາດອັບເດດຈຳນວນລາຍການໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // 6. Apply or Clear Service Fee
  const handleApplyServiceFee = async (type: "PERCENT_10" | "PERCENT_5" | "CUSTOM" | "CLEAR") => {
    if (!selectedTable || !activeOrder) {
      toast.error("ກະລຸນາເລືອກບິນກ່ອນ");
      return;
    }

    let feeAmount = 0;
    let label = "";

    if (type === "PERCENT_10") {
      feeAmount = Math.round(subtotal * 0.1);
      label = "ຄ່າບໍລິການ 10% (Service Charge)";
    } else if (type === "PERCENT_5") {
      feeAmount = Math.round(subtotal * 0.05);
      label = "ຄ່າບໍລິການ 5% (Service Charge)";
    } else if (type === "CUSTOM") {
      feeAmount = Math.max(0, Number(customServiceFeeAmount) || 0);
      label = customServiceFeeLabel.trim() || "ຄ່າບໍລິການພິເສດ (Custom Service Fee)";
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_SERVICE_FEE",
          orderId: activeOrder.id,
          serviceFeeAmount: type === "CLEAR" ? 0 : feeAmount,
          serviceFeeLabel: type === "CLEAR" ? null : label,
          serviceFeeType: type === "CLEAR" ? null : type
        })
      });

      if (res.ok) {
        await fetchActiveTables(false);
        setServiceFeeModalOpen(false);
        if (type !== "CLEAR") {
          toast.success(`ເພີ່ມ ${label} (+₭${feeAmount.toLocaleString()}) ສຳເລັດແລ້ວ!`);
        } else {
          toast.info("ຍົກເລີກຄ່າບໍລິການເສີມແລ້ວ");
        }
      } else {
        toast.error("ບໍ່ສາມາດບັນທຶກຄ່າບໍລິການໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຄ່າບໍລິການ");
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Apply Coupon / Discount
  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim() || !selectedTable || !activeOrder) return;
    setValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          orderAmount: activeOrder.totalAmount
        })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount
        });
        setCouponCodeInput("");
        toast.success(`ໃຊ້ຄູປອງ "${data.code}" ສ່ວນຫຼຸດ -₭${data.discountAmount.toLocaleString()} ສຳເລັດ!`);
      } else {
        setCouponError(data.error || "ລະຫັດຄູປອງບໍ່ຖືກຕ້ອງ");
      }
    } catch {
      setCouponError("ເກີດຂໍ້ຜິດພາດໃນການກວດສອບຄູປອງ");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Quick Percentage Discount helper
  const handleQuickPercentDiscount = (percent: number) => {
    if (!activeOrder) return;
    const disc = Math.round(subtotal * (percent / 100));
    setAppliedCoupon({
      code: `DISCOUNT ${percent}%`,
      discountAmount: disc
    });
    toast.success(`ນຳໃຊ້ສ່ວນຫຼຸດ ${percent}% (-₭${disc.toLocaleString()}) ສຳເລັດ!`);
  };

  // 8. SPLIT BILL LOGIC (Items or Equal)
  const openSplitModal = () => {
    setSplitQuantities({});
    setSplitPeopleCount(2);
    setSplitBillMode("ITEMS");
    setSplitBillModalOpen(true);
  };

  const handleSplitByItemsQtyChange = (itemId: string, maxQty: number, delta: number) => {
    setSplitQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const splitItemsTotal = (activeOrder?.items || activeOrder?.orderItems || []).reduce(
    (sum: number, item: any) => sum + (splitQuantities[item.id] || 0) * item.price,
    0
  );
  const remainingBillTotal = Math.max(0, subtotal - splitItemsTotal);

  const handleConfirmSplitBill = async () => {
    if (!activeOrder) return;
    setActionLoading(true);

    try {
      if (splitBillMode === "EQUAL") {
        const res = await splitTableOrderAction({
          orderId: activeOrder.id,
          itemsToSplit: [],
          peopleCount: splitPeopleCount,
          splitType: "EQUAL"
        });

        if (res.success) {
          setSplitBillModalOpen(false);
          await fetchActiveTables(false);
          setStatusPopup({
            open: true,
            title: `ແຍກບິນຫານເທົ່າກັນ ${splitPeopleCount} ທ່ານສຳເລັດ!`,
            message: `ແບ່ງເປັນ ${splitPeopleCount} ບິນຍ່ອຍ ທ່ານລະ ₭${Math.round(subtotal / splitPeopleCount).toLocaleString()} ຮຽບຮ້ອຍແລ້ວ. ທ່ານຕ້ອງການພິມທຸກບິນແຍກພ້ອມກັນເລີຍ ຫຼື ບໍ່?`,
            type: "success",
            actionButton: {
              label: "ພິມທຸກບິນແຍກດຽວນີ້",
              onClick: () => handleOpenPrintModal("ALL_SPLIT")
            }
          });
        } else {
          toast.error((res as any).error || "ບໍ່ສາມາດແຍກບິນໄດ້");
        }
      } else {
        const itemsToSplit = Object.entries(splitQuantities)
          .filter(([_, qty]) => qty > 0)
          .map(([id, quantity]) => ({ id, quantity }));

        if (itemsToSplit.length === 0) {
          toast.error("ກະລຸນາເລືອກລາຍການທີ່ຕ້ອງການແຍກໄປບິນໃໝ່ຢ່າງໜ້ອຍ 1 ລາຍການ");
          setActionLoading(false);
          return;
        }

        const res = await splitTableOrderAction({
          orderId: activeOrder.id,
          itemsToSplit,
          splitType: "ITEMS"
        });

        if (res.success) {
          setSplitBillModalOpen(false);
          setSplitQuantities({});
          await fetchActiveTables(false);
          setStatusPopup({
            open: true,
            title: "ແຍກບິນຕາມລາຍການສຳເລັດ!",
            message: `ສ້າງບິນໃໝ່ຍອດ ₭${splitItemsTotal.toLocaleString()} ແລະ ບິນເດີມເຫຼືອ ₭${remainingBillTotal.toLocaleString()} ສຳເລັດແລ້ວ. ທ່ານຕ້ອງການພິມທຸກບິນແຍກພ້ອມກັນເລີຍ ຫຼື ບໍ່?`,
            type: "success",
            actionButton: {
              label: "ພິມທຸກບິນແຍກດຽວນີ້",
              onClick: () => handleOpenPrintModal("ALL_SPLIT")
            }
          });
        } else {
          toast.error((res as any).error || "ບໍ່ສາມາດແຍກບິນໄດ້");
        }
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການແຍກບິນ");
    } finally {
      setActionLoading(false);
    }
  };

  // 9. MERGE BILL LOGIC
  const handleConfirmMergeBills = async () => {
    if (!activeOrder || !targetMergeTableId) {
      toast.error("ກະລຸນາເລືອກບິນ/ໂຕະທີ່ຕ້ອງການລວມ");
      return;
    }

    const targetTableObj = tables.find((t) => t.id === targetMergeTableId);
    const targetOrderId = targetTableObj?.orders?.[0]?.id;

    if (!targetOrderId) {
      toast.error("ບໍ່ພົບບິນປາຍທາງທີ່ຈະລວມ");
      return;
    }

    setActionLoading(true);
    try {
      const res = await mergeTableOrdersAction({
        primaryOrderId: targetOrderId,
        sourceOrderIds: [activeOrder.id]
      });

      if (res.success) {
        setMergeBillModalOpen(false);
        setTargetMergeTableId("");
        setSelectedTable(null);
        await fetchActiveTables(false);
        setStatusPopup({
          open: true,
          title: "ລວມບິນສຳເລັດແລ້ວ!",
          message: `ລວມລາຍການຂອງ "${selectedTable.name}" ເຂົ້າກັບ "${targetTableObj.name}" ຮຽບຮ້ອຍແລ້ວ`,
          type: "success"
        });
      } else {
        toast.error(res.error || "ບໍ່ສາມາດລວມບິນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລວມບິນ");
    } finally {
      setActionLoading(false);
    }
  };

  // 10. MOVE TABLE LOGIC
  const handleConfirmMoveTable = async () => {
    if (!selectedTable || !targetMoveTableId) {
      toast.error("ກະລຸນາເລືອກໂຕະປາຍທາງ");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MOVE_TABLE",
          sourceTableId: selectedTable.id,
          targetTableId: targetMoveTableId,
          orderId: activeOrder?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMoveTableModalOpen(false);
        setTargetMoveTableId("");
        setSelectedTable(null);
        await fetchActiveTables(true);
        setStatusPopup({
          open: true,
          title: "ຍ້າຍໂຕະສຳເລັດແລ້ວ!",
          message: `ຍ້າຍບິນຈາກ "${selectedTable.name}" ໄປໂຕະໃໝ່ຮຽບຮ້ອຍແລ້ວ`,
          type: "success"
        });
      } else {
        toast.error(data.error || "ບໍ່ສາມາດຍ້າຍໂຕະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍໂຕະ");
    } finally {
      setActionLoading(false);
    }
  };

  // 11. OPEN PRINT MODAL (Supports Single Slip, All Split Slips Batch, and Summary)
  const handleOpenPrintModal = (
    scope: "CURRENT" | "ALL_SPLIT" | "SUMMARY" = "CURRENT",
    isPaid = false,
    received = 0,
    change = 0
  ) => {
    if (!selectedTable) {
      toast.error("ກະລຸນາເລືອກບິນກ່ອນ");
      return;
    }
    setPrintScope(scope);
    setIsReceiptPaid(isPaid);
    setPaidReceivedAmount(received);
    setPaidChangeAmount(change);
    setPrintModalOpen(true);
  };

  // 12. PAY BILL & CLOSE TABLE
  const handlePayBill = async () => {
    if (!selectedTable || !activeOrder) {
      toast.error("ບໍ່ພົບບິນທີ່ຕ້ອງການຊຳລະເງິນ");
      return;
    }

    const receivedNum = Number(cashReceived) || finalNetTotal;
    const changeAmount = Math.max(0, receivedNum - finalNetTotal);

    setIsProcessingPayment(true);

    const result = await payTableOrder({
      orderId: activeOrder.id,
      tableId: selectedTable.id,
      paymentMethod,
      cashReceived: receivedNum,
      changeAmount,
      couponCode: appliedCoupon?.code,
      discountAmount: appliedCoupon?.discountAmount,
      serviceFeeAmount,
      serviceFeeLabel: savedServiceFee?.label,
      finalTotalAmount: finalNetTotal
    });

    setIsProcessingPayment(false);

    if (result.success) {
      setSuccess(true);
      setConfirmPayModalOpen(false);

      if (autoPrintAfterPay) {
        handleOpenPrintModal("CURRENT", true, receivedNum, changeAmount);
      }

      setStatusPopup({
        open: true,
        title: "ຊຳລະເງິນປິດບິນສຳເລັດ!",
        message: `ຮັບຊຳລະບິນ "${selectedTable.name}" ຍອດລວມ ₭${finalNetTotal.toLocaleString()} ຮຽບຮ້ອຍແລ້ວ`,
        type: "success",
      });

      setCashReceived("");
      setTimeout(() => {
        setSelectedTable(null);
        setSelectedOrderIndex(0);
        setAppliedCoupon(null);
        setSuccess(false);
        fetchActiveTables(true);
      }, 1200);
    } else {
      toast.error(result.error || "ເກີດຂໍ້ຜິດພາດໃນການຊຳລະເງິນ");
    }
  };

  // 13. CANCEL BILL
  const handleCancelTable = async () => {
    if (!selectedTable) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/restaurant/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_BILL",
          orderId: activeOrder?.id,
          tableId: selectedTable.id
        })
      });
      if (res.ok) {
        setCancelTableModalOpen(false);
        setStatusPopup({
          open: true,
          title: "ຍົກເລີກບິນສຳເລັດ!",
          message: `ຍົກເລີກບິນ ແລະ ຄືນສະຕັອກສິນຄ້າຂອງ "${selectedTable.name}" ຮຽບຮ້ອຍແລ້ວ`,
          type: "success",
        });
        setSelectedTable(null);
        setSelectedOrderIndex(0);
        setAppliedCoupon(null);
        await fetchActiveTables(true);
      } else {
        toast.error("ບໍ່ສາມາດຍົກເລີກບິນໄດ້");
      }
    } catch {
      toast.error("Failed to cancel table bill");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Tables based on Search and Tab
  const filteredTables = tables.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.zone?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orders?.some((o: any) =>
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (filterTab === "OCCUPIED") return t.orders?.length > 0 && t.status !== "BILL_REQUESTED";
    if (filterTab === "BILL_REQUESTED") return t.status === "BILL_REQUESTED";
    if (filterTab === "STANDALONE") return t.isStandaloneOrder;
    return true;
  });

  const filteredCatalog = products.filter((p) =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const availableMoveTables = allTables.filter(
    (t) => t.id !== selectedTable?.id && t.status === "AVAILABLE"
  );

  const availableMergeTables = tables.filter(
    (t) => t.id !== selectedTable?.id && t.orders?.length > 0
  );

  // Overall metric totals
  const totalOpenBillsCount = tables.length;
  const diningCount = tables.filter((t) => t.orders?.length > 0 && t.status !== "BILL_REQUESTED").length;
  const billRequestedCount = tables.filter((t) => t.status === "BILL_REQUESTED").length;
  const totalUnpaidAmount = tables.reduce((acc, t) => {
    return (
      acc +
      (t.orders || []).reduce((ordAcc: number, o: any) => {
        const m = (o.metadata as Record<string, any>) || {};
        return ordAcc + (o.totalAmount || 0) + (Number(m.serviceFeeAmount) || 0);
      }, 0)
    );
  }, 0);

  // Helper component to render a single 80mm slip (Luxury Rental-Card Style)
  const renderSingleThermalSlip = (
    order: any,
    index: number,
    totalSplitCount: number,
    isPaid: boolean,
    received: number,
    change: number
  ) => {
    const ordMeta = (order.metadata as Record<string, any>) || {};
    const ordSubtotal = order.totalAmount || 0;
    const ordFee = Number(ordMeta.serviceFeeAmount) || 0;
    const ordFeeLabel = ordMeta.serviceFeeLabel || "ຄ່າບໍລິການເສີມ";
    const ordNetTotal = Math.max(0, ordSubtotal + ordFee - (isPaid ? (order.discountAmount || 0) : discountAmount));
    const barcodeVal = `ORD-${order.id.slice(-6).toUpperCase()}`;

    return (
      <div
        key={order.id}
        className="split-slip-page bg-white text-zinc-950 rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-zinc-950 max-w-[340px] mx-auto text-xs font-sans space-y-3 leading-tight"
      >
        {/* Store Branding Header (Rental Card Style) */}
        <div className="text-center pb-2.5 border-b-2 border-dashed border-zinc-950 space-y-1">
          {effectiveStoreLogo ? (
            <img src={effectiveStoreLogo} alt={effectiveStoreName} className="h-10 mx-auto object-contain mb-1" />
          ) : (
            <div className="inline-block px-3 py-0.5 rounded-full bg-zinc-950 text-white text-[10px] font-black uppercase tracking-wider mb-1">
              {effectiveStoreName}
            </div>
          )}
          <h2 className="text-base font-black tracking-tight uppercase text-zinc-950">
            {effectiveStoreName}
          </h2>
          {effectiveStorePhone && (
            <p className="text-[10px] text-zinc-600 font-medium">
              ໂທ: {effectiveStorePhone}
            </p>
          )}
          {effectiveStoreAddress && (
            <p className="text-[9px] text-zinc-500 leading-tight max-w-[280px] mx-auto">
              {effectiveStoreAddress}
            </p>
          )}
          {effectiveStoreReceiptHeader && (
            <p className="text-[9px] text-purple-700 font-bold leading-tight">
              {effectiveStoreReceiptHeader}
            </p>
          )}

          {/* Receipt Title & Split Indicator Pill */}
          <div className="pt-1.5 flex flex-col items-center gap-1 border-t border-dotted border-zinc-300 mt-1">
            <span className="text-[12px] font-black text-zinc-950 uppercase tracking-wide">
              {isPaid ? "ໃບເສັດຮັບເງິນ (RECEIPT)" : "ໃບແຈ້ງຍອດ (PRE-BILL CHECK)"}
            </span>
            {totalSplitCount > 1 ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border-2 border-zinc-950 font-black text-[10px] bg-zinc-100 text-zinc-950 shadow-sm">
                <span>ບິນແຍກທີ #{index + 1} / {totalSplitCount}</span>
                <span className="text-zinc-500 font-normal">(Split {index + 1}/{totalSplitCount})</span>
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold text-[9px] border border-zinc-300">
                ບິນດ່ຽວ (Single Bill)
              </span>
            )}
          </div>
        </div>

        {/* Metadata Section */}
        <div className="py-1.5 border-b-2 border-dashed border-zinc-300 text-[11px] space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">ໂຕະ / ບິນ:</span>
            <strong className="font-black text-zinc-950">
              {selectedTable?.name} ({selectedTable?.zone?.name || "ທົ່ວໄປ"})
            </strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">ເລກທີບິນ (Ref):</span>
            <strong className="font-mono font-black text-zinc-950">#{barcodeVal}</strong>
          </div>
          {order.customerName && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">ລູກຄ້າ:</span>
              <span className="font-bold text-zinc-800">{order.customerName}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">ວັນທີ & ເວລາ:</span>
            <span className="font-mono text-zinc-800">
              {safeFormatDateTime(order.createdAt)}
            </span>
          </div>
          {isPaid && (
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-zinc-500">ວິທີຊຳລະ:</span>
              <span className="font-black text-emerald-800 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                {paymentMethod}
              </span>
            </div>
          )}
        </div>

        {/* Items List Table (Rental-Styled Table) */}
        <div className="py-1.5 border-b-2 border-zinc-950">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-950 text-left font-black text-zinc-700 uppercase text-[10px]">
                <th className="py-0.5">ລາຍການ</th>
                <th className="text-center py-0.5">ຈ/ນ</th>
                <th className="text-right py-0.5">ລວມ (₭)</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || order.orderItems || []).map((item: any, i: number) => (
                <tr key={item.id || i} className="border-b border-dashed border-zinc-200">
                  <td className="py-1 pr-1 font-medium text-zinc-900">
                    <div>{item.product?.name || "ບໍລິການເສີມ"}</div>
                    <div className="text-[9px] text-zinc-500 font-mono">
                      @₭{item.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-1 text-center font-mono">
                    <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-[10px] font-black border border-zinc-300">
                      x{item.quantity}
                    </span>
                  </td>
                  <td className="py-1 text-right font-mono font-black text-zinc-950">
                    ₭{(item.price * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Settlement Totals */}
        <div className="space-y-1 pt-1 border-b-2 border-dashed border-zinc-300 pb-2 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>ຍອດລວມ (Subtotal):</span>
            <span className="font-mono font-bold text-zinc-900">₭{ordSubtotal.toLocaleString()}</span>
          </div>
          {ordFee > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>+ {ordFeeLabel}:</span>
              <span className="font-mono font-bold">+₭{ordFee.toLocaleString()}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>- ສ່ວນຫຼຸດ ({appliedCoupon?.code || "Coupon"}):</span>
              <span className="font-mono font-bold">-₭{discountAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Highlighted Total Due Box (Rental Style) */}
          <div className="border-2 border-zinc-950 rounded-xl p-3 my-2 bg-zinc-50 text-center shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
              {isPaid ? "ຍອດທີ່ຊຳລະແລ້ວ (TOTAL PAID)" : "ຍອດຕ້ອງຊຳລະບິນນີ້ (TOTAL DUE)"}
            </p>
            <p className="text-2xl font-black mt-0.5 text-zinc-950 font-mono tracking-tight">
              ₭{ordNetTotal.toLocaleString()}
            </p>
            <div className="flex justify-center items-center gap-2.5 text-[10px] text-zinc-700 font-mono mt-1 pt-1 border-t border-dashed border-zinc-300 font-bold">
              <span className="bg-amber-100/90 text-amber-950 px-2 py-0.5 rounded border border-amber-300/80">
                ฿~{Math.round(ordNetTotal / rateThb).toLocaleString()} THB
              </span>
              <span>•</span>
              <span className="bg-emerald-100/90 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300/80">
                $~{(ordNetTotal / rateUsd).toFixed(2)} USD
              </span>
            </div>
          </div>

          {isPaid && paymentMethod === "CASH" && received > 0 && (
            <div className="pt-1 border-t border-dotted border-zinc-300 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>ຮັບເງິນສົດມາ:</span>
                <span className="font-mono font-bold">₭{received.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-900">
                <span>ເງິນທອນ:</span>
                <span className="font-mono font-black text-emerald-700">₭{change.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dual Barcode & QR Code Section */}
        <div className="pt-1 pb-1 border-b-2 border-dashed border-zinc-300 text-center space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide">
            ສະແກນ QR ຜ່ານ BCEL One / PromptPay
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white p-1 rounded-xl border-2 border-zinc-950 shrink-0 shadow-sm">
              <QRCodeSVG value={barcodeVal} size={64} level="M" />
            </div>
            <div className="flex-1 max-w-[170px]">
              {renderCode39SVG(barcodeVal, 30)}
              <div className="text-[10px] font-mono font-black tracking-widest text-zinc-900 mt-1">
                *{barcodeVal}*
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-[9px] text-zinc-500 font-sans text-center leading-tight pt-0.5 space-y-0.5">
          {effectiveStoreReceiptFooter ? (
            <p className="font-medium text-zinc-700">{effectiveStoreReceiptFooter}</p>
          ) : isPaid ? (
            <p>ໄດ້ຮັບຊຳລະເງິນຮຽບຮ້ອຍແລ້ວ • ຂໍຂອບໃຈທີ່ມາອຸດໜຸນ!</p>
          ) : (
            <p>ກະລຸນາກວດສອບລາຍການກ່ອນຊຳລະເງິນ • ຂໍຂອບໃຈທີ່ມາອຸດໜຸນ!</p>
          )}
          <p className="font-bold text-zinc-800">{effectiveStoreName} • POS System</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 pb-12">
      {/* ─── 1. TOP HEADER & METRIC KPI DASHBOARD ─── */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Cashier Hub & Billing
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: "5s" }} /> Auto-Sync Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>ຈັດການບິນ & ແຄດເຊຍ (Cashier Hub)</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ສູນກາງຈັດການບິນໂຕະ, ແຍກບິນຕາມລາຍການ, ຫານເທົ່າກັນ, ພິມທຸກບິນແຍກພ້ອມກັນ, ລວມບິນ, ຍ້າຍໂຕະ, ແອັດຄ່າບໍລິການ ແລະ ຮັບຊຳລະເງິນ
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenBillModal(true)}
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-600/25 border border-amber-400/40 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ ເປີດບິນໃໝ່</span>
            </button>

            <button
              type="button"
              onClick={handleCreateDemoBills}
              disabled={actionLoading}
              className="py-2.5 px-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700 transition-all flex items-center gap-1.5"
              title="ສ້າງບິນຕົວຢ່າງສຳລັບທົດລອງ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">ບິນຕົວຢ່າງ</span>
            </button>

            <Link
              href="/dashboard/pos"
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5"
            >
              <span>ໜ້າຂາຍ POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/dashboard/restaurant/zones"
              className="py-2.5 px-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700 transition-all flex items-center gap-1.5"
            >
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ຜັງໂຕະ</span>
            </Link>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-400 font-bold">ບິນທີ່ເປີດຢູ່ (Open)</p>
              <p className="text-xl font-black text-white">{totalOpenBillsCount} ບິນ</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-400 font-bold">ກຳລັງກິນ (Dining)</p>
              <p className="text-xl font-black text-emerald-400">{diningCount} ໂຕະ</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <Utensils className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-400 font-bold">ລໍຖ້າເຊັກບິນ (Wait Pay)</p>
              <p className="text-xl font-black text-amber-400">{billRequestedCount} ບິນ</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-400 font-bold">ຍອດລວມຄ້າງຊຳລະ (Unpaid)</p>
              <p className="text-xl font-black text-emerald-300">₭{totalUnpaidAmount.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN 2-COLUMN WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: ACTIVE BILLS & TABLES LIST */}
        <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col h-[780px]">
          <div className="space-y-3 pb-3 border-b border-zinc-800 mb-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>ລາຍການບິນ & ໂຕະ</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold">
                  {filteredTables.length}
                </span>
              </h2>

              <button
                onClick={() => fetchActiveTables(true)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title="ຣີເຟຣຊ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="ຄົ້ນຫາຊື່ໂຕະ, ລູກຄ້າ, ບິນ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-zinc-900 border-zinc-800 text-white text-xs rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-[11px] font-bold">
              {[
                { id: "ALL", label: "ທັງໝົດ" },
                { id: "OCCUPIED", label: "ກຳລັງກິນ" },
                { id: "BILL_REQUESTED", label: "ຂໍເຊັກບິນ" },
                { id: "STANDALONE", label: "ບິນດ່ວນ" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`py-1.5 rounded-xl transition-all text-center truncate ${
                    filterTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {loading && tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                <p className="text-xs">ກຳລັງໂຫຼດລາຍການບິນ...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-zinc-500 text-center p-6 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                <Coffee className="w-12 h-12 text-zinc-700" />
                <div>
                  <p className="text-white font-bold text-sm mb-1">ຍັງບໍ່ມີບິນໃນໝວດນີ້</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເປີດບິນໃໝ່ ຫຼື ສ້າງບິນຕົວຢ່າງທັນທີ
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpenBillModal(true)}
                    className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> ເປີດບິນໃໝ່
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateDemoBills}
                    disabled={actionLoading}
                    className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-zinc-700 transition-all"
                  >
                    ບິນຕົວຢ່າງ
                  </button>
                </div>
              </div>
            ) : (
              filteredTables.map((table) => {
                const tableOrders = table.orders || [];
                const isBillReq = table.status === "BILL_REQUESTED";
                const isSelected = selectedTable?.id === table.id;
                const itemCount = tableOrders.reduce(
                  (sum: number, ord: any) =>
                    sum + (ord.items || ord.orderItems || []).reduce((a: number, b: any) => a + b.quantity, 0),
                  0
                );
                const tableTotal = tableOrders.reduce((sum: number, ord: any) => {
                  const m = (ord.metadata as Record<string, any>) || {};
                  return sum + (ord.totalAmount || 0) + (Number(m.serviceFeeAmount) || 0);
                }, 0);

                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      setSelectedOrderIndex(0);
                      setCashReceived("");
                      setPaymentMethod("CASH");
                      setSuccess(false);
                      setCouponCodeInput("");
                      setAppliedCoupon(null);
                      setCouponError("");
                    }}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40"
                        : isBillReq
                        ? "bg-amber-950/25 border-amber-500/50 hover:border-amber-400"
                        : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                          isSelected
                            ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                            : isBillReq
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-zinc-800 text-white border-zinc-700"
                        }`}>
                          {table.isStandaloneOrder ? "POS" : table.name}
                        </span>

                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm truncate flex items-center gap-1.5 flex-wrap">
                            <span>{table.isStandaloneOrder ? table.name : `ໂຕະ ${table.name}`}</span>
                            {tableOrders.length > 1 && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-bold border border-purple-500/30">
                                {tableOrders.length} ບິນແຍກ
                              </span>
                            )}
                            {isBillReq && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> ຂໍເຊັກບິນ
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {table.zone?.name || "ທົ່ວໄປ (Indoor)"} • {itemCount} ລາຍການ
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-emerald-400">
                          ₭{tableTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-1.5">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tableOrders[0]?.createdAt
                          ? new Date(tableOrders[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "ເປີດມື້ນີ້"}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLockTable(table.id, table.status);
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1"
                      >
                        {isBillReq ? (
                          <>
                            <Unlock className="w-3 h-3" /> ປົດລັອກບິນ
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> ລັອກຂໍເຊັກບິນ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED BILL DETAILS, ACTIONS & CHECKOUT */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col h-[780px] overflow-hidden">
          {selectedTable ? (
            <>
              {/* BILL HEADER & ACTIONS TOOLBAR */}
              <div className="pb-3 border-b border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {selectedTable.isStandaloneOrder ? selectedTable.name : `ໂຕະ ${selectedTable.name}`}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                        {selectedTable.zone?.name || "Indoor (ໃນຮ້ານ)"}
                      </span>
                      {selectedTable.status === "BILL_REQUESTED" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ລໍຖ້າເຊັກບິນ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ບິນເລກອ້າງອີງ:{" "}
                      <span className="font-mono text-zinc-300">
                        #{activeOrder?.id?.slice(-8).toUpperCase() || "N/A"}
                      </span>
                      {activeOrder?.customerName && (
                        <span className="ml-2 text-emerald-400 font-medium">({activeOrder.customerName})</span>
                      )}
                    </p>
                  </div>

                  {/* Top Action Toolbar Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setServiceModalTab("CUSTOM_ITEM");
                        setServiceFeeModalOpen(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1"
                      title="ເພີ່ມຄ່າບໍລິການພິເສດ ຫຼື ສິນຄ້າເຂົ້າບິນ"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ ແອັດບໍລິການ</span>
                    </button>

                    <button
                      type="button"
                      onClick={openSplitModal}
                      className="py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1"
                      title="ແຍກບິນຕາມລາຍການ ຫຼື ຫານເທົ່າກັນ"
                    >
                      <SplitSquareHorizontal className="w-3.5 h-3.5 text-purple-300 stroke-[1.75]" />
                      <span>ແຍກບິນ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetMergeTableId("");
                        setMergeBillModalOpen(true);
                      }}
                      disabled={availableMergeTables.length === 0}
                      className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 text-xs font-bold border border-zinc-700 transition-all flex items-center gap-1"
                      title="ລວມບິນກັບໂຕະອື່ນ"
                    >
                      <Utensils className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">ລວມບິນ</span>
                    </button>

                    {!selectedTable.isStandaloneOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMoveTableId("");
                          setMoveTableModalOpen(true);
                        }}
                        disabled={availableMoveTables.length === 0}
                        className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 text-xs font-bold border border-zinc-700 transition-all flex items-center gap-1"
                        title="ຍ້າຍບິນໄປໂຕະຫວ່າງ"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">ຍ້າຍໂຕະ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openBillAuditModal(activeOrder?.id)}
                      className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-zinc-700 transition-all flex items-center gap-1"
                      title="ເບິ່ງປະຫວັດການແກ້ໄຂບິນນີ້ (Bill Audit History)"
                    >
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">ປະຫວັດບິນ</span>
                    </button>
                  </div>
                </div>

                {/* Multiple Split Orders Selector Tabs & Batch Print All Split Bills */}
                {activeOrders.length > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1 border-t border-zinc-800/80">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                      <span className="text-[11px] font-bold text-zinc-400 mr-1 shrink-0">ບິນຍ່ອຍ:</span>
                      {activeOrders.map((ord: any, i: number) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => setSelectedOrderIndex(i)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 ${
                            selectedOrderIndex === i
                              ? "bg-purple-600 text-white border-purple-400 shadow-md"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                          }`}
                        >
                          <Receipt className="w-3 h-3" />
                          <span>ບິນ #{i + 1} (₭{(ord.totalAmount || 0).toLocaleString()})</span>
                        </button>
                      ))}
                    </div>

                    {/* Batch Print All Split Slips Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPrintModal("ALL_SPLIT")}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-black flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                      title="ພິມທຸກບິນແຍກອອກມາພ້ອມກັນໃນບາດດຽວ"
                    >
                      <Printer className="w-3.5 h-3.5 text-purple-400" />
                      <span>ພິມທຸກບິນແຍກພ້ອມກັນ ({activeOrders.length} ບິນ)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ITEM ROWS LIST */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 pb-1 flex justify-between border-b border-zinc-800/60">
                  <span>ລາຍການສິນຄ້າ & ບໍລິການ ({ (activeOrder?.items || activeOrder?.orderItems || []).length })</span>
                  <span>ຈຳນວນ / ຍອດລວມ (₭)</span>
                </div>

                {!(activeOrder?.items || activeOrder?.orderItems) ||
                (activeOrder?.items || activeOrder?.orderItems).length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                    <p className="text-xs text-zinc-400">ຍັງບໍ່ມີລາຍການສິນຄ້າ ຫຼື ບໍລິການໃນບິນນີ້</p>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceModalTab("CUSTOM_ITEM");
                        setServiceFeeModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> + ແອັດບໍລິການ / ເພີ່ມສິນຄ້າ
                    </button>
                  </div>
                ) : (
                  (activeOrder.items || activeOrder.orderItems || []).map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:bg-zinc-900 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.product?.images?.[0] ? (
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-sm">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="w-8 h-8 rounded-lg bg-zinc-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                            x{item.quantity}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs sm:text-sm truncate">
                            {item.product?.name || "ລາຍການບໍລິການ"}
                          </p>
                          <p className="text-[11px] text-zinc-400">₭{item.price.toLocaleString()} / ໜ່ວຍ</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.id && (
                          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
                              title="ຫຼຸດຈຳນວນ"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-zinc-200 px-1">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
                              title="ເພີ່ມຈຳນວນ"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="font-mono font-bold text-white text-xs sm:text-sm min-w-[75px] text-right">
                          ₭{(item.price * item.quantity).toLocaleString()}
                        </div>

                        {item.id && (
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, 0)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                            title="ລົບລາຍການອອກຈາກບິນ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* TOTALS & DISCOUNTS SECTION */}
              <div className="border-t border-zinc-800 pt-3 space-y-2 bg-zinc-900/60 p-3.5 rounded-2xl mb-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">ຍອດລວມລາຍການ (Subtotal)</span>
                  <span className="font-bold text-white">₭{subtotal.toLocaleString()}</span>
                </div>

                {savedServiceFee && (
                  <div className="flex justify-between items-center text-xs bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {savedServiceFee.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-300">+₭{savedServiceFee.amount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleApplyServiceFee("CLEAR")}
                        className="text-zinc-400 hover:text-white"
                        title="ຍົກເລີກຄ່າບໍລິການ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-xs bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      ສ່ວນຫຼຸດ ({appliedCoupon.code})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">-₭{appliedCoupon.discountAmount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Discount Buttons & Coupon Input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex items-center gap-1">
                    {[5, 10, 15, 20].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleQuickPercentDiscount(p)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold border border-zinc-700 transition-colors"
                      >
                        -{p}%
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      placeholder="ລະຫັດຄູປອງ..."
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="h-7 bg-zinc-950 border-zinc-800 text-white text-[11px] rounded-lg"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCodeInput.trim()}
                      className="h-7 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded-lg shrink-0"
                    >
                      {validatingCoupon ? "..." : "ໃຊ້"}
                    </Button>
                  </div>
                </div>
                {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}

                {/* Final Net Total Display */}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                  <span className="text-sm font-extrabold text-white">ຍອດສຸດທິທີ່ຕ້ອງຊຳລະ (Net Total)</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ₭{finalNetTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* BOTTOM ACTIONS: PRINT PRE-BILL, BATCH PRINT ALL SPLITS, PAY, CANCEL */}
              <div className="grid grid-cols-12 gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => handleOpenPrintModal("CURRENT")}
                  className="col-span-3 h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-zinc-700"
                  title="ພິມໃບແຈ້ງຍອດບິນນີ້"
                >
                  <Printer className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">ພິມບິນ</span>
                </Button>

                {activeOrders.length > 1 ? (
                  <Button
                    type="button"
                    onClick={() => handleOpenPrintModal("ALL_SPLIT")}
                    className="col-span-3 h-12 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 border border-purple-500/40"
                    title="ພິມທຸກບິນແຍກອອກມາພ້ອມກັນໃນບາດດຽວ"
                  >
                    <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">ພິມທຸກບິນ ({activeOrders.length})</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleOpenPrintModal("SUMMARY")}
                    className="col-span-3 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-zinc-700"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">ສະຫຼຸບ</span>
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("CASH");
                    setCashReceived(String(finalNetTotal));
                    setConfirmPayModalOpen(true);
                  }}
                  className="col-span-4 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Banknote className="w-4 h-4" />
                  <span>ຊຳລະເງິນ</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setCancelTableModalOpen(true)}
                  className="col-span-2 h-12 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center border border-rose-500/30"
                  title="ຍົກເລີກບິນ"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-zinc-900 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-2xl">
                <Receipt className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">ເລືອກບິນ ຫຼື ເປີດບິນໃໝ່</h3>
              <p className="max-w-md mx-auto text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                ຄລິກເລືອກໂຕະ/ບິນທາງດ້ານຊ້າຍ ເພື່ອເບິ່ງລາຍການ, ແຍກບິນ, ພິມບິນແຍກທັງໝົດພ້ອມກັນ, ລວມບິນ, ຍ້າຍໂຕະ ແລະ ຮັບຊຳລະເງິນ
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpenBillModal(true)}
                  className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ ເປີດບິນໃໝ່ທັນທີ</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateDemoBills}
                  disabled={actionLoading}
                  className="py-2.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm border border-zinc-700 transition-all"
                >
                  ສ້າງບິນຕົວຢ່າງ (Demo)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: ADD SERVICE / STORE CATALOG / SERVICE CHARGE ─── */}
      {serviceFeeModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                ແອັດບໍລິການ & ສິນຄ້າ ({selectedTable.name})
              </h3>
              <button
                onClick={() => setServiceFeeModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-4">
              {[
                { id: "CUSTOM_ITEM", label: "ບໍລິການເສີມ", icon: Sparkles },
                { id: "CATALOG", label: "ສິນຄ້າໃນຮ້ານ", icon: PackagePlus },
                { id: "SERVICE_CHARGE", label: "Service Fee %", icon: CreditCard },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setServiceModalTab(t.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    serviceModalTab === t.id
                      ? "bg-amber-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {serviceModalTab === "CUSTOM_ITEM" && (
              <div className="space-y-4 mb-5">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-zinc-300">ຊື່ບໍລິການພິເສດ (Custom Service)</Label>
                    <Input
                      placeholder="ເຊັ່ນ: ຄ່າບໍລິການຫ້ອງ VIP, ຄ່າເປີດຂວດ, ຄ່າຊ່າງ..."
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-white font-bold text-sm rounded-xl h-10 mt-1"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "ຄ່າບໍລິການຫ້ອງ VIP", price: 100000 },
                      { name: "ຄ່າເປີດຂວດ (Corkage)", price: 50000 },
                      { name: "ຄ່າບໍລິການຊ່າງ / ຕິດຕັ້ງ", price: 80000 },
                      { name: "ຄ່າຈັດສົ່ງດ່ວນ", price: 30000 },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setCustomItemName(preset.name);
                          setCustomItemPrice(String(preset.price));
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors"
                      >
                        + {preset.name} (₭{preset.price.toLocaleString()})
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-zinc-300">ລາຄາຕໍ່ໜ່ວຍ (₭)</Label>
                      <Input
                        type="number"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-emerald-400 font-black text-base rounded-xl h-10 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-zinc-300">ຈຳນວນ</Label>
                      <Input
                        type="number"
                        min={1}
                        value={customItemQty}
                        onChange={(e) => setCustomItemQty(Math.max(1, Number(e.target.value) || 1))}
                        className="bg-zinc-950 border-zinc-800 text-white font-bold text-base rounded-xl h-10 mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={actionLoading || !customItemName.trim()}
                    onClick={() =>
                      handleAddItemToBill({
                        customServiceName: customItemName.trim(),
                        customServicePrice: Number(customItemPrice) || 0,
                        quantity: customItemQty,
                      })
                    }
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold rounded-xl shadow-lg"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ ເພີ່ມບໍລິການນີ້ເຂົ້າບິນ"}
                  </Button>
                </div>
              </div>
            )}

            {serviceModalTab === "CATALOG" && (
              <div className="space-y-3 mb-5">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="ຄົ້ນຫາສິນຄ້າໃນຮ້ານ..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs rounded-xl h-10"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredCatalog.length === 0 ? (
                    <p className="text-center text-xs text-zinc-500 py-6">ບໍ່ພົບສິນຄ້າ</p>
                  ) : (
                    filteredCatalog.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                          <p className="text-[11px] text-emerald-400 font-bold">
                            ₭{Number(prod.price).toLocaleString()}{" "}
                            <span className="text-zinc-500 font-normal">• ສະຕັອກ {prod.stock}</span>
                          </p>
                        </div>
                        <Button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleAddItemToBill({ productId: prod.id, quantity: 1 })}
                          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                        >
                          <Plus className="w-3 h-3 mr-1" /> ເພີ່ມ
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {serviceModalTab === "SERVICE_CHARGE" && (
              <div className="space-y-2.5 mb-5">
                <button
                  type="button"
                  onClick={() => handleApplyServiceFee("PERCENT_10")}
                  className="w-full p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-between text-left transition-all"
                >
                  <div>
                    <p className="font-bold text-white text-sm">ຄ່າບໍລິການ 10% (10% Service Charge)</p>
                    <p className="text-[11px] text-zinc-400">ຄິດຈາກຍອດລວມ ₭{subtotal.toLocaleString()}</p>
                  </div>
                  <span className="font-black text-amber-400 text-base">
                    +₭{Math.round(subtotal * 0.1).toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyServiceFee("PERCENT_5")}
                  className="w-full p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-between text-left transition-all"
                >
                  <div>
                    <p className="font-bold text-white text-sm">ຄ່າບໍລິການ 5% (5% Service Charge)</p>
                    <p className="text-[11px] text-zinc-400">ຄິດຈາກຍອດລວມ ₭{subtotal.toLocaleString()}</p>
                  </div>
                  <span className="font-black text-amber-400 text-base">
                    +₭{Math.round(subtotal * 0.05).toLocaleString()}
                  </span>
                </button>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-2">
                  <Label className="text-xs font-bold text-zinc-300">ກຳນົດຄ່າບໍລິການເອງ</Label>
                  <Input
                    placeholder="ຊື່ຄ່າບໍລິການ..."
                    value={customServiceFeeLabel}
                    onChange={(e) => setCustomServiceFeeLabel(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white text-xs rounded-xl h-9"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customServiceFeeAmount}
                      onChange={(e) => setCustomServiceFeeAmount(Number(e.target.value))}
                      className="bg-zinc-950 border-zinc-800 text-amber-400 font-bold text-sm rounded-xl h-10"
                    />
                    <Button
                      type="button"
                      onClick={() => handleApplyServiceFee("CUSTOM")}
                      className="h-10 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shrink-0"
                    >
                      ບັນທຶກ
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={() => setServiceFeeModalOpen(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
            >
              ປິດໜ້າຕ່າງ
            </Button>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: OPEN NEW BILL ─── */}
      {openBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                ເປີດບິນໃໝ່ / ບິນບໍລິການ
              </h3>
              <button onClick={() => setOpenBillModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-zinc-300">ຊື່ລູກຄ້າ / ຊື່ບິນ</Label>
                <Input
                  placeholder="ເຊັ່ນ: ລູກຄ້າໜ້າຮ້ານ, ຫ້ອງ VIP 1, ທ່ານ ສົມຊາຍ..."
                  value={newBillCustomerName}
                  onChange={(e) => setNewBillCustomerName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-10 mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-300">ເລືອກໂຕະ</Label>
                <select
                  value={newBillTableId}
                  onChange={(e) => setNewBillTableId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs px-3 mt-1"
                >
                  <option value="STANDALONE">ບິນໜ້າຮ້ານ / ບິນດ່ວນ (ບໍ່ລະບຸໂຕະ)</option>
                  {allTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      ໂຕະ {t.name} ({t.zone?.name || "Main"}) — {t.status === "AVAILABLE" ? "ວ່າງ" : "ເປີດຢູ່"}
                    </option>
                  ))}
                  <option value="NEW_TABLE">+ ສ້າງໂຕະໃໝ່...</option>
                </select>
              </div>

              {newBillTableId === "NEW_TABLE" && (
                <div>
                  <Label className="text-xs font-bold text-zinc-300">ຊື່ໂຕະໃໝ່</Label>
                  <Input
                    placeholder="ເຊັ່ນ: A01, VIP-1..."
                    value={newTableNameInput}
                    onChange={(e) => setNewTableNameInput(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-10 mt-1 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setOpenBillModal(false)}
                className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={handleOpenNewBill}
                className="flex-1 h-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ຢືນຢັນເປີດບິນ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: SPLIT BILL (ITEMS OR EQUAL) ─── */}
      {splitBillModalOpen && selectedTable && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <SplitSquareHorizontal className="w-5 h-5 text-purple-400 stroke-[1.75]" />
                  ແຍກບິນ (Split Bill) - {selectedTable.name}
                </h3>
                <p className="text-xs text-zinc-400">ເລືອກແຍກຕາມລາຍການສິນຄ້າ ຫຼື ຫານເທົ່າກັນຕາມຈຳນວນຄົນ</p>
              </div>
              <button
                type="button"
                onClick={() => setSplitBillModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 my-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSplitBillMode("ITEMS")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  splitBillMode === "ITEMS"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>ແຍກຕາມລາຍການສິນຄ້າ</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitBillMode("EQUAL")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  splitBillMode === "EQUAL"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ຫານເທົ່າກັນ (Split Equally)</span>
              </button>
            </div>

            {/* TAB 1: SPLIT BY ITEMS */}
            {splitBillMode === "ITEMS" && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400">ບິນເດີມເຫຼືອ: </span>
                    <span className="font-bold text-white">₭{remainingBillTotal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-bold">ບິນແຍກໃໝ່: </span>
                    <span className="font-black text-purple-400 text-sm">₭{splitItemsTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {(activeOrder.items || activeOrder.orderItems || []).map((item: any) => {
                    const currentMoved = splitQuantities[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{item.product?.name || "ລາຍການ"}</p>
                          <p className="text-[11px] text-zinc-400">
                            ທັງໝົດ {item.quantity} ໜ່ວຍ • ₭{item.price.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleSplitByItemsQtyChange(item.id, item.quantity, -1)}
                              className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-purple-400 px-2 min-w-[24px] text-center">
                              {currentMoved}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSplitByItemsQtyChange(item.id, item.quantity, 1)}
                              className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono min-w-[65px] text-right">
                            = ₭{(currentMoved * item.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SPLIT EQUALLY */}
            {splitBillMode === "EQUAL" && (
              <div className="space-y-4 my-2">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-400">ຍອດລວມບິນປະຈຸບັນ</p>
                  <p className="text-3xl font-black text-white">₭{subtotal.toLocaleString()}</p>
                  <p className="text-xs text-purple-400 font-bold">
                    ສະເລ່ຍທ່ານລະ ₭{Math.round(subtotal / splitPeopleCount).toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-zinc-300 mb-2 block">ເລືອກຈຳນວນຄົນທີ່ຫານ (People Count)</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {[2, 3, 4, 5, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitPeopleCount(num)}
                        className={`py-3 rounded-xl font-black text-sm border transition-all ${
                          splitPeopleCount === num
                            ? "bg-purple-600 text-white border-purple-400 shadow-md"
                            : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {num} ຄົນ
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-zinc-800 mt-4">
              <Button
                type="button"
                onClick={() => setSplitBillModalOpen(false)}
                className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                disabled={actionLoading || (splitBillMode === "ITEMS" && splitItemsTotal === 0)}
                onClick={handleConfirmSplitBill}
                className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ຢືນຢັນແຍກບິນດຽວນີ້"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: MERGE BILL ─── */}
      {mergeBillModalOpen && selectedTable && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-blue-400" />
                ລວມບິນ (Merge Bill)
              </h3>
              <button onClick={() => setMergeBillModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              ຍ້າຍລາຍການທັງໝົດຂອງ <span className="font-bold text-white">"{selectedTable.name}"</span> (₭{subtotal.toLocaleString()}) ໄປລວມກັບບິນປາຍທາງ
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {availableMergeTables.map((t) => {
                const ord = t.orders?.[0];
                return (
                  <div
                    key={t.id}
                    onClick={() => setTargetMergeTableId(t.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                      targetMergeTableId === t.id
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-[11px] text-zinc-400">{t.zone?.name || "ທົ່ວໄປ"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-400 text-sm">
                        ₭{(ord?.totalAmount || 0).toLocaleString()}
                      </p>
                      <span className="text-[10px] text-zinc-400">{ord?.items?.length || 0} ລາຍການ</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setMergeBillModalOpen(false)}
                className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                disabled={actionLoading || !targetMergeTableId}
                onClick={handleConfirmMergeBills}
                className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ຢືນຢັນລວມບິນ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: MOVE TABLE ─── */}
      {moveTableModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                ຍ້າຍໂຕະ (Move Table)
              </h3>
              <button onClick={() => setMoveTableModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              ຍ້າຍບິນຈາກ <span className="font-bold text-white">"{selectedTable.name}"</span> ໄປຍັງໂຕະທີ່ຫວ່າງ
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {availableMoveTables.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-6">ບໍ່ມີໂຕະຫວ່າງໃນຂະນະນີ້</p>
              ) : (
                availableMoveTables.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTargetMoveTableId(t.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                      targetMoveTableId === t.id
                        ? "bg-emerald-600/20 border-emerald-500 text-white"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">ໂຕະ {t.name}</p>
                      <p className="text-[11px] text-zinc-400">{t.zone?.name || "ທົ່ວໄປ"} • {t.seats || 4} ບ່ອນນັ່ງ</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">ຫວ່າງ (Available)</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setMoveTableModalOpen(false)}
                className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                disabled={actionLoading || !targetMoveTableId}
                onClick={handleConfirmMoveTable}
                className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ຢືນຢັນຍ້າຍໂຕະ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: CONFIRM PAYMENT & FAST TENDER ─── */}
      {confirmPayModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div>
                <h3 className="text-lg font-black text-white">ຊຳລະເງິນປິດບິນ: {selectedTable.name}</h3>
                <p className="text-xs text-zinc-400">ເລືອກຊ່ອງທາງການຊຳລະເງິນ ແລະ ຮັບເງິນຈາກລູກຄ້າ</p>
              </div>
              <button
                onClick={() => setConfirmPayModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl mb-4 text-center">
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider mb-1">ຍອດສຸດທິທີ່ຕ້ອງຊຳລະ (NET TOTAL)</p>
              <p className="text-3xl font-black text-emerald-400">₭{finalNetTotal.toLocaleString()}</p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: "CASH", label: "ເງິນສົດ (Cash)", icon: Banknote },
                { id: "PROMPTPAY", label: "ສະແກນ QR", icon: ScanLine },
                { id: "CREDIT_CARD", label: "ບັດ / ໂອນ", icon: CreditCard },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2.5 px-2 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                    paymentMethod === m.id
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Cash Tender UI with Quick Presets */}
            {paymentMethod === "CASH" && (
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4 space-y-3">
                <div>
                  <Label className="text-xs font-bold text-zinc-300">ຮັບເງິນສົດມາ (Cash Tendered ₭)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white font-black text-lg h-11 rounded-xl mt-1"
                  />
                </div>

                {/* Quick Cash Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {generateCashPresets(finalNetTotal).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashReceived(String(val))}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors ${
                        Number(cashReceived) === val
                          ? "bg-emerald-600 text-white border-emerald-400"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                      }`}
                    >
                      {val === finalNetTotal ? `ພໍດີ: ₭${val.toLocaleString()}` : `₭${val.toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {Number(cashReceived) >= finalNetTotal && (
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                    <span className="text-xs font-bold text-emerald-300">ເງິນທອນລູກຄ້າ (Change):</span>
                    <span className="text-lg font-black text-emerald-400">
                      ₭{(Number(cashReceived) - finalNetTotal).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QR Payment Code UI */}
            {paymentMethod === "PROMPTPAY" && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mb-4 text-center">
                <QRCodeSVG
                  value={paymentQrCode || promptPayId || "0000000000"}
                  size={150}
                  level="H"
                />
                <p className="text-xs text-zinc-800 font-bold mt-2">
                  ສະແກນ QR ເພື່ອຊຳລະ ₭{finalNetTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500">ກົດຢືນຢັນເມື່ອລູກຄ້າໂອນເງິນສຳເລັດ</p>
              </div>
            )}

            {/* Auto-print checkbox */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <input
                type="checkbox"
                id="autoPrintReceipt"
                checked={autoPrintAfterPay}
                onChange={(e) => setAutoPrintAfterPay(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-zinc-900 border-zinc-700 focus:ring-emerald-500"
              />
              <label htmlFor="autoPrintReceipt" className="text-xs text-zinc-300 cursor-pointer font-medium">
                ພິມໃບເສັດຮັບເງິນອັດຕະໂນມັດ (Auto Print Receipt)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setConfirmPayModalOpen(false)}
                className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                onClick={handlePayBill}
                disabled={isProcessingPayment || (paymentMethod === "CASH" && Number(cashReceived) < finalNetTotal)}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30"
              >
                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : "ຢືນຢັນຮັບເງິນປິດບິນ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: CANCEL BILL CONFIRMATION ─── */}
      <ActionModal
        isOpen={cancelTableModalOpen}
        onClose={() => setCancelTableModalOpen(false)}
        title="ຢືນຢັນການຍົກເລີກບິນ? (Confirm Cancel Bill)"
        description={
          selectedTable
            ? `ທ່ານຕ້ອງການຍົກເລີກບິນຂອງ "${selectedTable.name}" ແລະ ຄືນສະຕັອກສິນຄ້າ ຫຼື ບໍ່?`
            : ""
        }
        icon="delete"
        variant="danger"
        confirmText="ຢືນຢັນຍົກເລີກບິນ (Cancel Now)"
        cancelText="ກັບຄືນ"
        onConfirm={handleCancelTable}
      />

      {/* ─── MODAL 8: HIGH-QUALITY PRINT PREVIEW & BATCH SPLIT PRINT MODAL ─── */}
      {printModalOpen && selectedTable && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-3 sm:p-6 pt-16 sm:pt-10 overflow-y-auto bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto shrink-0">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    ຕົວຢ່າງກ່ອນພິມ (Print Slip Preview) - {selectedTable.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {printScope === "ALL_SPLIT"
                      ? `ພິມທຸກບິນແຍກພ້ອມກັນທັງໝົດ (${activeOrders.length} ບິນ)`
                      : printScope === "SUMMARY"
                      ? "ພິມໃບສະຫຼຸບຍອດບິນແຍກທັງໝົດ"
                      : `ພິມບິນ #${selectedOrderIndex + 1}`}
                  </p>
                </div>
              </div>

              {/* Controls: Scope & Format */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Print Scope Tabs (if multiple split orders) */}
                {activeOrders.length > 1 && (
                  <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPrintScope("ALL_SPLIT")}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        printScope === "ALL_SPLIT"
                          ? "bg-purple-600 text-white font-extrabold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      title="ພິມແຍກທຸກໃບຕໍ່ເນື່ອງໃນບາດດຽວ"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>ພິມທຸກບິນ ({activeOrders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintScope("SUMMARY")}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        printScope === "SUMMARY"
                          ? "bg-purple-600 text-white font-extrabold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ສະຫຼຸບລວມ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintScope("CURRENT")}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        printScope === "CURRENT"
                          ? "bg-purple-600 text-white font-extrabold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>ບິນ #{selectedOrderIndex + 1}</span>
                    </button>
                  </div>
                )}

                {/* Format Toggle (Slip 80mm vs A4) */}
                <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPrintFormat("SLIP")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      printFormat === "SLIP"
                        ? "bg-zinc-800 text-white border border-zinc-700"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat("A4")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      printFormat === "A4"
                        ? "bg-zinc-800 text-white border border-zinc-700"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    A4
                  </button>
                </div>

                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Preview Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-zinc-950/60 custom-scrollbar">
              <div id="printable-pos-slip" className="space-y-6">
                {/* 1. BATCH PRINT ALL SPLIT SLIPS IN SEQUENCE */}
                {printScope === "ALL_SPLIT" && activeOrders.length > 1 ? (
                  <div className="space-y-6">
                    <div className="text-center pb-2 no-print">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        ພິມທຸກບິນແຍກ ({activeOrders.length} ໃບ) - ລະບົບຈະພິມຕໍ່ກັນ ແລະ ຕັດເຈ້ຍແຕ່ລະບິນໃຫ້ອັດຕະໂນມັດ
                      </span>
                    </div>

                    {activeOrders.map((ord: any, idx: number) =>
                      renderSingleThermalSlip(ord, idx, activeOrders.length, isReceiptPaid, paidReceivedAmount, paidChangeAmount)
                    )}
                  </div>
                ) : printScope === "SUMMARY" && activeOrders.length > 1 ? (
                  /* 2. COMBINED SPLIT BILL SUMMARY SLIP */
                  <div className="bg-white text-zinc-950 rounded-2xl p-5 shadow-2xl border-2 border-zinc-950 max-w-[340px] mx-auto text-xs font-sans space-y-3 leading-tight">
                    <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3">
                      {effectiveStoreLogo ? (
                        <img src={effectiveStoreLogo} alt={effectiveStoreName} className="h-10 mx-auto object-contain mb-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-950 text-white font-black text-sm flex items-center justify-center mx-auto mb-1">
                          {effectiveStoreName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <h2 className="text-base font-black tracking-tight uppercase text-zinc-950">
                        {effectiveStoreName}
                      </h2>
                      <div className="pt-1 uppercase border-t border-dotted border-zinc-300 mt-1">
                        <span className="text-[12px] font-black text-zinc-950 block">
                          ໃບສະຫຼຸບຍອດບິນແຍກທັງໝົດ
                        </span>
                        <span className="text-[9px] text-zinc-500 font-sans block">
                          (CONSOLIDATED SPLIT BILLS SUMMARY)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ໂຕະ / ບິນ:</span>
                        <strong className="font-bold">{selectedTable.name} ({selectedTable.zone?.name || "ທົ່ວໄປ"})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ຈຳນວນບິນແຍກ:</span>
                        <strong className="font-bold text-purple-700">{activeOrders.length} ບິນຍ່ອຍ</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ວັນທີ:</span>
                        <span>{safeFormatDateTime()}</span>
                      </div>
                    </div>

                    {/* Breakdown of each split bill */}
                    <div className="space-y-2.5 border-b border-dashed border-zinc-300 pb-3 font-sans">
                      {activeOrders.map((ord: any, i: number) => {
                        const m = (ord.metadata as Record<string, any>) || {};
                        const ordFee = Number(m.serviceFeeAmount) || 0;
                        const total = (ord.totalAmount || 0) + ordFee;
                        return (
                          <div key={ord.id} className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-900 border-b border-zinc-200 pb-1">
                              <span className="flex items-center gap-1">
                                <Receipt className="w-3 h-3 text-purple-600" />
                                <span>ບິນ #{i + 1} ({ord.customerName || `ແຍກ ${i + 1}`})</span>
                              </span>
                              <span className="font-mono text-purple-700 font-black">₭{total.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-zinc-600 space-y-0.5 pt-0.5">
                              {(ord.items || ord.orderItems || []).map((it: any, j: number) => (
                                <div key={j} className="flex justify-between">
                                  <span className="truncate max-w-[180px]">{it.product?.name || "ລາຍການ"} x{it.quantity}</span>
                                  <span className="font-mono">₭{(it.price * it.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grand Total (Rental Style with Multi-Currency) */}
                    {(() => {
                      const grandTotal = activeOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                      return (
                        <div className="space-y-2 pt-1 border-b-2 border-dashed border-zinc-300 pb-2.5">
                          <div className="border-2 border-zinc-950 rounded-xl p-3 bg-zinc-50 text-center shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                              ຍອດລວມທຸກບິນແຍກ (CONSOLIDATED TOTAL)
                            </p>
                            <p className="text-2xl font-black mt-0.5 text-zinc-950 font-mono">
                              ₭{grandTotal.toLocaleString()}
                            </p>
                            <div className="flex justify-center items-center gap-2.5 text-[10px] text-zinc-700 font-mono mt-1 pt-1 border-t border-dashed border-zinc-300 font-bold">
                              <span className="bg-amber-100/90 text-amber-950 px-2 py-0.5 rounded border border-amber-300/80">
                                ฿~{Math.round(grandTotal / rateThb).toLocaleString()} THB
                              </span>
                              <span>•</span>
                              <span className="bg-emerald-100/90 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300/80">
                                $~{(grandTotal / rateUsd).toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="text-[9px] text-zinc-500 font-sans text-center leading-tight pt-1">
                      <p>ໃບສະຫຼຸບລວມສຳລັບກວດສອບຍອດບິນແຍກທັງໝົດຂອງໂຕະ</p>
                      <p className="font-bold text-zinc-800 mt-1">{effectiveStoreName} • SaaS POS</p>
                    </div>
                  </div>
                ) : (
                  /* 3. SINGLE THERMAL SLIP */
                  renderSingleThermalSlip(
                    activeOrder,
                    selectedOrderIndex,
                    activeOrders.length,
                    isReceiptPaid,
                    paidReceivedAmount,
                    paidChangeAmount
                  )
                )}
              </div>
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                <span>ຮູບແບບ: </span>
                <strong className="text-white">
                  {printFormat === "SLIP" ? "ເຈ້ຍຄວາມຮ້ອນ 80mm" : "ເຈ້ຍລາຍງານ A4"}
                </strong>
                {printScope === "ALL_SPLIT" && (
                  <span className="ml-2 text-purple-400 font-bold">
                    • ພິມຕໍ່ກັນ {activeOrders.length} ບິນ
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  ປິດໜ້າຕ່າງ
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {printScope === "ALL_SPLIT"
                      ? `ພິມທຸກບິນແຍກດຽວນີ້ (${activeOrders.length} ໃບ)`
                      : "ພິມບິນ (Print Now)"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 9: BILL AUDIT HISTORY MODAL ─── */}
      {billAuditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    ປະຫວັດການແກ້ໄຂບິນ (Bill Audit Trail)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {selectedTable?.name} • ບິນ #{activeOrder?.id?.slice(-6)?.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBillAuditModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar">
              {loadingBillAudit ? (
                <div className="py-12 text-center text-zinc-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                  <span>ກຳລັງໂຫຼດປະຫວັດບິນ...</span>
                </div>
              ) : billAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-zinc-400">ບໍ່ພົບປະຫວັດການແກ້ໄຂສຳລັບບິນນີ້</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">ທຸກການດຳເນີນງານໃໝ່ຈະຖືກບັນທຶກອັດຕະໂນມັດ</p>
                </div>
              ) : (
                billAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-cyan-400 font-mono font-bold text-[10px] border border-zinc-700">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {safeFormatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-zinc-200 font-medium">{log.details}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                      <span>ໂດຍ: {log.user?.name || "System"}</span>
                      {log.user?.role && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {log.user.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center text-xs">
              <Link
                href="/dashboard/audit-logs"
                className="text-cyan-400 hover:underline font-bold flex items-center gap-1"
                onClick={() => setBillAuditModalOpen(false)}
              >
                <span>ເບິ່ງປະຫວັດທັງໝົດໃນລະບົບ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setBillAuditModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GLOBAL PRINT STYLES (For 80mm Slip and Batch Split Slips) ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pos-slip,
          #printable-pos-slip * {
            visibility: visible !important;
          }
          #printable-pos-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printFormat === "SLIP" ? "80mm" : "100%"} !important;
            max-width: ${printFormat === "SLIP" ? "80mm" : "210mm"} !important;
            margin: 0 auto !important;
            padding: ${printFormat === "SLIP" ? "4mm 2mm" : "15mm"} !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          .split-slip-page {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 25px !important;
            padding-bottom: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Status Popup Notification */}
      <StatusPopup
        isOpen={statusPopup.open}
        onClose={() => setStatusPopup({ ...statusPopup, open: false })}
        title={statusPopup.title}
        message={statusPopup.message}
        type={statusPopup.type}
      />
    </div>
  );
}
