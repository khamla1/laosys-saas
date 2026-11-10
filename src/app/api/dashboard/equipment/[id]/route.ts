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

    const existing = await prisma.equipmentItem.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const userObj = session.user as any;

    const currentTotal = body.stockQuantity !== undefined ? Number(body.stockQuantity) : existing.stockQuantity;
    let currentMaint = body.maintenanceQuantity !== undefined 
      ? Number(body.maintenanceQuantity) 
      : (existing.maintenanceQuantity ?? (existing.status === "MAINTENANCE" ? currentTotal : 0));
    let currentRented = body.rentedQuantity !== undefined 
      ? Number(body.rentedQuantity) 
      : (existing.rentedQuantity ?? (existing.status === "RENTED" ? currentTotal : 0));
    let currentAvail = body.availableQuantity !== undefined 
      ? Number(body.availableQuantity) 
      : Math.max(0, currentTotal - currentMaint - currentRented);

    // If a simple status toggle was sent
    let targetStatus = body.status ?? existing.status;
    if (body.action === "SEND_TO_MAINTENANCE") {
      const moveQty = Number(body.quantity) || 1;
      const actualMove = Math.min(currentAvail, moveQty);
      currentAvail = Math.max(0, currentAvail - actualMove);
      currentMaint = currentMaint + actualMove;
      targetStatus = currentAvail > 0 ? "AVAILABLE" : "MAINTENANCE";

      // Automatically create a RepairTicket in the Repair Center
      try {
        const now = new Date();
        const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const randPart = Math.floor(1000 + Math.random() * 9000);
        const ticketNumber = `REP-EQ-${datePart}-${randPart}`;
        const issueDesc = body.note?.trim() || "ອຸປະກອນຊຳລຸດ ນຳສົ່ງສ້ອມແປງ / ບຳລຸງຮັກສາ";

        await prisma.repairTicket.create({
          data: {
            ticketNumber,
            customerName: `ອຸປະກອນເຊົ່າ: ${existing.equipmentCode}`,
            customerPhone: userObj.phone || null,
            itemName: `${existing.name} [${existing.equipmentCode}]`,
            issueDesc,
            status: "PENDING",
            priority: "NORMAL",
            technicianName: "ຊ່າງສ້ອມອຸປະກອນກິລາ",
            estimatedCost: 0,
            actualCost: null,
            depositPaid: 0,
            partsUsed: null,
            statusHistory: [
              {
                id: `hist-${Date.now()}`,
                action: "EQUIPMENT_MAINTENANCE_CREATED",
                fromStatus: "-",
                toStatus: "PENDING",
                note: `ສົ່ງສ້ອມແປງຈາກຄັງອຸປະກອນໃຫ້ເຊົ່າ (ລະຫັດ: ${existing.equipmentCode}, ຈຳນວນ: ${actualMove} ຊິ້ນ)`,
                changedBy: {
                  id: userObj.id || null,
                  name: userObj.name || userObj.email || "Staff",
                  email: userObj.email || "",
                  role: userObj.role || userObj.orgRole || "STAFF"
                },
                changedAt: new Date().toISOString()
              }
            ],
            notes: JSON.stringify({
              source: "EQUIPMENT_MAINTENANCE",
              equipmentId: existing.id,
              equipmentCode: existing.equipmentCode,
              quantity: actualMove
            }),
            organizationId
          }
        });
      } catch (err) {
        console.error("Failed to auto-create repair ticket from equipment:", err);
      }
    } else if (body.action === "RETURN_FROM_MAINTENANCE") {
      const moveQty = Number(body.quantity) || 1;
      const actualMove = Math.min(currentMaint, moveQty);
      currentMaint = Math.max(0, currentMaint - actualMove);
      currentAvail = currentAvail + actualMove;
      targetStatus = "AVAILABLE";

      // If returning from maintenance, auto-complete open repair ticket for this equipment
      try {
        const openTickets = await prisma.repairTicket.findMany({
          where: {
            organizationId,
            status: { in: ["PENDING", "IN_PROGRESS", "WAITING_PARTS"] },
            itemName: { contains: existing.equipmentCode }
          },
          orderBy: { createdAt: "desc" },
          take: 1
        });

        if (openTickets.length > 0) {
          const t = openTickets[0];
          const hist = Array.isArray(t.statusHistory) ? (t.statusHistory as any[]) : [];
          await prisma.repairTicket.update({
            where: { id: t.id },
            data: {
              status: "COMPLETED",
              completionDate: new Date(),
              statusHistory: [
                {
                  id: `hist-${Date.now()}`,
                  action: "RETURNED_FROM_MAINTENANCE",
                  fromStatus: t.status,
                  toStatus: "COMPLETED",
                  note: `ຮັບອຸປະກອນຄືນສູ່ຄັງອຸປະກອນພ້ອມໃຫ້ເຊົ່າແລ້ວ (ຈຳນວນ: ${actualMove} ຊິ້ນ)`,
                  changedBy: {
                    id: userObj.id || null,
                    name: userObj.name || userObj.email || "Staff",
                    email: userObj.email || "",
                    role: userObj.role || userObj.orgRole || "STAFF"
                  },
                  changedAt: new Date().toISOString()
                },
                ...hist
              ]
            }
          });
        }
      } catch (err) {
        console.error("Failed to sync repair ticket on equipment return:", err);
      }
    } else if (body.status && body.status !== existing.status) {
      if (body.status === "MAINTENANCE") {
        currentMaint = currentTotal;
        currentAvail = 0;
      } else if (body.status === "AVAILABLE") {
        currentAvail = currentTotal;
        currentMaint = 0;
      } else if (body.status === "RENTED") {
        currentRented = currentTotal;
        currentAvail = 0;
      }
      targetStatus = body.status;
    }

    // Build history entry with WHO changed it
    const currentHistory = Array.isArray(existing.statusHistory) ? (existing.statusHistory as any[]) : [];
    const isStatusOrStockChanged = 
      targetStatus !== existing.status || 
      currentMaint !== (existing.maintenanceQuantity || 0) ||
      currentAvail !== (existing.availableQuantity || 0) ||
      body.action;

    let updatedHistory = currentHistory;
    if (isStatusOrStockChanged || body.note) {
      const historyEntry = {
        id: `hist-${Date.now()}`,
        action: body.action || "STATUS_CHANGE",
        fromStatus: existing.status,
        toStatus: targetStatus,
        quantity: body.quantity !== undefined ? Number(body.quantity) : currentTotal,
        availableUnits: currentAvail,
        maintenanceUnits: currentMaint,
        rentedUnits: currentRented,
        note: body.note?.trim() || `ປ່ຽນສະຖານະເປັນ ${targetStatus}`,
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || userObj.orgRole || "STAFF"
        },
        changedAt: new Date().toISOString()
      };
      updatedHistory = [historyEntry, ...currentHistory];

      // Write to global AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            action: body.action || "EQUIPMENT_STATUS_CHANGED",
            details: `${userObj.name || userObj.email} ໄດ້ປັບປຸງອຸປະກອນ "${existing.name}": ${historyEntry.note} (ສະຖານະ: ${targetStatus})`,
            userId: userObj.id || null,
            organizationId,
            metadata: {
              equipmentId: existing.id,
              equipmentCode: existing.equipmentCode,
              fromStatus: existing.status,
              toStatus: targetStatus,
              availableUnits: currentAvail,
              maintenanceUnits: currentMaint,
              quantity: historyEntry.quantity,
              note: historyEntry.note
            }
          }
        });
      } catch (e) {
        console.error("Audit log error:", e);
      }
    }

    const updated = await prisma.equipmentItem.update({
      where: { id },
      data: {
        equipmentCode: body.equipmentCode ?? existing.equipmentCode,
        name: body.name ?? existing.name,
        type: body.type ?? existing.type,
        image: body.image ?? existing.image,
        description: body.description ?? existing.description,
        stockQuantity: currentTotal,
        availableQuantity: currentAvail,
        maintenanceQuantity: currentMaint,
        rentedQuantity: currentRented,
        status: targetStatus,
        statusHistory: updatedHistory,
        rentalPrice: body.rentalPrice !== undefined ? Number(body.rentalPrice) : existing.rentalPrice,
        depositPrice: body.depositPrice !== undefined ? Number(body.depositPrice) : existing.depositPrice,
        retailPrice: body.retailPrice !== undefined ? (body.retailPrice !== null && body.retailPrice !== "" ? Number(body.retailPrice) : null) : existing.retailPrice,
        barcode: body.barcode !== undefined ? (body.barcode?.trim() || null) : existing.barcode,
        productId: body.productId !== undefined ? (body.productId?.trim() || null) : existing.productId,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "ລະຫັດອຸປະກອນນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາໃຊ້ລະຫັດອື່ນ" }, { status: 400 });
    }
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

    const existing = await prisma.equipmentItem.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const userObj = session.user as any;
    try {
      await prisma.auditLog.create({
        data: {
          action: "EQUIPMENT_DELETED",
          details: `${userObj.name || userObj.email} ໄດ້ລຶບອຸປະກອນ "${existing.name}" (ລະຫັດ: ${existing.equipmentCode}) ອອກຈາກລະບົບ`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            equipmentId: existing.id,
            equipmentCode: existing.equipmentCode,
            equipmentName: existing.name,
            stockQuantity: existing.stockQuantity
          }
        }
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    await prisma.equipmentItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
