import { redirect } from "next/navigation";

export default function QuotationsRedirectPage() {
  redirect("/dashboard/accounting/quotations");
}
