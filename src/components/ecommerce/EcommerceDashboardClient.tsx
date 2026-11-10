"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Globe, QrCode, ShoppingBag, TrendingUp, Users, Plus, Trash2, ExternalLink, Save, CheckCircle, Copy } from "lucide-react";
import { ActionModal, StatusPopup } from "@/components/ui/action-popup";

interface QrTableItem {
  id: string;
  tableName: string;
  zone: string;
  url: string;
  scans: number;
  status: "ACTIVE" | "INACTIVE";
}

const INITIAL_QRS: QrTableItem[] = [
  { id: "QR-01", tableName: "ໂຕະ 01 (Table 1)", zone: "ໂຊນ VIP-A", url: "https://laosys.site/menu/table-1", scans: 142, status: "ACTIVE" },
  { id: "QR-02", tableName: "ໂຕະ 02 (Table 2)", zone: "ໂຊນ VIP-A", url: "https://laosys.site/menu/table-2", scans: 98, status: "ACTIVE" },
  { id: "QR-03", tableName: "ໂຕະ 03 (Table 3)", zone: "ໂຊນ VIP-A", url: "https://laosys.site/menu/table-3", scans: 110, status: "ACTIVE" },
  { id: "QR-04", tableName: "ໂຕະ 04 (Table 4)", zone: "ໂຊນກາງແຈ້ງ B", url: "https://laosys.site/menu/table-4", scans: 75, status: "ACTIVE" },
  { id: "QR-05", tableName: "ໂຕະ 05 (Table 5)", zone: "ໂຊນກາງແຈ້ງ B", url: "https://laosys.site/menu/table-5", scans: 64, status: "ACTIVE" },
  { id: "QR-06", tableName: "ເຄົາເຕີສັ່ງກັບບ້ານ (Takeaway)", zone: "ໜ້າຮ້ານ", url: "https://laosys.site/menu/takeaway", scans: 312, status: "ACTIVE" },
];

export function EcommerceDashboardClient() {
  const [qrs, setQrs] = useState<QrTableItem[]>(INITIAL_QRS);
  const [storefrontName, setStorefrontName] = useState("ຮ້ານຄາເຟ່ & ຮ້ານອາຫານລາວຊີດສ໌ (LAOSYS CAFE)");
  const [orderingMode, setOrderingMode] = useState("DINE_IN");

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [qrToDelete, setQrToDelete] = useState<QrTableItem | null>(null);

  // Add QR modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newZone, setNewZone] = useState("ໂຊນກາງແຈ້ງ");

  // Status popup
  const [statusPopup, setStatusPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const handleDeleteClick = (qr: QrTableItem) => {
    setQrToDelete(qr);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!qrToDelete) return;
    setQrs((prev) => prev.filter((q) => q.id !== qrToDelete.id));
    setDeleteModalOpen(false);
    setStatusPopup({
      open: true,
      title: "ລົບ QR Code ສຳເລັດແລ້ວ!",
      message: `ລົບ QR Code ຂອງ "${qrToDelete.tableName}" ອອກຈາກລະບົບ QR Menu ຮຽບຮ້ອຍແລ້ວ.`,
      type: "success",
    });
    setQrToDelete(null);
  };

  const handleAddQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    const newQr: QrTableItem = {
      id: `QR-0${qrs.length + 1}`,
      tableName: newTableName.trim(),
      zone: newZone,
      url: `https://laosys.site/menu/${newTableName.toLowerCase().replace(/\s+/g, "-")}`,
      scans: 0,
      status: "ACTIVE",
    };

    setQrs([...qrs, newQr]);
    setAddModalOpen(false);
    setNewTableName("");
    setStatusPopup({
      open: true,
      title: "ສ້າງ QR Code ໃໝ່ສຳເລັດແລ້ວ!",
      message: `ສ້າງ QR Menu ສຳລັບ "${newQr.tableName}" ພ້ອມລິ້ງສັ່ງອາຫານອອນລາຍຮຽບຮ້ອຍແລ້ວ.`,
      type: "success",
    });
  };

  const handleSaveSettings = () => {
    setStatusPopup({
      open: true,
      title: "ບັນທຶກການຕັ້ງຄ່າຮ້ານຄ້າອອນລາຍສຳເລັດແລ້ວ!",
      message: `ອັບເດດຊື່ຮ້ານ "${storefrontName}" ແລະ ໂໝດສັ່ງອາຫານອອນລາຍຮຽບຮ້ອຍແລ້ວ.`,
      type: "success",
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setStatusPopup({
      open: true,
      title: "ຄັດລອກລິ້ງສຳເລັດແລ້ວ! (Copied)",
      message: `ຄັດລອກລິ້ງ "${url}" ລົງໃນຄລິບບອດແລ້ວ, ສາມາດສົ່ງໃຫ້ລູກຄ້າໄດ້ທັນທີ.`,
      type: "info",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-zinc-900 p-6 rounded-3xl border border-purple-500/20 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" /> E-Commerce & QR Menu
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> ພ້ອມໃຊ້ງານ 100%
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ຮ້ານຄ້າອອນລາຍ & QR Menu (Online Storefront)
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            ສ້າງ QR Code ປະຈຳໂຕະ, ຈັດການເມນູສັ່ງອາຫານຜ່ານມືຖື ແລະ ຕິດຕາມອໍເດີອອນລາຍແບບຣຽວໄທມ໌
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddModalOpen(true)}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 border border-purple-400/40 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ ສ້າງ QR Code ໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 via-zinc-900/60 to-purple-900/10 border-purple-500/20 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-purple-400 flex items-center justify-between">
              <span className="truncate">ຜູ້ເຂົ້າຊົມ QR MENU</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-black text-white">1,840 ຄົນ</div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 truncate">ສະແກນຜ່ານມືຖືລ່າສຸດ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 via-zinc-900/60 to-blue-900/10 border-blue-500/20 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-blue-400 flex items-center justify-between">
              <span className="truncate">ອໍເດີອອນລາຍມື້ນີ້</span>
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-black text-white">36 ອໍເດີ</div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 truncate">ສົ່ງເຂົ້າຄົວ KDS ອັດຕະໂນມັດ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-emerald-900/10 border-emerald-500/20 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span className="truncate">ອັດຕາສັ່ງຊື້</span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-black text-white">14.5%</div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 truncate">+3.2% ທຽບກັບອາທິດກ່ອນ</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-amber-900/10 border-amber-500/20 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-amber-400 flex items-center justify-between">
              <span className="truncate">ຍອດຂາຍ QR MENU</span>
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-black text-white truncate">₭4,250,000</div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 truncate">ຈ່າຍຜ່ານ QR / ເງິນສົດ</p>
          </CardContent>
        </Card>
      </div>

      {/* Storefront Setup Section */}
      <Card className="bg-zinc-950/70 border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white">ການຕັ້ງຄ່າໜ້າຮ້ານອອນລາຍ (Storefront Settings)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">ຕັ້ງຄ່າຊື່ຮ້ານ, ເມນູ ແລະ ໂໝດການສັ່ງອາຫານຜ່ານ QR Code</p>
          </div>

          <button
            onClick={handleSaveSettings}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>ບັນທຶກການຕັ້ງຄ່າ</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1">ຊື່ຮ້ານຄ້າອອນລາຍ (Storefront Name)</label>
            <Input
              value={storefrontName}
              onChange={(e) => setStorefrontName(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1">ໂໝດການສັ່ງອາຫານ (Ordering Mode)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "DINE_IN", label: "ສັ່ງທີ່ໂຕະ (QR)" },
                { key: "TAKEAWAY", label: "ສັ່ງກັບບ້ານ" },
                { key: "DELIVERY", label: "ສົ່ງຮອດບ້ານ" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setOrderingMode(m.key)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    orderingMode === m.key
                      ? "bg-purple-600/20 text-purple-300 border-purple-500"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* QR Codes Directory Table */}
      <Card className="bg-zinc-950/70 border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        <CardHeader className="p-6 border-b border-zinc-800/80">
          <CardTitle className="text-lg font-extrabold text-white">ລາຍການ QR Code ປະຈຳໂຕະ (Table QR Codes)</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">
            ລູກຄ້າສາມາດສະແກນ QR Code ເພື່ອເປີດເບິ່ງເມນູ ແລະ ສັ່ງອາຫານເຂົ້າຄົວ KDS ໄດ້ທັນທີ
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800/80 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-bold">ລະຫັດ (ID)</TableHead>
                  <TableHead className="text-zinc-400 font-bold">ຊື່ໂຕະ / ເຄົາເຕີ</TableHead>
                  <TableHead className="text-zinc-400 font-bold">ໂຊນ (Zone)</TableHead>
                  <TableHead className="text-zinc-400 font-bold">ລິ້ງສັ່ງອາຫານ (QR Link)</TableHead>
                  <TableHead className="text-zinc-400 font-bold">ຈຳນວນສະແກນ</TableHead>
                  <TableHead className="text-zinc-400 font-bold">ສະຖານະ</TableHead>
                  <TableHead className="text-right text-zinc-400 font-bold">ຈັດການ (Action)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrs.map((qr) => (
                  <TableRow key={qr.id} className="border-zinc-800/60 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-purple-400">{qr.id}</TableCell>
                    <TableCell className="font-bold text-white flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-purple-400" />
                      <span>{qr.tableName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium">
                        {qr.zone}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400 font-mono text-xs truncate max-w-xs">{qr.url}</TableCell>
                    <TableCell className="font-bold text-emerald-400">{qr.scans} ຄັ້ງ</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                        ACTIVE
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(qr.url)}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                          title="ຄັດລອກລິ້ງ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>ຄັດລອກ</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(qr)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all"
                          title="ລົບ QR Code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ActionModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="ຢືນຢັນການລົບ QR Code?"
        description={
          qrToDelete
            ? `ທ່ານກຳລັງຈະລົບ QR Code ຂອງ "${qrToDelete.tableName}" (${qrToDelete.url}) ອອກຈາກລະບົບ. ລູກຄ້າຈະບໍ່ສາມາດສະແກນສັ່ງອາຫານໄດ້ອີກ.`
            : ""
        }
        icon="delete"
        variant="danger"
        confirmText="ຢືນຢັນການລົບ (Delete Now)"
        cancelText="ຍົກເລີກ"
        onConfirm={confirmDelete}
      />

      {/* Add QR Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-white mb-1">+ ສ້າງ QR Code ໃໝ່ (Generate Table QR)</h3>
            <p className="text-xs text-zinc-400 mb-6">ສ້າງ QR Code ສຳລັບໂຕະອາຫານ ຫຼື ເຄົາເຕີສັ່ງກັບບ້ານ</p>

            <form onSubmit={handleAddQr} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">ຊື່ໂຕະ / ຈຸດບໍລິການ</label>
                <Input
                  required
                  placeholder="ຕົວຢ່າງ: ໂຕະ 08 (Table 8)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">ໂຊນ / ພື້ນທີ່ (Zone)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["ໂຊນ VIP-A", "ໂຊນກາງແຈ້ງ", "ໜ້າຮ້ານ"].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setNewZone(z)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        newZone === z
                          ? "bg-purple-600/20 text-purple-300 border-purple-500"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-zinc-300 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40"
                >
                  ສ້າງ QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Popup */}
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
