import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { NewPOClient } from "./NewPOClient";
import { ClipboardList, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewPOPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId },
    orderBy: { name: "asc" }
  });

  const products = await prisma.product.findMany({
    where: { organizationId, status: "ACTIVE" },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory/purchase-orders" className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ສ້າງໃບສັ່ງຊື້ໃໝ່ <span className="text-purple-500">(New PO)</span>
          </h1>
          <p className="text-sm text-zinc-400">ເລືອກຜູ້ສະໜອງ ແລະ ເພີ່ມລາຍການສິນຄ້າທີ່ຕ້ອງການສັ່ງ</p>
        </div>
      </div>

      <NewPOClient suppliers={suppliers} products={products} />
    </div>
  );
}
