"use client";

import { useState, useEffect, useMemo } from "react";
import { askConfirm } from "@/components/ConfirmModal";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  ListPlus,
  Printer,
  Sparkles,
  Sliders,
  CheckCircle,
  Search,
  Package,
  Layers,
  Check,
  X,
  CreditCard,
  FileText,
  AlertCircle,
  Tag,
  Coffee,
  Flame,
  CheckSquare,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModifierItem = {
  id: string;
  name: string;
  price: number;
  groupId: string;
};

type ProductRef = {
  id: string;
  name: string;
  images?: string[];
  category?: string;
  price?: number;
};

type ModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  productIds?: string[];
  modifiers: ModifierItem[];
  products?: ProductRef[];
};

export default function ModifiersClient() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "REQUIRED" | "OPTIONAL">("ALL");

  // Group Dialog
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [groupData, setGroupData] = useState({
    name: "",
    isRequired: false,
    minSelections: "0",
    maxSelections: "",
    productIds: [] as string[],
  });

  // Item (Option) Dialog
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ModifierItem | null>(null);
  const [itemData, setItemData] = useState({
    name: "",
    price: "0",
    groupId: "",
  });

  // Assign Products Modal
  const [assignModalGroup, setAssignModalGroup] = useState<ModifierGroup | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isSavingProducts, setIsSavingProducts] = useState(false);

  // Print Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<"SLIP" | "A4">("A4");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/modifiers?catalog=true");
      if (res.ok) {
        const data = await res.json();
        if (data.groups && Array.isArray(data.groups)) {
          setGroups(data.groups);
          setAvailableProducts(data.availableProducts || []);
        } else if (Array.isArray(data)) {
          setGroups(data);
        }
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຕົວເລືອກເສີມໄດ້");
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const requiredGroups = groups.filter((g) => g.isRequired).length;
    const optionalGroups = totalGroups - requiredGroups;
    const totalModifiers = groups.reduce((acc, g) => acc + (g.modifiers?.length || 0), 0);
    const linkedProductsCount = new Set(
      groups.flatMap((g) => g.productIds || g.products?.map((p) => p.id) || [])
    ).size;

    return {
      totalGroups,
      requiredGroups,
      optionalGroups,
      totalModifiers,
      linkedProductsCount,
    };
  }, [groups]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.modifiers?.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        filterType === "ALL"
          ? true
          : filterType === "REQUIRED"
          ? g.isRequired
          : !g.isRequired;

      return matchesSearch && matchesType;
    });
  }, [groups, searchQuery, filterType]);

  // Open Group Dialog
  const handleOpenGroupDialog = (group: ModifierGroup | null = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupData({
        name: group.name,
        isRequired: group.isRequired,
        minSelections: String(group.minSelections ?? 0),
        maxSelections: group.maxSelections !== null && group.maxSelections !== undefined ? String(group.maxSelections) : "",
        productIds: group.productIds || group.products?.map((p) => p.id) || [],
      });
    } else {
      setEditingGroup(null);
      setGroupData({
        name: "",
        isRequired: false,
        minSelections: "0",
        maxSelections: "",
        productIds: [],
      });
    }
    setIsGroupDialogOpen(true);
  };

  // Save Group
  const handleSaveGroup = async () => {
    if (!groupData.name.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ກຸ່ມຕົວເລືອກ");
    }
    setIsSaving(true);
    try {
      const url = editingGroup ? `/api/modifiers/${editingGroup.id}` : "/api/modifiers";
      const res = await fetch(url, {
        method: editingGroup ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (res.ok) {
        toast.success(editingGroup ? "ແກ້ໄຂກຸ່ມຕົວເລືອກສຳເລັດ" : "ເພີ່ມກຸ່ມຕົວເລືອກໃໝ່ສຳເລັດ");
        setIsGroupDialogOpen(false);
        fetchData();
      } else {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (group: ModifierGroup) => {
    const ok = await askConfirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບກຸ່ມ "${group.name}"? ຕົວເລືອກຍ່ອຍທັງໝົດ ${group.modifiers?.length || 0} ລາຍການຈະຖືກລຶບອອກນຳ.`,
      { variant: "destructive" }
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/modifiers/${group.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບກຸ່ມຕົວເລືອກສຳເລັດ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບກຸ່ມຕົວເລືອກໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  // Open Item Dialog (Add or Edit Option)
  const handleOpenItemDialog = (groupId: string, item: ModifierItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setItemData({
        name: item.name,
        price: String(item.price || 0),
        groupId,
      });
    } else {
      setEditingItem(null);
      setItemData({
        name: "",
        price: "0",
        groupId,
      });
    }
    setIsItemDialogOpen(true);
  };

  // Save Item (Option)
  const handleSaveItem = async () => {
    if (!itemData.name.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ຕົວເລືອກ");
    }
    setIsSaving(true);
    try {
      const url = editingItem
        ? `/api/modifiers/item/${editingItem.id}`
        : `/api/modifiers/${itemData.groupId}`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemData.name.trim(),
          price: parseFloat(itemData.price) || 0,
        }),
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂຕົວເລືອກສຳເລັດ" : "ເພີ່ມຕົວເລືອກໃໝ່ສຳເລັດ");
        setIsItemDialogOpen(false);
        fetchData();
      } else {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຕົວເລືອກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (item: ModifierItem) => {
    const ok = await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຕົວເລືອກ "${item.name}"?`, {
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/modifiers/item/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບຕົວເລືອກສຳເລັດ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບຕົວເລືອກໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  // Seed Presets (1-Click Popular Presets)
  const handleSeedPresets = async () => {
    const ok = await askConfirm(
      "ທ່ານຕ້ອງການສ້າງຊຸດຕົວເລືອກຍອດນິຍົມອັດຕະໂນມັດບໍ່? (ປະກອບມີ: ລະດັບຄວາມຫວານ, ຂະໜາດແກ້ວ, ທັອບປິ້ງ, ລະດັບຄວາມເຜັດ, ຊະນິດຊີ້ນ)",
      { variant: "default" }
    );
    if (!ok) return;

    setIsSeeding(true);
    try {
      const res = await fetch("/api/modifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED_PRESETS" }),
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`ສ້າງຊຸດຕົວເລືອກສຳເລັດ ${result.createdCount || 0} ກຸ່ມ`);
        fetchData();
      } else {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການສ້າງຊຸດຕົວເລືອກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Assign Products Modal
  const handleOpenAssignModal = (group: ModifierGroup) => {
    setAssignModalGroup(group);
    setSelectedProductIds(group.productIds || group.products?.map((p) => p.id) || []);
    setProductSearch("");
  };

  // Save Assigned Products
  const handleSaveAssignedProducts = async () => {
    if (!assignModalGroup) return;
    setIsSavingProducts(true);
    try {
      const res = await fetch(`/api/modifiers/${assignModalGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProductIds }),
      });
      if (res.ok) {
        toast.success("ບັນທຶກການເຊື່ອມໂຍງສິນຄ້າສຳເລັດ");
        setAssignModalGroup(null);
        fetchData();
      } else {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsSavingProducts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຕົວເລືອກເສີມ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ກຸ່ມຕົວເລືອກທັງໝົດ</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalGroups}</div>
          <div className="text-[11px] text-zinc-500 mt-1">ກຸ່ມຕົວເລືອກພາຍໃນຮ້ານ</div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ບັງຄັບເລືອກ (Required)</span>
            <CheckCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.requiredGroups}</div>
          <div className="text-[11px] text-zinc-500 mt-1">ລູກຄ້າຕ້ອງເລືອກກ່ອນສັ່ງ</div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ລາຍການຕົວເລືອກຍ່ອຍ</span>
            <Tag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{stats.totalModifiers}</div>
          <div className="text-[11px] text-zinc-500 mt-1">ທາງເລືອກທັງໝົດໃນລະບົບ</div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ສິນຄ້າທີ່ເຊື່ອມໂຍງ</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{stats.linkedProductsCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">ລາຍການເມນູທີ່ນຳໃຊ້ຕົວເລືອກ</div>
        </div>
      </div>

      {/* ── Top Action Buttons & Presets ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => handleOpenGroupDialog()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ ເພີ່ມກຸ່ມໃໝ່ (Add Group)</span>
          </Button>

          <Button
            onClick={handleSeedPresets}
            disabled={isSeeding}
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            <span>ໃສ່ຊຸດຕົວເລືອກຍອດນິຍົມ (Presets)</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPrintModal(true)}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-10 px-3 rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>ພິມລາຍການ (Print)</span>
          </Button>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ຄົ້ນຫາກຸ່ມ ຫຼື ຕົວເລືອກ (ເຊັ່ນ: ຄວາມຫວານ, ໄຂ່ມຸກ, ຂະໜາດ...)"
            className="pl-10 bg-zinc-900/80 border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 h-10"
          />
        </div>

        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "ALL" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            ທັງໝົດ ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("REQUIRED")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "REQUIRED" ? "bg-amber-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            ບັງຄັບເລືອກ ({stats.requiredGroups})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("OPTIONAL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "OPTIONAL" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            ເລືອກເສີມ ({stats.optionalGroups})
          </button>
        </div>
      </div>

      {/* ── Modifier Groups Grid ── */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mx-auto">
            <ListPlus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-200">ຍັງບໍ່ມີຂໍ້ມູນກຸ່ມຕົວເລືອກ</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              ທ່ານສາມາດກົດປຸ່ມເພີ່ມກຸ່ມໃໝ່ ຫຼື ກົດ "ໃສ່ຊຸດຕົວເລືອກຍອດນິຍົມ" ເພື່ອສ້າງຕົວເລືອກພື້ນຖານອັດຕະໂນມັດ
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => handleOpenGroupDialog()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>ເພີ່ມກຸ່ມທຳອິດ</span>
            </Button>
            <Button
              onClick={handleSeedPresets}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold px-4 rounded-xl"
            >
              <Sparkles className="w-4 h-4 text-amber-400 mr-1.5" />
              <span>ສ້າງຊຸດຍອດນິຍົມດ່ວນ</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const linkedProducts = group.products || [];
            const linkedCount = group.productIds?.length || linkedProducts.length || 0;

            return (
              <div
                key={group.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all hover:border-zinc-700"
              >
                {/* Group Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {group.name}
                      </h3>
                      {group.isRequired ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                          ບັງຄັບເລືອກ
                        </span>
                      ) : (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 px-2 py-0.5 rounded-full font-medium">
                          ເລືອກເສີມ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>ຕ່ຳສຸດ: <strong className="text-zinc-200">{group.minSelections}</strong></span>
                      <span>•</span>
                      <span>ສູງສຸດ: <strong className="text-zinc-200">{group.maxSelections || "ບໍ່ຈຳກັດ"}</strong></span>
                    </div>
                  </div>

                  {/* Group Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenGroupDialog(group)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                      title="ແກ້ໄຂກຸ່ມ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group)}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-xl transition-colors"
                      title="ລຶບກຸ່ມ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Linked Products Bar */}
                <div className="px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/40 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-400" />
                    <span>ນຳໃຊ້ກັບ {linkedCount} ສິນຄ້າ</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(group)}
                    className="text-purple-400 hover:text-purple-300 font-bold hover:underline"
                  >
                    ຈັດການສິນຄ້າ
                  </button>
                </div>

                {/* Modifiers List inside Group */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {group.modifiers && group.modifiers.length > 0 ? (
                      group.modifiers.map((mod) => (
                        <div
                          key={mod.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors gap-2"
                        >
                          <span className="text-sm font-semibold text-zinc-200 truncate flex-1">
                            {mod.name}
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${
                                (mod.price || 0) > 0
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "text-zinc-500"
                              }`}
                            >
                              {(mod.price || 0) > 0 ? `+₭${mod.price.toLocaleString()}` : "ຟຣີ"}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleOpenItemDialog(group.id, mod)}
                              className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800"
                              title="ແກ້ໄຂ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(mod)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800"
                              title="ລຶບ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-zinc-500 italic bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800">
                        ບໍ່ມີຕົວເລືອກໃນກຸ່ມນີ້
                      </div>
                    )}
                  </div>

                  {/* Add Modifier Item Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenItemDialog(group.id)}
                    className="w-full border-zinc-700/80 border-dashed text-zinc-300 hover:text-white hover:bg-zinc-800 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ເພີ່ມຕົວເລືອກໃນກຸ່ມນີ້ (Add Option)</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: Group Dialog (Create / Edit Group) ── */}
      {isGroupDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingGroup ? "ແກ້ໄຂກຸ່ມຕົວເລືອກ" : "ເພີ່ມກຸ່ມຕົວເລືອກໃໝ່"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupDialogOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຊື່ກຸ່ມຕົວເລືອກ <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={groupData.name}
                  onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                  placeholder="ຕົວຢ່າງ: ລະດັບຄວາມຫວານ, ຂະໜາດແກ້ວ, ທັອບປິ້ງ..."
                  className="bg-zinc-950 border-zinc-800 text-white text-sm rounded-xl h-10"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="isRequiredGroup"
                  checked={groupData.isRequired}
                  onChange={(e) => setGroupData({ ...groupData, isRequired: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-600"
                />
                <label htmlFor="isRequiredGroup" className="text-xs font-medium text-zinc-200 cursor-pointer">
                  ບັງຄັບໃຫ້ເລືອກ (Required) — ລູກຄ້າຕ້ອງເລືອກຢ່າງໜ້ອຍ 1 ຕົວເລືອກກ່ອນສັ່ງ
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ເລືອກຕ່ຳສຸດ (Min Selections)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={groupData.minSelections}
                    onChange={(e) => setGroupData({ ...groupData, minSelections: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 text-white text-sm rounded-xl h-10"
                  />
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ເລືອກສູງສຸດ (Max Selections)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="ບໍ່ຈຳກັດ (Unlimited)"
                    value={groupData.maxSelections}
                    onChange={(e) => setGroupData({ ...groupData, maxSelections: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 text-white text-sm rounded-xl h-10"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGroupDialogOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:text-white h-10 px-4 rounded-xl text-xs font-semibold"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSaveGroup}
                className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingGroup ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກກຸ່ມ"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Modifier Option Item Dialog ── */}
      {isItemDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingItem ? "ແກ້ໄຂຕົວເລືອກ" : "ເພີ່ມຕົວເລືອກໃໝ່"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsItemDialogOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຊື່ຕົວເລືອກ <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={itemData.name}
                  onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                  placeholder="ຕົວຢ່າງ: ຫວານ 50%, ໄຂ່ມຸກ, ຂະໜາດໃຫຍ່..."
                  className="bg-zinc-950 border-zinc-800 text-white text-sm rounded-xl h-10"
                />
              </div>

              <div>
                <Label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ລາຄາບວກເພີ່ມ (Price Adjustment / ₭)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={itemData.price}
                    onChange={(e) => setItemData({ ...itemData, price: e.target.value })}
                    placeholder="0"
                    className="bg-zinc-950 border-zinc-800 text-emerald-400 font-mono font-bold text-sm rounded-xl h-10 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                    ₭
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">ໃສ່ 0 ຖ້າເປັນຕົວເລືອກຟຣີ ບໍ່ບວກເງິນເພີ່ມ</p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemDialogOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:text-white h-10 px-4 rounded-xl text-xs font-semibold"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSaveItem}
                className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກຕົວເລືອກ"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Assign Products to Group ── */}
      {assignModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    ເລືອກສິນຄ້າທີ່ນຳໃຊ້ "{assignModalGroup.name}"
                  </h3>
                  <p className="text-xs text-zinc-400">
                    ເລືອກເມນູອາຫານ ແລະ ເຄື່ອງດື່ມທີ່ຈະສະແດງຕົວເລືອກກຸ່ມນີ້ຕອນຂາຍ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalGroup(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search within available products */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ ຫຼື ໝວດໝູ່..."
                  className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs rounded-xl h-9"
                />
              </div>
            </div>

            {/* Product selection list */}
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-1.5 custom-scrollbar">
              {availableProducts.length === 0 ? (
                <p className="text-center py-10 text-xs text-zinc-500">ຍັງບໍ່ມີລາຍການສິນຄ້າໃນຮ້ານ</p>
              ) : (
                availableProducts
                  .filter((p) =>
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    (p.category || "").toLowerCase().includes(productSearch.toLowerCase())
                  )
                  .map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProductIds(selectedProductIds.filter((id) => id !== product.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, product.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-purple-950/40 border-purple-500/60 text-white"
                            : "bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-lg border border-zinc-700 bg-zinc-900" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold truncate">{product.name}</p>
                            <p className="text-[11px] text-zinc-400">
                              {product.category || "ທົ່ວໄປ"} • ₭{(product.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                ເລືອກແລ້ວ: <strong className="text-purple-400">{selectedProductIds.length}</strong> ລາຍການ
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignModalGroup(null)}
                  className="border-zinc-700 text-zinc-300 hover:text-white h-9 px-3 rounded-xl text-xs"
                >
                  ຍົກເລີກ
                </Button>
                <Button
                  type="button"
                  disabled={isSavingProducts}
                  onClick={handleSaveAssignedProducts}
                  className="bg-purple-600 hover:bg-purple-500 text-white h-9 px-4 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                >
                  {isSavingProducts && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ບັນທຶກການເຊື່ອມໂຍງ</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Dual-Format Printable Modifier Catalog Sheet ── */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Header & Format Switcher */}
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">ພິມໃບລາຍການຕົວເລືອກເສີມ & ສະເປັກເມນູ</span>
              </div>

              {/* Format Toggle */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintFormat("SLIP")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    printFormat === "SLIP" ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ບິນນ້ອຍ 80mm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("A4")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    printFormat === "A4" ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>ບິນໃຫຍ່ A4</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-zinc-400 hover:text-white p-1 self-end sm:self-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area Preview */}
            <div className="p-6 overflow-y-auto bg-zinc-950/90 text-zinc-900 custom-scrollbar flex-1">
              {printFormat === "SLIP" ? (
                /* ── 80mm Thermal Slip ── */
                <div
                  id="printable-modifier-slip"
                  className="bg-white text-zinc-950 p-5 rounded-2xl shadow-xl border border-zinc-300 font-mono text-xs max-w-[320px] mx-auto space-y-3 leading-tight"
                >
                  <div className="text-center border-b border-dashed border-zinc-400 pb-3 space-y-1">
                    <h2 className="text-sm font-black uppercase">ໃບລາຍການຕົວເລືອກເມນູ</h2>
                    <p className="text-[10px] text-zinc-600 font-sans">MENU MODIFIERS & OPTIONS</p>
                    <p className="text-[9px] text-zinc-500 pt-1">
                      {new Date().toLocaleDateString("lo-LA")}
                    </p>
                  </div>

                  <div className="space-y-3 border-b border-dashed border-zinc-400 pb-3">
                    {groups.map((g) => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex justify-between font-bold text-[11px] text-zinc-900 border-b border-zinc-200 pb-0.5">
                          <span>{g.name}</span>
                          <span className="text-[9px] text-zinc-500">
                            {g.isRequired ? "(ບັງຄັບ)" : "(ເລືອກເສີມ)"}
                          </span>
                        </div>
                        <div className="space-y-0.5 pl-2 text-[10px] text-zinc-700">
                          {g.modifiers?.map((m) => (
                            <div key={m.id} className="flex justify-between">
                              <span>- {m.name}</span>
                              <span className="font-bold">
                                {(m.price || 0) > 0 ? `+₭${m.price.toLocaleString()}` : "ຟຣີ"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-[9px] text-zinc-500 pt-1">
                    ລວມທັງໝົດ: {stats.totalGroups} ກຸ່ມ • {stats.totalModifiers} ຕົວເລືອກ
                  </div>
                </div>
              ) : (
                /* ── Formal A4 Sheet ── */
                <div
                  id="printable-modifier-slip"
                  className="bg-white text-zinc-950 p-8 rounded-2xl shadow-xl border border-zinc-300 font-sans space-y-6 max-w-2xl mx-auto text-xs"
                >
                  <div className="flex justify-between items-start border-b-2 border-zinc-950 pb-4">
                    <div>
                      <h2 className="text-xl font-black uppercase text-zinc-950">
                        ຕາຕະລາງລາຍການຕົວເລືອກເສີມ & ສູດປັບແຕ່ງເມນູ
                      </h2>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        MASTER MENU MODIFIERS & SPECIFICATION SHEET
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-zinc-500 font-mono">
                      <div>ວັນທີພິມ: {new Date().toLocaleDateString("lo-LA")}</div>
                      <div className="font-bold text-zinc-900">{stats.totalGroups} ກຸ່ມຕົວເລືອກ</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {groups.map((group, idx) => (
                      <div key={group.id} className="border border-zinc-300 rounded-xl overflow-hidden">
                        <div className="bg-zinc-100 p-2.5 flex justify-between items-center border-b border-zinc-300">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-zinc-950">{group.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 font-medium">
                              {group.isRequired ? "ບັງຄັບເລືອກ" : "ເລືອກເສີມ"}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500">
                            ຕ່ຳສຸດ: {group.minSelections} • ສູງສຸດ: {group.maxSelections || "ບໍ່ຈຳກັດ"}
                          </span>
                        </div>

                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-zinc-50 text-zinc-700 border-b border-zinc-200">
                            <tr>
                              <th className="py-2 px-3">ຊື່ຕົວເລືອກ</th>
                              <th className="py-2 px-3 text-right">ລາຄາບວກເພີ່ມ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 font-mono">
                            {group.modifiers && group.modifiers.length > 0 ? (
                              group.modifiers.map((m) => (
                                <tr key={m.id}>
                                  <td className="py-1.5 px-3 font-sans text-zinc-800">{m.name}</td>
                                  <td className="py-1.5 px-3 text-right font-bold text-zinc-900">
                                    {(m.price || 0) > 0 ? `+₭${m.price.toLocaleString()}` : "ຟຣີ"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="py-2 px-3 text-center text-zinc-400 italic font-sans">
                                  ບໍ່ມີຕົວເລືອກ
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-dashed border-zinc-300 flex justify-between text-[11px] text-zinc-500">
                    <span>ລະບົບຈັດການຕົວເລືອກເມນູຮ້ານອາຫານ &amp; POS</span>
                    <span>ອະນຸມັດໂດຍຜູ້ຈັດການສາຂາ</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-end gap-3 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPrintModal(false)}
                className="border-zinc-700 text-zinc-300 hover:text-white h-10 px-4 rounded-xl text-xs font-semibold"
              >
                ປິດໜ້າຕ່າງ
              </Button>
              <Button
                type="button"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-5 rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{printFormat === "SLIP" ? "ພິມບິນນ້ອຍ 80mm" : "ພິມບິນໃຫຍ່ A4"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Print Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-modifier-slip,
          #printable-modifier-slip * {
            visibility: visible !important;
          }
          #printable-modifier-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printFormat === "SLIP" ? "80mm" : "100%"} !important;
            max-width: ${printFormat === "SLIP" ? "80mm" : "210mm"} !important;
            margin: 0 !important;
            padding: ${printFormat === "SLIP" ? "10px" : "20px"} !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
