import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Ticket, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CustomerTableClient } from "@/components/CustomerTableClient";
import { getAllStoreCustomersMerged } from "@/lib/storeCustomer";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const { customers: t } = getDictionary(locale);

  const organizationId = (session.user as any).organizationId;

  if (!isAdmin && !organizationId) {
    redirect("/login");
  }

  // Fetch merged customers (both registered online storefront members & POS/Order customers)
  // Strictly isolated per store (organizationId) for store owners, or across all stores with storeName for Admin
  const customers = await getAllStoreCustomersMerged({
    organizationId,
    isAdmin,
  });

  const uniqueStores = isAdmin
    ? (Array.from(new Set(customers.map((c) => c.storeName || "Unknown"))) as string[])
    : [];
  const totalCustomers = customers.length;
  const onlineMembersCount = customers.filter((c) => c.isOnlineMember).length;
  const couponsClaimedTotal = customers.reduce(
    (sum, c) => sum + (Array.isArray(c.claimedCoupons) ? c.claimedCoupons.length : 0),
    0
  );
  const initialCustomers = customers.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t.title}</h2>
          <p className="text-zinc-400 mt-1">
            {t.desc} • ແຍກຂໍ້ມູນລູກຄ້າ ແລະ ຄູປອງສະເພາະແຕ່ລະຮ້ານ (Multi-Tenant Isolated)
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
        <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-yellow-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">{t.totalUnique}</CardTitle>
            <User className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white">{totalCustomers}</div>
            <p className="text-xs text-zinc-500 mt-1">ລວມລູກຄ້າໜ້າຮ້ານ ແລະ ອອນລາຍ</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">ສະມາຊິກລັອກອິນໜ້າຮ້ານອອນລາຍ</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-emerald-400">{onlineMembersCount}</div>
            <p className="text-xs text-zinc-500 mt-1">ລັອກອິນດ້ວຍເບີໂທມາດຕະຖານລາວ (020/030)</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">ຄູປອງທີ່ລູກຄ້າເກັບໄປແລ້ວ (1 ຄົນ / 1 ສິດ)</CardTitle>
            <Ticket className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-amber-400">{couponsClaimedTotal}</div>
            <p className="text-xs text-zinc-500 mt-1">ປ້ອງກັນການຣີເຊັດໜ້າເວັບເພື່ອເກັບຊ້ຳ</p>
          </CardContent>
        </Card>
      </div>

      <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-yellow-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-zinc-200">{t.allCustomers}</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <CustomerTableClient
            customers={initialCustomers}
            initialTotal={totalCustomers}
            stores={uniqueStores}
            t={t}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
