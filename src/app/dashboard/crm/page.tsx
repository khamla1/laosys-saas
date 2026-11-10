import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CrmDashboardClient } from "@/components/crm/CrmDashboardClient";

export default async function CRMPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <CrmDashboardClient />;
}

