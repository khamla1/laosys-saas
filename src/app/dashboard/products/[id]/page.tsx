import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ProductDetailsClient } from "./ProductDetailsClient";
import VariantsClient from "./VariantsClient";

export default async function ProductDetailsPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const params = await props.params;
  const { id } = params;

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  // Fetch product
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product || product.status === "DELETED") {
    redirect("/dashboard/products/manage");
  }

  // Tenant Isolation check
  const organizationId = (session.user as any).organizationId;
  let storeId = organizationId;

  if (role !== "ADMIN" && !storeId) {
    redirect("/dashboard");
  }

  if (!isAdmin && product.organizationId !== storeId) {
    redirect("/dashboard/products/manage");
  }

  // 1. Fetch stock movements
  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    include: {
      user: {
        select: { name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // 2. Fetch audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      details: {
        contains: id
      }
    },
    include: {
      user: {
        select: { name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // 3. Normalize structures
  const normalizedAudit = auditLogs.map(log => {
    let message = "";
    let parsed: any = {};
    try {
      if (log.details) {
        parsed = JSON.parse(log.details);
        message = parsed.message || "";
      }
    } catch (e) {
      message = log.details || "";
    }

    if (!message) {
      message = `${log.action} action performed`;
    }

    let type = log.action;
    if (type === "REQUEST_DELETE") type = "DELETE_REQUEST";
    if (type === "APPROVE_DELETE") type = "ADMIN_APPROVE";
    if (type === "RESTORE_PRODUCT") type = "RESTORE";

    let actorType: "USER" | "ADMIN" | "SYSTEM" = "USER";
    if (log.user?.role === "ADMIN") {
      actorType = "ADMIN";
    } else if (!log.user) {
      actorType = "SYSTEM";
    }

    const actorName = log.user?.name || log.user?.email || "System";

    return {
      type,
      message,
      actorName,
      actorType,
      createdAt: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : log.createdAt.toISOString(),
    };
  });

  const normalizedStock = movements.map(mov => {
    let type = "";
    let message = "";
    const actorName = mov.user?.name || mov.user?.email || "System";
    
    if (mov.type === "ADD") {
      type = "ADD_STOCK";
      message = `User ${actorName} added ${mov.quantity} items to stock`;
    } else if (mov.type === "REMOVE") {
      type = "REMOVE_STOCK";
      message = `User ${actorName} removed ${Math.abs(mov.quantity)} items from stock`;
    } else if (mov.type === "SALE") {
      type = "SALE";
      message = `Sale of ${Math.abs(mov.quantity)} items completed`;
    } else if (mov.type === "ADJUST") {
      type = "ADJUST_STOCK";
      message = `User ${actorName} adjusted stock to ${mov.quantity}`;
    }

    if (mov.reason) {
      message += ` (${mov.reason})`;
    }

    let actorType: "USER" | "ADMIN" | "SYSTEM" = "USER";
    if (mov.type === "SALE" && !mov.user) {
      actorType = "SYSTEM";
    } else if (mov.user?.role === "ADMIN") {
      actorType = "ADMIN";
    } else if (!mov.user) {
      actorType = "SYSTEM";
    }

    return {
      type,
      message,
      actorName,
      actorType,
      createdAt: mov.createdAt.toISOString(),
    };
  });

  // 4. Merge and sort DESC
  const mergedEvents = [...normalizedAudit, ...normalizedStock];
  mergedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Serialize product dates
  const serializedProduct = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  // Serialize movements dates
  const serializedMovements = movements.map(mov => ({
    ...mov,
    createdAt: mov.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <ProductDetailsClient
        product={serializedProduct as any}
        movements={serializedMovements as any}
        timeline={mergedEvents}
        isAdmin={isAdmin}
      />
      <VariantsClient productId={product.id} />
    </div>
  );
}
