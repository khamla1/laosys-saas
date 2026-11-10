import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const t = dicts.billing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      organizations: {
        take: 1,
        select: {
          organization: {
            select: {
              id: true,
              package: { select: { name: true } },
              subscriptionExpiresAt: true,
              subscriptionStatus: true,
            }
          }
        }
      }
    }
  });

  if (!user || user.organizations.length === 0) {
    redirect("/login");
  }

  const org = user.organizations[0].organization;
  const organizationId = org.id;

  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { paymentQrCode: true, paymentAccountInfo: true, promptPayId: true }
  });

  const productCount = await prisma.product.count({
    where: { organizationId }
  });

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const orderCount = await prisma.order.count({
    where: { organizationId, createdAt: { gte: startOfMonth } }
  });

  const staffCount = await prisma.userOrganization.count({
    where: { organizationId }
  });

  const currentPlanName = org.package?.name || "FREE";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">{t.title}</h1>
        <p className="text-zinc-400 mt-1">{t.desc}</p>
      </div>

      <BillingClient 
        plan={currentPlanName} 
        status={org.subscriptionStatus} 
        expiresAt={org.subscriptionExpiresAt} 
        productCount={productCount} 
        orderCount={orderCount}
        staffCount={staffCount}
        packages={packages}
        adminBankInfo={adminUser}
        t={t}
      />
    </div>
  );
}
