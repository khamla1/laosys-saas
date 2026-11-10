import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import StorefrontSettingsClient from "./StorefrontSettingsClient";

export default async function StorefrontSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4 max-w-7xl">
      <StorefrontSettingsClient />
    </div>
  );
}
