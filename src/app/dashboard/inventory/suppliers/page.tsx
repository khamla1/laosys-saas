"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  Handshake,
  Loader2,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/dashboard/suppliers");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSuppliers(data);
      } else {
        toast.error(data.error || "ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຜູ້ສະໜອງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ບໍລິສັດ ຫຼື ຜູ້ສະໜອງ");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactName, email, phone, address }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("ເພີ່ມຂໍ້ມູນຜູ້ສະໜອງສຳເລັດແລ້ວ");
        setName("");
        setContactName("");
        setEmail("");
        setPhone("");
        setAddress("");
        fetchSuppliers();
      } else {
        toast.error(data.error || "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນຜູ້ສະໜອງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍຊື່ຜູ້ສະໜອງນີ້?"))) return;
    try {
      const res = await fetch(`/api/dashboard/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບຂໍ້ມູນຜູ້ສະໜອງສຳເລັດແລ້ວ");
        fetchSuppliers();
      } else {
        const data = await res.json();
        toast.error(data.error || "ບໍ່ສາມາດລຶບຂໍ້ມູນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນ");
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/inventory"
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="ກັບຄືນໜ້າຄັງສິນຄ້າ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              ລາຍຊື່ຜູ້ສະໜອງສິນຄ້າ (Suppliers)
            </h1>
            <p className="text-sm text-zinc-400">
              ຈັດການຂໍ້ມູນບໍລິສັດຄູ່ຄ້າ, ຕົວແທນຈຳໜ່າຍ ແລະ ເຊື່ອມຕໍ່ການອອກໃບສັ່ງຊື້ (PO)
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/accounting/purchases"
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" /> ໄປໜ້າໃບສັ່ງຊື້ສິນຄ້າ (PO)
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Create Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">ເພີ່ມຜູ້ສະໜອງໃໝ່</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  ຊື່ບໍລິສັດ / ຮ້ານຄ້າຜູ້ສະໜອງ *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="ຕົວຢ່າງ: ບໍລິສັດ ການຄ້າສາກົນ ຈຳກັດ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  ຊື່ຜູ້ຕິດຕໍ່ (Contact Person)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="ຕົວຢ່າງ: ທ່ານ ສົມພອນ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  ເບີໂທລະສັບ (Phone)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="020 xxxx xxxx"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  ອີເມວ (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="supplier@company.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  ທີ່ຢູ່ (Address)
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ບ້ານ, ເມືອງ, ແຂວງ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none h-20"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                ບັນທຶກຜູ້ສະໜອງ (Save)
              </button>
            </form>
          </div>
        </div>

        {/* List Table */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/50">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຊື່ບໍລິສັດ, ຜູ້ຕິດຕໍ່, ເບີໂທ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="text-sm text-zinc-400 hidden sm:block">
                ທັງໝົດ <strong className="text-white">{suppliers.length}</strong> ລາຍການ
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="text-xs uppercase bg-zinc-950/50 border-b border-zinc-800/80 text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">ຊື່ບໍລິສັດ / ຜູ້ສະໜອງ</th>
                      <th className="px-6 py-4 font-semibold">ຂໍ້ມູນຕິດຕໍ່</th>
                      <th className="px-6 py-4 text-right">ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {filteredSuppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="px-6 py-4 font-medium text-zinc-200">
                          <div className="flex items-center gap-2">
                            <Handshake className="w-4 h-4 text-emerald-400" />
                            {sup.name}
                          </div>
                          {sup.contactName && (
                            <div className="text-xs text-zinc-500 mt-1 pl-6">
                              ຜູ້ຕິດຕໍ່: {sup.contactName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {sup.phone && (
                              <div className="flex items-center gap-2 text-xs text-zinc-300">
                                <Phone className="w-3 h-3 text-emerald-400" /> {sup.phone}
                              </div>
                            )}
                            {sup.email && (
                              <div className="flex items-center gap-2 text-xs">
                                <Mail className="w-3 h-3 text-zinc-500" /> {sup.email}
                              </div>
                            )}
                            {sup.address && (
                              <div className="flex items-start gap-2 text-xs mt-1 text-zinc-500">
                                <MapPin className="w-3 h-3 mt-0.5" />
                                <span className="max-w-[200px] truncate">{sup.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(sup.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                            title="ລຶບຜູ້ສະໜອງ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center">
                          <p className="text-zinc-500">ຍັງບໍ່ມີຂໍ້ມູນຜູ້ສະໜອງສິນຄ້າ</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
