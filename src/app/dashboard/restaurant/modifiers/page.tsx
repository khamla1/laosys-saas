import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ModifiersClient from "./ModifiersClient";
import { Sliders } from "lucide-react";

export default async function ModifiersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ຕົວເລືອກເສີມ & ປັບແຕ່ງເມນູ (Modifier Groups)
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
              ກຳນົດຕົວເລືອກປັບແຕ່ງອາຫານ &amp; ເຄື່ອງດື່ມ ເຊັ່ນ: ລະດັບຄວາມຫວານ, ຂະໜາດແກ້ວ, ທັອບປິ້ງ ຫຼື ລະດັບຄວາມເຜັດ
            </p>
          </div>
        </div>
      </div>

      {/* Main Client Component */}
      <ModifiersClient />
    </div>
  );
}
