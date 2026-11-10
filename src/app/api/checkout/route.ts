import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderNotification } from "@/lib/notifications";
import { getEffectiveLimits } from "@/lib/saas";
import { z } from "zod";

const checkoutSchema = z.object({
  storeId: z.string().min(1, "storeId is required"),
  productId: z.string().min(1, "productId is required"),
  quantity: z.number().int().min(1, "quantity must be at least 1"),
  customerName: z.string().min(1, "Customer name is required").max(100),
  customerPhone: z.string().max(20).optional().nullable(),
  customerAddress: z.string().min(1, "Customer address is required").max(500),
  customerNote: z.string().max(1000).optional().nullable(),
  paymentSlipUrl: z.string().url().optional().nullable(),
  couponId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { storeId, productId, quantity, customerName, customerPhone, customerAddress, customerNote, paymentSlipUrl, couponId } = parsed.data;

    // 1. Fetch the product to verify stock and price
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product is not active" }, { status: 400 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const totalAmount = product.price * quantity;
    let finalAmount = totalAmount;
    let discountAmount = 0;
    let couponRecord = null;

    if (couponId) {
      couponRecord = await prisma.coupon.findUnique({
        where: { id: couponId }
      });
      
      if (couponRecord && couponRecord.isActive && (!couponRecord.expiresAt || new Date(couponRecord.expiresAt) > new Date())) {
        if (couponRecord.type === "PERCENTAGE") {
          discountAmount = totalAmount * (couponRecord.value / 100);
          if (couponRecord.maxDiscount && discountAmount > couponRecord.maxDiscount) {
            discountAmount = couponRecord.maxDiscount;
          }
        } else {
          discountAmount = couponRecord.value;
        }

        if (discountAmount > totalAmount) discountAmount = totalAmount;
        finalAmount = totalAmount - discountAmount;
        
        // We will increment coupon usage inside the database transaction.
      }
    } // <-- restored missing bracket

    // 2. SaaS Feature Enforcement: Check Subscription Plan and Order Limits
    const limits = await getEffectiveLimits(storeId);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyOrderCount = await prisma.order.count({
      where: { 
        organizationId: storeId,
        createdAt: { gte: startOfMonth }
      }
    });

    if (monthlyOrderCount >= limits.orderLimit) {
      return NextResponse.json({ 
        error: "Store has reached its maximum order limit for this month." 
      }, { status: 403 });
    }

    // 3. Create Order, OrderItem, and log StockMovement atomically
    const order = await prisma.$transaction(async (tx) => {
      // Re-verify stock to prevent concurrent race condition (Safety)
      const p = await tx.product.findUnique({
        where: { id: productId }
      });
      if (!p || p.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      if (couponId && couponRecord) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } }
        });
      }

      const ord = await tx.order.create({
        data: {
          customerName: customerName || "Anonymous",
          customerPhone: customerPhone || "",
          customerAddress: customerAddress || "",
          customerNote,
          paymentSlipUrl,
          totalAmount: finalAmount,
          status: "PENDING",
          organizationId: storeId,
          couponId: couponRecord ? couponId : undefined,
          couponCode: couponRecord ? couponRecord.code : undefined,
          discountAmount,
          items: {
            create: {
              productId: product.id,
              quantity: quantity,
              price: product.price,
            }
          },
          transaction: {
            create: {
              amount: finalAmount,
              status: "COMPLETED",
              paymentMethod: "MOCK_CHECKOUT",
              reference: `MOCK-${Date.now()}`,
              organizationId: storeId,
            }
          }
        }
      });

      // Deduct stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } }
      });

      // Log StockMovement (SALE)
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          userId: null,
          organizationId: storeId,
          type: "SALE",
          quantity: -quantity,
          reason: "ຂາຍສິນຄ້າ (Online)",
        }
      });

      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";
      await tx.auditLog.create({
        data: {
          action: "CREATE_ORDER",
          details: `Created order ${ord.id} via Online Checkout`,
          userId: null,
          organizationId: storeId,
          ipAddress: ip,
        }
      });

      return ord;
    });

    // Send Notification
    sendOrderNotification(order.id, "NEW_ORDER", { source: "Online Store" }).catch(console.error);

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("[API ERROR] [CHECKOUT_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
