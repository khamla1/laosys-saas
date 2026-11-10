import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, ArrowLeft, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ (Privacy Policy) | LAOSYS Smart POS & E-Commerce",
  description: "ນະໂຍບາຍຄວາມປອດໄພ ແລະ ການປົກປ້ອງຂໍ້ມູນສ່ວນຕົວຂອງຜູ້ໃຊ້, ຮ້ານຄ້າ, ແລະ ລູກຄ້າເທິງລະບົບ LAOSYS.",
};

export default function PrivacyPage() {
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

      {/* Main Legal Document */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>LAOSYS Data Protection &amp; Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ (Privacy Policy)
          </h1>
          <p className="text-sm text-zinc-400">
            ອັບເດດລ່າສຸດ: 1 ສິງຫາ 2026 • ພວກເຮົາໃຫ້ຄວາມສຳຄັນສູງສຸດໃນການປົກປ້ອງຂໍ້ມູນທຸລະກິດຂອງທ່ານ
          </p>
        </div>

        <div className="space-y-8 text-zinc-300 leading-relaxed text-sm sm:text-base">
          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>1. ການເກັບກຳຂໍ້ມູນ (Data Collection)</span>
            </h2>
            <p className="text-zinc-400">
              ພວກເຮົາເກັບກຳຂໍ້ມູນທີ່ຈຳເປັນໃນການໃຫ້ບໍລິການລະບົບ POS ແລະ E-Commerce ເຊັ່ນ: ຊື່ຮ້ານຄ້າ, ອີເມວ, ເບີໂທລະສັບ, ລາຍການສິນຄ້າ, ຂໍ້ມູນຍອດຂາຍ, ແລະ ຂໍ້ມູນສະມາຊິກລູກຄ້າ (Loyalty Members) ທີ່ທ່ານໄດ້ບັນທຶກເຂົ້າໃນລະບົບ.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <span>2. ການນຳໃຊ້ຂໍ້ມູນ (Use of Information)</span>
            </h2>
            <p className="text-zinc-400">
              ຂໍ້ມູນທຸລະກິດຂອງທ່ານຖືກນຳໃຊ້ເພື່ອປະມວນຜົນການຂາຍ, ສ້າງລາຍງານສະຖິຕິພາຍໃນອົງກອນຂອງທ່ານ, ແລະ ປັບປຸງປະສິດທິພາບຂອງລະບົບ LAOSYS ເທົ່ານັ້ນ. ພວກເຮົາຈະບໍ່ເປີດເຜີຍ, ຈຳໜ່າຍ, ຫຼື ແບ່ງປັນຂໍ້ມູນຍອດຂາຍຂອງທ່ານໃຫ້ແກ່ບຸກຄົນທີສາມໂດຍເດັດຂາດ.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>3. ຄວາມປອດໄພ ແລະ ການເຂົ້າລະຫັດຂໍ້ມູນ (Enterprise Cloud Security)</span>
            </h2>
            <p className="text-zinc-400">
              ຂໍ້ມູນທັງໝົດຖືກເກັບຮັກສາເທິງຄລາວດ໌ (Cloud Server) ທີ່ມີມາດຕະຖານຄວາມປອດໄພສູງສຸດ, ເຂົ້າລະຫັດຂໍ້ມູນຜ່ານ SSL/TLS Encryption ແລະ ມີລະບົບປ້ອງກັນການເຂົ້າເຖິງໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ ພ້ອມການສຳຮອງຂໍ້ມູນອັດຕະໂນມັດ (Automated Backup).
            </p>
          </section>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white">ຕ້ອງການສອບຖາມກ່ຽວກັບຄວາມປອດໄພຂໍ້ມູນ?</h3>
            <p className="text-xs text-zinc-400 mt-1">ຕິດຕໍ່ທີມງານວິສະວະກອນຄວາມປອດໄພຂອງພວກເຮົາ</p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition-colors shrink-0"
          >
            ຕິດຕໍ່ທີມງານ (Contact Us)
          </Link>
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
