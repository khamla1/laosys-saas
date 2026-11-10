import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Store, ShoppingBag, Globe, Smartphone, Sparkles, ArrowRight, ArrowLeft, CheckCircle, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "ເວັບໄຊທ໌ຮ້ານຄ້າ (Storefront Platform) | LAOSYS Smart POS & E-Commerce",
  description: "ລະບົບສ້າງເວັບໄຊທ໌ຮ້ານຄ້າອອນລາຍ (E-Commerce Storefront) ອັດຕະໂນມັດສຳລັບຮ້ານຄ້າ ແລະ ຮ້ານອາຫານໃນລາວ.",
};

export default function StorefrontOverviewPage() {
  const highlights = [
    {
      title: "ລິ້ງຮ້ານຄ້າສ່ວນຕົວ (Your Store URL)",
      desc: "ໄດ້ຮັບລິ້ງໜ້າຮ້ານທັນທີເຊັ່ນ: laosys.site/shop/ຊື່ຮ້ານຂອງທ່ານ ເພື່ອແຊຣ໌ໃຫ້ລູກຄ້າສັ່ງຊື້ໄດ້ງ່າຍໆ.",
    },
    {
      title: "ເຊື່ອມຕໍ່ສະຕັອກ POS ອັດຕະໂນມັດ",
      desc: "ເມື່ອຂາຍໜ້າຮ້ານ ຫຼື ອອນລາຍ ສະຕັອກສິນຄ້າຈະຕັດຮ່ວມກັນແບບ Real-time ບໍ່ຕ້ອງຢ້ານສິນຄ້າໝົດ ຫຼື ຂາຍຊ້ຳ.",
    },
    {
      title: "ຮອງຮັບມືຖື ແລະ ທຸກໜ້າຈໍ",
      desc: "ອອກແບບມາໃຫ້ລູກຄ້າສັ່ງຊື້ຜ່ານມືຖືສະດວກທີ່ສຸດ ພ້ອມລະບົບຈ່າຍເງິນຜ່ານ QR Code & PromptPay.",
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
            <span>LAOSYS Online Storefront Platform</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            ເວັບໄຊທ໌ຮ້ານຄ້າອອນລາຍ
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mt-2">
              (Automated E-Commerce Storefront)
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
            ປ່ຽນຮ້ານຄ້າຂອງທ່ານໃຫ້ເປັນຮ້ານຄ້າອອນລາຍພາຍໃນ 1 ນາທີ ເຊື່ອມຕໍ່ລະບົບ POS ຂາຍໜ້າຮ້ານ ແລະ ສະຕັອກສິນຄ້າຮ່ວມກັນແບບ Real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/stores"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-base transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>ຄົ້ນຫາຮ້ານຄ້າທັງໝົດ (Store Directory)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="px-8 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-base transition-colors"
            >
              ເຂົ້າສູ່ລະບົບ / ເປີດຮ້ານ
            </Link>
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl"
            >
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{h.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{h.desc}</p>
            </div>
          ))}
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
