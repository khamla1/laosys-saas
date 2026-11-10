import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
import { NewInvoiceClient } from "./NewInvoiceClient";
import Link from "next/link";

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/accounting/invoices" className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ສ້າງໃບແຈ້ງໜີ້ <span className="text-blue-500">(New Invoice)</span>
          </h1>
          <p className="text-sm text-zinc-400">ສ້າງໃບແຈ້ງໜີ້ເພື່ອສົ່ງໃຫ້ລູກຄ້າ</p>
        </div>
      </div>

      <NewInvoiceClient />
    </div>
  );
}
