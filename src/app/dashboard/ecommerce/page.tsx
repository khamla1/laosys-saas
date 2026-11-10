import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EcommerceDashboardClient } from "@/components/ecommerce/EcommerceDashboardClient";

export default async function EcommercePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <EcommerceDashboardClient />;
}
