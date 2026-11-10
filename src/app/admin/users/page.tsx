import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import OrganizationsClient from "./OrganizationsClient";

export default async function AdminOrganizationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/dashboard");

  // Fetch Organizations & Account Requests in parallel
  const [orgs, accountRequests] = await Promise.all([
    prisma.organization.findMany({
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          }
        },
        members: {
          where: { role: "OWNER" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountRequest.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedOrgs = orgs.map(org => {
    const owner = org.members[0]?.user;
    const meta = (org.metadata as any) || {};
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      businessType: org.businessType,
      subscriptionExpiresAt: org.subscriptionExpiresAt ? org.subscriptionExpiresAt.toISOString() : null,
      enabledModules: org.enabledModules,
      createdAt: org.createdAt.toISOString(),
      productsCount: org._count.products,
      ordersCount: org._count.orders,
      ownerId: owner?.id || null,
      ownerName: owner?.name || owner?.email || "No Owner",
      ownerEmail: owner?.email || "—",
      ownerImage: owner?.image || null,
      address: meta.address || null,
      phone: meta.phone || null,
    };
  });

  const formattedRequests = accountRequests.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone || "—",
    address: r.address || "—",
    businessType: r.businessType || "GENERIC",
    status: r.status || "pending",
    createdAt: r.createdAt.toISOString(),
  }));

  return <OrganizationsClient initialOrgs={formattedOrgs} initialRequests={formattedRequests} />;
}
