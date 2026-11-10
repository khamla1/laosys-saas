import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ProductCreatorStudioClient } from "@/components/ProductCreatorStudioClient";

export default async function CreateProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (role === "CASHIER") {
    redirect("/dashboard/pos");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);

  return <ProductCreatorStudioClient t={dicts.createProduct} />;
}
