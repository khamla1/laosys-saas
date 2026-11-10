import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Utensils, ShoppingBag, BarChart3, Users, ShieldCheck, QrCode, ArrowLeft, Sparkles, CheckCircle, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "ຄຸນສົມບັດລະບົບ (Features) | LAOSYS Smart POS & E-Commerce",
  description: "ລວມຄຸນສົມບັດເດັ່ນຂອງລະບົບ LAOSYS ທີ່ຕອບໂຈດທຸກຮ້ານຄ້າ, ຮ້ານອາຫານ ແລະ ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍ.",
};

export default function FeaturesPage() {
  const features = [
    {
      icon: <Utensils className="w-8 h-8 text-orange-400" />,
      title: "ລະບົບ POS ຮ້ານອາຫານ & ເຄື່ອງດື່ມ",
      desc: "ຈັດການໂຕະອາຫານ, ສົ່ງອໍເດີ້ເຂົ້າຄົວ KDS ອັດຕະໂນມັດ, ແຍກບິນ/ລວມບິນ, ຄິດໄລ່ Service Charge ແລະ ພິມບິນໃບແຈ້ງຍອດພາສາລາວ.",
    },
    {
      icon: <ShoppingBag className="w-8 h-8 text-emerald-400" />,
      title: "ເວັບໄຊທ໌ຮ້ານຄ້າ E-Commerce ອັດຕະໂນມັດ",
      desc: "ສ້າງໜ້າຮ້ານອອນລາຍຂອງຮ້ານທ່ານທັນທີ (laosys.site/shop/ຊື່ຮ້ານ) ລູກຄ້າສາມາດສັ່ງຊື້ສິນຄ້າຜ່ານມືຖືໄດ້ທຸກທີ່ ທຸກເວລາ.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
      title: "ຈັດການສະຕັອກ & ບັນຊີຄົບວົງຈອນ",
      desc: "ຕັດສະຕັອກ Real-time, ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ, ຮອງຮັບບາໂຄ້ດ, ພ້ອມລາຍງານຍອດຂາຍ ແລະ ກໍາໄລ-ຂາດທຶນຊັດເຈນ.",
    },
    {
      icon: <QrCode className="w-8 h-8 text-cyan-400" />,
      title: "ຮອງຮັບ QR Code & PromptPay / OnePay",
      desc: "ສະແກນຈ່າຍເງິນສະດວກ ປອດໄພ ຫຼຸດຜ່ອນຂໍ້ຜິດພາດໃນການທອນເງິນ ແລະ ກວດສອບຍອດໄດ້ທັນທີ.",
    },
    {
      icon: <Users className="w-8 h-8 text-purple-400" />,
      title: "ລະບົບສະມາຊິກ & ສະສົມຄະແນນ (Loyalty)",
      desc: "ເກັບປະຫວັດລູກຄ້າ, ສະສົມຄະແນນແລກຂອງລາງວັນ, ຄູປອງສ່ວນຫຼຸດ ແລະ ຈັດການສິດທິພະນັກງານຫຼາຍລະດັບ.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-rose-400" />,
      title: "ຄວາມປອດໄພ Cloud Enterprise",
      desc: "ເຂົ້າເຖິງຂໍ້ມູນໄດ້ທຸກອຸປະກອນ (iPad, ມືຖື, ຄອມພິວເຕີ) ພ້ອມລະບົບສຳຮອງຂໍ້ມູນອັດຕະໂນມັດເທິງຄລາວດ໌.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo-v2.svg" 
              alt="LAOSYS Logo" 
              width={38} 
              height={38} 
              className="w-9 h-9 object-contain rounded-xl drop-shadow-[0_0_12px_rgba(0,242,254,0.35)] group-hover:scale-105 transition-all"
            />
            <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              LAOSYS
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/stores" 
              className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> ຄົ້ນຫາຮ້ານຄ້າ</span>
            </Link>
            <Link 
              href="/"
              className="text-xs sm:text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ກັບຄືນໜ້າຫຼັກ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center relative overflow-hidden border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LAOSYS Features Showcase</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            ຄຸນສົມບັດລະບົບ LAOSYS
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mt-2">
              (All-In-One POS &amp; E-Commerce)
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            ຄົບທຸກເຄື່ອງມືທີ່ຮ້ານຄ້າ, ຮ້ານອາຫານ, ແລະ ທຸລະກິດລາວຕ້ອງການ ໃນແພລດຟອມດຽວ.
          </p>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 p-6 rounded-3xl shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl text-center">
          <h3 className="text-2xl font-bold text-white mb-2">ພ້ອມຍົກລະດັບຮ້ານຄ້າຂອງທ່ານແລ້ວບໍ?</h3>
          <p className="text-sm text-zinc-400 mb-6">ເລີ່ມຕົ້ນໃຊ້ງານ LAOSYS ມື້ນີ້ ພ້ອມບໍລິການເບິ່ງແຍງຕະຫຼອດ 24/7</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນ
            </Link>
            <Link
              href="/stores"
              className="px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-colors"
            >
              ເບິ່ງຮ້ານຄ້າຕົວຢ່າງ (Store Directory)
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} LAOSYS — ລະບົບຈັດການຮ້ານຄ້າ POS ແລະ ເວັບໄຊທ໌ E-Commerce ຄົບວົງຈອນ</p>
        </div>
      </footer>
    </div>
  );
}
