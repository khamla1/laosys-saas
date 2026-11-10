"use client";

import { askConfirm } from "@/components/ConfirmModal";

import React, { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  XCircle,
  CheckCircle,
  Store,
  Clock,
  ShieldAlert,
  Calendar,
  Search,
  Package,
  RotateCcw,
  FileText,
  Building,
} from "lucide-react";
import { toast } from "sonner";

interface PendingDeletesClientProps {
  initialProducts?: any[];
  initialLogs?: any[];
  initialDeletes?: any[];
}

export function PendingDeletesClient({
  initialProducts = [],
  initialLogs = [],
  initialDeletes = [],
}: PendingDeletesClientProps) {
  const [activeTab, setActiveTab] = useState<"products" | "stores" | "logs">(
    initialProducts.length > 0 ? "products" : "stores"
  );
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [stores, setStores] = useState<any[]>(initialDeletes);
  const [logs] = useState<any[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");

  // Handler for store deletions
  const handleApproveStoreDelete = async (id: string, name: string) => {
    const confirmed = await askConfirm(
      `ຄຳເຕືອນສຳຄັນ: ທ່ານຕ້ອງການລຶບຂໍ້ມູນທັງໝົດຂອງຮ້ານ "${name}" ຢ່າງຖາວອນແທ້ບໍ່? ຂໍ້ມູນຈະບໍ່ສາມາດກູ້ຄືນໄດ້!`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/pending-deletes/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`ລຶບຂໍ້ມູນຂອງຮ້ານ "${name}" ຖາວອນສຳເລັດແລ້ວ`);
        setStores(stores.filter((item) => item.id !== id));
      } else {
        toast.error("ບໍ່ສາມາດລຶບຂໍ້ມູນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const handleCancelStoreRequest = async (id: string, name: string) => {
    if (!(await askConfirm(`ທ່ານຕ້ອງການຍົກເລີກຄຳຂໍລຶບຂອງຮ້ານ "${name}" ແທ້ບໍ່?`))) return;

    try {
      const res = await fetch(`/api/admin/pending-deletes/${id}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`ຍົກເລີກຄຳຂໍລຶບຂອງ "${name}" ແລ້ວ`);
        setStores(stores.filter((item) => item.id !== id));
      } else {
        toast.error("ຍົກເລີກບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // Handler for product deletions/restoration
  const handleProductAction = async (
    id: string,
    action: "approve" | "restore",
    productName: string
  ) => {
    const confirmed = await askConfirm(
      action === "approve"
        ? `ທ່ານຕ້ອງການລຶບສິນຄ້າ "${productName}" ຖາວອນແທ້ບໍ່?`
        : `ທ່ານຕ້ອງການກູ້ຄືນສິນຄ້າ "${productName}" ໃຫ້ກັບມາຂາຍປົກກະຕິແທ້ບໍ່?`
    );
    if (!confirmed) return;

    try {
      const endpoint =
        action === "approve"
          ? `/api/admin/pending-deletes/product/${id}/approve`
          : `/api/admin/pending-deletes/product/${id}/restore`;

      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        toast.success(
          action === "approve"
            ? `ລຶບສິນຄ້າ "${productName}" ຖາວອນແລ້ວ`
            : `ກູ້ຄືນສິນຄ້າ "${productName}" ສຳເລັດແລ້ວ!`
        );
        setProducts(products.filter((p) => p.id !== id));
      } else {
        toast.error("ດຳເນີນການບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    }
  };

  // Extract unique store names
  const uniqueOrgs = Array.from(
    new Set(
      [
        ...products.map((p) => p.organization?.name),
        ...stores.map((s) => s.organization?.name || s.name),
        ...logs.map((l) => l.organization?.name),
      ].filter((n): n is string => Boolean(n))
    )
  );

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchOrg =
      filterOrg === "ALL" || p.organization?.name === filterOrg;
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.organization?.name?.toLowerCase().includes(search.toLowerCase());
    return matchOrg && matchSearch;
  });

  const filteredStores = stores.filter((s) => {
    const matchOrg =
      filterOrg === "ALL" || (s.organization?.name || s.name) === filterOrg;
    const matchSearch =
      s.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.reason?.toLowerCase().includes(search.toLowerCase());
    return matchOrg && matchSearch;
  });

  const filteredLogs = logs.filter((l) => {
    const matchOrg =
      filterOrg === "ALL" || l.organization?.name === filterOrg;
    const matchSearch =
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase());
    return matchOrg && matchSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 shadow-lg shadow-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ລາຍການຂໍລຶບ & ຈັດການຂໍ້ມູນລໍຖ້າລຶບ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                Pending Deletions
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ກວດສອບຄຳຂໍລຶບສິນຄ້າ, ຄຳຂໍລຶບຮ້ານຄ້າ ແລະ ອະນຸມັດການລຶບຂໍ້ມູນຖາວອນ ຫຼື ກູ້ຄືນ
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div
          onClick={() => setActiveTab("products")}
          className={`bg-zinc-900/80 border rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 cursor-pointer ${
            activeTab === "products"
              ? "border-red-500/60 shadow-lg shadow-red-500/10"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສິນຄ້າລໍຖ້າລຶບ (Pending Products)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-red-400 mt-2">
                {products.length} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ສິນຄ້າທີ່ຮ້ານຄ້າກົດຂໍລຶບໃນລະບົບ</p>
        </div>

        <div
          onClick={() => setActiveTab("stores")}
          className={`bg-zinc-900/80 border rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 cursor-pointer ${
            activeTab === "stores"
              ? "border-amber-500/60 shadow-lg shadow-amber-500/10"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຮ້ານຄ້າລໍຖ້າລຶບ (Pending Stores)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {stores.length} <span className="text-sm font-normal text-zinc-500">ຮ້ານ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Building className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຮ້ານຄ້າທີ່ຍື່ນຄຳຮ້ອງຂໍປິດບັນຊີ / ລຶບຂໍ້ມູນ</p>
        </div>

        <div
          onClick={() => setActiveTab("logs")}
          className={`bg-zinc-900/80 border rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 cursor-pointer ${
            activeTab === "logs"
              ? "border-blue-500/60 shadow-lg shadow-blue-500/10"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ປະຫວັດການລຶບ (Deletion Logs)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-400 mt-2">
                {logs.length} <span className="text-sm font-normal text-zinc-500">ເຫດການ</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ບັນທຶກປະຫວັດການລຶບ ແລະ ກູ້ຄືນຂໍ້ມູນ</p>
        </div>
      </div>

      {/* ── Search Bar & Navigation Tabs ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20"
                : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Package className="w-3.5 h-3.5" /> ສິນຄ້າລໍຖ້າລຶບ ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("stores")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "stores"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20"
                : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Building className="w-3.5 h-3.5" /> ຮ້ານຄ້າລໍຖ້າລຶບ ({stores.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> ປະຫວັດການລຶບ ({logs.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່, SKU, ຫຼື ຮ້ານຄ້າ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <select
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
            >
              <option value="ALL">ທຸກຮ້ານຄ້າ (All Stores)</option>
              {uniqueOrgs.map((orgName) => (
                <option key={orgName} value={orgName}>
                  {orgName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── TAB 1: PENDING PRODUCTS ── */}
      {activeTab === "products" && (
        <div>
          {filteredProducts.length === 0 ? (
            <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
              <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-zinc-300 text-lg font-semibold">ບໍ່ມີສິນຄ້າລໍຖ້າລຶບໃນຂະນະນີ້</p>
              <p className="text-zinc-500 text-sm mt-1">ລາຍການສິນຄ້າທັງໝົດໃນລະບົບປົກກະຕິ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-zinc-900/90 border border-red-500/30 hover:border-red-500/60 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                        {p.status || "PENDING_DELETE"}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {p.updatedAt
                          ? new Date(p.updatedAt).toLocaleDateString("lo-LA")
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-500/20 to-rose-500/20 border border-red-500/30 flex items-center justify-center font-black text-lg text-white shrink-0">
                        {p.name ? p.name[0]?.toUpperCase() : "P"}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono">
                          SKU: {p.sku || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 my-4 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">ຮ້ານຄ້າ / ອົງກອນ:</span>
                        <span className="font-bold text-white">
                          {p.organization?.name || "ທົ່ວໄປ"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">ລາຄາຂາຍ:</span>
                        <span className="font-bold text-red-400">
                          ₭{(p.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleProductAction(p.id, "restore", p.name)}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> ກູ້ຄືນສິນຄ້າ
                    </button>

                    <button
                      onClick={() => handleProductAction(p.id, "approve", p.name)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ລຶບຖາວອນ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PENDING STORES ── */}
      {activeTab === "stores" && (
        <div>
          {filteredStores.length === 0 ? (
            <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
              <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-zinc-300 text-lg font-semibold">ບໍ່ມີຄຳຂໍລຶບຮ້ານຄ້າໃນຂະນະນີ້</p>
              <p className="text-zinc-500 text-sm mt-1">ທຸກຮ້ານຄ້າໃນລະບົບເຮັດວຽກປົກກະຕິ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredStores.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900/90 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        ຂັ້ນຕອນລໍຖ້າລຶບຮ້ານ
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("lo-LA")
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center font-black text-lg text-white shrink-0">
                        {item.organization?.name
                          ? item.organization.name[0]?.toUpperCase()
                          : "S"}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">
                          {item.organization?.name || "ຮ້ານຄ້າ"}
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono">
                          @{item.organization?.slug || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 my-4 space-y-1.5 text-xs">
                      <p className="font-semibold text-zinc-400">ເຫດຜົນການຂໍລຶບ:</p>
                      <p className="text-zinc-200 italic">
                        "{item.reason || "ບໍ່ລະບຸເຫດຜົນ (ຍົກເລີກທຸລະກິດ)"}"
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <button
                      onClick={() =>
                        handleCancelStoreRequest(
                          item.id,
                          item.organization?.name || "ຮ້ານ"
                        )
                      }
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      ຍົກເລີກຄຳຂໍ
                    </button>

                    <button
                      onClick={() =>
                        handleApproveStoreDelete(
                          item.id,
                          item.organization?.name || "ຮ້ານ"
                        )
                      }
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ລຶບຮ້ານຖາວອນ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: AUDIT LOGS ── */}
      {activeTab === "logs" && (
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 text-sm">
              ບໍ່ພົບປະຫວັດການລຶບຂໍ້ມູນ
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredLogs.map((l) => (
                <div
                  key={l.id}
                  className="p-4 hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{l.action}</p>
                      <p className="text-xs text-zinc-400 font-mono">{l.details}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono shrink-0">
                    {l.createdAt
                      ? new Date(l.createdAt).toLocaleString("lo-LA")
                      : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PendingDeletesClient;
