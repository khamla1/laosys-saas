import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Ticket } from "lucide-react";
import { InvoicesClient } from "./InvoicesClient";
import prisma from "@/lib/prisma";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Ticket size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ໃບແຈ້ງໜີ້ (Invoices)</h1>
          <p className="text-sm text-zinc-400">ຈັດການໃບແຈ້ງໜີ້ສຳລັບລູກຄ້າ ແລະ ຕິດຕາມສະຖານະການຊຳລະເງິນ</p>
        </div>
      </div>

      <InvoicesClient initialInvoices={invoices as any} />
    </div>
  );
}
