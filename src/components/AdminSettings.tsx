"use client";

import { toast } from "sonner";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Upload, Image as ImageIcon, Box, RotateCcw, ExternalLink, CheckCircle2, MessageSquare, Send, Bell } from "lucide-react";
import { BrandDiscord } from "@/components/icons/BrandIcons";

export function AdminSettings({ t, users = [], currentUserId = "" }: { t: any; users?: any[]; currentUserId?: string }) {
  const [bgUrl, setBgUrl] = useState("/bg.jpg");
  const [loginHeroMode, setLoginHeroMode] = useState<"3D_FACTORY" | "WALLPAPER">("3D_FACTORY");
  const [savingHeroMode, setSavingHeroMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState({ platformName: "" });

  // Payment & Store settings state
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [accountInfo, setAccountInfo] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(data => {
      if (data.login_bg_url) setBgUrl(data.login_bg_url);
      if (data.login_hero_mode === "WALLPAPER" || data.login_hero_mode === "3D_FACTORY") {
        setLoginHeroMode(data.login_hero_mode);
      }
    });
  }, []);

  const handleHeroModeChange = async (mode: "3D_FACTORY" | "WALLPAPER") => {
    setLoginHeroMode(mode);
    setSavingHeroMode(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "login_hero_mode", value: mode }),
      });
      toast.success(
        mode === "3D_FACTORY"
          ? "ປ່ຽນໜ້າເວັບໄຊ (Login) ເປັນໂໝດ 3D Automated Factory ແລ້ວ!"
          : "ປ່ຽນກັບມາໃຊ້ໂໝດຮູບພາບພື້ນຫຼັງປົກກະຕິ (Wallpaper) ແລ້ວ!"
      );
    } catch (err) {
      toast.error("ບໍ່ສາມາດບັນທຶກໂໝດໜ້າ Login ໄດ້.");
    }
    setSavingHeroMode(false);
  };

  const handleRestoreDefaultBg = async () => {
    setBgUrl("/bg.jpg");
    setLoginHeroMode("WALLPAPER");
    setLoading(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "login_bg_url", value: "/bg.jpg" }),
      });
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "login_hero_mode", value: "WALLPAPER" }),
      });
      toast.success("ກູ້ຄືນຮູບພື້ນຫຼັງເດີມ (/bg.jpg) ແລະ ເປີດໃຊ້ໂໝດຮູບພາບແລ້ວ!");
    } catch (err) {
      toast.error("ການກູ້ຄືນຮູບພື້ນຫຼັງເດີມລົ້ມເຫຼວ.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedUserId) return;
    setQrCodeUrl("");
    setLogoUrl("");
    setAccountInfo("");
    fetch(`/api/admin/payment-settings?sellerId=${selectedUserId}`).then(res => res.json()).then(data => {
      if (data.paymentQrCode) setQrCodeUrl(data.paymentQrCode);
      if (data.image) setLogoUrl(data.image);
      if (data.paymentAccountInfo) setAccountInfo(data.paymentAccountInfo);
    });
  }, [selectedUserId]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "login_bg_url", value: bgUrl })
      });
      toast.success("ບັນທຶກການຕັ້ງຄ່າສຳເລັດ! ອັບເດດຮູບພື້ນຫຼັງໜ້າ Login ແລ້ວ.");
    } catch (err) {
      toast.error("ການບັນທຶກການຕັ້ງຄ່າລົ້ມເຫຼວ.");
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setBgUrl(data.url);
        // Auto save after upload
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "login_bg_url", value: data.url })
        });
        toast.success("ອັບໂຫຼດ ແລະ ບັນທຶກຮູບພາບສຳເລັດແລ້ວ!");
      } else {
        toast.error("ການອັບໂຫຼດລົ້ມເຫຼວ: " + data.error);
      }
    } catch(err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດໄຟລ໌.");
    }
    setUploading(false);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setQrUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setQrCodeUrl(data.url);
        // Save automatically
        await fetch("/api/admin/payment-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentQrCode: data.url, sellerId: selectedUserId })
        });
        toast.success("ອັບໂຫຼດ QR Code ສຳເລັດແລ້ວ!");
      }
    } catch(err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ QR Code.");
    }
    setQrUploading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLogoUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        // Save automatically
        await fetch("/api/admin/payment-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data.url, sellerId: selectedUserId })
        });
        toast.success("ອັບໂຫຼດໂລໂກ້ຮ້ານຄ້າສຳເລັດແລ້ວ!");
      }
    } catch(err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດໂລໂກ້ຮ້ານຄ້າ.");
    }
    setLogoUploading(false);
  };

  const handleSavePaymentSettings = async () => {
    setSavingPayment(true);
    try {
      await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAccountInfo: accountInfo, sellerId: selectedUserId })
      });
      toast.success("ບັນທຶກຂໍ້ມູນບັນຊີຮັບເງິນແລ້ວ!");
    } catch(err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນຮັບເງິນ.");
    }
    setSavingPayment(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Payment & Store Settings Card */}
      <Card className="group relative overflow-hidden bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:50ms] [animation-fill-mode:both]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            ໂປຣໄຟລ໌ຮ້ານຄ້າ & ຊ່ອງທາງຮັບເງິນ
          </CardTitle>
          <CardDescription className="text-zinc-400">
            ຕັ້ງຄ່າໂລໂກ້ຮ້ានຄ້າ, QR Code ຮັບເງິນ, ແລະ ລາຍລະອຽດບັນຊີທະນາຄານ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          {users.length > 0 && (
            <div className="space-y-2 max-w-sm mb-6 p-5 border border-zinc-800/80 rounded-2xl bg-zinc-950/60 relative overflow-hidden group/select transition-all hover:border-emerald-500/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
              <label className="text-sm font-bold text-emerald-400 block mb-1">ຕັ້ງຄ່າສຳລັບຮ້ານຄ້າ:</label>
              <select 
                value={selectedUserId} 
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 text-sm font-semibold transition-all"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-zinc-950 text-zinc-100">
                    {u.name || "ຮ້ານຄ້າທີ່ບໍ່ມີຊື່"} ({u.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 leading-normal font-medium mt-1.5">ໃນຖານະຜູ້ເບິ່ງແຍງລະບົບ (Admin), ທ່ານສາມາດຕັ້ງຄ່າການຮັບເງິນໃຫ້ແຕ່ລະຮ້ານໄດ້.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-300">ໂລໂກ້ຮ້ານຄ້າ / ຮູບໂປຣໄຟລ໌</label>
              <label className="relative cursor-pointer flex-1 border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-emerald-500/5 rounded-xl px-6 py-8 transition-all duration-300 flex flex-col items-center justify-center text-center h-48 overflow-hidden group shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                />
                {logoUrl && !logoUploading ? (
                  <>
                    <img src={logoUrl} alt="Store Logo" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm font-bold text-white bg-zinc-900/85 px-3 py-1.5 rounded-xl border border-zinc-800">ປ່ຽນໂລໂກ້</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className={`w-8 h-8 transition-transform ${logoUploading ? 'text-emerald-500 animate-bounce' : 'text-zinc-500 group-hover:scale-110'}`} />
                    <span className="text-sm font-semibold text-zinc-300">
                      {logoUploading ? "ກຳລັງອັບໂຫຼດໂລໂກ້..." : "ຄລິກເພື່ອອັບໂຫຼດໂລໂກ້ຮ້ານ"}
                    </span>
                  </div>
                )}
              </label>
              {logoUrl && (
                <Button variant="outline" size="sm" onClick={() => {
                  setLogoUrl("");
                  fetch("/api/admin/payment-settings", { method: "POST", body: JSON.stringify({ image: "", sellerId: selectedUserId }) });
                }} className="text-rose-400 border-zinc-800/80 bg-zinc-950 hover:bg-rose-500/10 w-full rounded-xl transition-all">ລຶບໂລໂກ້</Button>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-300">ອັບໂຫຼດ QR Code</label>
              <label className="relative cursor-pointer flex-1 border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-emerald-500/5 rounded-xl px-6 py-8 transition-all duration-300 flex flex-col items-center justify-center text-center h-48 overflow-hidden group shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleQrUpload}
                  disabled={qrUploading}
                />
                {qrCodeUrl && !qrUploading ? (
                  <>
                    <img src={qrCodeUrl} alt="QR Code" className="absolute inset-0 w-full h-full object-contain p-2 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm font-bold text-white bg-zinc-900/85 px-3 py-1.5 rounded-xl border border-zinc-800">ປ່ຽນ QR Code</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-8 h-8 transition-transform ${qrUploading ? 'text-emerald-500 animate-bounce' : 'text-zinc-500 group-hover:scale-110'}`} />
                    <span className="text-sm font-semibold text-zinc-300">
                      {qrUploading ? "ກຳລັງອັບໂຫຼດ QR..." : "ຄລິກເພື່ອອັບໂຫຼດຮູບ QR Code"}
                    </span>
                  </div>
                )}
              </label>
              {qrCodeUrl && (
                <Button variant="outline" size="sm" onClick={() => {
                  setQrCodeUrl("");
                  fetch("/api/admin/payment-settings", { method: "POST", body: JSON.stringify({ paymentQrCode: "", sellerId: selectedUserId }) });
                }} className="text-rose-400 border-zinc-800/80 bg-zinc-950 hover:bg-rose-500/10 w-full rounded-xl transition-all">ລຶບ QR Code</Button>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-300">ຂໍ້ມູນບັນຊີ (ຕົວຢ່າງ: ຊື່ທະນາຄານ, ເລກບັນຊີ, ຊື່ບັນຊີ)</label>
              <textarea 
                value={accountInfo}
                onChange={e => setAccountInfo(e.target.value)}
                placeholder="ທະນາຄານ: BCEL&#10;ເລກບັນຊີ: 123456789&#10;ຊື່ບັນຊີ: Khamla Fomo"
                className="w-full min-h-[192px] p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:outline-none placeholder-zinc-650 text-sm font-medium transition-all"
              />
              <Button onClick={handleSavePaymentSettings} disabled={savingPayment} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl h-11">
                {savingPayment ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຂໍ້ມູນບັນຊີ"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:150ms] [animation-fill-mode:both]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-bold text-zinc-200">{t.platformSetup}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.platformSetupDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="platformName" className="text-zinc-300 font-semibold">{t.platformName}</Label>
            <Input 
              id="platformName" 
              name="platformName" 
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-emerald-500/50" 
            />
            <p className="text-xs text-zinc-500 font-medium">{t.platformNameDesc}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-zinc-200">
                  ຮູບແບບກອບດ້ານຊ້າຍໜ້າເຂົ້າສູ່ລະບົບ (Login Hero Display)
                </h3>
              </div>
              <Link
                href="/dashboard/factory-3d"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
              >
                <Box className="w-4 h-4" />
                <span>ເປີດໜ້າຄວບຄຸມ 3D Factory ເຕັມຈໍ (Admin 3D)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Selector between 3D Automated Factory and Original Wallpaper */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: 3D Automated Factory */}
              <div
                onClick={() => !savingHeroMode && handleHeroModeChange("3D_FACTORY")}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between gap-4 ${
                  loginHeroMode === "3D_FACTORY"
                    ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">
                          ໂໝດ 3D Automated Factory (Interactive 3D)
                        </h4>
                        <span className="text-xs text-zinc-400">
                          ສະແດງໂຮງງານອັດຕະໂນມັດ 3 ມິຕິ ໃນກອບຮູບດ້ານຊ້າຍໜ້າ Login
                        </span>
                      </div>
                    </div>
                    {loginHeroMode === "3D_FACTORY" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ກຳລັງໃຊ້ງານ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                    ຜູ້ເຂົ້າຊົມເວັບໄຊສາມາດໝຸນກ້ອງ 360°, ຊູມເຂົ້າ-ອອກ, ຄລິກເບິ່ງສະຖານະແຂນກົນຫຸ່ນຍົນ, ສາຍພານລຳລຽງ ແລະ ເປີດ/ປິດຫຼັງຄາໂປ່ງໃສໄດ້ທັນທີ ໂດຍຟອມເຂົ້າສູ່ລະບົບດ້ານຂວາຍັງຄົງຢູ່ຄືເກົ່າ.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    disabled={savingHeroMode}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHeroModeChange("3D_FACTORY");
                    }}
                    className={`w-full rounded-xl font-bold text-xs ${
                      loginHeroMode === "3D_FACTORY"
                        ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                        : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    }`}
                  >
                    {loginHeroMode === "3D_FACTORY"
                      ? "ກຳລັງສະແດງຜົນ 3D ຢູ່ໜ້າເວັບໄຊ"
                      : "ເລືອກໃຊ້ໂໝດ 3D Automated Factory"}
                  </Button>
                </div>
              </div>

              {/* Option 2: Original / Custom Wallpaper Image */}
              <div
                onClick={() => !savingHeroMode && handleHeroModeChange("WALLPAPER")}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between gap-4 ${
                  loginHeroMode === "WALLPAPER"
                    ? "bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/5"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">
                          ໂໝດຮູບພາບພື້ນຫຼັງປົກກະຕິ (Wallpaper ເດີມ)
                        </h4>
                        <span className="text-xs text-zinc-400">
                          ສະແດງຮູບຕຶກຕາເວັນຕົກເດີມ (/bg.jpg) ຫຼື ຮູບທີ່ອັບໂຫຼດເອງ
                        </span>
                      </div>
                    </div>
                    {loginHeroMode === "WALLPAPER" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ກຳລັງໃຊ້ງານ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                    ກັບຄືນໄປໃຊ້ຮູບພາບພື້ນຫຼັງແບບເດີມ (ຮູບຕຶກ ແລະ ຕາເວັນ) ຫຼື ຮູບພາບທີ່ທ່ານອັບໂຫຼດໄວ້ດ້ານລຸ່ມ ໂດຍສາມາດສະຫຼັບໄປມາກັບໂໝດ 3D ໄດ້ທຸກເວລາ.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    disabled={savingHeroMode}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHeroModeChange("WALLPAPER");
                    }}
                    className={`flex-1 rounded-xl font-bold text-xs ${
                      loginHeroMode === "WALLPAPER"
                        ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                        : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    }`}
                  >
                    {loginHeroMode === "WALLPAPER"
                      ? "ກຳລັງສະແດງຮູບພາບພື້ນຫຼັງ"
                      : "ເລືອກໃຊ້ໂໝດຮູບພາບພື້ນຫຼັງ"}
                  </Button>
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestoreDefaultBg();
                    }}
                    className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold px-3 flex items-center gap-1.5"
                    title="ກູ້ຄືນຮູບຕຶກຕາເວັນຕົກເດີມ (/bg.jpg)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ຮູບເດີມ (/bg.jpg)</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-800/80">
              <label className="text-sm font-semibold text-zinc-400">ອັບໂຫຼດຮູບພື້ນຫຼັງໃໝ່ (ສຳລັບໂໝດຮູບພາບພື້ນຫຼັງ)</label>
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer flex-1 border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-emerald-500/5 rounded-xl px-6 py-8 transition-all duration-300 text-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-8 h-8 ${uploading ? 'text-emerald-500 animate-bounce' : 'text-zinc-500 group-hover:scale-110 transition-transform'}`} />
                    <span className="text-sm font-semibold text-zinc-300">
                      {uploading ? "ກຳລັງອັບໂຫຼດຮູບ..." : "ຄລິກເພື່ອເລືອກຮູບ ຫຼື ລາກຮູບມາວາງທີ່ນີ້"}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">ຮອງຮັບ JPG, PNG, WEBP (ສູງສຸດ 100MB)</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ຫຼື</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <label className="text-sm font-semibold text-zinc-300">ໃຊ້ URL ຮູບພາບພາຍນອກ</label>
              <div className="flex gap-3">
                <Input 
                  value={bgUrl} 
                  onChange={e => setBgUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/..." 
                  className="bg-zinc-950/80 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500/10 rounded-xl"
                />
                <Button type="submit" disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl shadow-sm transition-all px-8">
                  {loading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ URL"}
                </Button>
              </div>
            </form>

            {/* Preview */}
            {bgUrl && (
              <div className="mt-8 space-y-2">
                <label className="text-sm font-semibold text-zinc-400">ຕົວຢ່າງຮູບພື້ນຫຼັງປັດຈຸບັນ (ເມື່ອເລືອກໂໝດຮູບພາບ)</label>
                <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl relative bg-zinc-950 ring-1 ring-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgUrl} alt="Background Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Discord Webhooks Quick Management Hub ── */}
      <Card className="bg-zinc-900/90 border-indigo-500/30 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <CardHeader className="border-b border-zinc-800/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/40">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <span>ລະບົບແຈ້ງເຕືອນ Discord Webhooks</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    2 Webhooks Active
                  </span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-0.5">
                  ແຈ້ງເຕືອນອໍເດີໃໝ່, ຍອດຂາຍ, ການເຂົ້າສູ່ລະບົບ (Logins), Audit Logs ແລະ ຄຳຮ້ອງຂໍຕ່າງໆ ໄປທີ່ Discord ທັນທີ
                </CardDescription>
              </div>
            </div>

            <Link
              href="/admin/discord"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>ຈັດການເຕັມຮູບແບບ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <img src="https://img.icons8.com/3d-fluency/375/shopping-cart.png" alt="" className="w-5 h-5" />
                  <span>Bot 1: LAOSYS Commercial Engine</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Webhook 1</span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate font-mono bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                https://discord.com/api/webhooks/1568253705818734736/...
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
                  <img src="https://img.icons8.com/3d-fluency/375/shield.png" alt="" className="w-5 h-5" />
                  <span>Bot 2: LAOSYS Sentinel Guard</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Webhook 2</span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate font-mono bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                https://discord.com/api/webhooks/1568253737007452332/...
              </p>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>ຕ້ອງການປ່ຽນ URL, ປ່ຽນເສັ້ນທາງສົ່ງ (Routing) ຫຼື ທົດສອບລະບົບ?</span>
            <Link href="/admin/discord" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
              ໄປທີ່ໜ້າຕັ້ງຄ່າ Discord Hub &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
