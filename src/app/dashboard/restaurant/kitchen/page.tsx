import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KDSClient from "./KDSClient";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cookies } from "next/headers";
import { ChefHat, MonitorCheck } from "lucide-react";

export default async function KDSPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const orgRole = (session.user as any).orgRole;
  if (!["ADMIN", "SELLER", "CASHIER", "STAFF", "KITCHEN", "CHEF"].includes(role) && orgRole !== "KITCHEN") {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);

  return (
    <div className="h-full bg-zinc-950 p-3 sm:p-5 md:p-6 flex flex-col min-h-screen">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>ຈໍສະແດງຜົນຫ້ອງຄົວ (Kitchen Display System)</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
              ລະບົບຈັດການຄິວອາຫານ, ຕິດຕາມສະຖານະປຸງແຕ່ງ ແລະ ແຈ້ງເຕືອນພ້ອມເສີຟ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="text-zinc-300">ອັບເດດຄິວອັດຕະໂນມັດ (Real-time KDS)</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <KDSClient dicts={dicts} />
      </div>
    </div>
  );
}
