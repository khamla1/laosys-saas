import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSettings } from "@/components/AdminSettings";
import { SellerSettings } from "@/components/SellerSettings";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SELLER") {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const { settings: t, adminSettings } = dicts;

  const isAdmin = role === "ADMIN";

  if (isAdmin) {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" }
    });

    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t.title}</h2>
          <p className="text-zinc-400 mt-1">{t.desc}</p>
        </div>

        <AdminSettings t={adminSettings} users={users} currentUserId={(session.user as any).id} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">ຕັ້ງຄ່າຮ້ານຄ້າ (Store Settings)</h2>
        <p className="text-zinc-400 mt-1">ຈັດການຂໍ້ມູນຮ້ານຄ້າ, ລະບົບຮັບເງິນ ແລະ ລະບົບແຈ້ງເຕືອນຍອດຂາຍ.</p>
      </div>

      <SellerSettings t={dicts} />
    </div>
  );
}
