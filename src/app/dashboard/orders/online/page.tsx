import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OnlineOrdersClient from "@/components/OnlineOrdersClient";

export default async function OnlineOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const organizationId = (session.user as any).organizationId;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const whereClause = !isAdmin ? { organizationId } : {};

  // fetch paginated orders for this organization, including items for the detail view
  const [orders, totalOrders, pendingCount, completedAgg] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        organization: {
          select: { id: true, name: true }
        }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20
    }),
    prisma.order.count({ where: whereClause }),
    prisma.order.count({ where: { ...whereClause, status: "PENDING" } }),
    prisma.order.aggregate({
      where: { ...whereClause, status: "COMPLETED" },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const sellers = isAdmin ? await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  }) : [];

  return (
    <OnlineOrdersClient
      initialOrders={orders}
      initialTotal={totalOrders}
      initialStats={{
        total: totalOrders,
        pending: pendingCount,
        completed: completedAgg._count.id || 0,
        revenue: completedAgg._sum.totalAmount || 0,
      }}
      isAdmin={isAdmin}
      sellers={sellers}
    />
  );
}
