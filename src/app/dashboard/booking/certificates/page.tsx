import { redirect } from "next/navigation";

export default function LegacyCertificatesRedirectPage() {
  redirect("/dashboard/clinic/certificates");
}
