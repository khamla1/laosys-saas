import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PendingDeletesClient } from "./PendingDeletesClient";

export default async function AdminPendingDeletesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch both PENDING_DELETE and DELETED products
  const products = await prisma.product.findMany({
    where: {
      status: { in: ["PENDING_DELETE", "DELETED"] }
    },
    include: {
      organization: {
        select: { id: true, name: true }
      }
    },
    orderBy: { updatedAt: "desc" },
    // select all fields (no select: {} means all fields are returned)
  });

  // Fetch all related audit logs
  const logs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["REQUEST_DELETE", "APPROVE_DELETE", "RESTORE_PRODUCT"] }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PendingDeletesClient 
      initialProducts={products as any[]} 
      initialLogs={logs as any[]} 
    />
  );
}
