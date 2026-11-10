import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const ticket = await prisma.repairTicket.findUnique({ where: { id } });
    if (!ticket || (organizationId && ticket.organizationId !== organizationId)) {
      return NextResponse.json({ error: "Repair ticket not found" }, { status: 404 });
    }

    // Check if this ticket was ALREADY converted to an Order to prevent duplicate billing
    let existingOrderId: string | null = null;
    let parsedNotes: any = {};
    if (ticket.notes) {
      try {
        parsedNotes = JSON.parse(ticket.notes);
        if (parsedNotes.convertedOrderId) {
          existingOrderId = parsedNotes.convertedOrderId;
        }
      } catch {}
    }

    if (!existingOrderId) {
      const hist = Array.isArray(ticket.statusHistory) ? (ticket.statusHistory as any[]) : [];
      const orderEntry = hist.find((h: any) => h.action === "CONVERTED_TO_ORDER" || h.orderId);
      if (orderEntry?.orderId) {
        existingOrderId = orderEntry.orderId;
      }
    }

    if (!existingOrderId) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          organizationId: ticket.organizationId,
          customerNote: { contains: ticket.ticketNumber }
        }
      });
      if (existingOrder) {
        existingOrderId = existingOrder.id;
      }
    }

    if (existingOrderId) {
      return NextResponse.json(
        {
          error: `ໃບສ້ອມແປງ #${ticket.ticketNumber} ນີ້ໄດ້ອອກບິນຂາຍຮຽບຮ້ອຍແລ້ວ ບໍ່ສາມາດອອກບິນຊ້ຳຊ້ອນໄດ້`,
          orderId: existingOrderId,
          alreadyConverted: true
        },
        { status: 400 }
      );
    }

    const totalAmount = Number(ticket.actualCost || ticket.estimatedCost || 0);
    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "ກະລຸນາກຳນົດຄ່າສ້ອມແປງຕົວຈິງ (Actual Cost) ຫຼາຍກວ່າ 0 ກ່ອນອອກບິນ" },
        { status: 400 }
      );
    }

    // 1. Create Sales Order
    const order = await prisma.order.create({
      data: {
        organizationId: ticket.organizationId,
        customerName: ticket.customerName || "ລູກຄ້າສ້ອມແປງ",
        customerPhone: ticket.customerPhone || null,
        totalAmount,
        status: "PAID",
        paymentMethod: "CASH",
        customerNote: `ໃບສ້ອມແປງ #${ticket.ticketNumber} (${ticket.itemName}) - ອາການ: ${ticket.issueDesc}`,
        metadata: {
          source: "REPAIR_TICKET",
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          itemCount: 1,
          itemName: ticket.itemName
        }
      },
    });

    // 2. Update Repair Ticket status to DELIVERED and persist convertedOrderId
    let history = Array.isArray(ticket.statusHistory) ? (ticket.statusHistory as any[]) : [];
    const historyEntry = {
      id: `hist-${Date.now()}`,
      action: "CONVERTED_TO_ORDER",
      orderId: order.id,
      fromStatus: ticket.status,
      toStatus: "DELIVERED",
      note: `ອອກບິນຂາຍ ແລະ ບັນທຶກລາຍຮັບຮຽບຮ້ອຍ (Order ID: #${order.id.slice(-6).toUpperCase()})`,
      changedBy: {
        id: userObj.id || null,
        name: userObj.name || userObj.email || "Staff",
        email: userObj.email || "",
        role: userObj.role || userObj.orgRole || "STAFF",
      },
      changedAt: new Date().toISOString(),
    };

    parsedNotes.convertedOrderId = order.id;
    parsedNotes.convertedOrderNumber = order.id.slice(-6).toUpperCase();
    parsedNotes.convertedAt = new Date().toISOString();

    await prisma.repairTicket.update({
      where: { id },
      data: {
        status: "DELIVERED",
        completionDate: ticket.completionDate || new Date(),
        notes: JSON.stringify(parsedNotes),
        statusHistory: [historyEntry, ...history],
      },
    });

    // If linked to equipment, return from maintenance
    if (parsedNotes.equipmentId) {
      try {
        const equip = await prisma.equipmentItem.findUnique({ where: { id: parsedNotes.equipmentId } });
        if (equip && equip.maintenanceQuantity > 0) {
          const retQty = Number(parsedNotes.quantity) || 1;
          const actualRet = Math.min(equip.maintenanceQuantity, retQty);
          await prisma.equipmentItem.update({
            where: { id: equip.id },
            data: {
              maintenanceQuantity: Math.max(0, equip.maintenanceQuantity - actualRet),
              availableQuantity: equip.availableQuantity + actualRet,
              status: "AVAILABLE"
            }
          });
        }
      } catch (err) {
        console.error("Failed to return equipment on order convert:", err);
      }
    }

    // 3. Auto-award Loyalty Points
    const awardedPoints = Math.floor(totalAmount / 10000);
    if (awardedPoints > 0 && ticket.customerName) {
      const existingLoyalty = await prisma.loyaltyReward.findFirst({
        where: { organizationId, customerName: ticket.customerName },
      });
      if (existingLoyalty) {
        const nextPoints = existingLoyalty.points + awardedPoints;
        const nextTier = nextPoints >= 500 ? "GOLD" : nextPoints >= 200 ? "SILVER" : "BRONZE";
        await prisma.loyaltyReward.update({
          where: { id: existingLoyalty.id },
          data: { points: nextPoints, tier: nextTier },
        });
      } else {
        const nextTier = awardedPoints >= 500 ? "GOLD" : awardedPoints >= 200 ? "SILVER" : "BRONZE";
        await prisma.loyaltyReward.create({
          data: {
            organizationId,
            customerName: ticket.customerName,
            points: awardedPoints,
            tier: nextTier,
          },
        });
      }
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
