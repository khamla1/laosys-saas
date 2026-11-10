import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, sellerId: inputSellerId, orderAmount, productIds } = await req.json();

    if (!code || orderAmount === undefined) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນລະຫັດส่วนลด/บัตรสมาชิก (Please enter code)" }, { status: 400 });
    }

    let organizationId = inputSellerId;
    if (!organizationId) {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        organizationId = (session.user as any).organizationId;
      }
    }

    const cleanedCode = code.toUpperCase().trim();
    const numOrderAmount = Number(orderAmount) || 0;

    // 1. Try Coupon search
    let coupon = null;
    if (organizationId) {
      coupon = await prisma.coupon.findUnique({
        where: {
          organizationId_code: {
            organizationId,
            code: cleanedCode
          }
        }
      });
    } else {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: cleanedCode,
          isActive: true
        }
      });
    }

    if (coupon) {
      if (!coupon.isActive) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດນີ້ຖືກປິດໃຊ້ງານແລ້ວ (Promo code is disabled)" }, { status: 400 });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດນີ້ໝົດອາຍຸແລ້ວ (Promo code has expired)" }, { status: 400 });
      }

      if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດນີ້ຖືກໃຊ້ຄົບກຳນົດແລ້ວ (Promo code usage limit reached)" }, { status: 400 });
      }

      if (numOrderAmount < coupon.minOrderVal) {
        return NextResponse.json({
          error: `ຍອດສັ່ງຊື້ຂັ້ນຕ່ຳຕ້ອງຮອດ ₭${coupon.minOrderVal.toLocaleString()} (Minimum order amount ₭${coupon.minOrderVal.toLocaleString()} required)`
        }, { status: 400 });
      }

      if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
          return NextResponse.json({
            error: "ລະຫັດສ່ວນຫຼຸດນີ້ບໍ່ສາມາດໃຊ້ກັບສິນຄ້ານີ້ໄດ້ (Coupon is not applicable to these products)"
          }, { status: 400 });
        }
        
        const hasApplicableProduct = productIds.some(id => coupon.applicableProductIds.includes(id));
        if (!hasApplicableProduct) {
          return NextResponse.json({
            error: "ລະຫັດສ່ວນຫຼຸດນີ້ບໍ່ສາມາດໃຊ້ກັບສິນຄ້ານີ້ໄດ້ (Coupon is not applicable to these products)"
          }, { status: 400 });
        }
      }

      let discount = 0;
      if (coupon.type === "PERCENTAGE") {
        discount = numOrderAmount * (coupon.value / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.type === "FIXED") {
        discount = coupon.value;
      }

      if (discount > numOrderAmount) {
        discount = numOrderAmount;
      }

      discount = Math.round(discount);

      return NextResponse.json({
        success: true,
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: discount
      });
    }

    // 2. Try Member Card search (LoyaltyReward)
    let member = null;
    if (organizationId) {
      member = await prisma.loyaltyReward.findFirst({
        where: {
          organizationId,
          OR: [
            { customerName: { equals: cleanedCode, mode: "insensitive" } },
            { id: cleanedCode }
          ]
        }
      });
    } else {
      member = await prisma.loyaltyReward.findFirst({
        where: {
          OR: [
            { customerName: { equals: cleanedCode, mode: "insensitive" } },
            { id: cleanedCode }
          ]
        }
      });
    }

    if (member) {
      let percent = 3; // BRONZE default
      if (member.tier === "SILVER") percent = 5;
      if (member.tier === "GOLD") percent = 10;
      if (member.tier === "PLATINUM") percent = 15;

      const discount = Math.round(numOrderAmount * (percent / 100));

      return NextResponse.json({
        success: true,
        valid: true,
        isMemberCard: true,
        memberId: member.id,
        memberName: member.customerName,
        tier: member.tier,
        points: member.points,
        code: `บัตรสมาชิก: ${member.customerName} (${member.tier})`,
        discountAmount: discount
      });
    }

    return NextResponse.json({ error: "ບໍ່ພົບລະຫັດส่วนลด หรือ บัตรสมาชิก (Invalid code or member card)" }, { status: 400 });
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Server error validating coupon" }, { status: 500 });
  }
}

