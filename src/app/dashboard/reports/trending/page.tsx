"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  Flame,
  ArrowUpRight,
  Download,
  Filter,
  Package,
  Layers,
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  PlusCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { ExcelExportButton } from "@/components/ExcelExportButton";
import { exportToExcel } from "@/lib/excel";
import Link from "next/link";

interface TrendingProduct {
  id: string;
  name: string;
  barcode: string;
  categoryName: string;
  price: number;
  costPrice: number;
  stock: number;
  stockStatus: string;
  totalSold: number;
  totalRevenue: number;
  restockSuggested: number;
}

export default function TrendingReportPage() {
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [items, setItems] = useState<TrendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [totalSoldAll, setTotalSoldAll] = useState(0);
  const [totalRevenueAll, setTotalRevenueAll] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const fetchTrendingData = async (cat: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/reports/trending?category=${cat}`);
      if (res.ok) {
        const json = await res.json();
        setCategories(json.categories || []);
        setItems(json.items || []);
        setTotalSoldAll(json.totalSoldAll || 0);
        setTotalRevenueAll(json.totalRevenueAll || 0);
        setLowStockCount(json.lowStockCount || 0);
        setOutOfStockCount(json.outOfStockCount || 0);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນສິນຄ້າຂາຍດີໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData(categoryFilter);
  }, [categoryFilter]);

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Best_Sellers_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "ສິນຄ້າຂາຍດີ",
      title: "ລາຍງານສິນຄ້າຂາຍດີ ແລະ ສະຕັອກ (BEST-SELLING & STOCK REPORT)",
      subtitle: `ຈຳນວນລາຍການ: ${filteredItems.length} | ລວມຂາຍໄດ້: ${totalSoldAll.toLocaleString()} ຊິ້ນ`,
      headers: [
        "ອັນດັບ",
        "ຊື່ສິນຄ້າ",
        "ບາໂຄດ",
        "ໝວດໝູ່",
        "ລາຄາຂາຍ (₭)",
        "ຂາຍໄດ້ (ຈຳນວນ)",
        "ຍອດຂາຍລວມ (₭)",
        "ສະຕັອກຄົງເຫຼືອ",
        "ສະຖານະສະຕັອກ",
        "ແນະນຳຕື່ມສະຕັອກ",
      ],
      data: filteredItems.map((prod, idx) => [
        idx + 1,
        prod.name,
        prod.barcode,
        prod.categoryName,
        `₭${prod.price.toLocaleString()}`,
        `${prod.totalSold.toLocaleString()} ຊິ້ນ`,
        `₭${prod.totalRevenue.toLocaleString()}`,
        `${prod.stock.toLocaleString()} ອັນ`,
        prod.stockStatus === "OUT_OF_STOCK"
          ? "ໝົດສະຕັອກ"
          : prod.stockStatus === "LOW_STOCK"
          ? "ໃກ້ໝົດ"
          : "ພ້ອມຂາຍ",
        `+${prod.restockSuggested} ອັນ`,
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${filteredItems.length} ສິນຄ້າ`,
        "-",
        "-",
        "-",
        `${totalSoldAll.toLocaleString()} ຊິ້ນ`,
        `₭${totalRevenueAll.toLocaleString()}`,
        "-",
        "-",
        "-",
      ],
    });
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.barcode.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-red-600 shadow-lg shadow-orange-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ສິນຄ້າຂາຍດີ ແລະ ການຄາດຄະເນສະຕັອກ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Best Sellers
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ວິເຄາະສິນຄ້າທີ່ຂາຍດີທີ່ສຸດ, ສະຖານະສະຕັອກຄົງເຫຼືອ, ແລະ ແນະນຳການຕື່ມສະຕັອກອັດຕະໂນມັດ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchTrendingData(categoryFilter)}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm transition-colors"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <ExcelExportButton
            onClick={handleExportExcel}
            label="ດາວໂຫຼດ Excel ສິນຄ້າຂາຍດີ"
            className="bg-orange-600 hover:bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-600/20"
          />
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຈຳນວນທີ່ຂາຍໄດ້ທັງໝົດ
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-orange-400 mt-2">
                {totalSoldAll.toLocaleString()}{" "}
                <span className="text-sm font-normal text-zinc-500">ຊິ້ນ</span>
              </h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຈາກອໍເດີ້ທີ່ສຳເລັດແລ້ວ</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຍອດຂາຍສິນຄ້າລວມ
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
                ₭{totalRevenueAll.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ລາຍຮັບລວມຈາກສິນຄ້າທັງໝົດ</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສິນຄ້າໃກ້ໝົດສະຕັອກ
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
                {lowStockCount}{" "}
                <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-3">ເຫຼືອ 1-5 ອັນໃນສະຕັອກ</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສິນຄ້າໝົດສະຕັອກ
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-red-400 mt-2">
                {outOfStockCount}{" "}
                <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-red-400 font-medium mt-3">ຕ້ອງການສັ່ງຊື້ຕື່ມດ່ວນ</p>
        </div>
      </div>

      {/* ── Category Filter Tabs & Search ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === "ALL"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20"
                : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            ໝວດໝູ່ທັງໝົດ
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ບາໂຄດ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* ── Table Section ── */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
            <p className="text-zinc-400 text-sm">ກຳລັງປະມວນຜົນສິນຄ້າຂາຍດີ...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ບໍ່ພົບລາຍການສິນຄ້າ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800/80">
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center w-12">ອັນດັບ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">ຊື່ສິນຄ້າ & ບາໂຄດ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">ໝວດໝູ່</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ລາຄາຂາຍ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ຂາຍໄດ້</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຍອດຂາຍລວມ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຕັອກຄົງເຫຼືອ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຖານະ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ການເຊື່ອມຕໍ່</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredItems.map((prod, index) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="p-4 text-center">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          index === 0
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                            : index === 1
                            ? "bg-zinc-300 text-black"
                            : index === 2
                            ? "bg-amber-800 text-white"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                        {prod.name}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{prod.barcode}</p>
                    </td>
                    <td className="p-4 text-xs text-zinc-300">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                        {prod.categoryName}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-zinc-200 text-right">
                      ₭{prod.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-bold text-orange-400">
                        {prod.totalSold.toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">ຊິ້ນ</span>
                    </td>
                    <td className="p-4 text-sm font-black text-emerald-400 text-right">
                      ₭{prod.totalRevenue.toLocaleString()}
                    </td>
                    <td className="p-4 text-center font-bold text-sm">
                      <span
                        className={
                          prod.stock === 0
                            ? "text-red-400"
                            : prod.stock <= 5
                            ? "text-amber-400"
                            : "text-zinc-200"
                        }
                      >
                        {prod.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {prod.stockStatus === "OUT_OF_STOCK" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          ໝົດແລ້ວ
                        </span>
                      ) : prod.stockStatus === "LOW_STOCK" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          ໃກ້ໝົດ
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ພ້ອມຂາຍ
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/dashboard/accounting/purchases?productId=${prod.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-semibold transition-all"
                        title="ສັ່ງຊື້ສິນຄ້ານີ້ເຂົ້າສະຕັອກ"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>ສັ່ງຊື້ຕື່ມ</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
