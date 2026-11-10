import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const records = await prisma.warrantyRecord.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { 
      warrantyNo: customNo, 
      customerName, 
      customerPhone,
      productName, 
      category,
      serialNumber, 
      purchaseDate, 
      warrantyPeriodMonths,
      expiryDate, 
      status,
      termsAndConditions,
      notes
    } = body;

    if (!customerName?.trim() || !productName?.trim() || !purchaseDate) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຊື່ລູກຄ້າ, ຊື່ສິນຄ້າ ແລະ ວັນທີຊື້ໃຫ້ຄົບຖ້ວນ" }, { status: 400 });
    }

    const userObj = session.user as any;

    // Generate unique warranty number: WN-YYYYMMDD-XXXX
    let warrantyNo = customNo?.trim();
    if (!warrantyNo) {
      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const randPart = Math.floor(1000 + Math.random() * 9000);
      warrantyNo = `WN-${datePart}-${randPart}`;
    }

    const existing = await prisma.warrantyRecord.findUnique({ where: { warrantyNo } });
    if (existing) {
      return NextResponse.json({ error: `ເລກທີບັດຮັບປະກັນ "${warrantyNo}" ມີໃນລະບົບແລ້ວ` }, { status: 400 });
    }

    // Auto-calculate expiryDate if not provided
    const periodMonths = Number(warrantyPeriodMonths) || 12;
    let finalExpiry = expiryDate ? new Date(expiryDate) : null;
    if (!finalExpiry || isNaN(finalExpiry.getTime())) {
      const pDate = new Date(purchaseDate);
      finalExpiry = new Date(pDate.setMonth(pDate.getMonth() + periodMonths));
    }

    const initialStatus = status || (finalExpiry < new Date() ? "EXPIRED" : "ACTIVE");

    const initialHistory = [
      {
        id: `hist-${Date.now()}`,
        action: "WARRANTY_CREATED",
        fromStatus: "-",
        toStatus: initialStatus,
        note: `ລົງທະບຽນຮັບປະກັນສິນຄ້າ: ${productName.trim()} (ໄລຍະເວລາ ${periodMonths} ເດືອນ)`,
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || userObj.orgRole || "STAFF"
        },
        changedAt: new Date().toISOString()
      }
    ];

    const record = await prisma.warrantyRecord.create({
      data: {
        warrantyNo,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        productName: productName.trim(),
        category: category?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        purchaseDate: new Date(purchaseDate),
        warrantyPeriodMonths: periodMonths,
        expiryDate: finalExpiry,
        status: initialStatus,
        claimHistory: [],
        statusHistory: initialHistory,
        termsAndConditions: termsAndConditions?.trim() || null,
        notes: notes?.trim() || null,
        organizationId
      }
    });

    // Write to central AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "WARRANTY_REGISTERED",
          details: `${userObj.name || userObj.email} ໄດ້ລົງທະບຽນບັດຮັບປະກັນ "${warrantyNo}" ສຳລັບ "${productName.trim()}" (ລູກຄ້າ: ${customerName.trim()})`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            warrantyId: record.id,
            warrantyNo,
            customerName: record.customerName,
            productName: record.productName,
            expiryDate: finalExpiry
          }
        }
      });
    } catch (e) {
      console.error("AuditLog error:", e);
    }

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
