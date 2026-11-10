import { notifyDiscordSecurity, notifyDiscordAudit } from "@/lib/discord";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type AuditEntityType =
  | "ORDER"
  | "BILL"
  | "PRODUCT"
  | "STOCK"
  | "TABLE"
  | "SETTING"
  | "RENTAL"
  | "CUSTOMER"
  | "USER"
  | "AUTH"
  | "SECURITY";

export interface AuditLogPayload {
  action: string;
  entityType?: AuditEntityType;
  entityId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  details: string;
  metadata?: {
    refCode?: string;
    entityName?: string;
    amount?: number;
    customerName?: string;
    tableName?: string;
    oldData?: any;
    newData?: any;
    changes?: Record<string, { from: any; to: any }> | any[];
    reason?: string;
    ipAddress?: string | null;
    [key: string]: any;
  };
  ipAddress?: string | null;
}

/**
 * Universal Audit Logger: Records all modifications, creations, deletions,
 * payments, splits, merges, stock adjustments, and settings changes.
 */
export async function recordAuditLog(payload: AuditLogPayload): Promise<any> {
  try {
    let finalOrgId = payload.organizationId || null;
    let finalUserId = payload.userId || null;

    // If orgId or userId are missing, attempt to retrieve from session
    let sessionUser: any = null;
    if (!finalOrgId || !finalUserId) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          sessionUser = session.user as any;
          if (!finalUserId && sessionUser.id) finalUserId = sessionUser.id;
          if (!finalOrgId && (sessionUser.organizationId || sessionUser.id)) {
            finalOrgId = sessionUser.organizationId || sessionUser.id;
          }
        }
      } catch {
        // Ignored if called outside request context (e.g. background job)
      }
    }

    let operatorName = payload.metadata?.operatorName || sessionUser?.name || null;
    let operatorEmail = payload.metadata?.operatorEmail || sessionUser?.email || null;
    let operatorRole = payload.metadata?.operatorRole || sessionUser?.orgRole || sessionUser?.role || null;

    if (finalUserId && (!operatorName || !operatorRole)) {
      try {
        const userRec = await prisma.user.findUnique({
          where: { id: finalUserId },
          select: {
            name: true,
            email: true,
            role: true,
            organizations: finalOrgId
              ? {
                  where: { organizationId: finalOrgId },
                  select: { role: true },
                }
              : undefined,
          },
        });
        if (userRec) {
          if (!operatorName) operatorName = userRec.name || userRec.email;
          if (!operatorEmail) operatorEmail = userRec.email;
          if (!operatorRole) {
            operatorRole = userRec.organizations?.[0]?.role || userRec.role || "STAFF";
          }
        }
      } catch {
        // Ignored
      }
    }

    const entityType = payload.entityType || (payload.action.split("_")[0] as AuditEntityType) || "SYSTEM";
    const refCode = payload.metadata?.refCode || (payload.entityId ? `#${payload.entityId.slice(-6).toUpperCase()}` : undefined);

    const mergedMetadata: Record<string, any> = {
      entityType,
      entityId: payload.entityId || null,
      refCode,
      operatorName: operatorName || undefined,
      operatorEmail: operatorEmail || undefined,
      operatorRole: operatorRole || undefined,
      ...(payload.metadata || {}),
    };

    if (payload.ipAddress && !mergedMetadata.ipAddress) {
      mergedMetadata.ipAddress = payload.ipAddress;
    }

    const log = await prisma.auditLog.create({
      data: {
        action: payload.action,
        details: payload.details,
        ipAddress: payload.ipAddress || null,
        metadata: mergedMetadata,
        organizationId: finalOrgId,
        userId: finalUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // 🛡️ Asynchronous Discord notification for Security & System Audits
    try {
      const act = (payload.action || "").toUpperCase();
      if (
        act.includes("LOGIN") ||
        act.includes("AUTH") ||
        act.includes("LOGOUT") ||
        act.includes("LOCK") ||
        act.includes("PASSWORD") ||
        payload.entityType === "AUTH" ||
        payload.entityType === "SECURITY"
      ) {
        notifyDiscordSecurity({
          action: payload.action,
          details: payload.details,
          userName: operatorName || undefined,
          userEmail: operatorEmail || undefined,
          userRole: operatorRole || undefined,
          ipAddress: payload.ipAddress || mergedMetadata.ipAddress,
          status: act.includes("FAIL") || act.includes("LOCK") || act.includes("BLOCKED") ? "FAILED" : "SUCCESS",
        }).catch(() => {});
      } else {
        notifyDiscordAudit({
          action: payload.action,
          details: payload.details,
          entityType: payload.entityType || mergedMetadata.entityType,
          refCode: payload.metadata?.refCode || mergedMetadata.refCode,
          operatorName: operatorName || undefined,
          operatorRole: operatorRole || undefined,
          ipAddress: payload.ipAddress || mergedMetadata.ipAddress,
        }).catch(() => {});
      }
    } catch {
      // Ignored
    }

    return log;
  } catch (error) {
    // Non-blocking error handling: Never crash main transaction if audit logging encounters an issue
    console.error("[AUDIT_LOG_ERROR] Failed to record audit log:", error);
    return null;
  }
}

/**
 * Specialized helpers for common domain actions
 */
export async function logOrderAudit({
  orderId,
  organizationId,
  userId,
  action,
  details,
  amount,
  tableName,
  customerName,
  changes,
  reason,
  extraMeta,
}: {
  orderId: string;
  organizationId?: string;
  userId?: string;
  action: string;
  details: string;
  amount?: number;
  tableName?: string;
  customerName?: string;
  changes?: any;
  reason?: string;
  extraMeta?: Record<string, any>;
}) {
  return recordAuditLog({
    action,
    entityType: "ORDER",
    entityId: orderId,
    organizationId,
    userId,
    details,
    metadata: {
      refCode: `ORD-${orderId.slice(-6).toUpperCase()}`,
      amount,
      tableName,
      customerName,
      changes,
      reason,
      ...(extraMeta || {}),
    },
  });
}

export async function logProductAudit({
  productId,
  productName,
  organizationId,
  userId,
  action,
  details,
  oldPrice,
  newPrice,
  oldStock,
  newStock,
  reason,
  changes,
}: {
  productId: string;
  productName: string;
  organizationId?: string;
  userId?: string;
  action: string;
  details: string;
  oldPrice?: number;
  newPrice?: number;
  oldStock?: number;
  newStock?: number;
  reason?: string;
  changes?: any;
}) {
  return recordAuditLog({
    action,
    entityType: "PRODUCT",
    entityId: productId,
    organizationId,
    userId,
    details,
    metadata: {
      refCode: productName,
      entityName: productName,
      oldPrice,
      newPrice,
      oldStock,
      newStock,
      reason,
      changes,
    },
  });
}

export async function logTableAudit({
  tableId,
  tableName,
  organizationId,
  userId,
  action,
  details,
  fromTable,
  toTable,
  reason,
}: {
  tableId: string;
  tableName: string;
  organizationId?: string;
  userId?: string;
  action: string;
  details: string;
  fromTable?: string;
  toTable?: string;
  reason?: string;
}) {
  return recordAuditLog({
    action,
    entityType: "TABLE",
    entityId: tableId,
    organizationId,
    userId,
    details,
    metadata: {
      refCode: tableName,
      tableName,
      fromTable,
      toTable,
      reason,
    },
  });
}
