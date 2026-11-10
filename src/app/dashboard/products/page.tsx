import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CatalogGridClient } from "@/components/CatalogGridClient";
import { StoreLinkButton } from "@/components/StoreLinkButton";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  const organizationId = (session.user as any).organizationId;
  let storeId = organizationId;
  if (role !== "ADMIN" && !storeId) {
    return null;
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const { products: t, productTable, createProduct, editProduct } = dicts;

  const whereClause = {
    status: "ACTIVE",
    ...(isAdmin ? {} : { organizationId: storeId })
  };

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      take: 20,
      include: {
        organization: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const sellers = isAdmin 
    ? await prisma.organization.findMany({ select: { id: true, name: true } })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{t.title}</h2>
          <p className="text-zinc-400 mt-1">{t.desc}</p>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-3">
          <StoreLinkButton storeId={userId} />
          <Link
            href="/dashboard/products/create"
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold gap-2 px-5 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ສູນສ້າງສິນຄ້າໃໝ່ (Create Product)</span>
          </Link>
        </div>
      </div>

      <CatalogGridClient 
        products={products as any[]} 
        initialTotal={totalProducts}
        t={productTable} 
        isAdmin={isAdmin}
        sellers={sellers}
      />
    </div>
  );
}
