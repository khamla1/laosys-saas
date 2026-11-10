import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findEquipment, syncEquipmentStock } from "@/lib/rental-sync";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.rentalOrder.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      customerName, customerPhone, customerIDCard,
      itemName, quantity, rentDate, dueDate, returnDate,
      rentalFee, depositAmount, fineAmount, notes, status 
    } = body;

    const userObj = session.user as any;
    const targetStatus = status !== undefined ? status : existing.status;
    const isReturningNow = targetStatus === "RETURNED" && existing.status !== "RETURNED";
    const isRevertingReturn = targetStatus !== "RETURNED" && existing.status === "RETURNED";

    // 1. Update RentalOrder record in database
    const updated = await prisma.rentalOrder.update({
      where: { id },
      data: {
        customerName: customerName !== undefined ? customerName : existing.customerName,
        customerPhone: customerPhone !== undefined ? customerPhone : existing.customerPhone,
        customerIDCard: customerIDCard !== undefined ? customerIDCard : existing.customerIDCard,
        itemName: itemName !== undefined ? itemName : existing.itemName,
        quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
        rentDate: rentDate ? new Date(rentDate) : existing.rentDate,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        returnDate: returnDate !== undefined ? (returnDate ? new Date(returnDate) : null) : (isReturningNow ? new Date() : existing.returnDate),
        rentalFee: rentalFee !== undefined ? Number(rentalFee) : existing.rentalFee,
        depositAmount: depositAmount !== undefined ? Number(depositAmount) : existing.depositAmount,
        fineAmount: fineAmount !== undefined ? Number(fineAmount) : existing.fineAmount,
        notes: notes !== undefined ? notes : existing.notes,
        status: targetStatus,
      }
    });

    // 2. Synchronize equipment stock accurately
    const targetItemName = updated.itemName || existing.itemName;
    const equipment = await findEquipment(organizationId, updated.equipmentId || existing.equipmentId, targetItemName);

    if (equipment) {
      // If order didn't have equipmentId linked, link it now
      if (!updated.equipmentId) {
        await prisma.rentalOrder.update({
          where: { id },
          data: { equipmentId: equipment.id }
        });
      }

      let action = "STOCK_SYNC";
      let note = `ອັບເດດຂໍ້ມູນບິນເຊົ່າ #${id.slice(-6).toUpperCase()}`;

      if (isReturningNow) {
        action = "RENTAL_RETURN";
        note = `ຮັບຄືນອຸປະກອນຈາກ "${existing.customerName}" ຈຳນວນ ${updated.quantity} ຊິ້ນ (ຄ່າປັບໃໝ: ${Number(fineAmount || existing.fineAmount || 0).toLocaleString()} ₭)`;
      } else if (isRevertingReturn) {
        action = "RENTAL_REOPEN";
        note = `ຍົກເລີກການຮັບຄືນ / ເປີດບິນເຊົ່າຄືນໃໝ່ໃຫ້ "${existing.customerName}"`;
      }

      await syncEquipmentStock(equipment.id, organizationId, {
        userObj,
        action,
        note,
        quantity: updated.quantity
      });

      // AuditLog on return
      if (isReturningNow) {
        try {
          await prisma.auditLog.create({
            data: {
              action: "RENTAL_RETURNED",
              details: `${userObj.name || userObj.email} ໄດ້ຮັບຄືນອຸປະກອນ "${equipment.name}" ຈຳນວນ ${updated.quantity} ຊິ້ນ ຈາກ "${existing.customerName}"`,
              userId: userObj.id || null,
              organizationId,
              metadata: {
                equipmentId: equipment.id,
                equipmentName: equipment.name,
                customerName: existing.customerName,
                quantity: updated.quantity,
                fineAmount: Number(fineAmount || 0)
              }
            }
          });
        } catch (e) {
          console.error("AuditLog error:", e);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT rental error:", error);
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

    const existing = await prisma.rentalOrder.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const userObj = session.user as any;
    const equipment = await findEquipment(organizationId, existing.equipmentId, existing.itemName);

    await prisma.rentalOrder.delete({ where: { id } });

    if (equipment) {
      await syncEquipmentStock(equipment.id, organizationId, {
        userObj,
        action: "RENTAL_DELETED",
        note: `ລຶບບິນເຊົ່າຂອງ "${existing.customerName}" ຈຳນວນ ${existing.quantity} ຊິ້ນ, ຄືນຍອດສູ່ຄັງ`,
        quantity: existing.quantity
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
