"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  SplitSquareHorizontal,
  Merge,
  ArrowRight,
  ArrowLeft,
  Users,
  Utensils,
  DollarSign,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Check,
  Receipt,
  ArrowLeftRight,
  Printer,
  Minus,
  Plus,
  FileText,
  Copy,
  Trash2,
  Wallet,
  Banknote,
  QrCode,
  CreditCard,
  Eye,
  ShieldCheck
} from "lucide-react";
import {
  splitTableOrderAction,
  mergeTableOrdersAction,
  createDemoTableOrdersAction,
  clearStuckPOSOrdersAction,
  deletePOSOrderAction,
  payTableOrder
} from "@/app/actions/pos";

export interface OrderItemData {
  id: string;
  quantity: number;
  price: number;
  productId: string;
  status: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image?: string | null;
  };
}

export interface OrderData {
  id: string;
  totalAmount: number;
  status: string;
  customerName?: string | null;
  tableId?: string | null;
  table?: {
    id: string;
    name: string;
    seats?: number;
    zone?: { id: string; name: string };
  } | null;
  items: OrderItemData[];
  createdAt: string | Date;
}

export interface TableData {
  id: string;
  name: string;
  seats?: number;
  status: string;
  zone?: { id: string; name: string };
  orders: OrderData[];
}

interface SplitMergeBillClientProps {
  orders: OrderData[];
  tables: TableData[];
  t: any;
  sellerId: string;
}

export function SplitMergeBillClient({
  orders,
  tables,
  t,
  sellerId
}: SplitMergeBillClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active workflow tab: 'split' | 'merge'
  const [activeTab, setActiveTab] = useState<"split" | "merge">("split");

  // --- SPLIT BILL STATE ---
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>("ALL");
  const [splitMode, setSplitMode] = useState<"ITEMS" | "EQUAL">("ITEMS");
  const [peopleCount, setPeopleCount] = useState<number>(2);

  // --- PRINT SPLIT BILL STATE ---
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printOption, setPrintOption] = useState<"ALL" | "CHECK_1" | "CHECK_2" | "SUMMARY">("ALL");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printTime, setPrintTime] = useState("");

  useEffect(() => {
    setPrintTime(new Date().toLocaleString("lo-LA"));
  }, []);

  const executePrintSplitBill = () => {
    setPrintTime(new Date().toLocaleString("lo-LA"));
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: auto;
          margin: 0mm;
        }
        body * {
          visibility: hidden !important;
        }
        .print-split-receipt,
        .print-split-receipt * {
          visibility: visible !important;
        }
        .print-split-receipt {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 80mm !important;
          padding: 6mm 3mm !important;
          margin: 0 auto !important;
          background: white !important;
          color: black !important;
          z-index: 999999 !important;
        }
        .print-receipt-slip {
          page-break-after: always !important;
          break-after: page !important;
          margin-bottom: 24px !important;
          padding-bottom: 20px !important;
          border-bottom: 2px dashed #000 !important;
        }
        .print-receipt-slip:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
          border-bottom: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      style.remove();
      setPrintModalOpen(false);
    }, 150);
  };

  // Map of orderItemId => quantity moved to new check
  const [splitQuantities, setSplitQuantities] = useState<Record<string, number>>({});

  // --- MERGE BILL STATE ---
  const [selectedOrderIdsForMerge, setSelectedOrderIdsForMerge] = useState<string[]>([]);
  const [primaryOrderIdForMerge, setPrimaryOrderIdForMerge] = useState<string | null>(null);

  // --- PAYMENT / CHECKOUT MODAL STATE ---
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payOrder, setPayOrder] = useState<OrderData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");
  const [cashReceived, setCashReceived] = useState<string>("");

  const handleOpenPayModal = (order: OrderData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPayOrder(order);
    setPaymentMethod("CASH");
    setCashReceived(order.totalAmount.toString());
    setPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!payOrder) return;
    startTransition(async () => {
      toast.loading("ກຳລັງບັນທຶກການຊຳລະເງິນແລະປິດໂຕະ...", { id: "pay-order" });
      try {
        const receivedNum = parseFloat(cashReceived) || payOrder.totalAmount;
        const changeNum = Math.max(0, receivedNum - payOrder.totalAmount);
        const res = await payTableOrder({
          orderId: payOrder.id,
          tableId: payOrder.tableId || payOrder.table?.id || "",
          paymentMethod,
          cashReceived: receivedNum,
          changeAmount: changeNum
        });
        if (res && !(res as any).error) {
          toast.success("ຊຳລະເງິນສຳເລັດ! ປິດໂຕະຮຽບຮ້ອຍແລ້ວ (Payment Complete)", { id: "pay-order" });
          setPayModalOpen(false);
          setPayOrder(null);
          router.refresh();
        } else {
          toast.error((res as any)?.error || "ບໍ່ສາມາດຊຳລະເງິນໄດ້", { id: "pay-order" });
        }
      } catch (e: any) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການຊຳລະເງິນ", { id: "pay-order" });
      }
    });
  };

  const distinctTables = Array.from(
    new Map(
      orders
        .filter((o) => o.table && o.table.id)
        .map((o) => [o.table!.id, o.table!])
    ).values()
  );

  const filteredOrders = orders.filter((o) => {
    if (selectedTableFilter === "ALL") return true;
    if (selectedTableFilter === "NONE") return !o.tableId && !o.table;
    return o.tableId === selectedTableFilter || o.table?.id === selectedTableFilter;
  });

  const activeOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) ||
    orders.find((o) => o.id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  useEffect(() => {
    if (filteredOrders.length > 0 && !filteredOrders.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
      setSplitQuantities({});
    }
  }, [selectedTableFilter, filteredOrders, selectedOrderId]);

  // Handler: Move 1 item to New Split Bill
  const handleMoveToNew = (itemId: string, maxQty: number) => {
    setSplitQuantities((prev) => {
      const current = prev[itemId] || 0;
      if (current >= maxQty) return prev;
      return { ...prev, [itemId]: current + 1 };
    });
  };

  // Handler: Move 1 item back to Original Bill
  const handleMoveToOriginal = (itemId: string) => {
    setSplitQuantities((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 0) return prev;
      const nextQty = current - 1;
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  // Calculate totals for Split by Items
  const originalSubtotal = activeOrder
    ? activeOrder.items.reduce((acc, item) => {
        const moved = splitQuantities[item.id] || 0;
        const remaining = item.quantity - moved;
        return acc + remaining * item.price;
      }, 0)
    : 0;

  const newSplitSubtotal = activeOrder
    ? activeOrder.items.reduce((acc, item) => {
        const moved = splitQuantities[item.id] || 0;
        return acc + moved * item.price;
      }, 0)
    : 0;

  const totalMovedItemsCount = Object.values(splitQuantities).reduce((a, b) => a + b, 0);

  // Submit: Confirm Split
  const handleConfirmSplit = () => {
    if (!activeOrder) return;
    if (splitMode === "ITEMS" && totalMovedItemsCount === 0) {
      toast.error("ກະລຸນາເລືອກລາຍການອາຫານທີ່ຕ້ອງການແຍກອອກຢ່າງໜ້ອຍ 1 ລາຍການ");
      return;
    }

    startTransition(async () => {
      toast.loading("ກຳລັງດຳເນີນການແຍກບິນ...", { id: "split-bill" });
      try {
        const itemsToSplit = Object.entries(splitQuantities).map(([id, quantity]) => ({
          id,
          quantity
        }));

        const res = await splitTableOrderAction({
          orderId: activeOrder.id,
          itemsToSplit,
          splitType: splitMode,
          peopleCount: splitMode === "EQUAL" ? peopleCount : undefined
        });

        if (res.success) {
          toast.success("ແຍກບິນສຳເລັດແລ້ວ (Bill Split Successfully)!", { id: "split-bill" });
          setSplitQuantities({});
          router.refresh();
        } else {
          toast.error((res as any).error || "ບໍ່ສາມາດແຍກບິນໄດ້", { id: "split-bill" });
        }
      } catch (e: any) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການແຍກບິນ", { id: "split-bill" });
      }
    });
  };

  // Toggle order selection for Merge
  const handleToggleMergeSelection = (orderId: string) => {
    setSelectedOrderIdsForMerge((prev) => {
      const exists = prev.includes(orderId);
      const next = exists ? prev.filter((id) => id !== orderId) : [...prev, orderId];

      // Auto-set primary order if none selected
      if (next.length > 0 && (!primaryOrderIdForMerge || !next.includes(primaryOrderIdForMerge))) {
        setPrimaryOrderIdForMerge(next[0]);
      } else if (next.length === 0) {
        setPrimaryOrderIdForMerge(null);
      }
      return next;
    });
  };

  // Calculate totals for Merge
  const mergedOrdersList = orders.filter((o) => selectedOrderIdsForMerge.includes(o.id));
  const mergedTotalAmount = mergedOrdersList.reduce((acc, o) => acc + o.totalAmount, 0);
  const mergedTotalItemsCount = mergedOrdersList.reduce(
    (acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Submit: Confirm Merge
  const handleConfirmMerge = () => {
    if (selectedOrderIdsForMerge.length < 2 || !primaryOrderIdForMerge) {
      toast.error("ກະລຸນາເລືອກບິນທີ່ຕ້ອງການລວມຢ່າງໜ້ອຍ 2 ບິນຂຶ້ນໄປ");
      return;
    }

    startTransition(async () => {
      toast.loading("ກຳລັງລວມບິນ...", { id: "merge-bill" });
      try {
        const sourceIds = selectedOrderIdsForMerge.filter((id) => id !== primaryOrderIdForMerge);
        const res = await mergeTableOrdersAction({
          primaryOrderId: primaryOrderIdForMerge,
          sourceOrderIds: sourceIds
        });

        if (res.success) {
          toast.success("ລວມບິນສຳເລັດແລ້ວ (Bills Merged Successfully)!", { id: "merge-bill" });
          setSelectedOrderIdsForMerge([]);
          setPrimaryOrderIdForMerge(null);
          router.refresh();
        } else {
          toast.error(res.error || "ບໍ່ສາມາດລວມບິນໄດ້", { id: "merge-bill" });
        }
      } catch (e: any) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການລວມບິນ", { id: "merge-bill" });
      }
    });
  };

  // Create Demo Orders
  const handleCreateDemoOrders = () => {
    startTransition(async () => {
      toast.loading("ກຳລັງສ້າງບິນຕົວຢ່າງໃນຖານຂໍ້ມູນ...", { id: "demo-orders" });
      try {
        const res = await createDemoTableOrdersAction();
        if (res.success) {
          toast.success("ສ້າງບິນຕົວຢ່າງສຳເລັດແລ້ວ! ພ້ອມທົດສອບແຍກບິນ/ລວມບິນ", {
            id: "demo-orders"
          });
          router.refresh();
        } else {
          toast.error(res.error || "ບໍ່ສາມາດສ້າງບິນຕົວຢ່າງໄດ້", { id: "demo-orders" });
        }
      } catch (e: any) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການສ້າງບິນຕົວຢ່າງ", { id: "demo-orders" });
      }
    });
  };

  // Clear all stuck or test orders
  const handleClearStuckOrders = () => {
    startTransition(async () => {
      toast.loading("ກຳລັງລ້າງບິນຄ້າງແລະບິນທົດສອບໃນຖານຂໍ້ມູນ...", { id: "clear-orders" });
      try {
        const res = await clearStuckPOSOrdersAction();
        if (res.success) {
          toast.success(`ລ້າງອໍເດີ້ຄ້າງສຳເລັດແລ້ວ (${res.count || 0} ລາຍການ)`, {
            id: "clear-orders"
          });
          setSelectedOrderId(null);
          router.refresh();
        } else {
          toast.error((res as any).error || "ບໍ່ສາມາດລ້າງບິນຄ້າງໄດ້", { id: "clear-orders" });
        }
      } catch (e: any) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການລ້າງບິນຄ້າງ", { id: "clear-orders" });
      }
    });
  };

  // Delete single order
  const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      toast.loading("ກຳລັງລຶບບິນນີ້...", { id: "delete-order" });
      try {
        const res = await deletePOSOrderAction(orderId);
        if (res.success) {
          toast.success("ລຶບບິນສຳເລັດແລ້ວ", { id: "delete-order" });
          if (selectedOrderId === orderId) {
            setSelectedOrderId(null);
          }
          router.refresh();
        } else {
          toast.error((res as any).error || "ບໍ່ສາມາດລຶບບິນໄດ້", { id: "delete-order" });
        }
      } catch (e: any) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບບິນ", { id: "delete-order" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Workflow Tabs Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("split")}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 ${
              activeTab === "split"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/20 border border-orange-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <SplitSquareHorizontal className="w-5 h-5" />
            <span>ແຍກບິນ (Split Bill)</span>
          </button>
          <button
            onClick={() => setActiveTab("merge")}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 ${
              activeTab === "merge"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Merge className="w-5 h-5" />
            <span>ລວມບິນ (Merge Bills)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {orders.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearStuckOrders}
              disabled={isPending}
              className="border-rose-500/50 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 font-bold text-xs h-10 px-3.5 transition-all shadow-sm"
              title="ລ້າງບິນຄ້າງແລະບິນທົດສອບທັງໝົດໃນລະບົບ"
            >
              <Trash2 className="w-4 h-4 mr-1.5 text-rose-400" />
              ລ້າງບິນຄ້າງທັງໝົດ
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCreateDemoOrders}
            disabled={isPending}
            className="border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 font-bold text-xs h-10 px-3.5 transition-all"
            title="ສ້າງບິນຕົວຢ່າງສຳລັບໂຕະ A01 ແລະ A02"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-orange-400" />
            ສ້າງບິນຕົວຢ່າງ
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/pos")}
            className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-bold text-xs h-10 px-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            ກັບຄືນ POS ປົກກະຕິ
          </Button>
          <Button
            variant="outline"
            onClick={() => router.refresh()}
            className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-bold text-xs h-10 px-3"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* NO ORDERS EMPTY STATE -> SHOW DEMO SEEDING BUTTON */}
      {orders.length === 0 ? (
        <Card className="p-8 sm:p-12 border-zinc-800 bg-zinc-900/50 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 shadow-inner">
            <Receipt className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            ຍັງບໍ່ມີບິນທີ່ກຳລັງເປີດໂຕະໃນລະບົບ
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md">
            ການແຍກບິນ ຫຼື ລວມບິນຕ້ອງໃຊ້ບິນອາຫານທີ່ກຳລັງເປີດໂຕະຢູ່ (Pending Orders). ທ່ານສາມາດສ້າງຂໍ້ມູນຕົວຢ່າງໃນຖານຂໍ້ມູນເພື່ອນຳໃຊ້ທົດສອບໄດ້ທັນທີ
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handleCreateDemoOrders}
              disabled={isPending}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-orange-600/30 text-sm"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              + ສ້າງບິນຕົວຢ່າງເພື່ອທົດສອບ (Create Demo Orders in DB)
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/pos")}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold h-12 px-5 rounded-xl"
            >
              ໄປເປີດບິນໃໝ່ໃນ POS
            </Button>
          </div>
        </Card>
      ) : activeTab === "split" ? (
        /* ========================================================
         * TAB 1: SPLIT BILL WORKFLOW (ແຍກບິນ)
         * ======================================================== */
        <div className="space-y-6">
          {/* STEP 1: SELECT ORDER TO SPLIT */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                ຂັ້ນຕອນທີ 1: ເລືອກບິນ/ໂຕະທີ່ຕ້ອງການແຍກລາຍການ (ເລືອກຕາມໂຕະ ຫຼື ໂຊນ)
              </label>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>ພົບ {filteredOrders.length} ບິນໃນຕົວເລືອກນີ້</span>
              </div>
            </div>

            {/* TABLE & ZONE FILTER BAR */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
              <span className="text-xs font-bold text-zinc-400 uppercase mr-1 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-orange-400" />
                ໂຕ๊ะ/ໂຊນ:
              </span>
              <button
                onClick={() => setSelectedTableFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTableFilter === "ALL"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20"
                    : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /><span>ທັງໝົດ</span></span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-black">{orders.length}</span>
              </button>
              <button
                onClick={() => setSelectedTableFilter("NONE")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTableFilter === "NONE"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20"
                    : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /><span>ສັ່ງກັບບ້ານ / ທົ່ວໄປ</span></span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-black">
                  {orders.filter((o) => !o.tableId && !o.table).length}
                </span>
              </button>
              {distinctTables.map((t) => {
                const count = orders.filter((o) => o.table?.id === t.id || o.tableId === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTableFilter(t.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedTableFilter === t.id
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20"
                        : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5" /><span>ໂຕະ {t.name}</span></span>
                    {t.zone && (
                      <span className="text-[11px] opacity-80 font-normal">({t.zone.name})</span>
                    )}
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-black">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* ORDERS GRID */}
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-400">
                ບໍ່ພົບບິນໃນຕົວເລືອກໂຕ๊ะ/ໂຊນນີ້
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredOrders.map((order) => {
                  const isSelected = order.id === selectedOrderId;
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setSplitQuantities({});
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? "bg-gradient-to-br from-orange-950/40 to-zinc-900 border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div>
                        {/* TABLE & ZONE BADGE HEADER */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-zinc-800/80">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`font-black text-xs px-2.5 py-0.5 rounded-lg ${
                                order.table
                                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                                  : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                              }`}
                            >
                              {order.table ? `ໂຕະ ${order.table.name}` : "ສັ່ງກັບບ້ານ"}
                            </Badge>
                            {order.table?.zone && (
                              <Badge className="font-bold text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                                {order.table.zone.name}
                              </Badge>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />
                          )}
                        </div>

                        {/* CUSTOMER NAME */}
                        <p className="font-bold text-white text-sm truncate" title={order.customerName || "ລູກຄ້າທົ່ວໄປ"}>
                          {order.customerName || "ລູກຄ້າທົ່ວໄປ"}
                        </p>
                      </div>

                      {/* STATS & FOOTER ACTIONS */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">{totalQty} ລາຍການ</span>
                          <span className="font-black text-emerald-400 text-sm">
                            ₭{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenPayModal(order, e)}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                            title="ຊຳລະເງິນແລະປິດໂຕະ (Pay & Checkout)"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>ຊຳລະເງິນ</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(order.id);
                              setPrintModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1 border border-zinc-700 transition-all"
                            title="ພິມບິນໂຕະນີ້ (Print Table Bill)"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-400" />
                            <span>ພິມບິນ</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOrder(order.id, e)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/40 transition-all"
                            title="ລຶບບິນຄ້າງນີ້ (Delete Order)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {activeOrder && (
            <>
              {/* STEP 2: SPLIT MODE SELECTOR */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl w-full min-w-0 overflow-x-hidden">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-zinc-400 uppercase mr-1">
                    ຮູບແບບການແຍກ:
                  </span>
                  <button
                    onClick={() => setSplitMode("ITEMS")}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 ${
                      splitMode === "ITEMS"
                        ? "bg-orange-600 text-white shadow-md"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ແຍກຕາມລາຍການອາຫານ (Split by Items)
                  </button>
                  <button
                    onClick={() => setSplitMode("EQUAL")}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 ${
                      splitMode === "EQUAL"
                        ? "bg-orange-600 text-white shadow-md"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ແຍກເທົ່າໆກັນ (Split Equally)
                  </button>
                </div>

                {splitMode === "EQUAL" && (
                  <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto min-w-0">
                    <span className="text-xs font-bold text-zinc-400 shrink-0">ຈຳນວນຄົນ (People):</span>
                    <div className="flex flex-wrap items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                      {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPeopleCount(num)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                            peopleCount === num
                              ? "bg-orange-500 text-white shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 bg-zinc-800/80 px-2 py-1 rounded-xl border border-zinc-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))}
                        className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={2}
                        max={100}
                        value={peopleCount}
                        onChange={(e) => setPeopleCount(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-12 bg-transparent text-center font-extrabold text-white text-sm outline-none border-0"
                      />
                      <button
                        type="button"
                        onClick={() => setPeopleCount(peopleCount + 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs py-1 px-3 font-extrabold shrink-0">
                      ₭{Math.round(activeOrder.totalAmount / peopleCount).toLocaleString()} / ຄົນ
                    </Badge>
                  </div>
                )}

                {/* Print Split Bill Button in Control Bar */}
                <div className="w-full xl:w-auto xl:ml-auto shrink-0 flex justify-end">
                  <Button
                    onClick={() => setPrintModalOpen(true)}
                    variant="outline"
                    className="w-full xl:w-auto border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold h-10 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>ພິມບິນແຍກ (Print Split Bills)</span>
                  </Button>
                </div>
              </div>

              {/* STEP 3: ITEM SPLIT COLUMNS (If ITEMS mode) */}
              {splitMode === "ITEMS" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT: ORIGINAL BILL */}
                  <Card className="p-5 border-zinc-800 bg-zinc-900/60 rounded-2xl flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                        <div>
                          <Badge className="bg-zinc-800 text-zinc-300 font-bold text-xs mb-1">
                            ບິນເດີມ (Original Check)
                          </Badge>
                          <h3 className="text-lg font-bold text-white">
                            {activeOrder.table ? `ໂຕະ ${activeOrder.table.name}` : "ບິນຫຼັກ"}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">ຍອດເຫຼືອໃນບິນເດີມ</p>
                          <p className="text-xl font-bold text-emerald-400">
                            ₭{originalSubtotal.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {activeOrder.items.map((item) => {
                          const movedQty = splitQuantities[item.id] || 0;
                          const remainingQty = item.quantity - movedQty;
                          if (remainingQty === 0) return null;
                          return (
                            <div
                              key={item.id}
                              className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">
                                  {item.product?.name || "ລາຍການອາຫານ"}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  ₭{item.price.toLocaleString()} × {remainingQty}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-400 text-sm">
                                  ₭{(item.price * remainingQty).toLocaleString()}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleMoveToNew(item.id, item.quantity)}
                                  className="h-8 w-8 p-0 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold"
                                  title="ຍ້າຍໄປບິນແຍກໃໝ່"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>ກົດປຸ່ມລູກສອນເພື່ອຍ້າຍລາຍການໄປບິນໃໝ່</span>
                      <span className="font-bold text-zinc-300">
                        {activeOrder.items.reduce(
                          (acc, i) => acc + (i.quantity - (splitQuantities[i.id] || 0)),
                          0
                        )}{" "}
                        ຊິ້ນ
                      </span>
                    </div>
                  </Card>

                  {/* RIGHT: NEW SPLIT BILL */}
                  <Card className="p-5 border-zinc-800 bg-gradient-to-br from-orange-950/20 via-zinc-900/60 to-zinc-900/80 rounded-2xl flex flex-col justify-between shadow-xl ring-1 ring-orange-500/30">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                        <div>
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold text-xs mb-1">
                            ບິນໃໝ່ທີ່ແຍກອອກ (New Split Bill)
                          </Badge>
                          <h3 className="text-lg font-bold text-white">
                            {activeOrder.table
                              ? `ໂຕະ ${activeOrder.table.name} (ບິນແຍກ 2)`
                              : "ບິນແຍກໃໝ່"}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">ຍອດບິນໃໝ່</p>
                          <p className="text-xl font-bold text-orange-400">
                            ₭{newSplitSubtotal.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {totalMovedItemsCount === 0 ? (
                        <div className="py-16 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                          <SplitSquareHorizontal className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                          <p className="text-sm font-medium text-zinc-400">
                            ຍັງບໍ່ມີລາຍການໃນບິນແຍກ
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            ເລືອກລາຍການຈາກບິນເດີມທາງຊ້າຍມືເພື່ອຍ້າຍມາບິນນີ້
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                          {activeOrder.items.map((item) => {
                            const movedQty = splitQuantities[item.id] || 0;
                            if (movedQty === 0) return null;
                            return (
                              <div
                                key={item.id}
                                className="p-3 bg-orange-950/30 border border-orange-500/30 rounded-xl flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleMoveToOriginal(item.id)}
                                    className="h-8 w-8 p-0 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                                    title="ຍ້າຍກັບຄືນບິນເດີມ"
                                  >
                                    <ArrowLeft className="w-4 h-4" />
                                  </Button>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-white text-sm truncate">
                                      {item.product?.name || "ລາຍການອາຫານ"}
                                    </p>
                                    <p className="text-xs text-orange-300 mt-0.5">
                                      ₭{item.price.toLocaleString()} × {movedQty}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-bold text-orange-400 text-sm">
                                  ₭{(item.price * movedQty).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs text-zinc-400">
                        ຈຳນວນລາຍການແຍກ:{" "}
                        <strong className="text-white">{totalMovedItemsCount} ຊິ້ນ</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setPrintModalOpen(true)}
                          variant="outline"
                          className="border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold h-11 px-5 rounded-xl flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>ພິມບິນແຍກ (Print)</span>
                        </Button>
                        <Button
                          onClick={handleConfirmSplit}
                          disabled={isPending || totalMovedItemsCount === 0}
                          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-orange-500/20"
                        >
                          {isPending ? "ກຳລັງແຍກບິນ..." : "ຢືນຢັນການແຍກບິນ (Confirm Split)"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                /* STEP 3: EQUAL SPLIT PREVIEW */
                <Card className="p-8 border-zinc-800 bg-zinc-900/60 rounded-2xl text-center max-w-2xl mx-auto shadow-xl">
                  <Users className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white">
                    ແຍກບິນເທົ່າໆກັນສຳລັບ {peopleCount} ທ່ານ
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    ຍອດບິນລວມ ₭{activeOrder.totalAmount.toLocaleString()} ຈະຖືກຫານເທົ່າກັນເປັນ{" "}
                    {peopleCount} ບິນ
                  </p>

                  <div className="my-6 p-6 bg-zinc-950 rounded-2xl border border-zinc-800 inline-block">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                      ຍອດຊຳລະຕໍ່ຄົນ (Amount per Person)
                    </p>
                    <p className="text-4xl font-extrabold text-orange-400 mt-2">
                      ₭{Math.round(activeOrder.totalAmount / peopleCount).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      onClick={() => setPrintModalOpen(true)}
                      variant="outline"
                      className="border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold h-12 px-6 rounded-xl text-base flex items-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      <span className="flex items-center gap-1.5"><Printer className="w-4 h-4" /><span>ພິມບິນແຍກ (Print Bills)</span></span>
                    </Button>
                    <Button
                      onClick={handleConfirmSplit}
                      disabled={isPending}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-500/30 text-base"
                    >
                      {isPending
                        ? "ກຳລັງແຍກບິນ..."
                        : `ຢືນຢັນສ້າງບິນແຍກ ${peopleCount} ບິນ (Confirm Equal Split)`}
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      ) : (
        /* ========================================================
         * TAB 2: MERGE BILLS WORKFLOW (ລວມບິນ)
         * ======================================================== */
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                ຂັ້ນຕອນທີ 1: ເລືອກ 2 ບິນຂຶ້ນໄປທີ່ຕ້ອງການລວມເຂົ້າກັນ
              </label>
              <span className="text-xs text-emerald-400 font-bold">
                ເລືອກແລ້ວ {selectedOrderIdsForMerge.length} ບິນ
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {orders.map((order) => {
                const isSelected = selectedOrderIdsForMerge.includes(order.id);
                const isPrimary = order.id === primaryOrderIdForMerge;
                const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div
                    key={order.id}
                    onClick={() => handleToggleMergeSelection(order.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? "bg-gradient-to-br from-emerald-950/40 to-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={`font-bold text-xs ${
                            order.table
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                          }`}
                        >
                          {order.table ? `ໂຕະ ${order.table.name}` : "ສັ່ງກັບບ້ານ"}
                        </Badge>
                        {isPrimary && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold text-[10px]">
                            ບິນຫຼັກ (Primary)
                          </Badge>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="font-semibold text-white text-sm truncate">
                      {order.customerName || "ລູກຄ້າທົ່ວໄປ"}
                    </p>
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{totalQty} ລາຍການ</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          ₭{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayModal(order, e);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                          title="ຊຳລະເງິນແລະປິດໂຕະ (Pay & Checkout)"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>ຊຳລະເງິນ</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                            setPrintModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1 border border-zinc-700 transition-all"
                          title="ພິມບິນໂຕະນີ້ (Print Table Bill)"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-400" />
                          <span>ພິມບິນ</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id, e);
                          }}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/40 transition-all"
                          title="ລຶບບິນຄ້າງນີ້ (Delete Order)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedOrderIdsForMerge.length >= 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT/CENTER: PRIMARY ORDER SELECTION & PREVIEW */}
              <Card className="lg:col-span-2 p-6 border-zinc-800 bg-zinc-900/60 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold text-xs mb-1">
                      ຂັ້ນຕອນທີ 2: ເລືອກບິນຫຼັກທີ່ຕ້ອງການລວມໄປຫາ
                    </Badge>
                    <h3 className="text-lg font-bold text-white">
                      ເລືອກໂຕະຫຼັກສຳລັບບິນລວມ (Select Primary Check)
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mergedOrdersList.map((ord) => (
                    <button
                      key={ord.id}
                      onClick={() => setPrimaryOrderIdForMerge(ord.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 ${
                        primaryOrderIdForMerge === ord.id
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                          : "bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      <span>
                        {ord.table ? `ໂຕະ ${ord.table.name}` : ord.customerName || "ບິນ"}
                      </span>
                      {primaryOrderIdForMerge === ord.id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-300 mb-3">
                    ລາຍການອາຫານທັງໝົດທີ່ລວມເຂົ້າກັນ ({mergedTotalItemsCount} ຊິ້ນ):
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {mergedOrdersList.flatMap((ord) =>
                      ord.items.map((item, idx) => (
                        <div
                          key={`${ord.id}-${item.id}-${idx}`}
                          className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Badge className="bg-zinc-800 text-zinc-400 text-[10px]">
                              {ord.table ? `ໂຕະ ${ord.table.name}` : "ບິນ"}
                            </Badge>
                            <span className="font-semibold text-white">
                              {item.product?.name || "ລາຍການອາຫານ"}
                            </span>
                            <span className="text-zinc-500">× {item.quantity}</span>
                          </div>
                          <span className="font-bold text-emerald-400">
                            ₭{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              {/* RIGHT: CONSOLIDATED GRAND TOTAL */}
              <Card className="p-6 border-zinc-800 bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-900/80 rounded-2xl flex flex-col justify-between shadow-xl ring-1 ring-emerald-500/30">
                <div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold text-xs mb-2">
                    ສະຫຼຸບບິນລວມໃໝ່ (Consolidated Summary)
                  </Badge>
                  <h3 className="text-xl font-bold text-white">
                    {mergedOrdersList.find((o) => o.id === primaryOrderIdForMerge)?.table
                      ? `ບິນລວມ: ໂຕະ ${
                          mergedOrdersList.find((o) => o.id === primaryOrderIdForMerge)?.table
                            ?.name
                        }`
                      : "ບິນລວມໃໝ່"}
                  </h3>

                  <div className="mt-6 space-y-3 p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>ຈຳນວນບິນທີ່ລວມ:</span>
                      <span className="font-bold text-white">
                        {selectedOrderIdsForMerge.length} ບິນ
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>ລາຍການອາຫານລວມ:</span>
                      <span className="font-bold text-white">
                        {mergedTotalItemsCount} ຊິ້ນ
                      </span>
                    </div>
                    <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-300">ຍອດສຸດທິລວມ:</span>
                      <span className="text-2xl font-extrabold text-emerald-400">
                        ₭{mergedTotalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <Button
                    onClick={handleConfirmMerge}
                    disabled={
                      isPending ||
                      selectedOrderIdsForMerge.length < 2 ||
                      !primaryOrderIdForMerge
                    }
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/30 text-sm"
                  >
                    {isPending
                      ? "ກຳລັງລວມບິນ..."
                      : `ຢືນຢັນການລວມບິນ ${selectedOrderIdsForMerge.length} ບິນ`}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
       * PRINT SPLIT BILL MODAL (ตัวเลือกการพิมพ์ใบบิลแยก)
       * ======================================================== */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 text-white w-[95vw] sm:w-full sm:max-w-xl md:max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl overflow-x-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-white tracking-tight">ເລືອກຮູບແບບການພິມບິນແຍກ (Print Options)</span>
                <p className="text-xs sm:text-sm font-normal text-zinc-400 mt-0.5">
                  ເລືອກວິທີທີ່ຕ້ອງການພິມໃບບິນສຳລັບລູກຄ້າ (Choose how to print the checks)
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 my-5 w-full">
            {/* OPTION 1: BATCH PRINT ALL BILLS TOGETHER (Main User Request) */}
            <div
              onClick={() => setPrintOption("ALL")}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 w-full ${
                printOption === "ALL"
                  ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/30"
                  : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-start gap-3.5 w-full">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    printOption === "ALL"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Printer className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                      <span className="flex items-center gap-1.5"><Printer className="w-4 h-4" /><span>ພິມບິນທັງໝົດພ້ອມກັນໃນຄັ້ງດຽວ (Print All Bills Together)</span></span>
                    </h4>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0">
                      ແນະນຳ (ອອກພ້ອມກັນ {splitMode === "EQUAL" ? peopleCount : 2} ໃບ)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                    {splitMode === "EQUAL"
                      ? `ສັ່ງພິມບິນແຍກທັງໝົດ ${peopleCount} ໃບພ້ອມກັນໃນຄລິກດຽວ (ແຕ່ລະໃບມີໜ້າຕັດແຍກສະເພາະຕົວ ສວຍງາມຄົບຖ້ວນ)`
                      : `ສັ່ງພິມທັງ ບິນເດີມ (₭${originalSubtotal.toLocaleString()}) ແລະ ບິນໃໝ່ (₭${newSplitSubtotal.toLocaleString()}) ອອກມາພ້ອມກັນທັນທີ`}
                  </p>
                </div>
              </div>
            </div>

            {/* IF ITEMS MODE: ALLOW PRINTING INDIVIDUAL CHECKS */}
            {splitMode === "ITEMS" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPrintOption("CHECK_1")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    printOption === "CHECK_1"
                      ? "border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/30"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">ພິມສະເພາະບິນທີ 1 (ບິນເດີມ)</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                      ບິນ 1/2
                    </Badge>
                  </div>
                  <p className="text-xs font-mono font-bold text-blue-400">
                    ₭{originalSubtotal.toLocaleString()}
                  </p>
                </div>

                <div
                  onClick={() => setPrintOption("CHECK_2")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    printOption === "CHECK_2"
                      ? "border-purple-500 bg-purple-500/10 shadow-md ring-1 ring-purple-500/30"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">ພິມສະເພາະບິນທີ 2 (ບິນໃໝ່)</span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                      ບິນ 2/2
                    </Badge>
                  </div>
                  <p className="text-xs font-mono font-bold text-purple-400">
                    ₭{newSplitSubtotal.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* OPTION: SUMMARY BILL */}
            <div
              onClick={() => setPrintOption("SUMMARY")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                printOption === "SUMMARY"
                  ? "border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30"
                  : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    printOption === "SUMMARY" ? "bg-amber-500 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      ພິມໃບສະຫຼຸບລວມ (1 Combined Bill with Summary)
                    </h4>
                    <span className="text-[11px] text-zinc-400">ໃບດຽວ</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    ພິມໃບບິນລວມທັງໝົດ 1 ໃບ ພ້ອມຕາຕະລາງສະຫຼຸບຍອດແຍກຈ່າຍຢູ່ທ້າຍບິນ
                  </p>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW TOGGLE BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPrintPreview(!showPrintPreview)}
                className="w-full py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{showPrintPreview ? "ເຊື່ອງຕົວຢ່າງໃບບິນ (Hide Preview)" : "ເບິ່ງຕົວຢ່າງໃບບິນກ່ອນພິມ (Live Receipt Preview)"}</span>
              </button>
            </div>

            {/* LIVE PREVIEW BOX (Styled like Rental card) */}
            {showPrintPreview && (
              <div className="p-4 rounded-2xl bg-white text-black font-sans text-xs border-2 border-emerald-500 shadow-2xl max-h-72 overflow-y-auto">
                <div className="text-center pb-2 border-b-2 border-black">
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-black uppercase">
                    LAOSYS POS & RESTAURANT
                  </span>
                  <h3 className="font-black text-base mt-1">ໃບບິນແຍກຄ່າອາຫານ (SPLIT CHECK)</h3>
                  <p className="text-[10px] text-zinc-600">
                    ໂຕະ: {activeOrder?.table ? activeOrder.table.name : "ທົ່ວໄປ"} • ໂຊນ: {activeOrder?.table?.zone?.name || "ຫຼັກ"}
                  </p>
                </div>

                <div className="py-2 border-b border-zinc-300 space-y-1">
                  <div className="flex justify-between font-bold text-zinc-700">
                    <span>ລາຍການອາຫານ</span>
                    <span>ລວມ</span>
                  </div>
                  {(splitMode === "EQUAL" ? activeOrder?.items : activeOrder?.items.filter(i => (splitQuantities[i.id] || 0) < i.quantity))?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-zinc-800">
                      <span>{item.product?.name || "ອາຫານ"} x{item.quantity}</span>
                      <span>₭{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="my-2.5 p-2.5 rounded-xl border-2 border-black bg-zinc-50 text-center">
                  <p className="text-[10px] font-bold uppercase text-zinc-600">ຍອດຕ້ອງຊຳລະບິນນີ້ (NET AMOUNT DUE)</p>
                  <p className="text-xl font-black text-black mt-0.5">
                    ₭{(splitMode === "EQUAL" ? Math.round((activeOrder?.totalAmount || 0) / peopleCount) : originalSubtotal).toLocaleString()}
                  </p>
                  <div className="flex justify-center gap-3 text-[10px] text-zinc-600 mt-1 font-mono">
                    <span>฿~{Math.round(((splitMode === "EQUAL" ? Math.round((activeOrder?.totalAmount || 0) / peopleCount) : originalSubtotal) / 650)).toLocaleString()} THB</span>
                    <span>•</span>
                    <span>$~{(((splitMode === "EQUAL" ? Math.round((activeOrder?.totalAmount || 0) / peopleCount) : originalSubtotal) / 22000)).toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-zinc-500 pt-1">
                  <p>QR Code / BCEL One / PromptPay Ready</p>
                  <p>ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you!</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800/80 w-full">
            <Button
              variant="outline"
              onClick={() => setPrintModalOpen(false)}
              className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-bold h-12 px-6 rounded-xl w-full sm:w-auto"
            >
              ຍົກເລີກ (Cancel)
            </Button>
            <Button
              onClick={executePrintSplitBill}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold h-12 px-8 rounded-xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Printer className="w-5 h-5 shrink-0" />
              <span>
                {printOption === "ALL"
                  ? `ພິມທັງໝົດ ${splitMode === "EQUAL" ? peopleCount : 2} ໃບພ້ອມກັນເລີຍ`
                  : "ພິມໃບບິນເລີຍ (Print Now)"}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
       * PAYMENT / QUICK CHECKOUT MODAL (รับชำระเงินและปิดบิลทันที)
       * ======================================================== */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 text-white w-[95vw] sm:w-full sm:max-w-md rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-white tracking-tight">
                  ຊຳລະເງິນແລະປິດໂຕະ (Checkout)
                </span>
                <p className="text-xs text-zinc-400 font-normal mt-0.5">
                  ເລືອກວິທີຊຳລະເງິນສຳລັບບິນນີ້ (Select payment method)
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {payOrder && (
            <div className="space-y-4 my-4">
              {/* ORDER SUMMARY CARD */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-0.5 rounded-lg mb-1">
                    {payOrder.table ? `ໂຕະ ${payOrder.table.name}` : "ສັ່ງກັບບ້ານ"}
                  </Badge>
                  <p className="text-sm font-bold text-white">
                    {payOrder.customerName || "ລູກຄ້າທົ່ວໄປ"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">ຍອດຕ້ອງຊຳລະ</span>
                  <span className="text-xl font-black text-emerald-400">
                    ₭{payOrder.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /><span>ເງິນສົດ</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "TRANSFER"
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /><span>ໂອນ QR</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "CARD"
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /><span>ບັດເຄຣດິດ</span></span>
                </button>
              </div>

              {/* CASH INPUT & CHANGE COMPUTATION */}
              {paymentMethod === "CASH" && (
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">
                      ຮັບເງິນຈາກລູກຄ້າ (Cash Received):
                    </label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(payOrder.totalAmount.toString())}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                    >
                      ຈ່າຍພໍດີ (Exact)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCashReceived(((parseFloat(cashReceived) || 0) + 20000).toString())
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                    >
                      +20,000
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCashReceived(((parseFloat(cashReceived) || 0) + 50000).toString())
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                    >
                      +50,000
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCashReceived(((parseFloat(cashReceived) || 0) + 100000).toString())
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                    >
                      +100,000
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-sm">
                    <span className="text-zinc-400">ເງິນທອນ (Change):</span>
                    <span className="font-extrabold text-amber-400 text-base">
                      ₭
                      {Math.max(
                        0,
                        (parseFloat(cashReceived) || 0) - payOrder.totalAmount
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === "TRANSFER" && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <p className="text-sm font-bold text-emerald-400">
                    ພ້ອມສະແກນຈ່າຍຜ່ານ QR / BCEL One / PromptPay
                  </p>
                  <p className="text-xs text-zinc-400">
                    ກວດສອບຍອດເງິນເຂົ້າບັນຊີ ₭{payOrder.totalAmount.toLocaleString()} ກ່ອນກົດຢືນຢັນ
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setPayModalOpen(false)}
              className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-bold h-11 px-5 rounded-xl"
            >
              ຍົກເລີກ
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>ຢືນຢັນຊຳລະເງິນ (Confirm Paid)</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
       * PRINTABLE THERMAL RECEIPT DOM (80mm Restaurant Receipt)
       * ======================================================== */}
      <div className="hidden print:block print-split-receipt fixed inset-0 bg-white z-[9999] p-2 text-black text-xs w-[80mm] mx-auto font-sans">
        {activeOrder && (
          <>
            {/* ── CASE 1: EQUAL SPLIT RECEIPTS ── */}
            {splitMode === "EQUAL" && (
              <>
                {Array.from({ length: peopleCount }).map((_, idx) => {
                  const perPersonAmt = Math.round(activeOrder.totalAmount / peopleCount);
                  const thbAmt = Math.round(perPersonAmt / 650);
                  const usdAmt = (perPersonAmt / 22000).toFixed(2);

                  return (
                    <div
                      key={idx}
                      className="print-receipt-slip border-2 border-black rounded-2xl p-4 mb-6 bg-white"
                    >
                      {/* Header */}
                      <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
                          LAOSYS RESTAURANT & POS
                        </div>
                        <h2 className="text-base font-black uppercase tracking-tight">
                          ໃບບິນແຍກຄ່າອາຫານ (SPLIT CHECK)
                        </h2>
                        <div className="inline-block mt-1 px-3 py-0.5 rounded-lg border border-black font-extrabold text-[11px] bg-zinc-100">
                          ບິນທີ {idx + 1} / {peopleCount} (Check {idx + 1} of {peopleCount})
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="py-2 border-b border-black text-[11px] space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span>ໂຕະ (Table):</span>
                          <span>{activeOrder.table ? `${activeOrder.table.name} (${activeOrder.table.zone?.name || "ໂຊນຮ້ານ"})` : "ສັ່ງກັບບ້ານ"}</span>
                        </div>
                        <div className="flex justify-between text-zinc-700">
                          <span>ເລກບິນ (Ref):</span>
                          <span className="font-mono font-bold">#SPLIT-{activeOrder.id.slice(-6).toUpperCase()}-{idx + 1}</span>
                        </div>
                        <div className="flex justify-between text-zinc-700">
                          <span>ວັນທີ-ເວລາ:</span>
                          <span>{printTime || "01/08/2026, 00:00:00"}</span>
                        </div>
                      </div>

                      {/* Equal Calculation Details */}
                      <div className="py-2 border-b border-black text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-700">ຍອດລວມທັງໝົດໂຕະ:</span>
                          <span className="font-bold">₭{activeOrder.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-700">ຫານຈຳນວນຄົນ:</span>
                          <span className="font-bold">{peopleCount} ທ່ານ (People)</span>
                        </div>
                      </div>

                      {/* Highlighted Total Due Box (Rental Style) */}
                      <div className="border-2 border-black rounded-xl p-3 my-2.5 bg-zinc-50 text-center">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                          ຍອດຕ້ອງຊຳລະບິນນີ້ (TOTAL THIS CHECK)
                        </p>
                        <p className="text-2xl font-black mt-1 text-black">
                          ₭{perPersonAmt.toLocaleString()}
                        </p>
                        <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-600 font-mono mt-1 pt-1 border-t border-dashed border-zinc-400">
                          <span>฿~{thbAmt.toLocaleString()} THB</span>
                          <span>•</span>
                          <span>$~{usdAmt} USD</span>
                        </div>
                      </div>

                      {/* Payment & QR */}
                      <div className="text-center text-[10px] text-zinc-600 space-y-0.5 pt-1">
                        <p className="font-bold text-black">ສະແກນ QR ຜ່ານ BCEL One / PromptPay</p>
                        <p>ກະລຸນານຳໃບບິນນີ້ໄປຊຳລະເງິນທີ່ເຄົາເຕີແຄດເຊຍ</p>
                        <p className="text-[9px] font-mono text-zinc-500 pt-1">
                          *SPLIT-{activeOrder.id.slice(-8).toUpperCase()}-{idx + 1}*
                        </p>
                        <p className="font-bold text-zinc-800 pt-1">ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you!</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── CASE 2: ITEM SPLIT RECEIPTS ── */}
            {splitMode === "ITEMS" && (
              <>
                {/* CHECK 1: Original Remaining Check */}
                {(printOption === "ALL" || printOption === "CHECK_1") && (
                  <div className="print-receipt-slip border-2 border-black rounded-2xl p-4 mb-6 bg-white">
                    {/* Header */}
                    <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
                        LAOSYS RESTAURANT & POS
                      </div>
                      <h2 className="text-base font-black uppercase tracking-tight">
                        ໃບບິນເດີມທີ່ເຫຼືອ (ORIGINAL CHECK)
                      </h2>
                      <div className="inline-block mt-1 px-3 py-0.5 rounded-lg border border-black font-extrabold text-[11px] bg-zinc-100">
                        ບິນທີ 1 / 2 (Check 1 of 2)
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="py-2 border-b border-black text-[11px] space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span>ໂຕະ (Table):</span>
                        <span>{activeOrder.table ? `${activeOrder.table.name} (${activeOrder.table.zone?.name || "ໂຊນຮ້ານ"})` : "ສັ່ງກັບບ້ານ"}</span>
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>ເລກບິນ (Ref):</span>
                        <span className="font-mono font-bold">#SPLIT-{activeOrder.id.slice(-6).toUpperCase()}-1</span>
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>ວັນທີ-ເວລາ:</span>
                        <span>{printTime || "01/08/2026, 00:00:00"}</span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="py-2 border-b border-black">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-black text-left font-bold text-zinc-700">
                            <th className="py-0.5">ລາຍການ</th>
                            <th className="text-center py-0.5">ຈ/ນ</th>
                            <th className="text-right py-0.5">ລວມ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOrder.items.map((item) => {
                            const movedQty = splitQuantities[item.id] || 0;
                            const remQty = item.quantity - movedQty;
                            if (remQty <= 0) return null;
                            return (
                              <tr key={item.id} className="border-b border-dashed border-zinc-200">
                                <td className="py-1 pr-1 font-medium">{item.product?.name || "ອາຫານ"}</td>
                                <td className="py-1 text-center font-bold">x{remQty}</td>
                                <td className="py-1 text-right font-mono font-bold">₭{(item.price * remQty).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Highlighted Total Due Box (Rental Style) */}
                    <div className="border-2 border-black rounded-xl p-3 my-2.5 bg-zinc-50 text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                        ຍອດຕ້ອງຊຳລະບິນທີ 1 (TOTAL CHECK 1)
                      </p>
                      <p className="text-2xl font-black mt-1 text-black">
                        ₭{originalSubtotal.toLocaleString()}
                      </p>
                      <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-600 font-mono mt-1 pt-1 border-t border-dashed border-zinc-400">
                        <span>฿~{Math.round(originalSubtotal / 650).toLocaleString()} THB</span>
                        <span>•</span>
                        <span>$~{(originalSubtotal / 22000).toFixed(2)} USD</span>
                      </div>
                    </div>

                    {/* Payment & QR */}
                    <div className="text-center text-[10px] text-zinc-600 space-y-0.5 pt-1">
                      <p className="font-bold text-black">ສະແກນ QR ຜ່ານ BCEL One / PromptPay</p>
                      <p>ກະລຸນານຳໃບບິນນີ້ໄປຊຳລະເງິນທີ່ເຄົາເຕີແຄດເຊຍ</p>
                      <p className="text-[9px] font-mono text-zinc-500 pt-1">
                        *SPLIT-{activeOrder.id.slice(-8).toUpperCase()}-1*
                      </p>
                      <p className="font-bold text-zinc-800 pt-1">ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you!</p>
                    </div>
                  </div>
                )}

                {/* CHECK 2: New Split Check */}
                {(printOption === "ALL" || printOption === "CHECK_2") && (
                  <div className="print-receipt-slip border-2 border-black rounded-2xl p-4 mb-6 bg-white">
                    {/* Header */}
                    <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
                        LAOSYS RESTAURANT & POS
                      </div>
                      <h2 className="text-base font-black uppercase tracking-tight">
                        ໃບບິນແຍກອອກໃໝ່ (NEW SPLIT CHECK)
                      </h2>
                      <div className="inline-block mt-1 px-3 py-0.5 rounded-lg border border-black font-extrabold text-[11px] bg-zinc-100">
                        ບິນທີ 2 / 2 (Check 2 of 2)
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="py-2 border-b border-black text-[11px] space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span>ໂຕະ (Table):</span>
                        <span>{activeOrder.table ? `${activeOrder.table.name} (${activeOrder.table.zone?.name || "ໂຊນຮ້ານ"})` : "ສັ່ງກັບບ້ານ"}</span>
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>ເລກບິນ (Ref):</span>
                        <span className="font-mono font-bold">#SPLIT-{activeOrder.id.slice(-6).toUpperCase()}-2</span>
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>ວັນທີ-ເວລາ:</span>
                        <span>{printTime || "01/08/2026, 00:00:00"}</span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="py-2 border-b border-black">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-black text-left font-bold text-zinc-700">
                            <th className="py-0.5">ລາຍການ</th>
                            <th className="text-center py-0.5">ຈ/ນ</th>
                            <th className="text-right py-0.5">ລວມ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOrder.items.map((item) => {
                            const movedQty = splitQuantities[item.id] || 0;
                            if (movedQty <= 0) return null;
                            return (
                              <tr key={item.id} className="border-b border-dashed border-zinc-200">
                                <td className="py-1 pr-1 font-medium">{item.product?.name || "ອາຫານ"}</td>
                                <td className="py-1 text-center font-bold">x{movedQty}</td>
                                <td className="py-1 text-right font-mono font-bold">₭{(item.price * movedQty).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Highlighted Total Due Box (Rental Style) */}
                    <div className="border-2 border-black rounded-xl p-3 my-2.5 bg-zinc-50 text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                        ຍອດຕ້ອງຊຳລະບິນທີ 2 (TOTAL CHECK 2)
                      </p>
                      <p className="text-2xl font-black mt-1 text-black">
                        ₭{newSplitSubtotal.toLocaleString()}
                      </p>
                      <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-600 font-mono mt-1 pt-1 border-t border-dashed border-zinc-400">
                        <span>฿~{Math.round(newSplitSubtotal / 650).toLocaleString()} THB</span>
                        <span>•</span>
                        <span>$~{(newSplitSubtotal / 22000).toFixed(2)} USD</span>
                      </div>
                    </div>

                    {/* Payment & QR */}
                    <div className="text-center text-[10px] text-zinc-600 space-y-0.5 pt-1">
                      <p className="font-bold text-black">ສະແກນ QR ຜ່ານ BCEL One / PromptPay</p>
                      <p>ກະລຸນານຳໃບບິນນີ້ໄປຊຳລະເງິນທີ່ເຄົາເຕີແຄດເຊຍ</p>
                      <p className="text-[9px] font-mono text-zinc-500 pt-1">
                        *SPLIT-{activeOrder.id.slice(-8).toUpperCase()}-2*
                      </p>
                      <p className="font-bold text-zinc-800 pt-1">ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you!</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── CASE 3: SINGLE SUMMARY BILL ── */}
            {printOption === "SUMMARY" && (
              <div className="print-receipt-slip border-2 border-black rounded-2xl p-4 mb-6 bg-white">
                {/* Header */}
                <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
                    LAOSYS RESTAURANT & POS
                  </div>
                  <h2 className="text-base font-black uppercase tracking-tight">
                    ໃບບິນລວມສະຫຼຸບຍອດແຍກ (SUMMARY BILL)
                  </h2>
                </div>

                {/* Metadata */}
                <div className="py-2 border-b border-black text-[11px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>ໂຕະ (Table):</span>
                    <span>{activeOrder.table ? `${activeOrder.table.name} (${activeOrder.table.zone?.name || "ໂຊນຮ້ານ"})` : "ສັ່ງກັບບ້ານ"}</span>
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span>ເລກບິນ (Ref):</span>
                    <span className="font-mono font-bold">#SUM-{activeOrder.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span>ວັນທີ-ເວລາ:</span>
                    <span>{printTime || "01/08/2026, 00:00:00"}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-2 border-b border-black">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-black text-left font-bold text-zinc-700">
                        <th className="py-0.5">ລາຍການ</th>
                        <th className="text-center py-0.5">ຈ/ນ</th>
                        <th className="text-right py-0.5">ລວມ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items.map((item) => (
                        <tr key={item.id} className="border-b border-dashed border-zinc-200">
                          <td className="py-1 pr-1 font-medium">{item.product?.name || "ອາຫານ"}</td>
                          <td className="py-1 text-center font-bold">x{item.quantity}</td>
                          <td className="py-1 text-right font-mono font-bold">₭{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Total */}
                <div className="flex justify-between font-black text-xs my-2 px-1">
                  <span>ຍອດລວມທັງໝົດໂຕະ:</span>
                  <span>₭{activeOrder.totalAmount.toLocaleString()}</span>
                </div>

                {/* Highlighted Breakdown Box */}
                <div className="border-2 border-black rounded-xl p-3 my-2.5 bg-zinc-50">
                  <p className="font-black text-center text-[10px] mb-1.5 uppercase border-b border-black pb-1">
                    --- ສະຫຼຸບການແຍກຈ່າຍ (SPLIT BREAKDOWN) ---
                  </p>
                  {splitMode === "EQUAL" ? (
                    <>
                      <div className="flex justify-between text-xs my-1">
                        <span className="text-zinc-600">ແຍກຈ່າຍຈຳນວນຄົນ:</span>
                        <span className="font-bold">{peopleCount} ຄົນ (People)</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-black pt-1.5 mt-1.5 text-black">
                        <span>ຕ້ອງຈ່າຍຄົນລະ:</span>
                        <span className="text-base text-emerald-800">
                          ₭{Math.round(activeOrder.totalAmount / peopleCount).toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs my-1">
                        <span className="text-zinc-600">ບິນທີ 1 (ບິນເດີມ):</span>
                        <span className="font-bold font-mono">₭{originalSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs my-1">
                        <span className="text-zinc-600">ບິນທີ 2 (ບິນໃໝ່):</span>
                        <span className="font-bold font-mono">₭{newSplitSubtotal.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Payment & QR */}
                <div className="text-center text-[10px] text-zinc-600 space-y-0.5 pt-1">
                  <p className="font-bold text-black">LAOSYS RESTAURANT & POS</p>
                  <p>ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
