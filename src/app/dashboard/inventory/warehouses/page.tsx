import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WarehousesClient } from "./WarehousesClient";
import { Package } from "lucide-react";

export default async function WarehousesPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { stock: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
          <Package size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ສາງສິນຄ້າ (Warehouses)</h1>
          <p className="text-sm text-zinc-400">ຈັດການສະຖານທີ່ເກັບສິນຄ້າ ແລະ ສາງຕ່າງໆ</p>
        </div>
      </div>

      <WarehousesClient initialWarehouses={warehouses} />
    </div>
  );
}
