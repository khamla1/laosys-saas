import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { couponCode, subtotal } = body;

    if (!couponCode || subtotal === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { token }
    });

    if (!shareLink || shareLink.status !== "ACTIVE") {
      return NextResponse.json({ error: "Link is invalid or inactive" }, { status: 404 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { organizationId_code: { organizationId: shareLink.organizationId, code: couponCode } }
    });

    if (!coupon) {
      return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດບໍ່ຖືກຕ້ອງ" }, { status: 400 });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດບໍ່ເປີດໃຊ້ງານ" }, { status: 400 });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດໝົດອາຍຸ" }, { status: 400 });
    }
    if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
      return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດຖືກໃຊ້ຄົບຈຳນວນແລ້ວ" }, { status: 400 });
    }
    if (subtotal < coupon.minOrderVal) {
      return NextResponse.json({ error: `ຕ້ອງຊື້ຂັ້ນຕ່ຳ ₭${coupon.minOrderVal.toLocaleString()}` }, { status: 400 });
    }

    if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      const hasApplicableProduct = shareLink.productIds.some(id => coupon.applicableProductIds.includes(id));
      if (!hasApplicableProduct) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດນີ້ບໍ່ສາມາດໃຊ້ກັບສິນຄ້ານີ້ໄດ້" }, { status: 400 });
      }
    }

    let appliedDiscount = 0;
    if (coupon.type === "PERCENTAGE") {
      let calculatedDiscount = subtotal * (coupon.value / 100);
      if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
        calculatedDiscount = coupon.maxDiscount;
      }
      appliedDiscount = calculatedDiscount;
    } else {
      appliedDiscount = coupon.value;
    }

    if (appliedDiscount > subtotal) {
      appliedDiscount = subtotal;
    }

    return NextResponse.json({ success: true, discountAmount: appliedDiscount, type: coupon.type, value: coupon.value }, { status: 200 });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
