"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Phone,
  ShoppingCart,
  Award,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  User,
  MessageCircle,
  Ticket,
  ShieldCheck,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CustomerTableClient({
  customers: initialCustomers,
  initialTotal,
  stores = [],
  t,
  isAdmin,
}: {
  customers: any[];
  initialTotal?: number;
  stores?: string[];
  t: any;
  isAdmin?: boolean;
}) {
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [totalItems, setTotalItems] = useState(initialTotal ?? initialCustomers.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("ALL");
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const isFirstRender = useRef(true);

  // Customer Detail & Print Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [printFormat, setPrintFormat] = useState<"slip" | "a4">("slip");
  const printAreaRef = useRef<HTMLDivElement>(null);

  const uniqueStores = isAdmin
    ? stores.length > 0
      ? stores
      : Array.from(new Set(customers.map((c) => c.storeName || "Unknown")))
    : [];

  const fetchCustomersPage = useCallback(
    async (page: number, limit: number, q: string, store: string) => {
      setIsLoadingPage(true);
      try {
        const params = new URLSearchParams({
          mode: "leaderboard",
          page: String(page),
          limit: String(limit),
        });
        if (q.trim()) params.set("search", q.trim());
        if (isAdmin && store !== "ALL") params.set("store", store);

        const res = await fetch(`/api/data-editor/customers?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            setCustomers(json.data);
            setTotalItems(json.total ?? json.data.length);
          }
        }
      } catch (e) {
        console.error("Failed to fetch customers page", e);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchCustomersPage(currentPage, itemsPerPage, searchQuery, selectedStore);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, searchQuery, selectedStore, fetchCustomersPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCustomers = customers;

  const handlePrint = () => {
    window.print();
  };

  const getCleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
  };

  return (
    <div className="space-y-4">
      {/* ── Print Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #customer-print-wrapper, #customer-print-wrapper * { visibility: visible; }
              #customer-print-wrapper {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                padding: 10px;
              }
            }
          `,
        }}
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input
            placeholder="ຄົ້ນຫາຊື່, ເບີໂທ (020/20/8 ໂຕ), ຄູປອງ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-zinc-950 border-zinc-800 text-white w-full h-10"
          />
        </div>

        {isAdmin && uniqueStores.length > 0 && (
          <div className="w-full sm:w-auto flex items-center gap-2">
            <Filter size={16} className="text-zinc-500" />
            <Select
              value={selectedStore}
              onValueChange={(val) => {
                setSelectedStore(val || "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-zinc-950 border-zinc-800 text-white">
                <SelectValue placeholder="ທຸກຮ້ານຄ້າ" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="ALL">ທຸກຮ້ານຄ້າ (All Stores)</SelectItem>
                {uniqueStores.map((store) => (
                  <SelectItem key={store as string} value={store as string}>
                    {store as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div
        className={`rounded-xl border border-zinc-800 overflow-hidden ${
          isLoadingPage ? "opacity-60 pointer-events-none transition-opacity" : ""
        }`}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
              <TableHead className="text-zinc-400">{t.rank}</TableHead>
              <TableHead className="text-zinc-400">{t.name}</TableHead>
              <TableHead className="text-zinc-400">{t.phone}</TableHead>
              <TableHead className="text-zinc-400">ຄູປອງທີ່ເກັບ / ໃຊ້ແລ້ວ</TableHead>
              {isAdmin && <TableHead className="text-zinc-400">ຮ້ານຄ້າ (Store)</TableHead>}
              <TableHead className="text-zinc-400">{t.totalOrders}</TableHead>
              <TableHead className="text-right text-zinc-400">{t.lifetimeValue}</TableHead>
              <TableHead className="text-right text-zinc-400">ການກະທຳ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-zinc-500 py-8">
                  {t.noCustomers}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                const claimed: string[] = Array.isArray(customer.claimedCoupons) ? customer.claimedCoupons : [];
                const used: string[] = Array.isArray(customer.usedCoupons) ? customer.usedCoupons : [];

                return (
                  <TableRow
                    key={globalIndex}
                    onClick={() => setSelectedCustomer(customer)}
                    className="border-zinc-800/50 hover:border-yellow-500/30 hover:bg-yellow-500/5 cursor-pointer transition-all duration-300 group"
                  >
                    <TableCell>
                      {globalIndex < 3 ? (
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                          <Award size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-xs">
                          {globalIndex + 1}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-yellow-500/20 shrink-0">
                          {customer.customerName ? customer.customerName.charAt(0) : "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200 group-hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                            <span>{customer.customerName || "ລູກຄ້າທົ່ວໄປ"}</span>
                            {customer.isOnlineMember && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck size={11} /> ສະມາຊິກອອນລາຍ
                              </span>
                            )}
                          </div>
                          {customer.customerAddress && (
                            <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-[200px]">
                              {customer.customerAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Phone size={13} className="text-emerald-400" />
                        <span>{customer.displayPhone || customer.customerPhone || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {claimed.length === 0 ? (
                        <span className="text-xs text-zinc-600">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {claimed.map((code) => {
                            const isUsed = used.includes(code);
                            return (
                              <span
                                key={code}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isUsed
                                    ? "bg-zinc-800 text-zinc-400 border-zinc-700 line-through"
                                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                }`}
                                title={isUsed ? "ໃຊ້ສິດຄູປອງນີ້ແລ້ວ" : "ເກັບຄູປອງໄວ້ແລ້ວ (ຍັງບໍ່ທັນໃຊ້)"}
                              >
                                <Ticket size={10} />
                                {code} {isUsed ? "(ໃຊ້ແລ້ວ)" : "(ເກັບແລ້ວ)"}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-zinc-300">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-xs font-medium border border-zinc-700">
                          {customer.storeName || "Unknown"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="text-zinc-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <ShoppingCart size={13} className="text-zinc-500" />
                        <span>
                          {customer._count?.id ?? 0} {t.times}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                        ₭{(customer._sum?.totalAmount || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="ເບິ່ງລາຍລະອຽດ"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                          title="ພິມໃບສະຫຼຸບຍອດລູກຄ້າ"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
      />

      {/* ── Customer Details & Print Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedCustomer.customerName || "ລູກຄ້າທົ່ວໄປ"}</span>
                    {selectedCustomer.storeName && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        ຮ້ານ: {selectedCustomer.storeName}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {selectedCustomer.displayPhone || selectedCustomer.customerPhone || "ບໍ່ມີເບີໂທ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Print Format / View Switcher */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedCustomer.customerPhone && (
                  <>
                    <a
                      href={`tel:${selectedCustomer.customerPhone}`}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone size={13} className="text-emerald-400" />
                      <span>ໂທອອກ</span>
                    </a>
                    <a
                      href={`https://wa.me/856${getCleanPhone(selectedCustomer.customerPhone).replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintFormat("slip")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    printFormat === "slip"
                      ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ບິນນ້ອຍ 80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("a4")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    printFormat === "a4"
                      ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ໃບໃຫຍ່ A4
                </button>
              </div>
            </div>

            {/* Print Preview Container */}
            <div className="p-6 overflow-y-auto bg-zinc-950 flex justify-center">
              <div
                id="customer-print-wrapper"
                ref={printAreaRef}
                className={
                  printFormat === "slip"
                    ? "w-[80mm] p-4 bg-white text-black font-mono text-xs shadow-lg border border-zinc-300"
                    : "w-full max-w-[190mm] p-8 bg-white text-black font-sans shadow-lg border border-zinc-300"
                }
              >
                {printFormat === "slip" ? (
                  /* 80mm Slip */
                  <div className="space-y-3 text-center">
                    <div className="border-b border-dashed border-zinc-400 pb-2">
                      <h4 className="font-bold text-sm tracking-wide">
                        {selectedCustomer.storeName || "CUSTOMER STATEMENT"}
                      </h4>
                      <p className="text-[10px] text-zinc-600">ໃບສະຫຼຸບຍອດການໃຊ້ຈ່າຍ ແລະ ຄູປອງລູກຄ້າ</p>
                    </div>

                    <div className="text-left space-y-1.5 py-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຊື່ລູກຄ້າ:</span>
                        <span className="font-bold">{selectedCustomer.customerName || "ລູກຄ້າທົ່ວໄປ"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ເບີໂທ:</span>
                        <span>{selectedCustomer.displayPhone || selectedCustomer.customerPhone || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຈຳນວນອໍເດີ້:</span>
                        <span className="font-bold">{selectedCustomer._count?.id ?? 0} ຄັ້ງ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຄູປອງທີ່ເກັບ:</span>
                        <span className="font-bold">
                          {(selectedCustomer.claimedCoupons || []).join(", ") || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຄູປອງທີ່ໃຊ້ແລ້ວ:</span>
                        <span className="font-bold">
                          {(selectedCustomer.usedCoupons || []).join(", ") || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="py-2.5 border-y border-zinc-300 my-1 bg-zinc-50">
                      <p className="text-[10px] text-zinc-600">ຍອດຊື້ສະສົມລວມ (Total Spent)</p>
                      <p className="font-black text-xl text-black">
                        ₭{(selectedCustomer._sum?.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="border-t border-dashed border-zinc-400 pt-2 text-[10px] text-zinc-500">
                      <p>ຂອບໃຈທີ່ໃຊ້ບໍລິການຮ້ານຄ້າຂອງພວກເຮົາ</p>
                      <p className="font-mono text-[9px] mt-1">
                        ພິມເມື່ອ: {new Date().toLocaleDateString("lo-LA")}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* A4 Statement */
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">CUSTOMER PURCHASE STATEMENT</h2>
                        <p className="text-xs text-zinc-600">ໃບສະຫຼຸບປະຫວັດການສັ່ງຊື້ ແລະ ຄູປອງສະມາຊິກລູກຄ້າ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">DATE: {new Date().toLocaleDateString("lo-LA")}</p>
                        <p className="text-[11px] text-zinc-500">{selectedCustomer.storeName || "ຮ້ານຄ້າອອນລາຍ"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <div>
                        <p className="text-zinc-500">ຊື່ລູກຄ້າ:</p>
                        <p className="text-base font-bold mt-0.5">
                          {selectedCustomer.customerName || "ລູກຄ້າທົ່ວໄປ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ເບີໂທລະສັບ:</p>
                        <p className="text-base font-bold font-mono mt-0.5">
                          {selectedCustomer.displayPhone || selectedCustomer.customerPhone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ຈຳນວນອໍເດີ້ທັງໝົດ:</p>
                        <p className="text-base font-bold mt-0.5">
                          {selectedCustomer._count?.id ?? 0} ລາຍການ
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ມູນຄ່າການສັ່ງຊື້ສະສົມ:</p>
                        <p className="text-base font-black text-amber-700 mt-0.5">
                          ₭{(selectedCustomer._sum?.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ຄູປອງທີ່ເກັບໄວ້:</p>
                        <p className="text-sm font-bold mt-0.5">
                          {(selectedCustomer.claimedCoupons || []).join(", ") || "ຍັງບໍ່ມີ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ຄູປອງທີ່ໃຊ້ສິດແລ້ວ:</p>
                        <p className="text-sm font-bold mt-0.5">
                          {(selectedCustomer.usedCoupons || []).join(", ") || "ຍັງບໍ່ມີ"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-yellow-500/20"
              >
                <Printer size={16} />
                <span>ພິມອອກ (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
