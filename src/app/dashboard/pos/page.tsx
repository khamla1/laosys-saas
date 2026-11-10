import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cookies } from "next/headers";
import Link from "next/link";
import { POSClient } from "@/components/POSClient";
import { SplitMergeBillClient } from "@/components/restaurant/SplitMergeBillClient";
import { SplitSquareHorizontal } from "lucide-react";

export default async function POSPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.id) {
    redirect("/");
  }

  const userId = (session!.user as any).id;
  const organizationId = (session!.user as any).organizationId || userId;
  const sellerId = organizationId;

  if (!sellerId) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const t = dicts.pos;

  const [products, sellerSettings, organization] = await Promise.all([
    prisma.product.findMany({
      where: { 
        organizationId: sellerId,
        status: "ACTIVE"
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { paymentQrCode: true, promptPayId: true, paymentAccountInfo: true }
    }),
    organizationId ? prisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true }
    }) : Promise.resolve(null)
  ]);

  const orgPayment = (organization?.metadata as any)?.payment;
  
  const finalPromptPayId = orgPayment?.promptPayId || sellerSettings?.promptPayId;
  const finalPaymentAccountInfo = orgPayment?.paymentAccountInfo || sellerSettings?.paymentAccountInfo;
  const finalPaymentQrCode = sellerSettings?.paymentQrCode;

  // Handle action=split for Split/Merge Bill workflow
  const action = searchParams?.action as string | undefined;

  if (action === "split") {
    redirect("/dashboard/restaurant/split-merge");
  }

  // Handle Table ID for Dine-in
  const tableId = searchParams?.tableId as string | undefined;
  let activeTable = null;
  
  const [activeTableData, allZones] = await Promise.all([
    tableId ? prisma.table.findUnique({
      where: { id: tableId, zone: { organizationId: sellerId } },
      include: {
        zone: true,
        orders: {
          where: { status: "PENDING" },
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    }) : Promise.resolve(null),
    prisma.zone.findMany({
      where: { organizationId: sellerId },
      include: {
        tables: {
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    })
  ]);

  activeTable = activeTableData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {activeTable ? `${t.title} - ${activeTable.name}` : t.title}
            </h1>
            {activeTable && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {activeTable.zone?.name ? `ໂຊນ ${activeTable.zone.name} - ໂຕ໊ະ ${activeTable.name}` : `ໂຕ໊ະ ${activeTable.name}`}
              </span>
            )}
          </div>
          <p className="text-zinc-400 mt-1">{t.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/restaurant/zones"
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition-all inline-flex items-center gap-1.5"
          >
            <span>ໂຊນ ແລະ ໂຕ໊ະ (Zones & Tables)</span>
          </Link>
          <Link
            href="/dashboard/restaurant/split-merge"
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 border border-purple-400/40 transition-all inline-flex items-center gap-1.5"
          >
            <SplitSquareHorizontal className="w-4 h-4 text-purple-200" />
            <span>ແຍກບິນ / ລວມບິນ (Split & Merge)</span>
          </Link>
        </div>
      </div>

      <POSClient 
        products={products as any[]} 
        t={t} 
        sellerId={sellerId} 
        paymentQrCode={finalPaymentQrCode ?? undefined}
        promptPayId={finalPromptPayId ?? undefined}
        paymentAccountInfo={finalPaymentAccountInfo ?? undefined}
        activeTable={activeTable}
        allZones={allZones as any[]}
      />
    </div>
  );
}
