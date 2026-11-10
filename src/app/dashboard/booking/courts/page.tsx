import { redirect } from "next/navigation";

export default function LegacyCourtsRedirectPage() {
  redirect("/dashboard/facilities/book");
}
