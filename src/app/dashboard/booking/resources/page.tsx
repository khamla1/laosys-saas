import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResourcesClient from "./ResourcesClient";

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">ຊັບພະຍາກອນ (Resources)</h1>
      <ResourcesClient />
    </div>
  );
}
