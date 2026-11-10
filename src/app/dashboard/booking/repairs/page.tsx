import { redirect } from "next/navigation";

export default function LegacyRepairsRedirectPage() {
  redirect("/dashboard/repairs/tickets");
}
