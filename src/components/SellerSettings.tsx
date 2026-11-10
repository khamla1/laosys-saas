"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Bell, CheckCircle, AlertCircle, ShieldCheck, KeyRound, Lock, MapPin, DollarSign, Receipt, Phone } from "lucide-react";
import { StoreTelegramSettings } from "./StoreTelegramSettings";
import { LAO_PROVINCES } from "@/lib/laoAddressData";
import { toast } from "sonner";

export function SellerSettings({ t }: { t: any }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    image: "",
    paymentQrCode: "",
    paymentAccountInfo: "",
    promptPayId: "",
    lineNotifyToken: "",
    telegramChatId: "",
    telegramEnabled: false,
    storePhone: "",
    province: "",
    district: "",
    village: "",
    addressDetail: "",
    rateTHB: 650,
    rateUSD: 22000,
    receiptHeader: "LAOSYS RESTAURANT & POS",
    receiptFooter: "ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you for your support!",
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Available districts based on selected province
  const selectedProvinceData = LAO_PROVINCES.find((p) => p.name === profile.province);
  const availableDistricts = selectedProvinceData ? selectedProvinceData.districts : [];

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ (At least 6 characters)");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ (Passwords do not match)");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings/seller")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setProfile({
            name: data.storeName || data.name || "",
            email: data.email || "",
            image: data.image || "",
            paymentQrCode: data.paymentQrCode || "",
            paymentAccountInfo: data.paymentAccountInfo || "",
            promptPayId: data.promptPayId || "",
            lineNotifyToken: data.lineNotifyToken || "",
            telegramChatId: data.telegramChatId || "",
            telegramEnabled: data.telegramEnabled || false,
            storePhone: data.storePhone || "",
            province: data.province || "",
            district: data.district || "",
            village: data.village || "",
            addressDetail: data.addressDetail || "",
            rateTHB: data.rateTHB || 650,
            rateUSD: data.rateUSD || 22000,
            receiptHeader: data.receiptHeader || "LAOSYS RESTAURANT & POS",
            receiptFooter: data.receiptFooter || "ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you for your support!",
          });
        }
      })
      .catch(console.error);
  }, []);



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ!" });
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.error || "ບັນທຶກການຕັ້ງຄ່າລົ້ມເຫຼວ" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "ເກີດຂໍ้ຜິດພາດໃນການເຊື່ອມຕໍ່" });
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLogoUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setProfile((prev) => ({ ...prev, image: data.url }));
        toast.success("ອັບໂຫຼດໂລໂກ້ສຳເລັດແລ້ວ! ກະລຸນາກົດບັນທຶກເພື່ອຢືນຢັນ.");
        setMessage({ type: "success", text: "ອັບໂຫຼດໂລໂກ້ສຳເລັດແລ້ວ! ກະລຸນາກົດບັນທຶກເພື່ອຢືນຢັນ." });
      } else {
        toast.error("ການອັບໂຫຼດລົ້ມເຫຼວ: " + (data.error || ""));
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດໂລໂກ້");
    }
    setLogoUploading(false);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setQrUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setProfile((prev) => ({ ...prev, paymentQrCode: data.url }));
        toast.success("ອັບໂຫຼດ QR Code ສຳເລັດແລ້ວ! ກະລຸນາກົດບັນທຶກເພື່ອຢືນຢັນ.");
        setMessage({ type: "success", text: "ອັບໂຫຼດ QR Code ສຳເລັດແລ້ວ! ກະລຸນາກົດບັນທຶກເພື່ອຢືນຢັນ." });
      } else {
        toast.error("ການອັບໂຫຼດລົ້ມເຫຼວ: " + (data.error || ""));
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ QR Code");
    }
    setQrUploading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.1)]"
              : "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.1)]"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-red-400" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Card */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-800/80 ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:50ms] [animation-fill-mode:both]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              ຂໍ້ມູນຮ້ານຄ້າ (Store Profile)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              ຕັ້ງຄ່າຊື່ຮ້ານ ແລະ ໂລໂກ້ຮ້ານຄ້າຂອງທ່ານ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-[180px_1fr] gap-6 items-center">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm font-semibold">ໂລໂກ້ຮ້ານ</Label>
                <label className="relative cursor-pointer w-32 h-32 border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-emerald-500/5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden group shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  {profile.image && !logoUploading ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profile.image} alt="Logo" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-zinc-800">ປ່ຽນຮູບ</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-2">
                      <ImageIcon className={`w-7 h-7 transition-transform ${logoUploading ? "text-emerald-500 animate-bounce" : "text-zinc-500 group-hover:scale-110"}`} />
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {logoUploading ? "ກຳລັງອັບ..." : "ອັບໂຫຼດໂລໂກ້"}
                      </span>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-zinc-300 font-semibold">ຊື່ຮ້ານຄ້າ (Store Name)</Label>
                  <Input
                    id="storeName"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="bg-zinc-950/80 border-zinc-800 text-white max-w-md focus:border-emerald-500/50 focus:ring-emerald-500/10 rounded-xl"
                    placeholder="ປ້ອນຊື່ຮ້านຄ້າຂອງທ່ານ..."
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs font-medium">ອີເມລບັນຊີ: <span className="text-emerald-400 font-mono font-semibold bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 ml-1">{profile.email}</span></Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Store Address & Contact Details Card ── */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-800/80 ring-1 ring-white/5 transition-all duration-500 hover:border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <MapPin className="text-blue-400 w-5 h-5" />
              ທີ່ຕັ້ງ ແລະ ເບີໂທຮ້ານຄ້າ (Store Address & Contact)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              ກຳນົດທີ່ຕັ້ງແຂວງ, ເມືອງ, ບ້ານ ແລະ ເບີໂທ ເພື່ອພິມອອກເທິງໃບບິນ ແລະ ໃບແຈ້ງໜີ້.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storePhone" className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> ເບີໂທຕິດຕໍ່ຮ້ານ (Store Phone)
                </Label>
                <Input
                  id="storePhone"
                  value={profile.storePhone}
                  onChange={(e) => setProfile((p) => ({ ...p, storePhone: e.target.value }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-blue-500/50"
                  placeholder="ຕົວຢ່າງ: 020 9999 8888"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="village" className="text-zinc-300 font-semibold">
                  ບ້ານ (Village)
                </Label>
                <Input
                  id="village"
                  value={profile.village}
                  onChange={(e) => setProfile((p) => ({ ...p, village: e.target.value }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-blue-500/50"
                  placeholder="ຕົວຢ່າງ: ບ້ານ ດົງໂດກ"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province" className="text-zinc-300 font-semibold">
                  ແຂວງ (Province)
                </Label>
                <select
                  id="province"
                  value={profile.province}
                  onChange={(e) => {
                    const newProv = e.target.value;
                    const provData = LAO_PROVINCES.find((p) => p.name === newProv);
                    setProfile((p) => ({
                      ...p,
                      province: newProv,
                      district: provData?.districts[0] || "",
                    }));
                  }}
                  className="w-full h-11 px-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="">-- ເລືອກແຂວງ --</option>
                  {LAO_PROVINCES.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-zinc-300 font-semibold">
                  ເມືອງ (District)
                </Label>
                <select
                  id="district"
                  value={profile.district}
                  onChange={(e) => setProfile((p) => ({ ...p, district: e.target.value }))}
                  disabled={!profile.province}
                  className="w-full h-11 px-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- ເລືອກເມືອງ --</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressDetail" className="text-zinc-300 font-semibold">
                ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ (Building / Street / Landmark)
              </Label>
              <Input
                id="addressDetail"
                value={profile.addressDetail}
                onChange={(e) => setProfile((p) => ({ ...p, addressDetail: e.target.value }))}
                className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-blue-500/50"
                placeholder="ຕົວຢ່າງ: ຖະໜົນ 13 ເໜືອ, ໃກ້ກັບ ມະຫາວິທະຍາໄລແຫ່ງຊາດ"
              />
            </div>

            {(profile.village || profile.district || profile.province) && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>ທີ່ຢູ່ເຕັມ:</strong>{" "}
                  {[profile.village, profile.district, profile.province, profile.addressDetail]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Multi-Currency & POS Receipt Settings Card ── */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-800/80 ring-1 ring-white/5 transition-all duration-500 hover:border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <DollarSign className="text-amber-400 w-5 h-5" />
              ອັດຕາແລກປ່ຽນ ແລະ ຕັ້ງຄ່າໃບບິນ POS (Multi-Currency & Receipts)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              ກຳນົດອັດຕາແລກປ່ຽນເງິນບາດ, ໂດລາ ແລະ ຂໍ້ຄວາມຫົວບິນ-ທ້າຍບິນສຳລັບລະບົບ POS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                <Label htmlFor="rateTHB" className="text-zinc-200 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  ອັດຕາແລກປ່ຽນເງິນບາດ (1 THB = ? LAK)
                </Label>
                <Input
                  id="rateTHB"
                  type="number"
                  value={profile.rateTHB}
                  onChange={(e) => setProfile((p) => ({ ...p, rateTHB: Number(e.target.value) }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white font-mono font-bold text-lg rounded-xl focus:border-amber-500/50"
                  placeholder="650"
                />
                <p className="text-[11px] text-zinc-500">ໃຊ້ຄິດໄລ່ເງິນທອນ ແລະ ຍອດບິນເປັນເງິນບາດໜ້າ POS</p>
              </div>

              <div className="space-y-2 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                <Label htmlFor="rateUSD" className="text-zinc-200 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  ອັດຕາແລກປ່ຽນເງິນໂດລາ (1 USD = ? LAK)
                </Label>
                <Input
                  id="rateUSD"
                  type="number"
                  value={profile.rateUSD}
                  onChange={(e) => setProfile((p) => ({ ...p, rateUSD: Number(e.target.value) }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white font-mono font-bold text-lg rounded-xl focus:border-emerald-500/50"
                  placeholder="22000"
                />
                <p className="text-[11px] text-zinc-500">ໃຊ້ຄິດໄລ່ເງິນທອນ ແລະ ຍອດບິນເປັນເງິນໂດລາໜ້າ POS</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="receiptHeader" className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-purple-400" /> ຂໍ້ຄວາມຫົວໃບບິນ (Receipt Header)
                </Label>
                <Input
                  id="receiptHeader"
                  value={profile.receiptHeader}
                  onChange={(e) => setProfile((p) => ({ ...p, receiptHeader: e.target.value }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-purple-500/50"
                  placeholder="LAOSYS RESTAURANT & POS"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptFooter" className="text-zinc-300 font-semibold">
                  ຂໍ້ຄວາມທ້າຍໃບບິນ (Receipt Footer)
                </Label>
                <Input
                  id="receiptFooter"
                  value={profile.receiptFooter}
                  onChange={(e) => setProfile((p) => ({ ...p, receiptFooter: e.target.value }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-purple-500/50"
                  placeholder="ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you for your support!"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings Card */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-800/80 ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:100ms] [animation-fill-mode:both]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              ຊ່ອງທາງຮັບເງິນ (Payment QR & Bank Info)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              ອັບໂຫຼດ QR Code ຮັບເງິນ ແລະ ລາຍລະອຽດບັນຊີທະນາຄານເພື່ອສະແດງໃນໜ້າເຊັກເອົາຕ໌.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-zinc-300 font-semibold">ອັບໂຫຼດ QR Code (OnePay / PromptPay)</Label>
              <label className="relative cursor-pointer border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-emerald-500/5 rounded-2xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center h-48 overflow-hidden group shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={qrUploading} />
                {profile.paymentQrCode && !qrUploading ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.paymentQrCode} alt="Payment QR" className="absolute inset-0 w-full h-full object-contain p-2 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-zinc-800">ປ່ຽນ QR Code</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-8 h-8 transition-transform ${qrUploading ? "text-emerald-500 animate-bounce" : "text-zinc-500 group-hover:scale-110"}`} />
                    <span className="text-sm font-semibold text-zinc-300">
                      {qrUploading ? "ກຳລັງອັບ QR..." : "ຄລິກເພື່ອອັບໂຫຼດຮູບ QR Code"}
                    </span>
                  </div>
                )}
              </label>
              {profile.paymentQrCode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProfile((p) => ({ ...p, paymentQrCode: "" }))}
                  className="text-rose-400 border-zinc-800 bg-zinc-950 hover:bg-rose-500/10 w-full rounded-xl transition-all duration-300 hover:border-rose-500/20"
                >
                  ລຶບຮູບ QR Code
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="promptPayId" className="text-zinc-300 font-semibold">ເລກ PromptPay (ສຳລັບສ້າງ QR ອັດຕະໂນມັດ)</Label>
                <Input
                  id="promptPayId"
                  value={profile.promptPayId}
                  onChange={(e) => setProfile((p) => ({ ...p, promptPayId: e.target.value }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white focus:border-emerald-500/50 focus:ring-emerald-500/10 rounded-xl"
                  placeholder="ເບີໂທ ຫຼື ບັດປະຊาຊົນ (ຕົວຢ່າງ: 0912345678)"
                />
              </div>
              
              <div className="space-y-1 mt-2">
                <Label htmlFor="accountInfo" className="text-zinc-300 font-semibold">ລາຍລະອຽດບັນຊີຮັບເງິນ (Bank details text)</Label>
                <textarea
                  id="accountInfo"
                  value={profile.paymentAccountInfo}
                  onChange={(e) => setProfile((p) => ({ ...p, paymentAccountInfo: e.target.value }))}
                  placeholder="ທະນາຄານ: BCEL&#10;ເລກບັນຊີ: 120-12-00-xxxxxx-x&#10;ຊື່ບັນຊີ: SOMPHON DEVELOPER"
                  className="w-full min-h-[112px] p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:outline-none placeholder-zinc-600 text-sm font-medium transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Integrations Card */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-800/80 ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:150ms] [animation-fill-mode:both]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Bell className="text-orange-400 animate-pulse" size={20} />
              ລະບົບແຈ້ງເຕືອນອໍເດີ (Order Alerts / Integrations)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              ເຊື່ອມຕໍ່ LINE Notify ຫຼື Telegram Group ເພື່ອຮັບການແຈ້ງເຕືອນຍອດຂາຍທັນທີເມື່ອມີລູກຄ້າຊຳລະເງິນ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 p-5 border border-zinc-800/80 bg-zinc-950/30 rounded-2xl relative overflow-hidden group/item transition-all hover:border-green-500/30">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none transition-all group-hover/item:bg-green-500/10" />
                <Label htmlFor="lineToken" className="text-zinc-200 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  LINE Notify Token
                </Label>
                <Input
                  id="lineToken"
                  type="password"
                  value={profile.lineNotifyToken}
                  onChange={(e) => setProfile((p) => ({ ...p, lineNotifyToken: e.target.value }))}
                  className="bg-zinc-950/80 border-zinc-800 text-white font-mono rounded-xl focus:border-green-500/40"
                  placeholder="ໃສ່ LINE Access Token..."
                />
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  ສ້າງ Token ໄດ້ທີ່ <a href="https://notify-bot.line.me" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">notify-bot.line.me</a> ແລ້ວດຶງ Line Notify ເຂົ້າຮ່ວມກຸ່ມແຊັດຂອງທ່ານ.
                </p>
              </div>

              <div className="space-y-4 p-5 border border-zinc-800/80 bg-zinc-950/30 rounded-2xl relative overflow-hidden group/item transition-all hover:border-blue-500/30">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none transition-all group-hover/item:bg-blue-500/10" />
                <div className="space-y-4 relative">
                  <StoreTelegramSettings 
                    initialChatId={profile.telegramChatId} 
                    initialEnabled={profile.telegramEnabled} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 h-12 text-base font-medium rounded-xl shadow-lg transition-all"
          >
            {loading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກການຕັ້ງຄ່າທັງໝົດ"}
          </Button>
        </div>
      </form>

      {/* ── Security & Password Change ── */}
      <Card className="group relative overflow-hidden bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-amber-500/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-zinc-800/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-zinc-100">ປ່ຽນລະຫັດຜ່ານເຂົ້າລະບົບ (Change Password)</CardTitle>
              <CardDescription className="text-zinc-400">
                ກຳນົດລະຫັດຜ່ານໃໝ່ ເພື່ອຄວາມປອດໄພ ແລະ ປ້ອງກັນການລືມລະຫັດຜ່ານ.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">ລະຫັດຜ່ານປະຈຸບັນ (Current Password)</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="ໃສ່ລະຫັດຜ່ານປະຈຸບັນຂອງທ່ານ (ຖ້າມີ)..."
                className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-amber-500/40"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">ລະຫັດຜ່ານໃໝ່ (New Password)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ"
                  className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-amber-500/40 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ຢືນຢັນລະຫັດຜ່ານໃໝ່ (Confirm Password)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="ພິມລະຫັດຜ່ານໃໝ່ອີກຄັ້ງ"
                  className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-amber-500/40 font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={passwordLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold px-6 h-11 rounded-xl shadow-lg shadow-amber-500/10 transition-all"
            >
              {passwordLoading ? (
                "ກຳລັງປ່ຽນລະຫັດຜ່ານ..."
              ) : (
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>ບັນທຶກລະຫັດຜ່ານໃໝ່</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
