import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookUser } from "lucide-react";
import { COAClient } from "./COAClient";
import { headers } from "next/headers";

export default async function ChartOfAccountsPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  // Use absolute URL to call our own API to trigger the auto-seed if empty
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = (await headers()).get("host") || "localhost:3000";
  const res = await fetch(`${protocol}://${host}/api/accounting/accounts`, {
    headers: {
      cookie: (await headers()).get("cookie") || ""
    },
    cache: "no-store"
  });

  const accounts = res.ok ? await res.json() : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
          <BookUser size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ຜັງບັນຊີ (Chart of Accounts)</h1>
          <p className="text-sm text-zinc-400">ຈັດການໝວດໝູ່ບັນຊີສຳລັບລົງບັນຊີຄູ່</p>
        </div>
      </div>

      <COAClient initialAccounts={accounts} />
    </div>
  );
}
