import { redirect } from "next/navigation";

export default function FinesRentalPage() {
  redirect("/dashboard/rental/issue?tab=fines");
}
