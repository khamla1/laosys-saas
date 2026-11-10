import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import { ProductTableClient } from "@/components/ProductTableClient";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { redirect } from "next/navigation";

export default async function ManageProductsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  const organizationId = (session.user as any).organizationId;
  let storeId = organizationId;
  if (role !== "ADMIN" && !storeId) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const { products: t, productTable, createProduct, editProduct } = dicts;

  const whereClause = {
    status: { not: "DELETED" },
    ...(isAdmin ? {} : { organizationId: storeId })
  };

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      take: 10,
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{t.addProduct || "ຈັດການສິນຄ້າ"}</h2>
          <p className="text-zinc-400 mt-1">{t.desc || "Manage your product inventory."}</p>
        </div>
        {role !== "CASHIER" && <div className="self-start sm:self-auto"><CreateProductDialog t={createProduct} /></div>}
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200">{t.catalog || "Product List"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductTableClient 
            products={products as any[]} 
            initialTotal={totalProducts}
            isAdmin={isAdmin} 
            userRole={role}
            t={productTable} 
            editDict={editProduct} 
            sellers={sellers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
