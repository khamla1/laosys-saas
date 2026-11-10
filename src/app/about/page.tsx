import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Award, Users, CheckCircle, ArrowLeft, Heart, Sparkles, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "ກ່ຽວກັບພວກເຮົາ (About LAOSYS) | ອັນດັບ 1 ລະບົບ POS & E-Commerce ໃນລາວ",
  description: "ຮູ້ຈັກກັບ LAOSYS ແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນອັນດັບ 1 ຂອງລາວ ທີ່ພັດທະນາຂຶ້ນເພື່ອຍົກລະດັບທຸລະກິດ ແລະ ຮ້ານຄ້າໃນຍຸກດິຈິຕອນ.",
};

export default function AboutPage() {
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LAOSYS Official Platform</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            ກ່ຽວກັບ LAOSYS
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mt-2">
              (About Our Platform)
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            ພວກເຮົາແມ່ນແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນອັນດັບ 1 ຂອງລາວ ທີ່ພັດທະນາຂຶ້ນເພື່ອຍົກລະດັບຮ້ານອາຫານ, ຮ້ານຄ້າ ແລະ ທຸລະກິດລາວສູ່ຍຸກດິຈິຕອນຢ່າງເຕັມຮູບແບບ.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex-1 w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
            <Award className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">ມາດຕະຖານອັນດັບ 1</h3>
            <p className="text-sm text-zinc-400">
              ອອກແບບ ແລະ ພັດທະນາໂດຍວິສະວະກອນຊອບແວທີ່ເຂົ້າໃຈທຸລະກິດ ແລະ ຮ້ານຄ້າໃນລາວຢ່າງແທ້ຈິງ.
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
            <Shield className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">ປອດໄພລະດັບ Enterprise</h3>
            <p className="text-sm text-zinc-400">
              ຂໍ້ມູນທັງໝົດເກັບເທິງຄລາວດ໌ທີ່ປອດໄພສູງສຸດ ພ້ອມລະບົບສຳຮອງຂໍ້ມູນອັດຕະໂນມັດທຸກວັນ.
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
            <Users className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">ບໍລິການຫຼັງການຂາຍ 24/7</h3>
            <p className="text-sm text-zinc-400">
              ທີມງານພ້ອມໃຫ້ຄຳປຶກສາ ແລະ ເບິ່ງແຍງຮ້ານຄ້າຂອງທ່ານຕະຫຼອດການໃຊ້ງານ.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-blue-950/40 border border-emerald-500/20 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            ພາລະກິດຂອງພວກເຮົາ (Our Mission)
          </h2>
          <p className="text-zinc-300 max-w-3xl mx-auto leading-relaxed text-sm sm:text-base">
            &ldquo;ພວກເຮົາເຊື່ອວ່າທຸລະກິດ ແລະ ຮ້ານຄ້າລາວທຸກຂະໜາດ ສົມຄວນໄດ້ຮັບເຄື່ອງມືທີ່ທັນສະໄໝ, ໃຊ້ງານງ່າຍ ແລະ ມີປະສິດທິພາບສູງ ໃນລາຄາທີ່ເຂົ້າເຖິງໄດ້ ເພື່ອຊ່ວຍໃຫ້ຜູ້ປະກອບການປະສົບຄວາມສຳເລັດ ແລະ ເຕີບໂຕຢ່າງຍືນຍົງ.&rdquo;
          </p>
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
