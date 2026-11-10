import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CouponsDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Seamlessly redirect to the unified All-in-One Marketing Hub on the Coupons tab
  redirect("/dashboard/marketing/promotions?tab=coupons");
}
