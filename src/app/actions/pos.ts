"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendOrderNotification } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit";

export async function createPOSOrder(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNote?: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod?: string;
  couponId?: string;
  tableId?: string;
  serviceFeeAmount?: number;
  serviceFeeLabel?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!(session?.user as any)?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session!.user as any).id;
  const userRole = (session!.user as any).role;

  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;
  if (!organizationId) {
    return { success: false, error: "User is not assigned to any organization" };
  }
  
  const storeId = organizationId;
  try {
    // We use a transaction to ensure all stock deductions and order creation happen together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and decrement stock
      let subtotal = 0;
      for (const item of data.items) {
        // Bug fix: use findFirst (not findUnique) with organizationId for correct tenant scoping
        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId: storeId }
        });

        if (!product || product.status !== "ACTIVE") {
          throw new Error(`Product ${product?.name || item.productId} is not available for purchase`);
        }

        // Bug fix: atomic conditional decrement to prevent race-condition negative stock
        const updated = await tx.product.updateMany({
          where: { id: item.productId, organizationId: storeId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (updated.count === 0) {
          throw new Error(`ສິນຄ້າ "${product.name}" ໝົດ Stock ແລ້ວ (Insufficient stock)`);
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: userId,
            organizationId: storeId,
            type: "SALE",
            quantity: -item.quantity,
            reason: "ຂາຍສິນຄ້າ (POS)",
          }
        });
        
        subtotal += item.price * item.quantity;
      }

      // 2. Validate Coupon (Server-side check)
      let appliedDiscount = 0;
      let appliedCouponId = null;
      let appliedCouponCode = null;

      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { organizationId_code: { organizationId: storeId, code: data.couponCode } }
        });

        if (coupon) {
          if (!coupon.isActive) {
            throw new Error("Coupon is no longer active");
          }
          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            throw new Error("Coupon has expired");
          }
          if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
            throw new Error("Coupon usage limit reached");
          }
          if (subtotal < coupon.minOrderVal) {
            throw new Error(`Minimum order amount of ${coupon.minOrderVal} required`);
          }

          if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
            const productIdsInCart = data.items.map((i: any) => i.productId);
            const hasApplicableProduct = productIdsInCart.some((id: string) => coupon.applicableProductIds.includes(id));
            if (!hasApplicableProduct) {
              throw new Error("Coupon is not applicable to any products in the cart");
            }
          }

          // Calculate discount
          if (coupon.type === "PERCENTAGE") {
            let calculatedDiscount = subtotal * (coupon.value / 100);
            if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
              calculatedDiscount = coupon.maxDiscount;
            }
            appliedDiscount = calculatedDiscount;
          } else {
            appliedDiscount = coupon.value;
          }

          appliedCouponId = coupon.id;
          appliedCouponCode = coupon.code;

          // Increment coupon usage
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } }
          });
        } else {
          // Fallback: Check Active Promotion Campaign
          const promo = await tx.promotion.findFirst({
            where: {
              organizationId: storeId,
              OR: [
                { code: data.couponCode },
                { name: { equals: data.couponCode, mode: "insensitive" } }
              ],
              status: "ACTIVE"
            }
          });

          if (!promo) {
            throw new Error("Invalid coupon or promotion code");
          }

          const now = new Date();
          if (promo.startDate && new Date(promo.startDate) > now) {
            throw new Error("Promotion has not started yet");
          }
          if (promo.endDate && new Date(promo.endDate) < now) {
            throw new Error("Promotion has expired");
          }

          if (promo.type === "PERCENTAGE") {
            appliedDiscount = subtotal * (promo.discountValue / 100);
          } else {
            appliedDiscount = promo.discountValue;
          }

          appliedCouponId = promo.id;
          appliedCouponCode = (promo as any).code || promo.name;
        }

        // Ensure discount isn't more than subtotal
        if (appliedDiscount > subtotal) {
          appliedDiscount = subtotal;
        }
      }

      // Verify total amounts roughly match (client may send slightly different due to precision, but we enforce it)
      const expectedTotal = Math.max(0, subtotal + (data.serviceFeeAmount || 0) - appliedDiscount);
      // Allowing small floating point variance, but usually totalAmount should match closely
      if (Math.abs(expectedTotal - data.totalAmount) > 1.0) {
        throw new Error("Total amount mismatch between client and server validation.");
      }

      // 3. Handle Order Creation or Updating for Dine-in (Table)
      let order;

      if (data.tableId) {
        // Check if there is an existing PENDING order for this table
        const existingOrder = await tx.order.findFirst({
          where: { tableId: data.tableId, status: "PENDING", organizationId: storeId }
        });

        if (existingOrder) {
          // Update existing order (Append items)
          order = await tx.order.update({
            where: { id: existingOrder.id },
            data: {
              totalAmount: existingOrder.totalAmount + expectedTotal,
              items: {
                create: data.items.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price
                }))
              }
            }
          });
        }
      }

      // If no existing table order, or it's not a table order, create a new one
      if (!order) {
        order = await tx.order.create({
          data: {
            organizationId: storeId,
            status: data.tableId ? "PENDING" : "PAID", 
            totalAmount: expectedTotal,
            customerName: data.customerName || "Walk-in Customer",
            customerEmail: data.customerEmail || "walkin@store.com",
            customerPhone: data.customerPhone || null,
            customerNote: data.customerNote || null,
            paymentMethod: data.paymentMethod || "CASH",
            couponId: appliedCouponId,
            couponCode: appliedCouponCode,
            discountAmount: appliedDiscount,
            tableId: data.tableId || null,
            metadata: {
              ...(data.serviceFeeAmount ? { serviceFeeAmount: data.serviceFeeAmount, serviceFeeLabel: data.serviceFeeLabel } : {})
            },
            items: {
              create: data.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          }
        });
        
        // If assigned to a table, update the table status
        if (data.tableId) {
          await tx.table.update({
            where: { id: data.tableId },
            data: { 
              status: "OCCUPIED",
              currentOrderId: order.id
            }
          });
        }
      }

      // Auto-award Loyalty Points (10,000 LAK = 1 point)
      if (order.status === "PAID" && expectedTotal > 0) {
        const cIdent = (data.customerName || "").trim();
        const cPhone = (data.customerPhone || "").trim();
        if ((cIdent && cIdent.toLowerCase() !== "walk-in customer") || cPhone) {
          const awardedPoints = Math.floor(expectedTotal / 10000);
          if (awardedPoints > 0) {
            const customerNameKey = cIdent && cIdent.toLowerCase() !== "walk-in customer" ? cIdent : (cPhone || "Customer");
            const existingReward = await tx.loyaltyReward.findFirst({
              where: {
                organizationId: storeId,
                customerName: customerNameKey,
              },
            });

            if (existingReward) {
              const nextPoints = existingReward.points + awardedPoints;
              const nextTier = nextPoints >= 500 ? "GOLD" : nextPoints >= 200 ? "SILVER" : "BRONZE";
              await tx.loyaltyReward.update({
                where: { id: existingReward.id },
                data: { points: nextPoints, tier: nextTier },
              });
            } else {
              const nextTier = awardedPoints >= 500 ? "GOLD" : awardedPoints >= 200 ? "SILVER" : "BRONZE";
              await tx.loyaltyReward.create({
                data: {
                  organizationId: storeId,
                  customerName: customerNameKey,
                  points: awardedPoints,
                  tier: nextTier,
                },
              });
            }
          }
        }
      }

      return order;
    });

    // Send notification (async)
    sendOrderNotification(result.id, "NEW_ORDER", { source: "POS" }).catch(console.error);

    await recordAuditLog({
      action: "ORDER_CREATED",
      entityType: "ORDER",
      entityId: result.id,
      organizationId: storeId,
      userId: userId,
      details: `ສ້າງບິນໃໝ່ ສຳລັບ ${data.customerName || "ລູກຄ້າທົ່ວໄປ"} (ຍອດ: ₭${expectedTotal.toLocaleString()})`,
      metadata: {
        refCode: `ORD-${result.id.slice(-6).toUpperCase()}`,
        amount: expectedTotal,
        customerName: data.customerName,
        itemsCount: data.items.length,
        paymentMethod: data.paymentMethod || "CASH",
        tableId: data.tableId || null
      }
    });

    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("POS Order Error:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}

export async function payTableOrder(data: {
  orderId: string;
  tableId: string;
  paymentMethod: string;
  cashReceived?: number;
  changeAmount?: number;
  couponCode?: string;
  discountAmount?: number;
  serviceFeeAmount?: number;
  serviceFeeLabel?: string;
  finalTotalAmount?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify order belongs to this tenant
      const existingOrder = await tx.order.findUnique({
        where: { id: data.orderId }
      });
      if (!existingOrder || existingOrder.organizationId !== organizationId) {
        throw new Error("Order not found or unauthorized for payment");
      }

      // 2. Process coupon if provided — fully validated server-side
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { organizationId_code: { organizationId, code: data.couponCode } }
        });

        if (coupon && coupon.isActive &&
            (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) &&
            (!coupon.maxUsage || coupon.usageCount < coupon.maxUsage)) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } }
          });
          // Save coupon to order record
          await tx.order.update({
            where: { id: data.orderId },
            data: {
              couponId: coupon.id,
              couponCode: coupon.code,
              discountAmount: data.discountAmount || 0,
            }
          });
        }
      }

      const prevMeta = (existingOrder.metadata as Record<string, any>) || {};
      const serviceFeeAmt = data.serviceFeeAmount !== undefined ? data.serviceFeeAmount : (Number(prevMeta.serviceFeeAmount) || 0);
      const serviceFeeLbl = data.serviceFeeLabel !== undefined ? data.serviceFeeLabel : prevMeta.serviceFeeLabel;
      const discountAmt = data.discountAmount || 0;
      const computedTotal = data.finalTotalAmount !== undefined
        ? data.finalTotalAmount
        : Math.max(0, existingOrder.totalAmount + serviceFeeAmt - discountAmt);

      // 3. Mark order as PAID
      const order = await tx.order.update({
        where: { id: data.orderId },
        data: {
          status: "PAID",
          totalAmount: computedTotal,
          paymentMethod: data.paymentMethod,
          couponCode: data.couponCode,
          discountAmount: discountAmt,
          metadata: {
            ...prevMeta,
            cashReceived: data.cashReceived,
            changeAmount: data.changeAmount,
            ...(serviceFeeAmt > 0 ? { serviceFeeAmount: serviceFeeAmt, serviceFeeLabel: serviceFeeLbl } : {})
          }
        }
      });

      // 4. Mark table as AVAILABLE only if no other PENDING orders remain on this table
      const realTableId = data.tableId && !data.tableId.startsWith("order-") ? data.tableId : existingOrder.tableId;
      if (realTableId) {
        const remainingOrders = await tx.order.findMany({
          where: {
            tableId: realTableId,
            organizationId,
            status: "PENDING",
            id: { not: data.orderId }
          },
          select: { id: true }
        });

        if (remainingOrders.length === 0) {
          await tx.table.updateMany({
            where: { id: realTableId, zone: { organizationId } },
            data: {
              status: "AVAILABLE",
              currentOrderId: null
            }
          });
        } else {
          await tx.table.updateMany({
            where: { id: realTableId, zone: { organizationId } },
            data: {
              status: "OCCUPIED",
              currentOrderId: remainingOrders[0].id
            }
          });
        }
      }

      // Auto-award Loyalty Points on Table Payment (10,000 LAK = 1 point)
      if (computedTotal > 0) {
        const cIdent = (existingOrder.customerName || "").trim();
        const cPhone = (existingOrder.customerPhone || "").trim();
        if ((cIdent && cIdent.toLowerCase() !== "walk-in customer") || cPhone) {
          const awardedPoints = Math.floor(computedTotal / 10000);
          if (awardedPoints > 0) {
            const customerNameKey = cIdent && cIdent.toLowerCase() !== "walk-in customer" ? cIdent : (cPhone || "Customer");
            const existingReward = await tx.loyaltyReward.findFirst({
              where: {
                organizationId,
                customerName: customerNameKey,
              },
            });

            if (existingReward) {
              const nextPoints = existingReward.points + awardedPoints;
              const nextTier = nextPoints >= 500 ? "GOLD" : nextPoints >= 200 ? "SILVER" : "BRONZE";
              await tx.loyaltyReward.update({
                where: { id: existingReward.id },
                data: { points: nextPoints, tier: nextTier },
              });
            } else {
              const nextTier = awardedPoints >= 500 ? "GOLD" : awardedPoints >= 200 ? "SILVER" : "BRONZE";
              await tx.loyaltyReward.create({
                data: {
                  organizationId,
                  customerName: customerNameKey,
                  points: awardedPoints,
                  tier: nextTier,
                },
              });
            }
          }
        }
      }

      return order;
    });

    await recordAuditLog({
      action: "ORDER_PAID",
      entityType: "ORDER",
      entityId: result.id,
      organizationId,
      userId: (session!.user as any).id,
      details: `ຊຳລະເງິນບິນ #${result.id.slice(-6).toUpperCase()} ຍອດ ₭${(result.totalAmount || 0).toLocaleString()} ຜ່ານ ${data.paymentMethod}`,
      metadata: {
        refCode: `ORD-${result.id.slice(-6).toUpperCase()}`,
        amount: result.totalAmount,
        paymentMethod: data.paymentMethod,
        cashReceived: data.cashReceived,
        changeAmount: data.changeAmount,
        discountAmount: data.discountAmount,
        serviceFeeAmount: data.serviceFeeAmount,
        tableId: data.tableId
      }
    });

    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("Payment error:", error);
    return { success: false, error: error.message || "Failed to process payment" };
  }
}

export async function splitTableOrderAction(data: {
  orderId: string;
  itemsToSplit: { id: string; quantity: number }[];
  peopleCount?: number;
  splitType?: "ITEMS" | "EQUAL";
}) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;
  if (!organizationId) return { success: false, error: "No organization assigned" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { items: true }
      });
      if (!order || order.organizationId !== organizationId) {
        throw new Error("Order not found or unauthorized");
      }

      if (data.splitType === "EQUAL" && data.peopleCount && data.peopleCount > 1) {
        const perPersonAmount = Math.round(order.totalAmount / data.peopleCount);
        const firstPersonAmount = order.totalAmount - (perPersonAmount * (data.peopleCount - 1));
        const newOrders = [];
        for (let i = 1; i < data.peopleCount; i++) {
          const newOrd = await tx.order.create({
            data: {
              organizationId,
              tableId: order.tableId,
              status: "PENDING",
              totalAmount: perPersonAmount,
              paymentMethod: order.paymentMethod,
              customerName: `${order.customerName || "Customer"} (ບິນແຍກ ${i + 1}/${data.peopleCount})`,
            }
          });
          newOrders.push(newOrd.id);
        }
        await tx.order.update({
          where: { id: order.id },
          data: {
            totalAmount: firstPersonAmount,
            customerName: `${order.customerName || "Customer"} (ບິນແຍກ 1/${data.peopleCount})`
          }
        });
        return { success: true, newOrderIds: newOrders };
      }

      // Default: Split by Items
      const newOrder = await tx.order.create({
        data: {
          organizationId,
          tableId: order.tableId,
          status: "PENDING",
          totalAmount: 0,
          paymentMethod: order.paymentMethod,
          customerName: `${order.customerName || "Customer"} (ບິນແຍກໃໝ່)`,
        }
      });

      for (const item of data.itemsToSplit) {
        const orderItem = order.items.find(i => i.id === item.id);
        if (!orderItem) continue;

        if (item.quantity < orderItem.quantity) {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { quantity: orderItem.quantity - item.quantity }
          });
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: orderItem.productId,
              price: orderItem.price,
              quantity: item.quantity,
              status: orderItem.status
            }
          });
        } else {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { orderId: newOrder.id }
          });
        }
      }

      const origItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
      const newItems = await tx.orderItem.findMany({ where: { orderId: newOrder.id } });
      const origTotal = origItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const newTotal = newItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

      await tx.order.update({ where: { id: order.id }, data: { totalAmount: origTotal } });
      await tx.order.update({ where: { id: newOrder.id }, data: { totalAmount: newTotal } });

      return { success: true, newOrderId: newOrder.id };
    });

    await recordAuditLog({
      action: "ORDER_SPLIT",
      entityType: "ORDER",
      entityId: data.orderId,
      organizationId,
      userId: (session!.user as any).id,
      details: `ແຍກບິນ #${data.orderId.slice(-6).toUpperCase()} ຮູບແບບ ${data.splitType || "ITEMS"}`,
      metadata: {
        refCode: `ORD-${data.orderId.slice(-6).toUpperCase()}`,
        splitType: data.splitType || "ITEMS",
        originalOrderId: data.orderId,
        newOrderId: (result as any).newOrderId || ((result as any).newOrderIds ? (result as any).newOrderIds.join(", ") : null)
      }
    });

    return result;
  } catch (error: any) {
    console.error("Split order error:", error);
    return { success: false, error: error.message || "Failed to split bill" };
  }
}

export async function mergeTableOrdersAction(data: {
  primaryOrderId: string;
  sourceOrderIds: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;
  if (!organizationId) return { success: false, error: "No organization assigned" };

  try {
    await prisma.$transaction(async (tx) => {
      const primaryOrder = await tx.order.findUnique({ where: { id: data.primaryOrderId } });
      if (!primaryOrder || primaryOrder.organizationId !== organizationId) {
        throw new Error("Primary order not found or unauthorized");
      }

      const sourceOrdersCount = await tx.order.count({
        where: {
          id: { in: data.sourceOrderIds },
          organizationId: organizationId,
        }
      });

      if (sourceOrdersCount !== data.sourceOrderIds.length) {
        throw new Error("One or more source orders not found or unauthorized for merge");
      }

      await tx.orderItem.updateMany({
        where: { orderId: { in: data.sourceOrderIds } },
        data: { orderId: data.primaryOrderId }
      });

      await tx.order.deleteMany({
        where: { id: { in: data.sourceOrderIds }, organizationId }
      });

      const allItems = await tx.orderItem.findMany({ where: { orderId: data.primaryOrderId } });
      const newTotal = allItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

      await tx.order.update({
        where: { id: data.primaryOrderId },
        data: { totalAmount: newTotal }
      });
    });

    await recordAuditLog({
      action: "ORDER_MERGED",
      entityType: "ORDER",
      entityId: data.primaryOrderId,
      organizationId,
      userId: (session!.user as any).id,
      details: `ລວມບິນ ${data.sourceOrderIds.length} ບິນ ເຂົ້າກັບບິນຫຼັກ #${data.primaryOrderId.slice(-6).toUpperCase()}`,
      metadata: {
        refCode: `ORD-${data.primaryOrderId.slice(-6).toUpperCase()}`,
        primaryOrderId: data.primaryOrderId,
        sourceOrderIds: data.sourceOrderIds
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Merge order error:", error);
    return { success: false, error: error.message || "Failed to merge bills" };
  }
}

export async function createDemoTableOrdersAction() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;
  if (!organizationId) return { success: false, error: "No organization assigned" };

  try {
    await prisma.$transaction(async (tx) => {
      let zone = await tx.zone.findFirst({ where: { organizationId } });
      if (!zone) {
        zone = await tx.zone.create({
          data: {
            name: "ໂຊນກາງ (Main Dining)",
            organizationId
          }
        });
      }

      // Create Demo tables if not existing
      let tableA1 = await tx.table.findFirst({ where: { name: "A01", zoneId: zone.id } });
      if (!tableA1) {
        tableA1 = await tx.table.create({
          data: {
            name: "A01",
            seats: 4,
            status: "OCCUPIED",
            zoneId: zone.id
          }
        });
      }
      let tableA2 = await tx.table.findFirst({ where: { name: "A02", zoneId: zone.id } });
      if (!tableA2) {
        tableA2 = await tx.table.create({
          data: {
            name: "A02",
            seats: 6,
            status: "OCCUPIED",
            zoneId: zone.id
          }
        });
      }

      const products = await tx.product.findMany({
        where: { organizationId, status: "ACTIVE" },
        take: 3
      });

      if (products.length === 0) {
        throw new Error("ກະລຸນາເພີ່ມສິນຄ້າຢ່າງໜ້ອຍ 1 ຢ່າງກ່ອນສ້າງບິນຕົວຢ່າງ");
      }

      // Create Order for A1
      const orderA1 = await tx.order.create({
        data: {
          organizationId,
          tableId: tableA1.id,
          status: "PENDING",
          totalAmount: products[0].price * 2 + (products[1]?.price || 0),
          customerName: "ໂຕະ A01 (ລູກຄ້າຕົວຢ່າງ)"
        }
      });
      await tx.orderItem.create({
        data: {
          orderId: orderA1.id,
          productId: products[0].id,
          price: products[0].price,
          quantity: 2,
          status: "SERVED"
        }
      });
      if (products[1]) {
        await tx.orderItem.create({
          data: {
            orderId: orderA1.id,
            productId: products[1].id,
            price: products[1].price,
            quantity: 1,
            status: "PENDING"
          }
        });
      }

      // Create Order for A2
      const orderA2 = await tx.order.create({
        data: {
          organizationId,
          tableId: tableA2.id,
          status: "PENDING",
          totalAmount: products[0].price + (products[2]?.price || products[0].price) * 3,
          customerName: "ໂຕະ A02 (ລູກຄ້າຕົວຢ່າງ)"
        }
      });
      await tx.orderItem.create({
        data: {
          orderId: orderA2.id,
          productId: products[0].id,
          price: products[0].price,
          quantity: 1,
          status: "SERVED"
        }
      });
      const p2 = products[2] || products[0];
      await tx.orderItem.create({
        data: {
          orderId: orderA2.id,
          productId: p2.id,
          price: p2.price,
          quantity: 3,
          status: "PENDING"
        }
      });

      // Update table status and currentOrderId for both demo tables
      await tx.table.update({
        where: { id: tableA1.id },
        data: { status: "OCCUPIED", currentOrderId: orderA1.id }
      });
      await tx.table.update({
        where: { id: tableA2.id },
        data: { status: "OCCUPIED", currentOrderId: orderA2.id }
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create demo table orders error:", error);
    return { success: false, error: error.message || "Failed to create demo orders" };
  }
}

export async function clearStuckPOSOrdersAction() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;
  if (!organizationId) return { success: false, error: "No organization assigned" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      // 1. Delete order items first for all pending orders of this org
      const pendingOrders = await tx.order.findMany({
        where: { organizationId, status: "PENDING" },
        select: { id: true }
      });
      const pendingIds = pendingOrders.map((o) => o.id);

      if (pendingIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: { in: pendingIds } }
        });
      }

      // 2. Delete the pending orders
      const deleted = await tx.order.deleteMany({
        where: {
          organizationId,
          status: "PENDING",
        }
      });

      // 3. Reset all tables in this org back to AVAILABLE
      await tx.table.updateMany({
        where: { zone: { organizationId } },
        data: {
          status: "AVAILABLE",
          currentOrderId: null
        }
      });

      return deleted;
    });

    return { success: true, count: res.count };
  } catch (error: any) {
    console.error("Clear stuck orders error:", error);
    return { success: false, error: error.message || "Failed to clear pending orders" };
  }
}

export async function deletePOSOrderAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
  const organizationId = (session!.user as any).organizationId || (session!.user as any).id;
  if (!organizationId) return { success: false, error: "No organization assigned" };

  // Role check: only OWNER/ADMIN/MANAGER can delete orders
  const orgRole = (session!.user as any).orgRole;
  const userRole = (session!.user as any).role;
  const canDelete = userRole === "ADMIN" || ["OWNER", "ADMIN", "MANAGER"].includes(orgRole);
  if (!canDelete) return { success: false, error: "Forbidden: Manager role required to delete orders" };

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, organizationId },
        include: { items: true }
      });
      if (!order) throw new Error("Order not found or unauthorized");

      // Bug fix: Restore stock for each item before deleting the order
      for (const item of (order.items || [])) {
        await tx.product.updateMany({
          where: { id: item.productId, organizationId },
          data: { stock: { increment: item.quantity } }
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: (session!.user as any).id,
            organizationId,
            type: "RETURN",
            quantity: item.quantity,
            reason: `Order #${orderId.slice(-6)} deleted`
          }
        });
      }

      // Bug fix: Restore coupon usage if coupon was applied
      if (order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } }
        });
      }

      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });

      if (order.tableId) {
        await tx.table.updateMany({
          where: { id: order.tableId, zone: { organizationId } },
          data: { status: "AVAILABLE", currentOrderId: null }
        });
      }
    });

    await recordAuditLog({
      action: "ORDER_DELETED",
      entityType: "ORDER",
      entityId: orderId,
      organizationId,
      userId: (session!.user as any).id,
      details: `ລຶບບິນ #${orderId.slice(-6).toUpperCase()} ແລະ ຄືນສະຕັອກສິນຄ້າ`,
      metadata: {
        refCode: `ORD-${orderId.slice(-6).toUpperCase()}`,
        deletedOrderId: orderId
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Delete order error:", error);
    return { success: false, error: error.message || "Failed to delete order" };
  }
}

