import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageSquare, ArrowLeft, Send, Sparkles, Search } from "lucide-react";
import { BrandFacebook, BrandWhatsapp } from "@/components/icons/BrandIcons";

export const metadata: Metadata = {
  title: "ຕິດຕໍ່ພວກເຮົາ (Contact Us) | LAOSYS Smart POS & E-Commerce",
  description: "ຕິດຕໍ່ສອບຖາມ, ຂໍຄຳປຶກສາ ຫຼື ແຈ້ງບັນຫາການໃຊ້ງານລະບົບ LAOSYS ຕະຫຼອດ 24 ຊົ່ວໂມງ.",
};

export default function ContactPage() {
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
              <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /><span>ຄົ້ນຫາຮ້ານຄ້າ</span></span>
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
            <span>LAOSYS Official Support Channel</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            ຕິດຕໍ່ພວກເຮົາ
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mt-2">
              (Contact Support)
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            ທີມງານວິສະວະກອນ ແລະ ຝ່າຍບໍລິການລູກຄ້າພ້ອມໃຫ້ຄຳປຶກສາ, ຊ່ວຍເຫຼືອ ແລະ ເບິ່ງແຍງຮ້ານຄ້າຂອງທ່ານ.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <BrandWhatsapp size={26} color="#25D366" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">ໂທລະສັບ / WhatsApp</h3>
            <p className="text-sm text-zinc-400 mb-4">ຕິດຕໍ່ດ່ວນ ຫຼື ສອບຖາມການໃຊ້ງານ</p>
            <a
              href="tel:02099319309"
              className="text-emerald-400 font-extrabold hover:underline text-lg block"
            >
              020 99319309
            </a>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">ອີເມວ (Email Support)</h3>
            <p className="text-sm text-zinc-400 mb-4">ສົ່ງເອກະສານ ຫຼື ຂໍ້ສະເໜີທຸລະກິດ</p>
            <a
              href="mailto:support@laosys.site"
              className="text-blue-400 font-bold hover:underline text-base block"
            >
              support@laosys.site
            </a>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">ສຳນັກງານໃຫຍ່</h3>
            <p className="text-sm text-zinc-400 mb-4">ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ</p>
            <span className="text-zinc-300 font-medium text-sm block">
              Vientiane Capital, Lao PDR
            </span>
          </div>
        </div>

        {/* Message Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mx-auto mb-4"><BrandFacebook size={32} color="#1877F2" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">ຕິດຕໍ່ຜ່ານ Facebook Official Page</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-6">
            ທ່ານສາມາດທັກຂໍ້ຄວາມຫາແອັດມິນຂອງພວກເຮົາຜ່ານ Facebook Page ໄດ້ຕະຫຼອດເວລາ ພວກເຮົາຍິນດີໃຫ້ບໍລິການດ້ວຍຄວາມໄວສູງສຸດ.
          </p>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-600/20"
          >
            <BrandFacebook size={18} color="#FFFFFF" className="shrink-0" />
            <span>ສົ່ງຂໍ້ຄວາມ Facebook Page</span>
          </a>
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
