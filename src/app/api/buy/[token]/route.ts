import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, phone, address, note, items, paymentSlipUrl, couponCode } = body;

    if (!name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate link
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: { products: true }
    });

    if (!shareLink || shareLink.status !== "ACTIVE") {
      return NextResponse.json({ error: "Link is invalid or inactive" }, { status: 404 });
    }

    if (shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link has expired" }, { status: 400 });
    }

    // Validate all requested items against the link's products
    let subtotal = 0;
    const orderItemsToCreate: any[] = [];

    for (const item of items) {
      const product = shareLink.products.find(p => p.id === item.productId);
      
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} is not part of this link.` }, { status: 400 });
      }

      if (product.status !== "ACTIVE") {
        return NextResponse.json({ error: "Product is not active" }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Not enough stock for ${product.name}.` }, { status: 400 });
      }

      subtotal += product.price * item.quantity;
      orderItemsToCreate.push({
        quantity: item.quantity,
        price: product.price,
        productId: product.id,
      });
    }

    // Validate Coupon
    let appliedDiscount = 0;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { organizationId_code: { organizationId: shareLink.organizationId, code: couponCode } }
      });

      if (!coupon) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດບໍ່ຖືກຕ້ອງ" }, { status: 400 }); // Invalid coupon code
      }
      if (!coupon.isActive) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດບໍ່ເປີດໃຊ້ງານ" }, { status: 400 });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດໝົດອາຍຸແລ້ວ" }, { status: 400 });
      }
      if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
        return NextResponse.json({ error: "ລະຫັດສ່ວນຫຼຸດຖືກໃຊ້ຄົບກຳນົດແລ້ວ" }, { status: 400 });
      }
      if (subtotal < coupon.minOrderVal) {
        return NextResponse.json({ error: `ຍອດສັ່ງຊື້ຂັ້ນຕ່ຳຕ້ອງແມ່ນ ${coupon.minOrderVal} ກີບ` }, { status: 400 });
      }

      appliedCouponId = coupon.id;
      appliedCouponCode = coupon.code;

      if (coupon.type === "PERCENTAGE") {
        appliedDiscount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount && appliedDiscount > coupon.maxDiscount) {
          appliedDiscount = coupon.maxDiscount;
        }
      } else {
        appliedDiscount = coupon.value;
      }
      if (appliedDiscount > subtotal) appliedDiscount = subtotal;
    }

    const totalAmount = subtotal - appliedDiscount;

    // Execute atomic transaction
    const order = await prisma.$transaction(async (tx) => {
      // Re-verify stock inside transaction to prevent concurrent race condition (Safety)
      for (const item of orderItemsToCreate) {
        const p = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (!p || p.stock < item.quantity) {
          throw new Error(`Not enough stock for ${p?.name || item.productId}`);
        }
      }

      if (couponCode && appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usageCount: { increment: 1 } }
        });
      }

      // Create the order
      const ord = await tx.order.create({
        data: {
          totalAmount,
          status: "PENDING", // PENDING instead of PAID to require admin verification
          organizationId: shareLink.organizationId,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          customerNote: note,
          paymentSlipUrl: paymentSlipUrl || null,
          couponId: appliedCouponId || undefined,
          couponCode: appliedCouponCode || undefined,
          discountAmount: appliedDiscount,
          items: {
            create: orderItemsToCreate
          },
          transaction: {
            create: {
              amount: totalAmount,
              status: "COMPLETED",
              paymentMethod: "FOMO_LINK_QR",
              reference: `FOMO-${Date.now()}`,
              organizationId: shareLink.organizationId,
            }
          }
        }
      });

      // Deduct stock for all items and create SALE movements
      for (const item of orderItemsToCreate) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: null,
            organizationId: shareLink.organizationId,
            type: "SALE",
            quantity: -item.quantity,
            reason: "ຂາຍສິນຄ້າ (FOMO Link)",
          }
        });
      }

      return ord;
    });

    // Log the purchase in audit log
    await prisma.auditLog.create({
      data: {
        action: "FOMO_PURCHASE",
        details: `Customer ${name} bought ${orderItemsToCreate.length} items via link ${token}`,
        organizationId: shareLink.organizationId
      }
    });

    sendOrderNotification(order.id, "NEW_ORDER", { source: "Public Checkout Link" }).catch(console.error);

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Buy Link Checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
