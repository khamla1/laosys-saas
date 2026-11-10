"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PackageOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Trash2,
  Edit3,
  Loader2,
  Tag,
  Image as ImageIcon,
  Banknote,
  ShieldAlert,
  LayoutGrid,
  List,
  Layers,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Timer,
  Clock,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  History,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
} from "@/components/BillVerifyResultCard";

interface StatusHistoryEntry {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  quantity?: number;
  availableUnits?: number;
  maintenanceUnits?: number;
  rentedUnits?: number;
  note?: string;
  changedBy: {
    id?: string | null;
    name: string;
    email?: string;
    role?: string;
  };
  changedAt: string;
}

interface EquipmentItem {
  id: string;
  equipmentCode: string;
  name: string;
  type: string;
  image?: string | null;
  description?: string | null;
  stockQuantity: number;
  availableQuantity?: number | null;
  maintenanceQuantity?: number | null;
  rentedQuantity?: number | null;
  statusHistory?: StatusHistoryEntry[] | null;
  rentalPrice: number;
  depositPrice: number;
  retailPrice?: number | null;
  barcode?: string | null;
  productId?: string | null;
  totalRentCount?: number | null;
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | string;
  createdAt: string;
  updatedAt: string;
}

interface StoreProductOption {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  images?: string[];
  stock?: number;
  sku?: string | null;
}

const STATUS_CONFIGS: Record<string, { label: string; badgeColor: string; dotColor: string }> = {
  AVAILABLE: {
    label: "ພ້ອມໃຫ້ເຊົ່າ",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dotColor: "bg-emerald-400"
  },
  RENTED: {
    label: "ຖືກເຊົ່າຢູ່",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    dotColor: "bg-amber-400"
  },
  MAINTENANCE: {
    label: "ບຳລຸງຮັກສາ / ສ້ອມແປງ",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    dotColor: "bg-rose-400"
  }
};

const DEFAULT_TYPES = [
  "ດອກປີກໄກ່",
  "ກ໊ອຟ",
  "ເທັນນິສ",
  "ລົດຖີບ",
  "ເກີບກິລາ",
  "ຊຸດກິລາ",
  "ອຸປະກອນປ້ອງກັນ",
  "ອື່ນໆ"
];

export default function RentalEquipmentPage() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"SEARCH" | "BARCODE_INPUT">("SEARCH");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [equipmentCode, setEquipmentCode] = useState("");
  const [name, setName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [type, setType] = useState("ດອກປີກໄກ່");
  const [customType, setCustomType] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [availableQuantity, setAvailableQuantity] = useState("1");
  const [maintenanceQuantity, setMaintenanceQuantity] = useState("0");
  const [rentalPrice, setRentalPrice] = useState("");
  const [depositPrice, setDepositPrice] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [editReasonNote, setEditReasonNote] = useState("");

  // Maintenance Dialog State (Send to repair / Return from repair)
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintItem, setMaintItem] = useState<EquipmentItem | null>(null);
  const [maintActionType, setMaintActionType] = useState<"SEND" | "RETURN">("SEND");
  const [maintQty, setMaintQty] = useState("1");
  const [maintReason, setMaintReason] = useState("");
  const [isProcessingMaint, setIsProcessingMaint] = useState(false);

  // History Log Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTargetItem, setHistoryTargetItem] = useState<EquipmentItem | null>(null);

  // Quick State
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Dynamic Categories State
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [showQuickAddCatModal, setShowQuickAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchStoreProducts();
    fetchDbCategories();
  }, []);

  const fetchDbCategories = async () => {
    try {
      const res = await fetch("/api/dashboard/categories");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDbCategories(data.map((c: any) => c.name).filter(Boolean));
      }
    } catch {
      // non-blocking
    }
  };

  const handleQuickSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ປະເພດ / ໝວດໝູ່ໃໝ່");
    }
    setIsSavingCat(true);
    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() || undefined }),
      });
      if (res.ok) {
        const created = await res.json();
        toast.success(`ເພີ່ມໝວດໝູ່ "${created.name}" ສຳເລັດ`);
        setDbCategories(prev => Array.from(new Set([...prev, created.name])));
        setType(created.name);
        setNewCatName("");
        setNewCatDesc("");
        setShowQuickAddCatModal(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "ບັນທຶກໝວດໝູ່ບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໝວດໝູ່");
    } finally {
      setIsSavingCat(false);
    }
  };

  const allCategoryOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...DEFAULT_TYPES.filter(t => t !== "ອື່ນໆ"),
        ...dbCategories,
        "ອື່ນໆ"
      ])
    );
  }, [dbCategories]);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/equipment");
      const data = await res.json();
      if (res.ok) {
        setItems(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນອຸປະກອນໃຫ້ເຊົ່າໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setStoreProducts(data);
      }
    } catch (err) {
      // non-blocking
    }
  };

  const generateAutoCode = () => {
    const prefix = "EQ";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setEquipmentCode(`${prefix}-${rand}`);
  };

  const handleSelectStoreProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    if (!prodId) return;
    const found = storeProducts.find(p => p.id === prodId);
    if (found) {
      if (!name.trim()) setName(found.name);
      setRetailPrice(String(found.price || 0));
      if (!rentalPrice) {
        const suggestedFee = Math.round((found.price * 0.1) / 1000) * 1000 || 25000;
        setRentalPrice(String(suggestedFee));
      }
      if (!depositPrice) {
        setDepositPrice(String(found.price || 50000));
      }
      if (found.category && (!type || type === "ອື່ນໆ")) {
        if (DEFAULT_TYPES.includes(found.category)) {
          setType(found.category);
        } else {
          setType("ອື່ນໆ");
          setCustomType(found.category);
        }
      }
      if (Array.isArray(found.images) && found.images.length > 0 && !image) {
        setImage(found.images[0]);
      }
      toast.success(`ເຊື່ອມຕໍ່ກັບສິນຄ້າ "${found.name}" ແລ້ວ`);
    }
  };

  const resetForm = () => {
    setEquipmentCode("");
    setName("");
    setSelectedProductId("");
    setRetailPrice("");
    setBarcode("");
    setType("ດອກປີກໄກ່");
    setCustomType("");
    setImage("");
    setDescription("");
    setStockQuantity("1");
    setAvailableQuantity("1");
    setMaintenanceQuantity("0");
    setRentalPrice("");
    setDepositPrice("");
    setStatus("AVAILABLE");
    setEditReasonNote("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    generateAutoCode();
    setShowModal(true);
  };

  const openEditModal = (item: EquipmentItem) => {
    resetForm();
    setEditingItem(item);
    setEquipmentCode(item.equipmentCode);
    setName(item.name);
    setSelectedProductId(item.productId || "");
    setRetailPrice(item.retailPrice !== null && item.retailPrice !== undefined ? String(item.retailPrice) : "");
    setBarcode(item.barcode || "");
    if (DEFAULT_TYPES.includes(item.type)) {
      setType(item.type);
      setCustomType("");
    } else {
      setType("ອື່ນໆ");
      setCustomType(item.type);
    }
    setImage(item.image || "");
    setDescription(item.description || "");
    setStockQuantity(String(item.stockQuantity ?? 1));
    setAvailableQuantity(String(item.availableQuantity ?? item.stockQuantity ?? 1));
    setMaintenanceQuantity(String(item.maintenanceQuantity ?? 0));
    setRentalPrice(String(item.rentalPrice ?? ""));
    setDepositPrice(String(item.depositPrice ?? ""));
    setStatus(item.status || "AVAILABLE");
    setEditReasonNote("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = type === "ອື່ນໆ" ? (customType.trim() || "ອື່ນໆ") : type;

    if (!equipmentCode.trim() || !name.trim() || !finalType.trim()) {
      return toast.error("ກະລຸນາຕື່ມລະຫັດ, ຊື່ອຸປະກອນ ແລະ ປະເພດໃຫ້ຄົບຖ້ວນ");
    }

    const totalQty = Number(stockQuantity) || 1;
    const availQty = Number(availableQuantity) !== undefined ? Number(availableQuantity) : totalQty;
    const maintQtyVal = Number(maintenanceQuantity) || 0;

    setIsSubmitting(true);
    try {
      const payload = {
        equipmentCode: equipmentCode.trim(),
        name: name.trim(),
        type: finalType,
        image: image.trim() || null,
        description: description.trim() || null,
        stockQuantity: totalQty,
        availableQuantity: availQty,
        maintenanceQuantity: maintQtyVal,
        rentalPrice: Number(rentalPrice) || 0,
        depositPrice: Number(depositPrice) || 0,
        retailPrice: retailPrice !== "" ? Number(retailPrice) : null,
        barcode: barcode.trim() || null,
        productId: selectedProductId || null,
        status,
        note: editReasonNote.trim() || (editingItem ? "ແກ້ໄຂລາຍລະອຽດອຸປະກອນ" : "ເພີ່ມອຸປະກອນໃໝ່")
      };

      const url = editingItem
        ? `/api/dashboard/equipment/${editingItem.id}`
        : "/api/dashboard/equipment";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? "ບັນທຶກການແກ້ໄຂອຸປະກອນສຳເລັດ" : "ເພີ່ມອຸປະກອນໃໝ່ສຳເລັດ (ເຊື່ອມຕໍ່ສິນຄ້າແລ້ວ)");
        setShowModal(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Maintenance Quick Dialog
  const openMaintenanceDialog = (item: EquipmentItem, action: "SEND" | "RETURN") => {
    setMaintItem(item);
    setMaintActionType(action);
    setMaintQty("1");
    setMaintReason(action === "SEND" ? "ອຸປະກອນຊຳລຸດ ນຳສົ່ງສ້ອມແປງ" : "ສ້ອມແປງສຳເລັດ ສົ່ງຄືນຄັງພ້ອມໃຊ້ງານ");
    setShowMaintModal(true);
  };

  const handleProcessMaintenance = async () => {
    if (!maintItem) return;
    const qty = Number(maintQty) || 1;

    if (maintActionType === "SEND") {
      const avail = maintItem.availableQuantity ?? maintItem.stockQuantity;
      if (qty > avail) {
        return toast.error(`ຈຳນວນທີ່ສົ່ງສ້ອມແປງຕ້ອງບໍ່ເກີນຈຳນວນທີ່ພ້ອມໃຫ້ເຊົ່າ (${avail} ຊິ້ນ)`);
      }
    } else {
      const inMaint = maintItem.maintenanceQuantity || 0;
      if (qty > inMaint) {
        return toast.error(`ຈຳນວນທີ່ຮັບຄືນຕ້ອງບໍ່ເກີນຈຳນວນທີ່ກຳລັງສ້ອມແປງ (${inMaint} ຊິ້ນ)`);
      }
    }

    const confirmed = await askConfirm(
      maintActionType === "SEND"
        ? `ທ່ານຕ້ອງການສົ່ງອຸປະກອນ "${maintItem.name}" ຈຳນວນ ${qty} ຊິ້ນ ໄປສູນບຳລຸງຮັກສາ/ສ້ອມແປງແທ້ບໍ່?`
        : `ທ່ານຕ້ອງການຮັບອຸປະກອນ "${maintItem.name}" ຈຳນວນ ${qty} ຊິ້ນ ກັບຄືນສູ່ຄັງພ້ອມໃຫ້ເຊົ່າແທ້ບໍ່?`,
      {
        title: maintActionType === "SEND" ? "ຢືນຢັນການສົ່ງສ້ອມແປງ" : "ຢືນຢັນການຮັບຄືນຈາກສູນສ້ອມ",
        subMessage: maintActionType === "SEND"
          ? `ອຸປະກອນຈະຖືກຕັດອອກຈາກຍອດພ້ອມໃຫ້ເຊົ່າ ແລະ ບັນທຶກປະຫວັດການສົ່ງສ້ອມແປງ.`
          : `ອຸປະກອນຈະຖືກເພີ່ມກັບເຂົ້າສູ່ຍອດພ້ອມໃຫ້ເຊົ່າໃນຄັງທັນທີ.`,
        confirmText: maintActionType === "SEND" ? "ຢືນຢັນສົ່ງສ້ອມ" : "ຢືນຢັນຮັບຄືນ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    setIsProcessingMaint(true);
    try {
      const res = await fetch(`/api/dashboard/equipment/${maintItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: maintActionType === "SEND" ? "SEND_TO_MAINTENANCE" : "RETURN_FROM_MAINTENANCE",
          quantity: qty,
          note: maintReason.trim()
        })
      });

      if (res.ok) {
        toast.success(
          maintActionType === "SEND"
            ? `ສົ່ງສ້ອມແປງຈຳນວນ ${qty} ຊິ້ນສຳເລັດແລ້ວ`
            : `ຮັບຄືນຈາກການສ້ອມແປງ ${qty} ຊິ້ນສຳເລັດແລ້ວ`
        );
        setShowMaintModal(false);
        setMaintItem(null);
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດອັບເດດສະຖານະການສ້ອມແປງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsProcessingMaint(false);
    }
  };

  // Open History Audit Log Drawer
  const openHistoryDialog = (item: EquipmentItem) => {
    setHistoryTargetItem(item);
    setShowHistoryModal(true);
  };

  const handleDelete = async (item: EquipmentItem) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບອຸປະກອນ "${item.name}" (ລະຫັດ: ${item.equipmentCode}) ອອກຈາກລະບົບແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບອຸປະກອນໃຫ້ເຊົ່າ",
        subMessage: "ຂໍ້ມູນອຸປະກອນ ແລະ ປະຫວັດທັງໝົດຈະຖືກລຶບອອກຈາກຄັງຖາວອນ.",
        confirmText: "ຢືນຢັນລຶບ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/equipment/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບອຸປະກອນສຳເລັດ");
        setItems(prev => prev.filter(it => it.id !== item.id));
      } else {
        toast.error("ບໍ່ສາມາດລຶບອຸປະກອນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast.success(`ຄັດລອກລະຫັດ "${code}" ແລ້ວ`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Distinct types list
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.type) set.add(it.type);
    });
    return Array.from(set);
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(r => {
      const q = search.toLowerCase();
      const matchSearch =
        r.name.toLowerCase().includes(q) ||
        r.equipmentCode.toLowerCase().includes(q) ||
        (r.barcode && r.barcode.toLowerCase().includes(q)) ||
        (r.type && r.type.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));

      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchType = typeFilter === "ALL" || r.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [items, search, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((sum, it) => sum + (it.stockQuantity || 0), 0);
    const totalAvail = items.reduce((sum, it) => sum + (it.availableQuantity ?? it.stockQuantity ?? 0), 0);
    const totalMaint = items.reduce((sum, it) => sum + (it.maintenanceQuantity || 0), 0);
    const totalRented = items.reduce((sum, it) => sum + (it.rentedQuantity || 0), 0);

    return { totalItems, totalStock, totalAvail, totalMaint, totalRented };
  }, [items]);

  const [inspectedEquipmentResult, setInspectedEquipmentResult] = useState<BillVerifyResultData | null>(null);

  const buildEquipmentInspectionResult = (found: EquipmentItem): BillVerifyResultData => {
    const avail = found.availableQuantity ?? found.stockQuantity ?? 0;
    const rented = found.rentedQuantity || 0;
    const maint = found.maintenanceQuantity || 0;

    if (avail > 0 && found.status !== "MAINTENANCE") {
      return {
        code: found.equipmentCode,
        typeLabel: `ອຸປະກອນໃຫ້ເຊົ່າ (${found.type || "ທົ່ວໄປ"})`,
        status: "VALID",
        statusTitle: `ພ້ອມໃຫ້ເຊົ່າ • ຍັງເຫຼືອ ${avail} ຊິ້ນໃນຄັງ`,
        expiryMessage: `ອຸປະກອນ "${found.name}" (${found.equipmentCode}) ພ້ອມສົ່ງມອບໃຫ້ລູກຄ້າເຊົ່າທັນທີ (ທັງໝົດ ${found.stockQuantity} ຊິ້ນ • ກຳລັງເຊົ່າ ${rented} • ສ້ອມແປງ ${maint}).`,
        itemName: `${found.name}${found.barcode ? ` (Barcode: ${found.barcode})` : ""}`,
        amountFormatted: `₭${(found.rentalPrice || 0).toLocaleString()}/ຊມ`,
        extraBadgeText: `ວ່າງ ${avail}/${found.stockQuantity} ຊິ້ນ`,
        onPrimaryAction: () => openEditModal(found),
        primaryActionLabel: "ແກ້ໄຂຂໍ້ມູນອຸປະກອນ",
      };
    }

    return {
      code: found.equipmentCode,
      typeLabel: `ອຸປະກອນໃຫ້ເຊົ່າ (${found.type || "ທົ່ວໄປ"})`,
      status: "EXPIRED",
      statusTitle:
        found.status === "MAINTENANCE" || maint > 0
          ? "ບໍ່ພ້ອມໃຫ້ເຊົ່າ • ຢູ່ໃນລະຫວ່າງບຳລຸງຮັກສາ / ສ້ອມແປງ!"
          : "ອຸປະກອນໝົດຄັງຊົ່ວຄາວ • ກຳລັງຖືກເຊົ່າຄົບທຸກຊິ້ນ!",
      expiryMessage: `ອຸປະກອນ "${found.name}" (${found.equipmentCode}) ຍອດພ້ອມເຊົ່າເຫຼືອ 0 ຊິ້ນ (ກຳລັງຖືກເຊົ່າ ${rented} ຊິ້ນ • ສ້ອມແປງ ${maint} ຊິ້ນ).`,
      itemName: `${found.name}${found.barcode ? ` (Barcode: ${found.barcode})` : ""}`,
      amountFormatted: `₭${(found.rentalPrice || 0).toLocaleString()}/ຊມ`,
      extraBadgeText: `ວ່າງ 0/${found.stockQuantity} ຊິ້ນ`,
      onPrimaryAction: () => openHistoryDialog(found),
      primaryActionLabel: "ເບິ່ງປະຫວັດສະຖານະ",
    };
  };

  const handleInspectEquipmentByQuery = (rawQuery: string) => {
    const raw = rawQuery.trim();
    if (!raw) return;
    setSearch(raw);
    const q = raw.toLowerCase();
    const found =
      items.find(
        (it) =>
          (it.barcode && it.barcode.toLowerCase() === q) ||
          it.equipmentCode.toLowerCase() === q
      ) ||
      items.find(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.equipmentCode.toLowerCase().includes(q) ||
          (it.barcode && it.barcode.toLowerCase().includes(q))
      );

    if (found) {
      const result = buildEquipmentInspectionResult(found);
      setInspectedEquipmentResult(result);
      if (result.status === "VALID") {
        toast.success(`${result.statusTitle} (${found.name})`);
      } else {
        toast.error(`${result.statusTitle} (${found.name})`);
      }
    } else {
      setInspectedEquipmentResult({
        code: raw.toUpperCase(),
        typeLabel: "ອຸປະກອນໃຫ້ເຊົ່າ (Equipment)",
        status: "NOT_FOUND",
        statusTitle: "ບໍ່ພົບລະຫັດອຸປະກອນ ຫຼື ບາໂຄດນີ້ໃນຄັງ",
        expiryMessage: `ບໍ່ພົບອຸປະກອນທີ່ກົງກັບລະຫັດ "${raw}" — ຖ້າເປັນລະຫັດບິນເຊົ່າ (RNT-...) ກະລຸນາກົດໄປໜ້າ "ເປີດບິນເຊົ່າ & ສົ່ງຄືນ".`,
      });
      toast.error(`ບໍ່ພົບອຸປະກອນລະຫັດ: "${raw}"`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-xl shadow-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
            <PackageOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">ລະບົບເຊົ່າອຸປະກອນ</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Equipment Rental & Maintenance
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-0.5">
              ຈັດການຄັງອຸປະກອນ, ຍອດຄົງເຫຼືອພ້ອມເຊົ່າ, ຈຳນວນສ້ອມແປງ ແລະ ບັນທຶກປະຫວັດຜູ້ປ່ຽນສະຖານະ
            </p>
          </div>
        </div>

        {/* Action Buttons & Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setScannerTarget("SEARCH");
              setIsCameraScannerOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
            title="ເປີດກ້ອງສະແກນບາໂຄດອຸປະກອນ"
          >
            <Camera className="w-4 h-4" />
            <span>ກ້ອງສະແກນ (Scanner)</span>
          </button>

          <Link
            href="/dashboard/rental/issue"
            className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-all border border-zinc-700/60 flex items-center gap-2"
          >
            <Timer className="w-4 h-4 text-emerald-400" />
            <span>ລາຍການເຊົ່າ & ສົ່ງຄືນ</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
          </Link>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມອຸປະກອນໃໝ່</span>
          </button>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/dashboard/rental/equipment"
          className="px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20 whitespace-nowrap"
        >
          ຄັງອຸປະກອນໃຫ້ເຊົ່າ (Equipment)
        </Link>
        <Link
          href="/dashboard/rental/issue"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ເປີດບິນເຊົ່າ & ສົ່ງຄືນ (Active Rentals)
        </Link>
      </div>

      {/* ── KPI Summary Cards (Unit Breakdown) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stock Units */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ອຸປະກອນທັງໝົດ</span>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.totalStock} ຊິ້ນ</div>
            <span className="text-[11px] text-zinc-500">ຈາກ {stats.totalItems} ລາຍການໃນລະບົບ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800/70 border border-zinc-700/50 flex items-center justify-center text-emerald-400">
            <PackageOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Ready for Rent */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ພ້ອມໃຫ້ເຊົ່າ (Available)</span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.totalAvail} ຊິ້ນ</div>
            <span className="text-[11px] text-zinc-500">ອຸປະກອນພ້ອມສົ່ງມອບລູກຄ້າ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: In Maintenance / Repair */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ກຳລັງສ້ອມແປງ (Maintenance)</span>
            <div className="text-2xl font-bold text-rose-400 tracking-tight">{stats.totalMaint} ຊິ້ນ</div>
            <span className="text-[11px] text-zinc-500">ກຳລັງດັດແປງ / ສ້ອມແປງຢູ່</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Currently Rented Out */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ກຳລັງຖືກເຊົ່າ (Rented)</span>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">{stats.totalRented} ຊິ້ນ</div>
            <span className="text-[11px] text-zinc-500">ລູກຄ້ານຳໄປໃຊ້ງານຢູ່</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Timer className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box & Camera Scan */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="ພິມລະຫັດອຸປະກອນ EQ-..., ບາໂຄດ ຫຼື ຊື່ອຸປະກອນ..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  if (!e.target.value.trim()) setInspectedEquipmentResult(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleInspectEquipmentByQuery(search);
                  }
                }}
                className="w-full pl-10 pr-8 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setInspectedEquipmentResult(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {search.trim() && (
              <button
                type="button"
                onClick={() => handleInspectEquipmentByQuery(search)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                ກວດສອບ
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setScannerTarget("SEARCH");
                setIsCameraScannerOpen(true);
              }}
              className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95"
              title="ເປີດກ້ອງສະແກນບາໂຄດອຸປະກອນ"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
              <span className="sm:hidden">ສະແກນ</span>
            </button>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center bg-zinc-950/70 border border-zinc-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "ALL"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ທັງໝົດ
              </button>
              <button
                onClick={() => setStatusFilter("AVAILABLE")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "AVAILABLE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ພ້ອມໃຫ້ເຊົ່າ
              </button>
              <button
                onClick={() => setStatusFilter("RENTED")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "RENTED"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ຖືກເຊົ່າ
              </button>
              <button
                onClick={() => setStatusFilter("MAINTENANCE")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "MAINTENANCE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ບຳລຸງຮັກສາ
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950/70 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                title="ມຸມມອງກາດ (Grid View)"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="ມຸມມອງຕາຕະລາງ (Table View)"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Category Chips */}
        {availableTypes.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-zinc-800/60 pt-3">
            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">ໝວດໝູ່:</span>
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === "ALL"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              ທຸກປະເພດ
            </button>
            {availableTypes.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  typeFilter === t
                    ? "bg-zinc-100 text-zinc-950 font-semibold"
                    : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -- Scanned / Searched Equipment Status Card -- */}
      {(inspectedEquipmentResult ||
        (search.trim().length >= 2 && filteredItems.length === 1)) && (
        <BillVerifyResultCard
          data={
            inspectedEquipmentResult ||
            buildEquipmentInspectionResult(filteredItems[0])
          }
          onClose={() => {
            setInspectedEquipmentResult(null);
            setSearch("");
          }}
        />
      )}

      {/* ── Content View (Grid or Table) ── */}
      {isLoading ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
          <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຄັງອຸປະກອນໃຫ້ເຊົ່າ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-2xl flex items-center justify-center mb-4 text-zinc-500 border border-zinc-700/40">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">ບໍ່ພົບລາຍການອຸປະກອນ</h3>
          <p className="text-zinc-400 text-xs max-w-sm mb-5">
            {search || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "ບໍ່ພົບອຸປະກອນທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ ລອງປັບຕົວກອງໃໝ່"
              : "ຍັງບໍ່ທັນມີລາຍການອຸປະກອນໃນຄັງ ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເພີ່ມອຸປະກອນ"}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມອຸປະກອນໃໝ່</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid Cards View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map(item => {
            const statusCfg = STATUS_CONFIGS[item.status] || STATUS_CONFIGS.AVAILABLE;
            const availUnits = item.availableQuantity ?? Math.max(0, item.stockQuantity - (item.maintenanceQuantity || 0) - (item.rentedQuantity || 0));
            const maintUnits = item.maintenanceQuantity || 0;
            const rentedUnits = item.rentedQuantity || 0;
            const totalUnits = item.stockQuantity || 1;

            return (
              <div
                key={item.id}
                className="bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:shadow-black/50 backdrop-blur-xl"
              >
                <div>
                  {/* Top Image Preview & Badges */}
                  <div className="h-44 w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800/60">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-600 gap-1.5">
                        <ImageIcon className="w-10 h-10 stroke-1 text-zinc-700" />
                        <span className="text-[11px] text-zinc-600">ບໍ່ມີຮູບພາບ</span>
                      </div>
                    )}

                    {/* Stock Overview Pill */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/75 backdrop-blur-md text-white border border-white/10 shadow-sm flex items-center gap-1">
                        <span>ຄົງເຫຼືອພ້ອມເຊົ່າ:</span>
                        <span className="text-emerald-400 font-extrabold">{availUnits}</span>
                        <span>/ {totalUnits} ຊິ້ນ</span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md shadow-sm flex items-center gap-1.5 ${statusCfg.badgeColor} bg-black/60`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* Gradient Fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-900 to-transparent" />
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Code & Type */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleCopyCode(item.equipmentCode, item.id)}
                          title="ຄລິກເພື່ອຄັດລອກລະຫັດ"
                          className="font-mono text-xs text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded-md border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition-colors flex items-center gap-1"
                        >
                          <span>{item.equipmentCode}</span>
                          {copiedCodeId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-500" />
                          )}
                        </button>
                        {item.barcode && (
                          <span
                            className="font-mono text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800"
                            title={`ບາໂຄດ: ${item.barcode}`}
                          >
                            BC: {item.barcode}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {item.type}
                      </span>
                    </div>

                    {/* Equipment Name */}
                    <div>
                      <h3
                        className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-emerald-300 transition-colors"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Detailed Stock Breakdown Box (User Request: Ready vs Maintenance vs Rented) */}
                    <div className="bg-zinc-950/90 rounded-xl p-2.5 border border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ພ້ອມໃຫ້ເຊົ່າ:</span>
                        </span>
                        <strong className="text-emerald-400">{availUnits} ຊິ້ນ</strong>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-rose-400" />
                          <span>ກຳລັງສ້ອມແປງ:</span>
                        </span>
                        <strong className={maintUnits > 0 ? "text-rose-400 font-bold" : "text-zinc-500"}>
                          {maintUnits} ຊິ້ນ
                        </strong>
                      </div>

                      {rentedUnits > 0 && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Timer className="w-3 h-3 text-amber-400" />
                            <span>ຖືກເຊົ່າຢູ່:</span>
                          </span>
                          <strong className="text-amber-400">{rentedUnits} ຊິ້ນ</strong>
                        </div>
                      )}

                      {/* Stock Progress Bar */}
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden flex mt-1">
                        <div
                          style={{ width: `${(availUnits / totalUnits) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`ພ້ອມເຊົ່າ ${availUnits}`}
                        />
                        <div
                          style={{ width: `${(maintUnits / totalUnits) * 100}%` }}
                          className="bg-rose-500 h-full"
                          title={`ກຳລັງສ້ອມ ${maintUnits}`}
                        />
                        <div
                          style={{ width: `${(rentedUnits / totalUnits) * 100}%` }}
                          className="bg-amber-500 h-full"
                          title={`ຖືກເຊົ່າ ${rentedUnits}`}
                        />
                      </div>
                    </div>

                    {/* Pricing Box */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5">
                        <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider mb-0.5">
                          ຄ່າເຊົ່າ / ມື້
                        </div>
                        <div className="text-sm font-black text-emerald-300">
                          {item.rentalPrice ? `${item.rentalPrice.toLocaleString()} ₭` : "ຟຣີ"}
                        </div>
                      </div>

                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5">
                        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                          ຄ່າມັດຈຳ
                        </div>
                        <div className="text-sm font-bold text-zinc-200">
                          {item.depositPrice ? `${item.depositPrice.toLocaleString()} ₭` : "0 ₭"}
                        </div>
                      </div>
                    </div>

                    {/* Fines & Deposit Info Banner */}
                    <div className="flex items-center justify-between text-[11px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl text-amber-300">
                      <span className="flex items-center gap-1 font-semibold">
                        <Banknote className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>ຄ່າປັບໃໝ & ມັດຈຳ:</span>
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.depositPrice ? `${item.depositPrice.toLocaleString()} ₭` : "0 ₭"} <span className="text-[10px] text-rose-400 font-semibold">(ປັບໃໝ 10,000 ₭/ມື້)</span>
                      </span>
                    </div>

                    {/* Retail Replacement Value & Store Link Indicator */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-zinc-500" />
                        <span>ມູນຄ່າສິນຄ້າ:</span>
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {item.retailPrice ? `${item.retailPrice.toLocaleString()} ₭` : "-"}
                      </span>
                    </div>

                    {item.productId && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">ເຊື່ອມຕໍ່ສິນຄ້າໃນຮ້ານແລ້ວ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls & Actions */}
                <div className="p-4 pt-2 border-t border-zinc-800/80 space-y-2.5">
                  {/* Maintenance Quick Actions */}
                  <div className="flex items-center gap-1.5">
                    {availUnits > 0 && (
                      <button
                        onClick={() => openMaintenanceDialog(item, "SEND")}
                        className="flex-1 py-1 px-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        title="ສົ່ງອຸປະກອນຊຳລຸດໄປສ້ອມແປງ"
                      >
                        <Wrench className="w-3 h-3 text-amber-400" />
                        <span>ສົ່ງສ້ອມແປງ</span>
                      </button>
                    )}

                    {maintUnits > 0 && (
                      <button
                        onClick={() => openMaintenanceDialog(item, "RETURN")}
                        className="flex-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        title="ສ້ອມແປງສຳເລັດ ສົ່ງຄືນຄັງ"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                        <span>ສ້ອມແປງແລ້ວ</span>
                      </button>
                    )}

                    {/* View History Log Button */}
                    <button
                      onClick={() => openHistoryDialog(item)}
                      title="ເບິ່ງປະຫວັດການປ່ຽນສະຖານະ & ໃຜເປັນຄົນປ່ຽນ"
                      className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors border border-zinc-700/60 flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] font-medium hidden sm:inline">ປະຫວັດ</span>
                    </button>
                  </div>

                  {/* Standard Actions (Rent, Edit, Delete) */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    {availUnits > 0 ? (
                      <Link
                        href={`/dashboard/rental/issue?item=${encodeURIComponent(item.name)}&fee=${item.rentalPrice || 0}&deposit=${item.depositPrice || 0}&equipId=${item.id}`}
                        title="ເປີດບິນເຊົ່າອຸປະກອນນີ້ (ພ້ອມລາຄາເຊົ່າ ແລະ ມັດຈຳ)"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>ເຊົ່າອຸປະກອນ</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="ອຸປະກອນນີ້ໝົດຄັງແລ້ວ ຫຼື ບໍ່ພ້ອມໃຫ້ເຊົ່າ"
                        className="px-2.5 py-1 bg-zinc-800/80 text-zinc-500 border border-zinc-700/40 rounded-lg text-xs font-medium flex items-center gap-1 cursor-not-allowed"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
                        <span>ໝົດຄັງ</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        title="ແກ້ໄຂອຸປະກອນ"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        title="ລຶບອຸປະກອນ"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/70 text-xs text-zinc-400 uppercase font-semibold border-b border-zinc-800/80">
                <tr>
                  <th className="py-3.5 px-4">ອຸປະກອນ</th>
                  <th className="py-3.5 px-4">ລະຫັດ & ປະເພດ</th>
                  <th className="py-3.5 px-4 text-center">ຍອດຄົງເຫຼືອ (ພ້ອມເຊົ່າ / ສ້ອມ / ເຊົ່າ)</th>
                  <th className="py-3.5 px-4 text-right">ຄ່າເຊົ່າ</th>
                  <th className="py-3.5 px-4 text-right">ຄ່າມັດຈຳ</th>
                  <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredItems.map(item => {
                  const statusCfg = STATUS_CONFIGS[item.status] || STATUS_CONFIGS.AVAILABLE;
                  const availUnits = item.availableQuantity ?? Math.max(0, item.stockQuantity - (item.maintenanceQuantity || 0) - (item.rentedQuantity || 0));
                  const maintUnits = item.maintenanceQuantity || 0;
                  const rentedUnits = item.rentedQuantity || 0;
                  const totalUnits = item.stockQuantity || 1;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center flex-shrink-0 border border-zinc-800">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm line-clamp-1">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.description}</div>
                            )}
                            {item.productId && (
                              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 mt-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>ເຊື່ອມສິນຄ້າໃນຮ້ານ</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code & Type */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-zinc-300">{item.equipmentCode}</div>
                        {item.barcode && (
                          <div className="font-mono text-[10px] text-zinc-500 mt-0.5">BC: {item.barcode}</div>
                        )}
                        <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                          {item.type}
                        </span>
                      </td>

                      {/* Stock Breakdown */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
                          <span className="text-emerald-400 font-bold" title="ພ້ອມເຊົ່າ">
                            {availUnits} ພ້ອມ
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className={maintUnits > 0 ? "text-rose-400 font-bold" : "text-zinc-500"} title="ກຳລັງສ້ອມ">
                            {maintUnits} ສ້ອມ
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className={rentedUnits > 0 ? "text-amber-400 font-bold" : "text-zinc-500"} title="ຖືກເຊົ່າ">
                            {rentedUnits} ເຊົ່າ
                          </span>
                          <span className="text-zinc-500 text-[10px]">({totalUnits})</span>
                        </div>
                      </td>

                      {/* Rental Price */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {item.rentalPrice ? `${item.rentalPrice.toLocaleString()} ₭` : "ຟຣີ"}
                      </td>

                      {/* Deposit Price */}
                      <td className="py-3 px-4 text-right font-medium text-zinc-300">
                        {item.depositPrice ? `${item.depositPrice.toLocaleString()} ₭` : "0 ₭"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${statusCfg.badgeColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openHistoryDialog(item)}
                            title="ເບິ່ງປະຫວັດການປ່ຽນສະຖານະ"
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {availUnits > 0 ? (
                            <Link
                              href={`/dashboard/rental/issue?item=${encodeURIComponent(item.name)}&fee=${item.rentalPrice || 0}&deposit=${item.depositPrice || 0}&equipId=${item.id}`}
                              title="ເປີດບິນເຊົ່າອຸປະກອນນີ້ (ພ້ອມລາຄາ)"
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                              <Timer className="w-4 h-4" />
                            </Link>
                          ) : (
                            <span
                              title="ອຸປະກອນໝົດຄັງ (ບໍ່ສາມາດເຊົ່າໄດ້)"
                              className="p-1.5 text-zinc-600 cursor-not-allowed inline-flex items-center"
                            >
                              <Timer className="w-4 h-4" />
                            </span>
                          )}
                          <button
                            onClick={() => openEditModal(item)}
                            title="ແກ້ໄຂ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="ລຶບ"
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Maintenance Modal (Send to repair / Return from repair) ── */}
      {showMaintModal && maintItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  maintActionType === "SEND" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {maintActionType === "SEND" ? <Wrench className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {maintActionType === "SEND" ? "ສົ່ງອຸປະກອນໄປສ້ອມແປງ" : "ສ້ອມແປງສຳເລັດ ສົ່ງຄືນຄັງ"}
                  </h2>
                  <p className="text-xs text-zinc-400">{maintItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaintModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Unit status indicator */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-zinc-500 block">ພ້ອມໃຫ້ເຊົ່າປັດຈຸບັນ:</span>
                  <strong className="text-emerald-400 text-sm">
                    {maintItem.availableQuantity ?? maintItem.stockQuantity} ຊິ້ນ
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block">ກຳລັງສ້ອມແປງ:</span>
                  <strong className="text-rose-400 text-sm">{maintItem.maintenanceQuantity || 0} ຊິ້ນ</strong>
                </div>
              </div>

              {/* Quantity input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຈຳນວນທີ່ຕ້ອງການ{maintActionType === "SEND" ? "ສົ່ງສ້ອມແປງ" : "ສົ່ງຄືນຄັງພ້ອມໃຊ້"} (ຊິ້ນ) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    maintActionType === "SEND"
                      ? (maintItem.availableQuantity ?? maintItem.stockQuantity)
                      : (maintItem.maintenanceQuantity || 1)
                  }
                  value={maintQty}
                  onChange={e => setMaintQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Reason / Note input (Crucial for audit tracking) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ເຫດຜົນ / ອາການຊຳລຸດ / ໝາຍເຫດ (ບັນທຶກປະຫວັດ) <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={maintReason}
                  onChange={e => setMaintReason(e.target.value)}
                  rows={2}
                  required
                  placeholder={
                    maintActionType === "SEND"
                      ? "ຕົວຢ່າງ: ເອັນຂາດ, ດ້າມຫຼວມ, ນຳສົ່ງຊ່າງປ່ຽນກິບ..."
                      : "ຕົວຢ່າງ: ສ້ອມແປງເອັນແລ້ວ ສະພາບ 100% ພ້ອມໃຫ້ເຊົ່າ..."
                  }
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowMaintModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={isProcessingMaint}
                onClick={handleProcessMaintenance}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  maintActionType === "SEND"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                }`}
              >
                {isProcessingMaint && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{maintActionType === "SEND" ? "ຢືນຢັນສົ່ງສ້ອມແປງ" : "ຢືນຢັນສົ່ງຄືນຄັງ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Change & Audit History Modal (Who changed status) ── */}
      {showHistoryModal && historyTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">ປະຫວັດການປ່ຽນສະຖານະ & ຜູ້ດຳເນີນການ</h2>
                  <p className="text-xs text-zinc-400">
                    {historyTargetItem.name} ({historyTargetItem.equipmentCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Timeline */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {!historyTargetItem.statusHistory || historyTargetItem.statusHistory.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-500 italic">
                  ຍັງບໍ່ມີປະຫວັດການປ່ຽນສະຖານະສຳລັບອຸປະກອນນີ້
                </div>
              ) : (
                <div className="space-y-4">
                  {historyTargetItem.statusHistory.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2 relative"
                    >
                      {/* Top Bar: User & Role Badge & Timestamp */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                            {hist.changedBy?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block">
                              {hist.changedBy?.name || hist.changedBy?.email || "Staff"}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {hist.changedBy?.email} {hist.changedBy?.role ? `• ${hist.changedBy.role}` : ""}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] text-zinc-400 font-mono">
                          {new Date(hist.changedAt).toLocaleString("lo-LA")}
                        </span>
                      </div>

                      {/* Status Transition & Quantity */}
                      <div className="flex items-center gap-2 text-xs pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-400">ສະຖານະ:</span>
                        <span className="font-mono text-zinc-300 font-bold">{hist.fromStatus || "-"}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-500" />
                        <span className="font-mono text-emerald-400 font-bold">{hist.toStatus}</span>

                        {hist.quantity !== undefined && (
                          <span className="ml-auto text-[11px] font-bold bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                            ຈຳນວນ: {hist.quantity} ຊິ້ນ
                          </span>
                        )}
                      </div>

                      {/* Action & Reason Note */}
                      {hist.note && (
                        <div className="text-xs text-zinc-300 bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800 italic">
                          &ldquo;{hist.note}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <PackageOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingItem ? "ແກ້ໄຂຂໍ້ມູນອຸປະກອນໃຫ້ເຊົ່າ" : "ເພີ່ມອຸປະກອນໃຫ້ເຊົ່າໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {editingItem ? "ປັບປຸງຂໍ້ມູນ, ຍອດຄົງເຫຼືອພ້ອມເຊົ່າ ແລະ ບັນທຶກປະຫວັດ" : "ກະລຸນາຕື່ມຂໍ້ມູນອຸປະກອນໃຫ້ຄົບຖ້ວນ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="equipment-form" onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. Link to Store Product (ເຊື່ອມຕໍ່ກັບສິນຄ້າໃນຮ້ານ) */}
                <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 p-4 rounded-2xl border border-emerald-500/25 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <PackageOpen className="w-4 h-4" />
                      <span>ເຊື່ອມຕໍ່ກັບສິນຄ້າໃນຮ້ານ (Link to Store Inventory)</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">ດຶງຂໍ້ມູນ, ມູນຄ່າ ແລະ ຮູບພາບອັດຕະໂນມັດ</span>
                  </div>
                  <select
                    value={selectedProductId}
                    onChange={e => handleSelectStoreProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="">-- ເລືອກສິນຄ້າໃນຮ້ານເພື່ອເຊື່ອມໂຍງ (ຫຼື ປ້ອນຂໍ້ມູນເອງດ້ານລຸ່ມ) --</option>
                    {storeProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ລາຄາ: {(p.price || 0).toLocaleString()} ₭ (ຄັງ: {p.stock ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        ລະຫັດອຸປະກອນ (Code) <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateAutoCode}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>ສຸ່ມລະຫັດ</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={equipmentCode}
                      onChange={e => setEquipmentCode(e.target.value)}
                      required
                      placeholder="ຕົວຢ່າງ: EQ-BDM-001"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ປະເພດອຸປະກອນ (Category)</span>
                        <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCatModal(true)}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ເພີ່ມປະເພດໃໝ່</span>
                      </button>
                    </div>
                    <select
                      value={type}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "__ADD_NEW_CATEGORY__") {
                          setShowQuickAddCatModal(true);
                        } else {
                          setType(val);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      {allCategoryOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="__ADD_NEW_CATEGORY__" className="text-emerald-400 font-bold bg-zinc-900">
                        + ເພີ່ມປະເພດ / ໝວດໝູ່ໃໝ່...
                      </option>
                    </select>

                    {/* Dedicated Add Category Button directly under the dropdown */}
                    <div className="mt-2 p-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-400">ບໍ່ມີປະເພດອຸປະກອນໃນລາຍການ?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCatModal(true)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-emerald-600/30 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ ເພີ່ມປະເພດໃໝ່</span>
                        </button>
                        <Link
                          href="/dashboard/categories"
                          target="_blank"
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <span>ຈັດການໝວດໝູ່</span>
                          <ArrowUpRight className="w-3 h-3 text-blue-400" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Custom Type if "Other" */}
                  {type === "ອື່ນໆ" && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ລະບຸປະເພດກິລາ / ອຸປະກອນອື່ນໆ
                      </label>
                      <input
                        type="text"
                        value={customType}
                        onChange={e => setCustomType(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ສະເກັດບອດ, ໂຕະປິງປອງ, ບານບ້ວງ..."
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (customType.trim()) {
                              setNewCatName(customType.trim());
                            }
                            setShowQuickAddCatModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ ບັນທຶກ &ldquo;{customType || "ອຸປະກອນໃໝ່"}&rdquo; ເຂົ້າໝວດໝູ່ຫຼັກ</span>
                        </button>
                        <Link
                          href="/dashboard/categories"
                          target="_blank"
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <span>ໄປໜ້າຈັດການໝວດໝູ່</span>
                          <ArrowUpRight className="w-3 h-3 text-blue-400" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຊື່ອຸປະກອນ ແລະ ລຸ້ນ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="ຕົວຢ່າງ: Yonex Astrox 88D Pro (ໄມ້ຕີດອກປີກໄກ່)"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Image Link */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ລິ້ງຄ໌ຮູບພາບອຸປະກອນ (Image URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={image}
                        onChange={e => setImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      {image && (
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex-shrink-0">
                          <img src={image} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ລາຍລະອຽດ ຫຼື ສະພາບອຸປະກອນ
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      placeholder="ຕົວຢ່າງ: ສະພາບ 95%, ເອັນຕຶງ 26 lbs, ດ້າມໃໝ່..."
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Total Stock Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຈຳນວນລວມທັງໝົດ (Total Stock) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={e => {
                        const val = e.target.value;
                        setStockQuantity(val);
                        if (!editingItem) {
                          setAvailableQuantity(val);
                        }
                      }}
                      required
                      min="1"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  {/* Available Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຍອດຄົງເຫຼືອພ້ອມໃຫ້ເຊົ່າ (Available Units) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={availableQuantity}
                      onChange={e => setAvailableQuantity(e.target.value)}
                      required
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Maintenance Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຈຳນວນທີ່ກຳລັງສ້ອມແປງ (In Maintenance)
                    </label>
                    <input
                      type="number"
                      value={maintenanceQuantity}
                      onChange={e => setMaintenanceQuantity(e.target.value)}
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-rose-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ສະຖານະຫຼັກ
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="AVAILABLE">ພ້ອມໃຫ້ເຊົ່າ (Available)</option>
                      <option value="RENTED">ຖືກເຊົ່າຢູ່ (Rented)</option>
                      <option value="MAINTENANCE">ບຳລຸງຮັກສາ / ສ້ອມແປງ (Maintenance)</option>
                    </select>
                  </div>

                  {/* Rental Price */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຄ່າເຊົ່າ (ກີບ / ₭) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={rentalPrice}
                        onChange={e => setRentalPrice(e.target.value)}
                        required
                        min="0"
                        placeholder="0"
                        className="w-full pl-3.5 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                        ₭
                      </span>
                    </div>
                  </div>

                  {/* Deposit Price */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຄ່າມັດຈຳ (ກີບ / ₭)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositPrice}
                        onChange={e => setDepositPrice(e.target.value)}
                        min="0"
                        placeholder="0"
                        className="w-full pl-3.5 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                        ₭
                      </span>
                    </div>
                  </div>

                  {/* Retail Replacement Value */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ມູນຄ່າສິນຄ້າຕົວຈິງ / ຊົດໃຊ້ຫາກສູນຫາຍ (ກີບ / ₭)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={retailPrice}
                        onChange={e => setRetailPrice(e.target.value)}
                        min="0"
                        placeholder="0"
                        className="w-full pl-3.5 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                        ₭
                      </span>
                    </div>
                  </div>

                  {/* Barcode with Camera Scanner */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        ບາໂຄດສິນຄ້າ (Barcode)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("BARCODE_INPUT");
                          setIsCameraScannerOpen(true);
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 transition-colors"
                        title="ເປີດກ້ອງສະແກນບາໂຄດເຂົ້າຊ່ອງນີ້"
                      >
                        <Camera className="w-3 h-3" />
                        <span>ກ້ອງສະແກນ</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        placeholder="ຕົວຢ່າງ: 8850123456789"
                        className="w-full pl-3.5 pr-28 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("BARCODE_INPUT");
                          setIsCameraScannerOpen(true);
                        }}
                        className="absolute right-1.5 px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                        title="ເປີດກ້ອງສະແກນບາໂຄດ"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>ກ້ອງສະແກນ</span>
                      </button>
                    </div>
                  </div>

                  {/* Audit Reason Note (Who changed what) */}
                  {editingItem && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເຫດຜົນການແກ້ໄຂ / ໝາຍເຫດບັນທຶກປະຫວັດຜູ້ດຳເນີນການ
                      </label>
                      <input
                        type="text"
                        value={editReasonNote}
                        onChange={e => setEditReasonNote(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ປັບຍອດຄົງເຫຼືອເພີ່ມ 2 ຊິ້ນ, ປ່ຽນລາຄາເຊົ່າ..."
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-zinc-800 bg-zinc-950/70 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                form="equipment-form"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກອຸປະກອນ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Add Category Modal ── */}
      {showQuickAddCatModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">ເພີ່ມປະເພດ / ໝວດໝູ່ອຸປະກອນໃໝ່</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddCatModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຊື່ປະເພດອຸປະກອນ / ໝວດໝູ່ໃໝ່ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  required
                  placeholder="ຕົວຢ່າງ: ສະເກັດບອດ, ປິງປອງ, ລອຍນ້ຳ, ໂຍຄະ..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ລາຍລະອຽດ ຫຼື ຄຳອະທິບາຍ (ຖ້າມີ)
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="ໝວດໝູ່ອຸປະກອນກິລາພິເສດ..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  href="/dashboard/categories"
                  target="_blank"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>ເປີດໜ້າຈັດການໝວດໝູ່ເຕັມ</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCatModal(false)}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCat}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    {isSavingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>ບັນທຶກ &amp; ເລືອກ</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Barcode / QR Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          if (scannerTarget === "BARCODE_INPUT") {
            setBarcode(code);
            toast.success(`ສະແກນບາໂຄດສຳເລັດ: ${code}`);
          } else {
            handleInspectEquipmentByQuery(code);
          }
        }}
        title={
          scannerTarget === "BARCODE_INPUT"
            ? "ສະແກນບາໂຄດອຸປະກອນ (Scan Equipment Barcode)"
            : "ສະແກນບາໂຄດອຸປະກອນເຊົ່າ (Scan Equipment)"
        }
        subtitle={
          scannerTarget === "BARCODE_INPUT"
            ? "ສ່ອງກ້ອງໃສ່ບາໂຄດສິນຄ້າເພື່ອປ້ອນລະຫັດອັດຕະໂນມັດ"
            : "ສ່ອງກ້ອງໃສ່ບາໂຄດ ຫຼື ລະຫັດອຸປະກອນເພື່ອຄົ້ນຫາດ່ວນ"
        }
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດ..."
      />
    </div>
  );
}
