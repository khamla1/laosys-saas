import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { JournalsClient } from "./JournalsClient";
import prisma from "@/lib/prisma";

export default async function JournalsPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  const journals = await prisma.journalEntry.findMany({
    where: { organizationId },
    include: {
      lines: {
        include: { account: true }
      }
    },
    orderBy: { date: "desc" }
  });

  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId },
    orderBy: { code: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ສະໝຸດລາຍວັນ (Journal Entries)</h1>
          <p className="text-sm text-zinc-400">ບັນທຶກລາຍການບັນຊີຄູ່ (Double-Entry Ledger)</p>
        </div>
      </div>

      <JournalsClient initialJournals={journals as any} accounts={accounts as any} />
    </div>
  );
}
