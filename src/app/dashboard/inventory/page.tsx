import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InventoryDashboardClient } from "@/components/inventory/InventoryDashboardClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <InventoryDashboardClient />;
}

