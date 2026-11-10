"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { User, Lock, Globe, ArrowRight, ShieldCheck, AlertTriangle, HelpCircle, Mail, Box, Image as ImageIcon, Eye, EyeOff, X, ChevronDown, Search } from "lucide-react";
import { BrandFacebook, BrandWhatsapp } from "@/components/icons/BrandIcons";
import { AccountRequestModal } from "@/components/AccountRequestModal";
import { getScreenById, ScreenDefinition } from "@/lib/screens";
import FactoryProductionLine3D from "@/components/FactoryProductionLine3D";

export default function HomeV3() { 
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [bgUrl, setBgUrl] = useState("/bg.jpg");
  const [heroMode, setHeroMode] = useState<"3D_FACTORY" | "WALLPAPER">("3D_FACTORY");
  const [showHeroBranding, setShowHeroBranding] = useState(false);
  const [language, setLanguage] = useState("la");
  const [mounted, setMounted] = useState(false);
  const [screenDef, setScreenDef] = useState<ScreenDefinition | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("screenId");
      if (sid) {
        const def = getScreenById(sid);
        if (def) setScreenDef(def);
      }
    }
    // Read language from cookie on load
    const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
    if (match && match[2]) {
      setLanguage(match[2]);
    }
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    try {
      await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLang })
      });
      router.refresh();
    } catch (e) {
      console.error("Failed to set language cookie");
    }
  };

  const t = {
    la: {
      welcome: "ຍິນດີຕ້ອນຮັບກັບມາ",
      desc: "ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານເພື່ອເຂົ້າສູ່ລະບົບ",
      email: "ອີເມວ ຫຼື ຊື່ຜູ້ໃຊ້",
      password: "ລະຫັດຜ່ານ",
      login: "ເຂົ້າສູ່ລະບົບ",
      loading: "ກຳລັງເຂົ້າ...",
      suspendedTitle: "ບັນຊີຂອງທ່ານຖືກລະງັບ",
      suspendedDesc: "ກະລຸນາຕິດຕໍ່ຜູ້ເບິ່ງແຍງລະບົບ (Admin) ເພື່ອແກ້ໄຂບັນຫາ ຫຼື ສອບຖາມຂໍ້ມູນເພີ່ມເຕີມ.",
      close: "ປິດ",
      needHelp: "ຕ້ອງການຄວາມຊ່ວຍເຫຼືອ?",
      version: "ເວີຊັ່ນ",
      contactTitle: "ຊ່ອງທາງການຕິດຕໍ່",
      contactDesc: "ກະລຸນາເລືອກຊ່ອງທາງທີ່ທ່ານຕ້ອງການຕິດຕໍ່ ເພື່ອຂໍຄວາມຊ່ວຍເຫຼືອຈາກທີມງານຂອງພວກເຮົາ",
      contactFb: "ຕິດຕໍ່ຜ່ານ Facebook",
      contactFbDesc: "ສົ່ງຂໍ້ຄວາມຫາແອັດມິນຜ່ານທາງເພຈ",
      contactEmail: "ຕິດຕໍ່ຜ່ານ Email",
      contactWhatsApp: "ຕິດຕໍ່ຜ່ານ WhatsApp",
      contactWhatsAppDesc: "ເບີໂທລະສັບ / WhatsApp: 020 99319309",
    },
    en: {
      welcome: "Welcome Back",
      desc: "Please enter your details to sign in.",
      email: "Email or Username",
      password: "Password",
      login: "Sign In",
      loading: "Signing in...",
      suspendedTitle: "Account Suspended",
      suspendedDesc: "Your account has been suspended or blocked. Please contact the administrator for more information.",
      close: "Close",
      needHelp: "Need help?",
      version: "Version",
      contactTitle: "Contact Support",
      contactDesc: "Please select a channel to contact our support team.",
      contactFb: "Contact via Facebook",
      contactFbDesc: "Send a message to our admin via page",
      contactEmail: "Contact via Email",
      contactWhatsApp: "Contact via WhatsApp",
      contactWhatsAppDesc: "Phone / WhatsApp: 020 99319309",
    },
    th: {
      welcome: "ยินดีต้อนรับกลับมา",
      desc: "กรุณากรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ",
      email: "อีเมล หรือ ชื่อผู้ใช้",
      password: "รหัสผ่าน",
      login: "เข้าสู่ระบบ",
      loading: "กำลังเข้าสู่ระบบ...",
      suspendedTitle: "บัญชีของคุณถูกระงับ",
      suspendedDesc: "กรุณาติดต่อผู้ดูแลระบบ (Admin) เพื่อแก้ไขปัญหาหรือสอบถามข้อมูลเพิ่มเติม",
      close: "ปิด",
      needHelp: "ต้องการความช่วยเหลือ?",
      version: "เวอร์ชัน",
      contactTitle: "ช่องทางการติดต่อ",
      contactDesc: "กรุณาเลือกช่องทางที่คุณต้องการติดต่อเพื่อขอความช่วยเหลือจากทีมงานของเรา",
      contactFb: "ติดต่อผ่าน Facebook",
      contactFbDesc: "ส่งข้อความหาแอดมินผ่านทางเพจ",
      contactEmail: "ติดต่อผ่าน Email",
      contactWhatsApp: "ติดต่อผ่าน WhatsApp",
      contactWhatsAppDesc: "เบอร์โทรศัพท์ / WhatsApp: 020 99319309",
    }
  }[language as "la" | "en" | "th"] || {
    welcome: "ຍິນດີຕ້ອນຮັບກັບມາ",
    desc: "ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານເພື່ອເຂົ້າສູ່ລະບົບ",
    email: "ອີເມວ ຫຼື ຊື່ຜູ້ໃຊ້",
    password: "ລະຫັດຜ່ານ",
    login: "ເຂົ້າສູ່ລະບົບ",
    loading: "ກຳລັງເຂົ້າ...",
    suspendedTitle: "ບັນຊີຂອງທ່ານຖືກລະງັບ",
    suspendedDesc: "ກະລຸນາຕິດຕໍ່ຜູ້ເບິ່ງແຍງລະບົບ (Admin) ເພື່ອແກ້ໄຂບັນຫາ ຫຼື ສອບຖາມຂໍ້ມູນເພີ່ມເຕີມ.",
    close: "ປິດ",
    needHelp: "ຕ້ອງການຄວາມຊ່ວຍເຫຼືອ?",
    version: "ເວີຊັ່ນ",
    contactTitle: "ຊ່ອງທາງການຕິດຕໍ່",
    contactDesc: "ກະລຸນາເລືອກຊ່ອງທາງທີ່ທ່ານຕ້ອງການຕິດຕໍ່ ເພື່ອຂໍຄວາມຊ່ວຍເຫຼືອຈາກທີມງານຂອງພວກເຮົາ",
    contactFb: "ຕິດຕໍ່ຜ່ານ Facebook",
    contactFbDesc: "ສົ່ງຂໍ້ຄວາມຫາແອັດມິນຜ່ານທາງເພຈ",
    contactEmail: "ຕິດຕໍ່ຜ່ານ Email",
    contactWhatsApp: "ຕິດຕໍ່ຜ່ານ WhatsApp",
    contactWhatsAppDesc: "ເບີໂທລະສັບ / WhatsApp: 020 99319309",
  };

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.login_bg_url) {
          setBgUrl(data.login_bg_url);
        }
        if (data.login_hero_mode === "WALLPAPER" || data.login_hero_mode === "3D_FACTORY") {
          setHeroMode(data.login_hero_mode);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "Account is suspended" || res.error === "Account is blocked") {
        setShowSuspendedModal(true);
      } else {
        setError(res.error);
      }
      setLoading(false);
    } else {
      const destination = screenDef ? screenDef.path : "/dashboard";
      router.push(destination);
      router.refresh();
    }
  };

  return (
    <main className="flex flex-col w-full font-sans bg-white overflow-x-hidden">
      {/* Hero Section - Login */}
      <section className="min-h-screen flex w-full bg-zinc-50 relative justify-center items-center md:items-stretch md:justify-start">
      {/* Mobile Background Image */}
      <div className="md:hidden absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${bgUrl}')` }}
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      </div>

      {/* Premium Top Gradient Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 z-50" />

      {/* Left Column - Interactive 3D Factory OR Original Wallpaper Image */}
      <div className="hidden md:block md:w-[60%] lg:w-[65%] xl:w-[75%] relative h-screen group overflow-hidden bg-zinc-950">
        {heroMode === "3D_FACTORY" ? (
          <div className="relative w-full h-full">
            <FactoryProductionLine3D
              embeddedHero={true}
              bottomActions={
                <>
                  <a
                    href="/stores"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>ຄົ້ນຫາຮ້ານຄ້າ LAOSYS (Store Directory)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowHeroBranding((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 text-zinc-200 border border-zinc-700/80 backdrop-blur-xl text-xs font-bold shadow-lg transition-all"
                  >
                    {showHeroBranding ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>ເຊື່ອງຂໍ້ມູນ LAOSYS</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ຂໍ້ມູນ LAOSYS &amp; ເມນູ</span>
                      </>
                    )}
                  </button>
                </>
              }
            />

            {/* Floating LAOSYS Info & Navigation Modal (Top-left, Never Collides with Bottom Dock) */}
            {showHeroBranding && (
              <div className="absolute top-16 left-6 right-6 md:right-auto md:max-w-xl max-h-[calc(100vh-14rem)] overflow-y-auto bg-zinc-950/95 backdrop-blur-2xl border border-zinc-700/80 rounded-3xl p-6 shadow-2xl z-40 text-white/95">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    <h2 className="text-xl font-bold tracking-wide">LAOSYS | Smart POS &amp; E-Commerce Platform</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHeroBranding(false)}
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-3">
                  LAOSYS (laosys.site) ແມ່ນແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນອັນດັບ 1 ທີ່ຖືກອອກແບບມາເພື່ອຍົກລະດັບທຸລະກິດໃນຍຸກດິຈິຕອນ ປະກອບດ້ວຍລະບົບຂາຍໜ້າຮ້ານ (POS) ທີ່ມີປະສິດທິພາບສູງ, ການຈັດການສະຕັອກສິນຄ້າແບບ Real-time, ລະບົບຈັດການຮ້ານອາຫານແລະເຄື່ອງດື່ມ, ການເຊື່ອມຕໍ່ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍ (E-Commerce Storefront) ອັດຕະໂນມັດ, ພ້ອມທັງລະບົບວິເຄາະຂໍ້ມູນຍອດຂາຍແລະລາຍງານທາງດ້ານການເງິນທີ່ຊັດເຈນ.
                </p>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 hidden sm:block">
                  ລະບົບ LAOSYS ຮອງຮັບການເຮັດວຽກຫຼາຍສາຂາ (Multi-branch), ການຈັດການສິດທິຜູ້ใช้งานຫຼາຍລະດັບ (Multi-role authorization), ການສະແກນບາໂຄ້ດແລະ QR Code, ການເຊື່ອມຕໍ່ອຸປະກອນ POS ຄົບຊຸດ, ພ້ອມມາດຕະຖານຄວາມປອດໄພສູງສຸດລະດັບ Enterprise Secure Cloud Portal ເພື່ອໃຫ້ຜູ້ປະກອບການສາມາດບໍລິຫານທຸລະກິດໄດ້ຢ່າງໝັ້ນໃຈ ທຸກທີ່ ທຸກເວລາ.
                </p>
                <div className="mb-4">
                  <a 
                    href="/stores" 
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
                  >
                    <span>ຄົ້ນຫາຮ້ານຄ້າ &amp; ຮ້ານອາຫານໃນ LAOSYS (Store Directory)</span>
                    <span className="text-xs bg-zinc-950/20 px-2 py-0.5 rounded-full">ໃໝ່ / NEW</span>
                  </a>
                </div>
                <nav aria-label="Internal Navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/80 border-t border-white/20 pt-3">
                  <a href="/stores" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1">ຄົ້ນຫາຮ້ານຄ້າ (Stores)</a>
                  <a href="/storefront" className="hover:text-emerald-400 transition-colors">ເວັບໄຊທ໌ຮ້ານຄ້າ (Storefront)</a>
                  <a href="/about" className="hover:text-emerald-400 transition-colors">ກ່ຽວກັບ LAOSYS</a>
                  <a href="/features" className="hover:text-emerald-400 transition-colors">ຄຸນສົມບັດລະບົບ POS</a>
                  <a href="/contact" className="hover:text-emerald-400 transition-colors">ຕິດຕໍ່ພວກເຮົາ (Contact)</a>
                  <a href="/privacy" className="hover:text-emerald-400 transition-colors">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a>
                  <a href="/terms" className="hover:text-emerald-400 transition-colors">ເງື່ອນໄຂການໃຫ້ບໍລິການ</a>
                </nav>
              </div>
            )}

            {/* Semantic SEO Branding hidden for crawlers when modal is closed */}
            {!showHeroBranding && (
              <div className="sr-only">
                <h2>LAOSYS | Smart POS &amp; E-Commerce Platform</h2>
                <p>LAOSYS (laosys.site) ແມ່ນແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນອັນດັບ 1...</p>
                <nav aria-label="Internal Navigation">
                  <a href="/stores">Stores</a>
                  <a href="/storefront">Storefront</a>
                  <a href="/about">About</a>
                  <a href="/features">Features</a>
                  <a href="/contact">Contact</a>
                  <a href="/privacy">Privacy</a>
                  <a href="/terms">Terms</a>
                </nav>
              </div>
            )}
          </div>
        ) : (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: `url('${bgUrl}')` }}
            />
            {/* Soft gradient overlay for better depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

            {/* Semantic SEO Branding & Rich Feature Overview for crawlers and users in Wallpaper mode */}
            <div className="absolute bottom-8 left-8 right-8 z-10 text-white/95 max-w-4xl">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <h2 className="text-2xl font-bold tracking-wide">LAOSYS | Smart POS &amp; E-Commerce Platform</h2>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                LAOSYS (laosys.site) ແມ່ນແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນອັນດັບ 1 ທີ່ຖືກອອກແບບມາເພື່ອຍົກລະດັບທຸລະກິດໃນຍຸກດິຈິຕອນ ປະກອບດ້ວຍລະບົບຂາຍໜ້າຮ້ານ (POS) ທີ່ມີປະສິດທິພາບສູງ, ການຈັດການສະຕັອກສິນຄ້າແບບ Real-time, ລະບົບຈັດການຮ້ານອາຫານແລະເຄື່ອງດື່ມ, ການເຊື່ອມຕໍ່ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍ (E-Commerce Storefront) ອັດຕະໂນມັດ, ພ້ອມທັງລະບົບວິເຄາະຂໍ້ມູນຍອດຂາຍແລະລາຍງານທາງດ້ານການເງິນທີ່ຊັດເຈນ.
              </p>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 hidden sm:block">
                ລະບົບ LAOSYS ຮອງຮັບການເຮັດວຽກຫຼາຍສາຂາ (Multi-branch), ການຈັດການສິດທິຜູ້ใช้งานຫຼາຍລະດັບ (Multi-role authorization), ການສະແກນບາໂຄ້ດແລະ QR Code, ການເຊື່ອມຕໍ່ອຸປະກອນ POS ຄົບຊຸດ, ພ້ອມມາດຕະຖານຄວາມປອດໄພສູງສຸດລະດັບ Enterprise Secure Cloud Portal ເພື່ອໃຫ້ຜູ້ປະກອບການສາມາດບໍລິຫານທຸລະກິດໄດ້ຢ່າງໝັ້ນໃຈ ທຸກທີ່ ທຸກເວລາ.
              </p>
              <div className="mb-4">
                <a 
                  href="/stores" 
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  <span>ຄົ້ນຫາຮ້ານຄ້າ &amp; ຮ້ານອາຫານໃນ LAOSYS (Store Directory)</span>
                  <span className="text-xs bg-zinc-950/20 px-2 py-0.5 rounded-full">ໃໝ່ / NEW</span>
                </a>
              </div>
              <nav aria-label="Internal Navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/80 border-t border-white/20 pt-3">
                <a href="/stores" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1">ຄົ້ນຫາຮ້ານຄ້າ (Stores)</a>
                <a href="/storefront" className="hover:text-emerald-400 transition-colors">ເວັບໄຊທ໌ຮ້ານຄ້າ (Storefront)</a>
                <a href="/about" className="hover:text-emerald-400 transition-colors">ກ່ຽວກັບ LAOSYS</a>
                <a href="/features" className="hover:text-emerald-400 transition-colors">ຄຸນສົມບັດລະບົບ POS</a>
                <a href="/contact" className="hover:text-emerald-400 transition-colors">ຕິດຕໍ່ພວກເຮົາ (Contact)</a>
                <a href="/privacy" className="hover:text-emerald-400 transition-colors">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a>
                <a href="/terms" className="hover:text-emerald-400 transition-colors">ເງື່ອນໄຂການໃຫ້ບໍລິການ</a>
              </nav>
            </div>
          </>
        )}
      </div>
      
      {/* Right Column - Premium Login Form */}
      <div className="w-full md:w-[40%] lg:w-[35%] xl:w-[25%] flex flex-col justify-between p-8 sm:p-12 relative bg-white/95 md:bg-white backdrop-blur-xl shadow-2xl md:shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] z-10 m-4 rounded-3xl md:m-0 md:rounded-none h-auto md:h-auto self-center md:self-auto max-h-[calc(100vh-2rem)] md:max-h-none overflow-y-auto">
        
        <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto">
          {/* Welcome Text */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="sr-only">LAOSYS - ລະບົບຈັດການຮ້ານຄ້າ (POS) ແລະ ເວັບໄຊທ໌ E-Commerce | laosys.site</h1>
            <img src="/logo-v2.svg" alt="LAOSYS Logo" width={160} height={160} fetchPriority="high" decoding="async" className="w-32 h-32 sm:w-36 sm:h-36 object-contain mx-auto md:mx-0 mb-6 drop-shadow-[0_20px_35px_rgba(0,242,254,0.3)] rounded-3xl hover:scale-105 hover:rotate-1 transition-all duration-500" />
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500 tracking-tight mb-2">
              {t.welcome}
            </h2>
            <p className="text-sm text-zinc-500">{t.desc} ທີ່ Laosys</p>
            {screenDef && (
              <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center gap-2 text-xs text-blue-700 shadow-sm">
                <span className="font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] shrink-0">
                  {screenDef.screenId}
                </span>
                <span className="truncate font-medium">{screenDef.titleLa}</span>
              </div>
            )}
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Groups with Icons */}
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <Input 
                  type="text" 
                  placeholder={t.email}
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 h-12 bg-zinc-50/50 border-zinc-200 text-zinc-900 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all shadow-sm hover:bg-zinc-50"
                />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <Input 
                  type="password" 
                  placeholder={t.password}
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 h-12 bg-zinc-50/50 border-zinc-200 text-zinc-900 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all shadow-sm hover:bg-zinc-50"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                  <Globe className="h-5 w-5" />
                </div>
                <select 
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="flex h-12 w-full appearance-none items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 text-sm text-zinc-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-zinc-50 cursor-pointer"
                >
                  <option value="la">ພາສາລາວ (Lao)</option>
                  <option value="th">ภาษาไทย (Thai)</option>
                  <option value="en">English (US)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}
            
            <div className="pt-4 space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl h-12 text-base font-medium shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40 flex items-center justify-center gap-2 group" 
                disabled={loading}
              >
                {loading ? t.loading : t.login}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </div>
          </form>

          <div className="mt-4 w-full space-y-2.5">
            <AccountRequestModal />
            <a
              href="/stores"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-emerald-700 hover:text-emerald-800 font-bold text-sm transition-all shadow-sm"
            >
              <Search className="w-4 h-4 text-emerald-600" />
              <span>ຄົ້ນຫາຮ້ານຄ້າໃນລະບົບ (Browse Stores)</span>
            </a>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="flex items-center justify-between mt-auto pt-8 border-t border-zinc-100">
          <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 bg-zinc-100/50 py-1.5 px-3 rounded-full border border-zinc-200/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {t.version} 1.0.0
          </div>
          <button 
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-xs font-medium text-zinc-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5 bg-white border border-zinc-200 hover:border-blue-200 hover:bg-blue-50 py-1.5 px-3 rounded-full shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t.needHelp}
          </button>
        </div>
      </div>
      </section>

      {/* SEO Content Block - Below the Fold */}
      <article className="w-full bg-white text-zinc-800 py-16 px-6 md:px-12 lg:px-24 border-t border-zinc-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">ແພລດຟອມຈັດການຮ້ານຄ້າ (POS) ແລະ ເວັບໄຊທ໌ E-Commerce ຄົບວົງຈອນ</h2>
            <p className="mt-4 text-lg text-zinc-600">ລະບົບ POS ອັດສະລິຍະ, ຈັດການສະຕັອກສິນຄ້າ, ລະບົບຮ້ານອາຫານ ແລະ ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍສຳລັບທຸລະກິດຍຸກໃໝ່</p>
          </header>
          
          <div className="grid md:grid-cols-2 gap-12">
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-zinc-800">ຄຸນສົມບັດເດັ່ນຂອງລະບົບ POS ແລະ ການຈັດການສະຕັອກ</h3>
              <p className="text-zinc-600 leading-relaxed">
                ແພລດຟອມຂອງພວກເຮົາຖືກອອກແບບມາເພື່ອຕອບສະໜອງທຸກຄວາມຕ້ອງການຂອງຜູ້ປະກອບການ ບໍ່ວ່າຈະເປັນຮ້ານຄ້າຂາຍຍ່ອຍ, ຮ້ານຄ້າຂາຍສົ່ງ, ຮ້ານອາຫານ, ຫຼື ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍ. ລະບົບຂາຍໜ້າຮ້ານມີຄວາມໄວສູງ ຮອງຮັບການສະແກນບາໂຄ້ດ, ການຕັດສະຕັອກແບບ Real-time, ແລະ ການພິມໃບເສັດຢ່າງເປັນມືອາຊີບ.
              </p>
              <p className="text-zinc-600 leading-relaxed">
                ນອກຈາກນີ້ຍັງມີລະບົບຈັດການຕົວເລືອກສິນຄ້າ (Product Variants), ລະບົບໂປຣໂມຊັນແລະຄູປອງສ່ວນຫຼຸດ, ພ້ອມທັງລະບົບລາຍງານຍອດຂາຍ ແລະ ວິເຄາະກຳໄລ-ຕົ້ນທຶນທີ່ຊັດເຈນ ເພື່ອຊ່ວຍໃຫ້ທ່ານຕັດສິນໃຈທາງທຸລະກິດໄດ້ຢ່າງຖືກຕ້ອງແລະວ່ອງໄວ.
              </p>
            </section>
            
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-zinc-800">ເຊື່ອມຕໍ່ໜ້າຮ້ານກັບອອນລາຍ (Omnichannel Storefront)</h3>
              <p className="text-zinc-600 leading-relaxed">
                ລະບົບສາມາດເຊື່ອມຕໍ່ຂໍ້ມູນສິນຄ້າແລະສະຕັອກລະຫວ່າງການຂາຍໜ້າຮ້ານ ແລະ ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍ (E-Commerce) ໄດ້ອັດຕະໂນມັດ ໂດຍບໍ່ຕ້ອງປ້ອນຂໍ້ມູນຊ້ຳຊ້ອນ. ຮອງຮັບການຊຳລະເງິນຜ່ານ QR Code ພ້ອມແຈ້ງເຕືອນຄຳສັ່ງຊື້ໃໝ່ທັນທີ.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-sm">
                <li><strong>ລະບົບຂາຍໜ້າຮ້ານ (POS):</strong> ຂາຍດ່ວນ, ພິມບິນ, ຈັດການເງິນທອນ ແລະ ສະຕັອກຢ່າງຖືກຕ້ອງ.</li>
                <li><strong>ລະບົບຮ້ານອາຫານ:</strong> ຈັດການໂຕະ, ໂຊນ, ເມນູເສີມ (Modifiers) ແລະ ສົ່ງຄຳສັ່ງເຂົ້າຄົວ.</li>
                <li><strong>ລະບົບຫຼາຍສາຂາ:</strong> ບໍລິຫານຫຼາຍຮ້ານຄ້າໃນບັນຊີດຽວ ພ້ອມລະບົບກຳນົດສິດທິພະນັກງານ.</li>
                <li><strong>ຄວາມປອດໄພລະດັບສູງ:</strong> ປົກປ້ອງຂໍ້ມູນດ້ວຍເຕັກໂນໂລຊີ Cloud Security ທີ່ທັນສະໄໝ.</li>
              </ul>
            </section>
          </div>
          
          <nav aria-label="Footer Navigation" className="pt-8 border-t border-zinc-200 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-blue-600">
            <a href="/storefront" className="hover:underline">ເວັບໄຊທ໌ຮ້ານຄ້າ (Storefront)</a>
            <a href="/about" className="hover:underline">ກ່ຽວກັບພວກເຮົາ (About)</a>
            <a href="/features" className="hover:underline">ຄຸນສົມບັດລະບົບ (Features)</a>
            <a href="/contact" className="hover:underline">ຕິດຕໍ່ພວກເຮົາ (Contact)</a>
            <a href="/privacy" className="hover:underline">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a>
            <a href="/terms" className="hover:underline">ເງື່ອນໄຂການໃຫ້ບໍລິການ</a>
          </nav>

          <footer className="pt-6 border-t border-zinc-100 text-center text-zinc-500 text-xs sm:text-sm">
            <p>&copy; {new Date().getFullYear()} LAOSYS. ສະຫງວນລິຂະສິດທຸກປະການ. ແພລດຟອມຈັດການຮ້ານຄ້າ POS ແລະ ເວັບໄຊທ໌ E-Commerce ອັນດັບ 1.</p>
          </footer>
        </div>
      </article>

      {/* Suspended Account Modal */}
      <Dialog open={showSuspendedModal} onOpenChange={setShowSuspendedModal}>
        <DialogContent className="bg-white border-zinc-200 sm:max-w-md shadow-2xl rounded-2xl">
          <div className="flex flex-col items-center justify-center text-center pt-8 pb-4">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold text-zinc-900 mb-2">
              {t.suspendedTitle}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-base max-w-sm mx-auto mb-6">
              {t.suspendedDesc}
            </DialogDescription>
            <div className="w-full space-y-3">
              <Button 
                onClick={() => setShowSuspendedModal(false)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 text-base font-medium"
              >
                {t.close}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="bg-white border-zinc-100 shadow-2xl rounded-2xl sm:max-w-md p-0 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-zinc-900 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                  <HelpCircle className="w-6 h-6" />
                </div>
                {t.contactTitle}
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-500 mt-2">
                {t.contactDesc}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <a 
                href="https://www.facebook.com/share/1KBhGuvWsx/" 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center p-4 border border-zinc-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <BrandFacebook size={20} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 group-hover:text-[#1877F2] transition-colors">{t.contactFb}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.contactFbDesc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-[#1877F2] group-hover:translate-x-1 transition-all" />
              </a>

              <a 
                href="mailto:khamla.souvan.official@gmail.com" 
                className="w-full flex items-center p-4 border border-zinc-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors">{t.contactEmail}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">khamla.souvan.official@gmail.com</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </a>

              <a 
                href="https://wa.me/8562099319309" 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center p-4 border border-zinc-200 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <BrandWhatsapp size={20} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 group-hover:text-[#25D366] transition-colors">{t.contactWhatsApp}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.contactWhatsAppDesc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-[#25D366] group-hover:translate-x-1 transition-all" />
              </a>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-100">
              <Button 
                onClick={() => setShowHelpModal(false)}
                variant="ghost"
                className="w-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl h-11 font-medium transition-colors"
              >
                {t.close}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
