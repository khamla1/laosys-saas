import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findEquipment, syncEquipmentStock } from "@/lib/rental-sync";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, fineAmount } = body;

    const existing = await prisma.rentalOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rental order not found" }, { status: 404 });
    }

    const organizationId = existing.organizationId;
    const userObj = session.user as any;
    const isReturningNow = status === "RETURNED" && existing.status !== "RETURNED";

    const rental = await prisma.rentalOrder.update({
      where: { id },
      data: { 
        status: status !== undefined ? status : existing.status,
        ...(fineAmount !== undefined ? { fineAmount: Number(fineAmount) } : {}),
        ...(status === "RETURNED" ? { returnDate: new Date() } : {})
      },
    });

    const equipment = await findEquipment(organizationId, rental.equipmentId || existing.equipmentId, rental.itemName || existing.itemName);
    if (equipment) {
      if (!rental.equipmentId) {
        await prisma.rentalOrder.update({ where: { id }, data: { equipmentId: equipment.id } });
      }

      await syncEquipmentStock(equipment.id, organizationId, {
        userObj,
        action: isReturningNow ? "RENTAL_RETURN" : "STATUS_UPDATE",
        note: isReturningNow
          ? `ຮັບຄືນອຸປະກອນຈາກ "${existing.customerName}" ຈຳນວນ ${rental.quantity} ຊິ້ນ`
          : `ອັບເດດສະຖານະບິນເຊົ່າ #${id.slice(-6).toUpperCase()}`,
        quantity: rental.quantity
      });
    }

    return NextResponse.json(rental);
  } catch (error) {
    console.error("[RENTALS_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
