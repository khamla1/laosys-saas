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

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const booking = await prisma.facilityBooking.findUnique({ where: { id } });
    if (!booking || booking.organizationId !== organizationId) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { error: "ການຈອງນີ້ໄດ້ອອກບິນ ແລະ ສຳເລັດແລ້ວ (ຖືກຍ້າຍໄປເກັບໃນປະຫວັດແລ້ວ ບໍ່ສາມາດອອກບິນຊ້ຳໄດ້)" },
        { status: 400 }
      );
    }

    // Estimate duration in hours
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    const durationHours = Math.max(1, Math.round((end - start) / (1000 * 3600)));

    // Try parsing fee from name or default
    let ratePerHour = 60000;
    const match = booking.facilityName.match(/(\d+[\d,.]*)/);
    if (match) {
      const num = parseInt(match[1].replace(/[,.]/g, ""), 10);
      if (num >= 10000) ratePerHour = num;
    }
    const totalAmount = ratePerHour * durationHours;

    // 1. Create Sales Order
    const order = await prisma.order.create({
      data: {
        organizationId,
        customerName: booking.customerName || "ລູກຄ້າຈອງສະໜາມ",
        totalAmount,
        status: "PAID",
        paymentMethod: "CASH",
        customerNote: `ຄ່າຈອງສະໜາມ/ສະຖານທີ່: ${booking.facilityName} (${durationHours} ຊົ່ວໂມງ) [Ref Booking #${booking.id.slice(-6).toUpperCase()}]`,
        metadata: {
          facilityBookingId: booking.id,
          facilityName: booking.facilityName,
          durationHours,
          source: "FACILITY_BOOKING",
        },
      },
    });

    // 2. Update booking status
    await prisma.facilityBooking.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    // 3. Auto-award Loyalty Points
    const awardedPoints = Math.floor(totalAmount / 10000);
    if (awardedPoints > 0 && booking.customerName) {
      const existingLoyalty = await prisma.loyaltyReward.findFirst({
        where: { organizationId, customerName: booking.customerName },
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
            customerName: booking.customerName,
            points: awardedPoints,
            tier: nextTier,
          },
        });
      }
    }

    return NextResponse.json({ success: true, orderId: order.id, totalAmount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
