"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Filter,
  ShoppingBag,
  CreditCard,
  Loader2,
  RefreshCw,
  Wallet,
  Receipt,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ExcelExportButton } from "@/components/ExcelExportButton";
import { exportToExcel } from "@/lib/excel";

interface SalesReportData {
  range: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  netProfit: number;
  timeline: Array<{ label: string; revenue: number; orders: number; heightPercent: number }>;
  topProducts: Array<{ id: string; name: string; sold: number; revenue: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
}

export default function SalesReportPage() {
  const [timeRange, setTimeRange] = useState("30D");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SalesReportData | null>(null);

  const fetchSalesReport = async (range: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/reports/sales?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນລາຍງານຍອດຂາຍໄດ້");
        setData(null);
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport(timeRange);
  }, [timeRange]);

  const handleExportExcel = () => {
    if (!data) return;
    exportToExcel({
      filename: `Sales_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Sales",
      title: "ລາຍງານຍອດຂາຍ ແລະ ກຳໄລ (SALES & PROFIT REPORT)",
      subtitle: `ຊ່ວງເວລາ: ${timeRange} | ຍອດຂາຍລວມ: ₭${data.totalRevenue.toLocaleString()} | ອໍເດີ: ${data.totalOrders} ບິນ`,
      headers: ["ລຳດັບ", "ໄລຍະເວລາ (Timeline)", "ຍອດຂາຍ (Revenue ₭)", "ຈຳນວນບິນ (Orders)"],
      data: data.timeline.map((t, idx) => [
        idx + 1,
        t.label,
        `₭${t.revenue.toLocaleString()}`,
        `${t.orders} ບິນ`,
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${data.timeline.length} ຊ່ວງ`,
        `₭${data.totalRevenue.toLocaleString()}`,
        `${data.totalOrders} ບິນ`,
      ],
    });
  };

  const getPaymentMethodLabel = (m: string) => {
    switch (m.toUpperCase()) {
      case "BCEL_ONE":
      case "BCEL":
        return "BCEL One QR";
      case "CASH":
        return "ເງິນສົດ (CASH)";
      case "TRANSFER":
        return "ໂອນເງິນ (TRANSFER)";
      case "CREDIT_CARD":
      case "CARD":
        return "ບັດເຄຣດິດ (CARD)";
      case "PROMPTPAY":
        return "PromptPay / QR";
      case "CASH_ON_DELIVERY":
        return "ເກັບເງິນປາຍທາງ (COD)";
      default:
        return m;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-16 text-zinc-100">
      {/* ── TOP BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={13} />
              <span>ລາຍງານການເງິນ ແລະ ຍອດຂາຍ (Live Analytics)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ລາຍງານຍອດຂາຍ ແລະ ກຳໄລ
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຕິດຕາມຍອດຂາຍຈິງ, ຕົ້ນທຶນ, ກຳໄລລວມ, ຊ່ອງທາງການຊຳລະ ແລະ ສິນຄ້າຂາຍດີເຊື່ອມໂຍງລະບົບແບບ Realtime
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchSalesReport(timeRange)}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin text-emerald-400" : "text-zinc-400"} />
              <span>ໂຫຼດຂໍ້ມູນໃໝ່</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={!data}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-sm font-medium border border-emerald-500/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <ArrowUpRight size={16} className="text-emerald-400" />
              <span>ດາວໂຫຼດ Excel ລາຍງານຍອດຂາຍ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400">ເລືອກຊ່ວງເວລາ:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { label: "ວັນນີ້", value: "TODAY" },
            { label: "7 ວັນຜ່ານມາ", value: "7D" },
            { label: "30 ວັນຜ່ານມາ", value: "30D" },
            { label: "ປີນີ້", value: "YEAR" },
            { label: "ທັງໝົດ", value: "ALL" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTimeRange(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                timeRange === item.value
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800/70 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 md:p-24 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500 mb-3" />
          <p className="text-zinc-300 text-sm font-semibold">ກຳລັງປະມວນຜົນຍອດຂາຍ ແລະ ກຳໄລຈາກຖານຂໍ້ມູນ...</p>
          <p className="text-zinc-500 text-xs mt-1">ກະລຸນາລໍຖ້າຈັກໜ່ອຍ</p>
        </div>
      ) : data ? (
        <>
          {/* ── Summary Stats Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    ຍອດຂາຍລວມ (Total Revenue)
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono">
                    ₭{data.totalRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-400 font-medium">
                <span>ຈາກອໍເດີທີ່ຊຳລະແລ້ວ</span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    ຈຳນວນບິນ / ອໍເດີ (Orders)
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-blue-400 mt-2 font-mono">
                    {data.totalOrders.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-zinc-500">ບິນ</span>
                  </h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-blue-400 font-medium">
                <span>ລູກຄ້າທີ່ມາຊື້: {data.totalCustomers} ຄົນ</span>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    ຍອດສະເລ່ຍຕໍ່ບິນ (AOV)
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-2 font-mono">
                    ₭{data.averageOrderValue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-purple-400 font-medium">
                <span>ຄ່າສະເລ່ຍຕໍ່ໃບບິນ</span>
              </div>
            </div>

            {/* Gross Profit & Margin */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    ກຳໄລລວມ (Gross Profit)
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 font-mono">
                    ₭{data.grossProfit.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-400 font-bold">
                <span>ອັດຕາກຳໄລ: {data.profitMargin}%</span>
              </div>
            </div>
          </div>

          {/* ── Revenue Chart & Top Products Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Revenue Bars Chart */}
            <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-emerald-400" />
                    <span>ກຣາຟແນວໂນ້ມຍອດຂາຍ (Revenue Timeline)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">ສະແດງການປຽບທຽບຍອດຂາຍຕາມຊ່ວງເວລາທີ່ເລືອກ</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                  {data.timeline.length} ຈຸດບັນທຶກ
                </span>
              </div>

              {data.timeline.length === 0 || data.totalRevenue === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                  <BarChart3 className="w-12 h-12 mb-2 opacity-30" />
                  <p className="text-sm">ຍັງບໍ່ມີຂໍ້ມູນຍອດຂາຍໃນຊ່ວງເວລານີ້</p>
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 px-2 overflow-x-auto">
                  {data.timeline.map((bar, idx) => (
                    <div key={idx} className="flex-1 min-w-[40px] flex flex-col items-center gap-2 group">
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">
                        ₭{bar.revenue > 1000000 ? `${(bar.revenue / 1000000).toFixed(1)}M` : bar.revenue.toLocaleString()}
                      </span>
                      <div className="w-full max-w-[56px] bg-zinc-800 rounded-2xl h-44 flex items-end p-1">
                        <div
                          className="w-full bg-gradient-to-t from-teal-600 via-emerald-500 to-cyan-400 rounded-xl transition-all duration-700 group-hover:brightness-110 shadow-lg shadow-emerald-500/20"
                          style={{ height: `${bar.heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 truncate max-w-[60px] text-center">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Best Selling Products */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">5 ອັນດັບສິນຄ້າຂາຍດີທີ່ສຸດ</h3>
                <p className="text-xs text-zinc-400 mb-6">ສິນຄ້າທີ່ສ້າງລາຍຮັບສູງສຸດໃນຊ່ວງນີ້</p>

                {data.topProducts.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">ຍັງບໍ່ມີຂໍ້ມູນການຂາຍສິນຄ້າ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topProducts.map((prod, i) => (
                      <div
                        key={prod.id || i}
                        className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{prod.name}</p>
                            <p className="text-xs text-zinc-500">ຂາຍໄດ້: {prod.sold.toLocaleString()} ລາຍການ</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-emerald-400 shrink-0 ml-2 font-mono">
                          ₭{prod.revenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Payment Methods Breakdown ── */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-1">ຊ່ອງທາງການຊຳລະເງິນ (Payment Channels)</h3>
            <p className="text-xs text-zinc-400 mb-6">ຍອດເງິນທີ່ໄດ້ຮັບແຍກຕາມວິທີການຊຳລະ</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {data.paymentMethods.length === 0 ? (
                <div className="col-span-4 p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ຍັງບໍ່ມີລາຍການຊຳລະເງິນ</p>
                </div>
              ) : (
                data.paymentMethods.map((pm, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-400">{getPaymentMethodLabel(pm.method)}</p>
                      <h4 className="text-lg font-bold text-white mt-1 font-mono">₭{pm.amount.toLocaleString()}</h4>
                      <p className="text-xs text-zinc-500">{pm.count} ບິນ</p>
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 md:p-20 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-500 border border-zinc-700/60">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ບໍ່ສາມາດດຶງຂໍ້ມູນລາຍງານຍອດຂາຍໄດ້</h3>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              ເກີດຂໍ້ຜິດພາດໃນການປະມວນຜົນຂໍ້ມູນ ຫຼື ຍັງບໍ່ທັນມີລາຍການຂາຍໃນຊ່ວງເວລານີ້
            </p>
          </div>
          <button
            onClick={() => fetchSalesReport(timeRange)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ລອງໃໝ່ອີກຄັ້ງ (Try Again)</span>
          </button>
        </div>
      )}
    </div>
  );
}
