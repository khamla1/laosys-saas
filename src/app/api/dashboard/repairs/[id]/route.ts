import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userObj = session.user as any;
    let organizationId = userObj.organizationId;
    if (!organizationId) {
      const userOrg = await prisma.userOrganization.findFirst({
        where: { userId: userObj.id }
      });
      organizationId = userOrg?.organizationId || null;
    }
    if (!organizationId && (userObj.role === "ADMIN" || userObj.role === "SUPER_ADMIN")) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id || null;
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.repairTicket.findUnique({ where: { id } });
    if (!existing || (organizationId && existing.organizationId !== organizationId)) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();

    const targetStatus = body.status !== undefined ? body.status : existing.status;
    const targetTechnician = body.technicianName !== undefined ? body.technicianName : existing.technicianName;
    const targetActualCost = body.actualCost !== undefined && body.actualCost !== "" ? Number(body.actualCost) : existing.actualCost;

    const isStatusChanged = targetStatus !== existing.status;
    const isTechChanged = targetTechnician !== existing.technicianName;
    const isCostChanged = targetActualCost !== existing.actualCost;

    let updatedHistory = Array.isArray(existing.statusHistory) ? (existing.statusHistory as any[]) : [];

    if (isStatusChanged || isTechChanged || isCostChanged || body.actionNote) {
      const historyEntry = {
        id: `hist-${Date.now()}`,
        action: body.action || (isStatusChanged ? "STATUS_CHANGE" : "TICKET_UPDATED"),
        fromStatus: existing.status,
        toStatus: targetStatus,
        note: body.actionNote?.trim() || (isStatusChanged ? `ປ່ຽນສະຖານະເປັນ ${targetStatus}` : "ອັບເດດຂໍ້ມູນໃບສ້ອມແປງ"),
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || userObj.orgRole || "STAFF"
        },
        changedAt: new Date().toISOString()
      };
      updatedHistory = [historyEntry, ...updatedHistory];

      // AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            action: isStatusChanged ? "REPAIR_STATUS_CHANGED" : "REPAIR_TICKET_UPDATED",
            details: `${userObj.name || userObj.email} ໄດ້ປັບປຸງໃບສ້ອມແປງ "${existing.ticketNumber}" (${existing.itemName}): ${historyEntry.note}`,
            userId: userObj.id || null,
            organizationId: organizationId || existing.organizationId,
            metadata: {
              ticketId: existing.id,
              ticketNumber: existing.ticketNumber,
              fromStatus: existing.status,
              toStatus: targetStatus,
              technicianName: targetTechnician
            }
          }
        });
      } catch (e) {
        console.error("AuditLog error:", e);
      }
    }

    // If ticket is completed, delivered or cancelled, check if it was linked to an equipment item
    if (["COMPLETED", "DELIVERED", "CANCELLED"].includes(targetStatus) && targetStatus !== existing.status) {
      try {
        let equipmentId: string | null = null;
        let returnQty = 1;
        if (existing.notes) {
          try {
            const parsed = JSON.parse(existing.notes);
            if (parsed.equipmentId) {
              equipmentId = parsed.equipmentId;
              returnQty = Number(parsed.quantity) || 1;
            }
          } catch {}
        }

        // If not in notes, search by equipment code in [EQ-...] in itemName
        if (!equipmentId && existing.itemName) {
          const match = existing.itemName.match(/\[(EQ-[^\]]+)\]/);
          if (match && match[1]) {
            const found = await prisma.equipmentItem.findFirst({
              where: { equipmentCode: match[1] }
            });
            if (found) equipmentId = found.id;
          }
        }

        if (equipmentId) {
          const equip = await prisma.equipmentItem.findUnique({ where: { id: equipmentId } });
          if (equip && equip.maintenanceQuantity > 0) {
            const actualReturn = Math.min(equip.maintenanceQuantity, returnQty);
            const newMaint = Math.max(0, equip.maintenanceQuantity - actualReturn);
            const newAvail = equip.availableQuantity + actualReturn;
            const newStatus = "AVAILABLE";

            const equipHist = Array.isArray(equip.statusHistory) ? (equip.statusHistory as any[]) : [];
            await prisma.equipmentItem.update({
              where: { id: equipmentId },
              data: {
                maintenanceQuantity: newMaint,
                availableQuantity: newAvail,
                status: newStatus,
                statusHistory: [
                  {
                    id: `hist-${Date.now()}`,
                    action: targetStatus === "CANCELLED" ? "MAINTENANCE_CANCELLED" : "MAINTENANCE_COMPLETED",
                    fromStatus: equip.status,
                    toStatus: newStatus,
                    quantity: actualReturn,
                    availableUnits: newAvail,
                    maintenanceUnits: newMaint,
                    note: `ສຳເລັດການສ້ອມແປງຈາກໃບສ້ອມແປງ ${existing.ticketNumber} (ສະຖານະ: ${targetStatus})`,
                    changedBy: {
                      id: userObj.id || null,
                      name: userObj.name || userObj.email || "Staff",
                      email: userObj.email || "",
                      role: userObj.role || userObj.orgRole || "STAFF"
                    },
                    changedAt: new Date().toISOString()
                  },
                  ...equipHist
                ]
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync equipment from ticket status change:", err);
      }
    }

    const updated = await prisma.repairTicket.update({
      where: { id },
      data: {
        customerName: body.customerName !== undefined ? body.customerName.trim() : existing.customerName,
        customerPhone: body.customerPhone !== undefined ? (body.customerPhone?.trim() || null) : existing.customerPhone,
        itemName: body.itemName !== undefined ? body.itemName.trim() : existing.itemName,
        issueDesc: body.issueDesc !== undefined ? body.issueDesc.trim() : existing.issueDesc,
        status: targetStatus,
        priority: body.priority !== undefined ? body.priority : existing.priority,
        technicianName: targetTechnician,
        estimatedCost: body.estimatedCost !== undefined && body.estimatedCost !== "" ? Number(body.estimatedCost) : existing.estimatedCost,
        actualCost: targetActualCost,
        depositPaid: body.depositPaid !== undefined && body.depositPaid !== "" ? Number(body.depositPaid) : existing.depositPaid,
        partsUsed: body.partsUsed !== undefined ? body.partsUsed : existing.partsUsed,
        statusHistory: updatedHistory,
        notes: body.notes !== undefined ? (body.notes?.trim() || null) : existing.notes,
        completionDate: body.completionDate !== undefined 
          ? (body.completionDate ? new Date(body.completionDate) : null) 
          : (targetStatus === "COMPLETED" || targetStatus === "DELIVERED" ? (existing.completionDate || new Date()) : existing.completionDate)
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

    const userObj = session.user as any;
    let organizationId = userObj.organizationId;
    if (!organizationId) {
      const userOrg = await prisma.userOrganization.findFirst({
        where: { userId: userObj.id }
      });
      organizationId = userOrg?.organizationId || null;
    }
    if (!organizationId && (userObj.role === "ADMIN" || userObj.role === "SUPER_ADMIN")) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id || null;
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.repairTicket.findUnique({ where: { id } });
    if (!existing || (organizationId && existing.organizationId !== organizationId)) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.repairTicket.delete({ where: { id } });

    // Write to AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "REPAIR_TICKET_DELETED",
          details: `${userObj.name || userObj.email} ໄດ້ລຶບໃບສ້ອມແປງ "${existing.ticketNumber}" (${existing.itemName})`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            ticketNumber: existing.ticketNumber,
            customerName: existing.customerName,
            itemName: existing.itemName
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
