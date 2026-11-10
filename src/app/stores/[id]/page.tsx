import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StorefrontClient } from "@/components/StorefrontClient";

export default async function StorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await prisma.organization.findUnique({
    where: { id: id },
  });

  if (!store) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { organizationId: store.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  return <StorefrontClient store={store as any} products={products as any} />;
}
