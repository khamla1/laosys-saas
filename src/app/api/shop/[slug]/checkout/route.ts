import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyDiscordOrder } from "@/lib/discord";
import { normalizeLaoPhone } from "@/lib/laoPhone";
import {
  getOrUpsertStoreCustomer,
  markCouponUsedByCustomer,
} from "@/lib/storeCustomer";

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { slug } = params;
    const body = await request.json();
    const {
      items,
      customerName,
      customerPhone,
      customerAddress,
      shippingMethod,
      shippingCarrier,
      paymentMethod,
      paymentSlipUrl,
      note,
      couponCode,
      couponId,
      discountAmount,
      tableId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "ກະຕ່າສິນຄ້າຫວ່າງເປົ່າ (Cart is empty)" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານຄ້າ (Store not found)" }, { status: 404 });
    }

    // Normalize Lao phone number (supports 55558888, 2055558888, 02055558888, +8562055558888)
    let resolvedPhone = customerPhone || "";
    if (!tableId) {
      const parsedPhone = normalizeLaoPhone(customerPhone);
      if (!parsedPhone.isValid) {
        return NextResponse.json(
          { error: parsedPhone.error || "ຮູບແບບເບີໂທລະສັບບໍ່ຖືກຕ້ອງ" },
          { status: 400 }
        );
      }
      resolvedPhone = parsedPhone.normalized;

      // Enforce 1-person-1-use coupon rule at checkout
      if (couponCode) {
        const cleanCoupon = String(couponCode).trim().toUpperCase();
        const existingCustomer = await getOrUpsertStoreCustomer(
          organization.id,
          resolvedPhone
        );
        if (existingCustomer.usedCoupons.includes(cleanCoupon)) {
          return NextResponse.json(
            {
              error: `ເບີໂທ ${existingCustomer.displayPhone} ໄດ້ໃຊ້ສິດຄູປອງ ${cleanCoupon} ໄປແລ້ວ (ຈຳກັດ 1 ເບີ / 1 ຄັ້ງ)`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Calculate total
    let totalAmount = 0;
    const orderItemsData = [];
    const receiptItems: { name: string; variantName?: string | null; quantity: number; price: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.organizationId !== organization.id) {
        continue;
      }

      let price = product.price;
      let variantName = item.variantName || null;

      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (variant) {
          if (variant.price !== null) price = variant.price;
          variantName = variant.name;
        }
      }

      totalAmount += price * item.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: price,
        metadata: item.variantId ? { variantId: item.variantId, variantName } : undefined,
      });

      receiptItems.push({
        name: product.name,
        variantName,
        quantity: item.quantity,
        price,
      });
    }

    let order;
    const finalAmount = Math.max(0, totalAmount - (Number(discountAmount) || 0));
    const resolvedPaymentMethod = paymentMethod || "CASH_ON_DELIVERY";
    const formattedAddress = [
      customerAddress,
      shippingCarrier ? `[ຂົນສົ່ງ: ${shippingCarrier}]` : null,
      shippingMethod ? `[ຮູບແບບ: ${shippingMethod}]` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    if (tableId) {
      const table = await prisma.table.findUnique({ where: { id: tableId } });
      if (!table || table.status === "BILL_REQUESTED") {
        return NextResponse.json(
          { error: "ໂຕະນີ້ກຳລັງເຊັກບິນ ບໍ່ສາມາດສັ່ງເພີ່ມໄດ້" },
          { status: 400 }
        );
      }

      const existingOrder = await prisma.order.findFirst({
        where: { tableId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });

      if (existingOrder) {
        order = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            totalAmount: { increment: finalAmount },
            items: { create: orderItemsData },
          },
          include: { items: true },
        });
      } else {
        order = await prisma.order.create({
          data: {
            organizationId: organization.id,
            tableId,
            totalAmount: finalAmount,
            discountAmount: Number(discountAmount) || 0,
            couponCode: couponCode ? String(couponCode).toUpperCase().trim() : undefined,
            couponId: couponId || undefined,
            status: "PENDING",
            customerName,
            customerPhone: resolvedPhone || undefined,
            customerAddress: formattedAddress || undefined,
            customerNote: note || undefined,
            paymentMethod: resolvedPaymentMethod,
            paymentSlipUrl: paymentSlipUrl || undefined,
            items: { create: orderItemsData },
          },
          include: { items: true },
        });
      }

      if (table.status !== "OCCUPIED") {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: "OCCUPIED", currentOrderId: order.id },
        });
      }
    } else {
      order = await prisma.order.create({
        data: {
          organizationId: organization.id,
          totalAmount: finalAmount,
          discountAmount: Number(discountAmount) || 0,
          couponCode: couponCode ? String(couponCode).toUpperCase().trim() : undefined,
          couponId: couponId || undefined,
          status: "PENDING",
          customerName,
          customerPhone: resolvedPhone,
          customerAddress: formattedAddress || undefined,
          customerNote: note || undefined,
          paymentMethod: resolvedPaymentMethod,
          paymentSlipUrl: paymentSlipUrl || undefined,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
    }

    if (couponId) {
      await prisma.coupon
        .updateMany({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    // Update customer record & mark coupon as used in this store's database
    let updatedCustomer = null;
    if (resolvedPhone) {
      try {
        if (couponCode) {
          updatedCustomer = await markCouponUsedByCustomer(
            organization.id,
            resolvedPhone,
            String(couponCode).toUpperCase().trim(),
            { name: customerName, address: customerAddress }
          );
        } else {
          updatedCustomer = await getOrUpsertStoreCustomer(
            organization.id,
            resolvedPhone,
            { name: customerName, address: customerAddress }
          );
        }
      } catch (e) {
        console.error("[SHOP_CHECKOUT_CUSTOMER_SYNC]", e);
      }
    }

    await prisma.kitchenTicket
      .create({
        data: {
          orderId: order.id,
          status: "PENDING",
        },
      })
      .catch(() => {});

    // Create in-app notification for the organization
    await (prisma as any).notification
      .create({
        data: {
          organizationId: organization.id,
          title: "ອໍເດີອອນລາຍໃໝ່! (New Online Order)",
          message: `ລູກຄ້າ ${customerName || "ບໍ່ລະບຸຊື່"} (${resolvedPhone}) ສັ່ງຊື້ສິນຄ້າ ຍອດສຸດທິ ₭${finalAmount.toLocaleString()} (${resolvedPaymentMethod === "QR_TRANSFER" ? "ໂອນຜ່ານ QR" : "ເກັບເງິນປາຍທາງ"})`,
          type: "ORDER",
          link: "/dashboard/orders",
        },
      })
      .catch(() => {});

    // Dispatch real-time Discord webhook notification
    notifyDiscordOrder(
      {
        ...order,
        organizationName: organization.name,
        itemsCount: receiptItems.reduce((acc, r) => acc + r.quantity, 0),
      },
      "NEW_ORDER"
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId: order.id,
      customer: updatedCustomer,
      receipt: {
        id: order.id,
        shortId: order.id.slice(-6).toUpperCase(),
        storeName: organization.name,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: formattedAddress,
        paymentMethod: resolvedPaymentMethod,
        paymentSlipUrl: order.paymentSlipUrl || null,
        shippingCarrier: shippingCarrier || "ANOUSITH",
        shippingMethod: shippingMethod || "EXPRESS",
        subtotalAmount: totalAmount,
        discountAmount: Number(discountAmount) || 0,
        couponCode: couponCode ? String(couponCode).toUpperCase().trim() : null,
        totalAmount: finalAmount,
        createdAt: order.createdAt,
        items: receiptItems,
      },
    });
  } catch (error) {
    console.error("[SHOP_CHECKOUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
