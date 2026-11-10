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

    const items = await prisma.equipmentItem.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    
    const body = await req.json();
    const { 
      equipmentCode, name, type, image, description, stockQuantity, 
      rentalPrice, depositPrice, status, productId, retailPrice, barcode 
    } = body;

    if (!equipmentCode?.trim() || !name?.trim() || !type?.trim()) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນລະຫັດ, ຊື່ອຸປະກອນ ແລະ ປະເພດໃຫ້ຄົບຖ້ວນ" }, { status: 400 });
    }

    const totalQty = Number(stockQuantity) || 1;
    const initialStatus = status || "AVAILABLE";
    const userObj = session.user as any;

    const initialHistory = [
      {
        id: `hist-${Date.now()}`,
        action: "CREATE_EQUIPMENT",
        fromStatus: "-",
        toStatus: initialStatus,
        quantity: totalQty,
        note: "ເພີ່ມອຸປະກອນໃໝ່ເຂົ້າຄັງ",
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || userObj.orgRole || "STAFF"
        },
        changedAt: new Date().toISOString()
      }
    ];

    const newItem = await prisma.equipmentItem.create({
      data: {
        equipmentCode: equipmentCode.trim(),
        name: name.trim(),
        type: type.trim(),
        image: image?.trim() || null,
        description: description?.trim() || null,
        stockQuantity: totalQty,
        availableQuantity: initialStatus === "AVAILABLE" ? totalQty : 0,
        maintenanceQuantity: initialStatus === "MAINTENANCE" ? totalQty : 0,
        rentedQuantity: initialStatus === "RENTED" ? totalQty : 0,
        statusHistory: initialHistory,
        rentalPrice: Number(rentalPrice) || 0,
        depositPrice: Number(depositPrice) || 0,
        retailPrice: retailPrice !== undefined && retailPrice !== null && retailPrice !== "" ? Number(retailPrice) : null,
        barcode: barcode?.trim() || null,
        productId: productId?.trim() || null,
        status: initialStatus,
        organizationId
      }
    });

    // Write to central AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "EQUIPMENT_CREATED",
          details: `${userObj.name || userObj.email} ໄດ້ເພີ່ມອຸປະກອນ "${name.trim()}" (ລະຫັດ: ${equipmentCode.trim()}, ຈຳນວນ: ${totalQty})`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            equipmentId: newItem.id,
            equipmentCode: newItem.equipmentCode,
            equipmentName: newItem.name,
            stockQuantity: totalQty,
            status: initialStatus
          }
        }
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    return NextResponse.json(newItem);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "ລະຫັດອຸປະກອນນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາໃຊ້ລະຫັດອື່ນ" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
