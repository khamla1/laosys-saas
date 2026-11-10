"use client";

import { askConfirm } from "@/components/ConfirmModal";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Check,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Store,
  Shield,
  Loader2,
  XCircle,
  Sparkles,
  CheckSquare,
  Square,
  Layers
} from "lucide-react";

interface PackageItem {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  productLimit: number;
  orderLimit: number;
  staffLimit: number;
  isActive: boolean;
  enabledModules?: string[];
}

const AVAILABLE_MODULES = [
  { id: "CORE", label: "ລະບົບຫຼັກ (Core - ຈັດການຮ້ານ & ຕັ້ງຄ່າ)" },
  { id: "POS", label: "ລະບົບໜ້າຮ້ານ (POS - ຄິດເງິນ)" },
  { id: "INVENTORY", label: "ລະບົບສາງສິນຄ້າ (Inventory & Stock)" },
  { id: "ECOMMERCE", label: "ລະບົບອີຄອມເມີຊ (E-Commerce Storefront)" },
  { id: "RESTAURANT", label: "ລະບົບຮ້ານອາຫານ (Restaurant, KDS, ໂຕະ)" },
  { id: "BOOKING", label: "ລະບົບນັດໝາຍ (Booking & Services)" },
  { id: "ACCOUNTING", label: "ລະບົບບັນຊີ (Accounting & Invoices)" },
  { id: "RENTALS", label: "ລະບົບເຊົ່າອຸປະກອນ (Rentals)" },
  { id: "REPAIRS", label: "ສູນສ້ອມແປງ (Repairs Center)" },
  { id: "FITTING", label: "ບໍລິການຟິດຕິ້ງ (Fitting Studio)" },
  { id: "CONSIGNMENT", label: "ສາງສິນຄ້າມືສອງ (Consignment)" },
  { id: "TEAM", label: "ຈັດການທີມ (Team / Club Management)" },
  { id: "COMMUNITY", label: "ຄອມມູນິຕີ້ (Community / Forum)" },
  { id: "TECH", label: "ອຸປະກອນອັດສະລິຍະ (Smart Tech & IoT)" },
  { id: "AMBASSADORS", label: "ຕົວແທນຈຳໜ່າຍ (Ambassadors / Affiliates)" },
  { id: "COACHING", label: "ຫ້ອງຮຽນ/ໂຄດຊິ້ງ (Coaching & Classes)" },
  { id: "DATA_EDITOR", label: "ຈັດການຂໍ້ມູນ (Data Editor Advanced)" }
];

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("500000");
  const [durationDays, setDurationDays] = useState("30");
  const [productLimit, setProductLimit] = useState("-1");
  const [orderLimit, setOrderLimit] = useState("-1");
  const [staffLimit, setStaffLimit] = useState("5");
  const [isActive, setIsActive] = useState(true);
  const [enabledModules, setEnabledModules] = useState<string[]>(
    AVAILABLE_MODULES.map((m) => m.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/admin/packages");
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນແພັກເກັດໄດ້");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPkg(null);
    setName("");
    setPrice("500000");
    setDurationDays("30");
    setProductLimit("-1");
    setOrderLimit("-1");
    setStaffLimit("5");
    setIsActive(true);
    setEnabledModules(AVAILABLE_MODULES.map((m) => m.id));
    setShowModal(true);
  };

  const openEdit = (pkg: PackageItem) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setPrice(pkg.price.toString());
    setDurationDays((pkg.durationDays || 30).toString());
    setProductLimit((pkg.productLimit !== undefined ? pkg.productLimit : -1).toString());
    setOrderLimit((pkg.orderLimit !== undefined ? pkg.orderLimit : -1).toString());
    setStaffLimit((pkg.staffLimit !== undefined ? pkg.staffLimit : 5).toString());
    setIsActive(pkg.isActive ?? true);
    setEnabledModules(
      Array.isArray(pkg.enabledModules) && pkg.enabledModules.length > 0
        ? pkg.enabledModules
        : AVAILABLE_MODULES.map((m) => m.id)
    );
    setShowModal(true);
  };

  const handleSelectAllModules = () => {
    setEnabledModules(AVAILABLE_MODULES.map((m) => m.id));
  };

  const handleDeselectAllModules = () => {
    setEnabledModules(["CORE"]); // Always keep CORE at minimum
  };

  const toggleModule = (modId: string) => {
    if (modId === "CORE") return; // CORE is always enabled
    setEnabledModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ແພັກເກັດ");

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        price: Number(price) || 0,
        durationDays: Number(durationDays) || 30,
        productLimit: Number(productLimit) || -1,
        orderLimit: Number(orderLimit) || -1,
        staffLimit: Number(staffLimit) || -1,
        isActive,
        enabledModules,
      };

      const url = editingPkg
        ? `/api/admin/packages/${editingPkg.id}`
        : "/api/admin/packages";
      const method = editingPkg ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          editingPkg ? "ແກ້ໄຂແພັກເກັດສຳເລັດແລ້ວ" : "ສ້າງແພັກເກັດໃໝ່ສຳເລັດແລ້ວ!"
        );
        setShowModal(false);
        fetchPackages();
      } else {
        toast.error("ບັນທຶກບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, pkgName: string) => {
    if (!(await askConfirm(`ທ່ານຕ້ອງການລຶບແພັກເກັດ "${pkgName}" ແທ້ບໍ່?`))) return;
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`ລຶບແພັກເກັດ "${pkgName}" ສຳເລັດ`);
        setPackages(packages.filter((p) => p.id !== id));
      } else {
        toast.error("ລຶບບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-pink-500" />
            ຈັດການແພັກເກັດ & ກຳນົດສິດຟີເຈີ (Package & Feature Toggles)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            ກຳນົດວ່າແຕ່ລະແພັກເກັດສາມາດເປີດໃຊ້ໂມດູນ/ຟີເຈີໃດໄດ້ແດ່ ແລະ ກຳນົດຂີດຈຳກັດຂອງແຕ່ລະຊັ້ນ
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-pink-500/20 flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" /> ສ້າງແພັກເກັດໃໝ່
        </button>
      </div>

      {/* Package Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p className="text-sm text-zinc-400">ກຳລັງໂຫຼດຂໍ້ມູນແພັກເກັດ...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl">
          <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300">ຍັງບໍ່ມີແພັກເກັດ</h3>
          <p className="text-xs text-zinc-500 mt-1">ກົດປຸ່ມສ້າງແພັກເກັດໃໝ່ດ້ານເທິງເພື່ອເລີ່ມຕົ້ນ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => {
            const modCount = Array.isArray(pkg.enabledModules)
              ? pkg.enabledModules.length
              : AVAILABLE_MODULES.length;

            return (
              <div
                key={pkg.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 relative flex flex-col justify-between hover:border-pink-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                    <span className="px-2.5 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-xs font-bold">
                      {modCount} ໂມດູນ
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl font-black text-white">
                      ₭{(pkg.price || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-400 ml-1">
                      / {pkg.durationDays || 30} ວັນ
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-zinc-800/80 pt-4 mb-4 text-xs text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ສິນຄ້າສູງສຸດ:</span>
                      <span className="font-bold">
                        {pkg.productLimit === -1 ? "ບໍ່ຈຳກັດ (Unlimited)" : pkg.productLimit?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ອໍເດີ້ສູງສຸດ:</span>
                      <span className="font-bold">
                        {pkg.orderLimit === -1 ? "ບໍ່ຈຳກັດ (Unlimited)" : pkg.orderLimit?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ພະນັກງານສູງສຸດ:</span>
                      <span className="font-bold">
                        {pkg.staffLimit === -1 ? "ບໍ່ຈຳກັດ (Unlimited)" : pkg.staffLimit?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Modules list preview */}
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase mb-2">
                      ໂມດູນທີ່ເປີດໃຊ້ໃນແພັກເກັດນີ້ ({modCount}/{AVAILABLE_MODULES.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                      {AVAILABLE_MODULES.map((mod) => {
                        const isEnabled =
                          !Array.isArray(pkg.enabledModules) ||
                          pkg.enabledModules.includes(mod.id);

                        return (
                          <span
                            key={mod.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              isEnabled
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-zinc-950 text-zinc-600 border-zinc-800 line-through"
                            }`}
                          >
                            {mod.id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">
                    ID: #{pkg.id.slice(-6)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> ແກ້ໄຂ
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="ລຶບ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal with Granular Feature Checkboxes ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                {editingPkg ? "ແກ້ໄຂແພັກເກັດ & ໂມດູນ" : "ສ້າງແພັກເກັດ SaaS ໃໝ່"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* General Package Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ຊື່ແພັກເກັດ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ເຊັ່ນ: STARTER, PRO, ENTERPRISE..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ລາຄາ (₭) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-pink-400 font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ໄລຍະເວລາ (ວັນ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ຈຳນວນພະນັກງານສູງສຸດ (-1 = ບໍ່ຈຳກັດ)
                  </label>
                  <input
                    type="number"
                    value={staffLimit}
                    onChange={(e) => setStaffLimit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ຈຳນວນສິນຄ້າສູງສຸດ (-1 = ບໍ່ຈຳກັດ)
                  </label>
                  <input
                    type="number"
                    value={productLimit}
                    onChange={(e) => setProductLimit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ຈຳນວນອໍເດີ້ສູງສຸດ (-1 = ບໍ່ຈຳກັດ)
                  </label>
                  <input
                    type="number"
                    value={orderLimit}
                    onChange={(e) => setOrderLimit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Granular Feature/Module Checkboxes */}
              <div className="border-t border-zinc-800/80 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="block text-sm font-bold text-white">
                      ເລືອກໂມດູນທີ່ເປີດໃຫ້ໃນແພັກເກັດນີ້ ({enabledModules.length}/{AVAILABLE_MODULES.length})
                    </label>
                    <p className="text-xs text-zinc-400">
                      ກົດເລືອກ ຫຼື ຍົກເລີກໄດ້ທີລະຟີເຈີ ຫຼື ເລືອກທັງໝົດໃນຄັ້ງດຽວ
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> ເລືອກທັງໝົດ
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllModules}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" /> ຍົກເລີກທັງໝົດ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {AVAILABLE_MODULES.map((mod) => {
                    const checked = enabledModules.includes(mod.id);
                    const isCore = mod.id === "CORE";

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          checked
                            ? "bg-purple-950/40 border-purple-500/40 text-white shadow-sm"
                            : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                        } ${isCore ? "opacity-75 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isCore}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-purple-500 focus:ring-0 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight">
                            {mod.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase mt-0.5">
                            {mod.id} {isCore && "(ບັງຄັບ)"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex gap-3 sticky bottom-0 bg-zinc-900 z-10 py-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPkg ? "ບັນທຶກການແກ້ໄຂ" : "ສ້າງແພັກເກັດ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
