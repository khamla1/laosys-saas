import { redirect } from "next/navigation";

export default function OverdueRentalPage() {
  redirect("/dashboard/rental/issue?tab=overdue");
}
