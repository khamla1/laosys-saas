import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { POClient } from "./POClient";
import { ClipboardList } from "lucide-react";

export default async function PurchaseOrdersPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  const pos = await prisma.purchaseOrder.findMany({
    where: { organizationId },
    include: {
      supplier: true,
      items: { include: { product: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ໃບສັ່ງຊື້ (Purchase Orders)</h1>
          <p className="text-sm text-zinc-400">ຈັດການໃບສັ່ງຊື້ ແລະ ນຳເຂົ້າສິນຄ້າສູ່ຄັງ</p>
        </div>
      </div>

      <POClient initialPOs={pos as any} warehouses={warehouses as any} />
    </div>
  );
}
