import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    let organizationId = user.organizationId;
    if (!organizationId) {
      const userOrg = await prisma.userOrganization.findFirst({
        where: { userId: user.id }
      });
      organizationId = userOrg?.organizationId || null;
    }
    if (!organizationId && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id || null;
    }
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const tickets = await prisma.repairTicket.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    let organizationId = user.organizationId;
    if (!organizationId) {
      const userOrg = await prisma.userOrganization.findFirst({
        where: { userId: user.id }
      });
      organizationId = userOrg?.organizationId || null;
    }
    if (!organizationId && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id || null;
    }
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { 
      ticketNumber: customTicketNo,
      customerName, 
      customerPhone, 
      itemName, 
      issueDesc, 
      status,
      priority,
      technicianName,
      estimatedCost,
      actualCost,
      depositPaid,
      partsUsed,
      notes,
      completionDate
    } = body;

    if (!customerName?.trim() || !itemName?.trim() || !issueDesc?.trim()) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຊື່ລູກຄ້າ, ຊື່ອຸປະກອນ ແລະ ລາຍລະອຽດບັນຫາໃຫ້ຄົບຖ້ວນ" }, { status: 400 });
    }

    const userObj = session.user as any;
    
    // Generate clean ticket number if not provided: REP-YYYYMMDD-XXXX
    let ticketNumber = customTicketNo?.trim();
    if (!ticketNumber) {
      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const randPart = Math.floor(1000 + Math.random() * 9000);
      ticketNumber = `REP-${datePart}-${randPart}`;
    }

    const initialStatus = status || "PENDING";
    const initialHistory = [
      {
        id: `hist-${Date.now()}`,
        action: "TICKET_CREATED",
        fromStatus: "-",
        toStatus: initialStatus,
        note: `ເປີດໃບສ້ອມແປງໃໝ່: ${issueDesc.trim()}`,
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || userObj.orgRole || "STAFF"
        },
        changedAt: new Date().toISOString()
      }
    ];

    const ticket = await prisma.repairTicket.create({
      data: {
        ticketNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        itemName: itemName.trim(),
        issueDesc: issueDesc.trim(),
        status: initialStatus,
        priority: priority || "NORMAL",
        technicianName: technicianName?.trim() || null,
        estimatedCost: estimatedCost !== undefined && estimatedCost !== "" ? Number(estimatedCost) : null,
        actualCost: actualCost !== undefined && actualCost !== "" ? Number(actualCost) : null,
        depositPaid: depositPaid !== undefined && depositPaid !== "" ? Number(depositPaid) : 0,
        partsUsed: Array.isArray(partsUsed) ? partsUsed : null,
        statusHistory: initialHistory,
        notes: notes?.trim() || null,
        completionDate: completionDate ? new Date(completionDate) : null,
        organizationId
      }
    });

    // Write to central AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "REPAIR_TICKET_CREATED",
          details: `${userObj.name || userObj.email} ໄດ້ເປີດໃບສ້ອມແປງ "${ticketNumber}" ສຳລັບ "${itemName.trim()}" (ລູກຄ້າ: ${customerName.trim()})`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            ticketId: ticket.id,
            ticketNumber,
            customerName: ticket.customerName,
            itemName: ticket.itemName,
            status: initialStatus
          }
        }
      });
    } catch (e) {
      console.error("AuditLog error:", e);
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
