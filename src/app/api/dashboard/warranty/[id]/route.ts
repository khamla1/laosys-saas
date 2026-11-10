import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.warrantyRecord.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const userObj = session.user as any;

    const targetStatus = body.status !== undefined ? body.status : existing.status;
    const isStatusChanged = targetStatus !== existing.status;

    let updatedClaimHistory = Array.isArray(existing.claimHistory) ? (existing.claimHistory as any[]) : [];
    if (body.newClaim) {
      const claimEntry = {
        id: `claim-${Date.now()}`,
        claimDate: new Date().toISOString(),
        issue: body.newClaim.issue?.trim() || "ແຈ້ງເຄລມສິນຄ້າ",
        resolution: body.newClaim.resolution?.trim() || "ກຳລັງກວດສອບ",
        status: body.newClaim.status || "IN_PROGRESS",
        cost: Number(body.newClaim.cost) || 0,
        handledBy: userObj.name || userObj.email || "Staff",
        notes: body.newClaim.notes?.trim() || null
      };
      updatedClaimHistory = [claimEntry, ...updatedClaimHistory];
    }

    let updatedStatusHistory = Array.isArray(existing.statusHistory) ? (existing.statusHistory as any[]) : [];
    if (isStatusChanged || body.newClaim || body.actionNote) {
      const historyEntry = {
        id: `hist-${Date.now()}`,
        action: body.action || (body.newClaim ? "CLAIM_FILED" : (isStatusChanged ? "STATUS_CHANGED" : "WARRANTY_UPDATED")),
        fromStatus: existing.status,
        toStatus: targetStatus,
        note: body.actionNote?.trim() || (body.newClaim ? `ແຈ້ງເຄລມ: ${body.newClaim.issue}` : `ປ່ຽນສະຖານະເປັນ ${targetStatus}`),
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || userObj.orgRole || "STAFF"
        },
        changedAt: new Date().toISOString()
      };
      updatedStatusHistory = [historyEntry, ...updatedStatusHistory];

      // AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            action: body.newClaim ? "WARRANTY_CLAIM_FILED" : "WARRANTY_STATUS_CHANGED",
            details: `${userObj.name || userObj.email} ໄດ້ອັບເດດບັດຮັບປະກັນ "${existing.warrantyNo}" (${existing.productName}): ${historyEntry.note}`,
            userId: userObj.id || null,
            organizationId,
            metadata: {
              warrantyId: existing.id,
              warrantyNo: existing.warrantyNo,
              customerName: existing.customerName,
              status: targetStatus
            }
          }
        });
      } catch (e) {
        console.error("AuditLog error:", e);
      }
    }

    const updated = await prisma.warrantyRecord.update({
      where: { id },
      data: {
        customerName: body.customerName !== undefined ? body.customerName.trim() : existing.customerName,
        customerPhone: body.customerPhone !== undefined ? (body.customerPhone?.trim() || null) : existing.customerPhone,
        productName: body.productName !== undefined ? body.productName.trim() : existing.productName,
        category: body.category !== undefined ? body.category : existing.category,
        serialNumber: body.serialNumber !== undefined ? (body.serialNumber?.trim() || null) : existing.serialNumber,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate,
        warrantyPeriodMonths: body.warrantyPeriodMonths !== undefined ? Number(body.warrantyPeriodMonths) : existing.warrantyPeriodMonths,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : existing.expiryDate,
        status: targetStatus,
        claimHistory: updatedClaimHistory,
        statusHistory: updatedStatusHistory,
        termsAndConditions: body.termsAndConditions !== undefined ? (body.termsAndConditions?.trim() || null) : existing.termsAndConditions,
        notes: body.notes !== undefined ? (body.notes?.trim() || null) : existing.notes
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.warrantyRecord.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const userObj = session.user as any;

    await prisma.warrantyRecord.delete({ where: { id } });

    // Write to AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "WARRANTY_DELETED",
          details: `${userObj.name || userObj.email} ໄດ້ລຶບບັດຮັບປະກັນ "${existing.warrantyNo}" (${existing.productName}) ຂອງ "${existing.customerName}"`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            warrantyNo: existing.warrantyNo,
            customerName: existing.customerName,
            productName: existing.productName
          }
        }
      });
    } catch (e) {
      console.error("AuditLog error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
