import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, FileText, CheckCircle, ArrowLeft, ExternalLink, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "ເງື່ອນໄຂການໃຫ້ບໍລິການ (Terms of Service) | LAOSYS Smart POS & E-Commerce",
  description: "ເງື່ອນໄຂການໃຊ້ງານລະບົບ LAOSYS ສຳລັບຮ້ານຄ້າ, ຮ້ານອາຫານ ແລະ ເວັບໄຊທ໌ E-Commerce (Terms of Service and Merchant Agreement).",
};

export default function TermsPage() {
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
            <FileText className="w-3.5 h-3.5" />
            <span>LAOSYS Merchant Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            ເງື່ອນໄຂການໃຫ້ບໍລິການ (Terms of Service)
          </h1>
          <p className="text-sm text-zinc-400">
            ອັບເດດລ່າສຸດ: 1 ສິງຫາ 2026 • ນຳໃຊ້ກັບທຸກຮ້ານຄ້າທີ່ໃຊ້ບໍລິການເທິງລະບົບ LAOSYS
          </p>
        </div>

        <div className="space-y-8 text-zinc-300 leading-relaxed text-sm sm:text-base">
          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
              <span>ການຍອມຮັບເງື່ອນໄຂ (Acceptance of Terms)</span>
            </h2>
            <p className="text-zinc-400">
              ການລົງທະບຽນ ແລະ ການໃຊ້ງານແພລດຟອມ LAOSYS (ລະບົບຂາຍໜ້າຮ້ານ POS, ລະບົບຈັດການສະຕັອກສິນຄ້າ, ແລະ ເວັບໄຊທ໌ຮ້ານຄ້າ E-Commerce) ຖືວ່າທ່ານໄດ້ອ່ານ, ເຂົ້າໃຈ ແລະ ຍິນຍອມປະຕິບັດຕາມເງື່ອນໄຂການໃຫ້ບໍລິການນີ້ທຸກປະການ. ຖ້າທ່ານບໍ່ເຫັນດີກັບເງື່ອນໄຂໃດໜຶ່ງ ກະລຸນາຍຸດຕິການໃຊ້ງານລະບົບ.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
              <span>ສິດທິ ແລະ ຄວາມຮັບຜິດຊອບຂອງຜູ້ໃຊ້ (Account Rights &amp; Responsibilities)</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
              <li>ຜູ້ປະກອບການ (Owner/Admin) ຕ້ອງໃຫ້ຂໍ້ມູນທີ່ຖືກຕ້ອງໃນການລົງທະບຽນຮ້ານຄ້າ ແລະ ມີຄວາມຮັບຜິດຊອບຕໍ່ຄວາມປອດໄພຂອງລະຫັດຜ່ານ.</li>
              <li>ຫ້າມນຳໃຊ້ລະບົບ LAOSYS ໃນການຈຳໜ່າຍສິນຄ້າຜິດກົດໝາຍ, ລະເມີດລິຂະສິດ, ຫຼື ເຮັດທຸລະກຳທີ່ຂັດຕໍ່ກົດໝາຍແຫ່ງ ສປປ ລາວ.</li>
              <li>ຜູ້ປະກອບການມີສິດຄຸ້ມຄອງຂໍ້ມູນພະນັກງານ (Cashier, Kitchen, Staff) ພາຍໃນອົງກອນຂອງຕົນເອງ.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
              <span>ລະບົບໜ້າຮ້ານອອນລາຍ (E-Commerce Storefront Policies)</span>
            </h2>
            <p className="text-zinc-400">
              ຮ້ານຄ້າທີ່ເປີດໜ້າເວັບໄຊທ໌ຜ່ານລະບົບ LAOSYS (`laosys.site/shop/[slug]`) ຕ້ອງຮັບຜິດຊອບຕໍ່ຄວາມຖືກຕ້ອງຂອງລາຄາສິນຄ້າ, ຄ່າບໍລິການຈັດສົ່ງ, ແລະ ການໃຫ້ບໍລິການລູກຄ້າຂອງຮ້ານຕົນເອງ. LAOSYS ເປັນຜູ້ໃຫ້ບໍລິການແພລດຟອມເທັກໂນໂລຢີ ແລະ ບໍ່ມີສ່ວນກ່ຽວຂ້ອງໃນຂໍ້ຂັດແຍ່ງລະຫວ່າງຮ້ານຄ້າກັບຜູ້ຊື້.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">4</span>
              <span>ການຊຳລະເງິນ ແລະ ການຕໍ່ອາຍຸບໍລິການ (Subscription &amp; Payments)</span>
            </h2>
            <p className="text-zinc-400">
              ຄ່າບໍລິການລະບົບ POS ແລະ E-Commerce ເປັນໄປຕາມແພັກເກດທີ່ທ່ານເລືອກ (ເຊັ່ນ: Free Trial, Pro, Enterprise). ການຊຳລະເງິນສາມາດເຮັດຜ່ານລະບົບໂອນເງິນ / PromptPay / OnePay ຫຼື ບັດເຄຣດິດ ໂດຍຈະບໍ່ມີການຄືນເງິນສຳລັບຮອບບິນທີ່ໄດ້ເປີດໃຊ້ງານໄປແລ້ວ.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">5</span>
              <span>ຄວາມປອດໄພຂອງຂໍ້ມູນ ແລະ ການສຳຮອງຂໍ້ມູນ (Data Security &amp; Cloud Backup)</span>
            </h2>
            <p className="text-zinc-400">
              LAOSYS ໃຫ້ຄວາມສຳຄັນສູງສຸດຕໍ່ຄວາມປອດໄພຂໍ້ມູນທຸລະກິດຂອງທ່ານ ໂດຍຂໍ້ມູນຍອດຂາຍ, ສະຕັອກ, ແລະ ປະຫວັດລູກຄ້າຈະຖືກເຂົ້າລະຫັດແບບ Enterprise Cloud Encryption ແລະ ສຳຮອງຂໍ້ມູນທຸກວັນ.
            </p>
          </section>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white">ມີຄຳຖາມກ່ຽວກັບເງື່ອນໄຂການໃຊ້ງານ?</h3>
            <p className="text-xs text-zinc-400 mt-1">ຕິດຕໍ່ທີມງານຂອງພວກເຮົາເພື່ອສອບຖາມລາຍລະອຽດເພີ່ມເຕີມ</p>
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
