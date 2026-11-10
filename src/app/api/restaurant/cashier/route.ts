import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId || (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const includeMeta = searchParams.get("meta") === "true";

    // 1. Fetch tables that are OCCUPIED, BILL_REQUESTED, or have any PENDING orders
    const tables = await prisma.table.findMany({
      where: {
        zone: { organizationId },
        OR: [
          { status: { in: ["OCCUPIED", "BILL_REQUESTED"] } },
          { orders: { some: { status: "PENDING" } } }
        ]
      },
      include: {
        zone: true,
        orders: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: [
        { zone: { name: "asc" } },
        { name: "asc" }
      ]
    });

    // 2. Also fetch standalone PENDING orders (without tableId) so non-table bills also appear in Cashier
    const standaloneOrders = await prisma.order.findMany({
      where: {
        organizationId,
        status: "PENDING",
        tableId: null
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const virtualTables = standaloneOrders.map((ord) => {
      const meta = (ord.metadata as Record<string, any>) || {};
      return {
        id: `order-${ord.id}`,
        name: ord.customerName || `ບິນ #${ord.id.slice(-4).toUpperCase()}`,
        status: meta.billRequested ? "BILL_REQUESTED" : "OCCUPIED",
        isStandaloneOrder: true,
        zone: { id: "standalone", name: "ບິນໜ້າຮ້ານ / ບໍລິການທົ່ວໄປ" },
        orders: [ord]
      };
    });

    const combined = [...tables, ...virtualTables];

    if (includeMeta) {
      const [allTables, products] = await Promise.all([
        prisma.table.findMany({
          where: { zone: { organizationId } },
          include: { zone: true },
          orderBy: { name: "asc" }
        }),
        prisma.product.findMany({
          where: { organizationId, status: "ACTIVE" },
          select: { id: true, name: true, price: true, stock: true, category: true, images: true },
          orderBy: { name: "asc" },
          take: 200
        })
      ]);

      return NextResponse.json({
        tables: combined,
        allTables,
        products
      });
    }

    return NextResponse.json(combined);
  } catch (error) {
    console.error("[CASHIER_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId || userId;
    const body = await request.json();
    const { action } = body;

    // 1. LOCK / UNLOCK TABLE (Request Bill status)
    if (action === "LOCK_TABLE") {
      const { tableId, status } = body;
      if (!tableId) {
        return NextResponse.json({ error: "tableId is required" }, { status: 400 });
      }

      if (String(tableId).startsWith("order-")) {
        const orderId = String(tableId).replace("order-", "");
        const ord = await prisma.order.findFirst({ where: { id: orderId, organizationId } });
        if (!ord) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        const prevMeta = (ord.metadata as Record<string, any>) || {};
        const nextReq = status ? status === "BILL_REQUESTED" : !prevMeta.billRequested;
        await prisma.order.update({
          where: { id: orderId },
          data: {
            metadata: { ...prevMeta, billRequested: nextReq }
          }
        });
        return NextResponse.json({ success: true, status: nextReq ? "BILL_REQUESTED" : "OCCUPIED" });
      }

      const existingTable = await prisma.table.findFirst({
        where: { id: tableId, zone: { organizationId } }
      });
      if (!existingTable) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }

      const nextStatus = status || (existingTable.status === "BILL_REQUESTED" ? "OCCUPIED" : "BILL_REQUESTED");
      const updated = await prisma.table.update({
        where: { id: tableId },
        data: { status: nextStatus }
      });

      return NextResponse.json({ success: true, table: updated, status: nextStatus });
    }

    // 2. SAVE / CLEAR SERVICE FEE ON AN ORDER
    if (action === "SET_SERVICE_FEE") {
      const { orderId, serviceFeeAmount, serviceFeeLabel, serviceFeeType } = body;
      if (!orderId) {
        return NextResponse.json({ error: "orderId is required" }, { status: 400 });
      }

      const ord = await prisma.order.findFirst({
        where: { id: orderId, organizationId }
      });
      if (!ord) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const prevMeta = (ord.metadata as Record<string, any>) || {};
      const updatedMeta = {
        ...prevMeta,
        serviceFeeAmount: Number(serviceFeeAmount) || 0,
        serviceFeeLabel: serviceFeeLabel || null,
        serviceFeeType: serviceFeeType || null
      };

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { metadata: updatedMeta }
      });

      await recordAuditLog({
        action: "ORDER_SERVICE_FEE_SET",
        entityType: "ORDER",
        entityId: orderId,
        organizationId,
        userId,
        details: `ປັບຄ່າບໍລິການເສີມບິນ #${orderId.slice(-6).toUpperCase()}: ${serviceFeeLabel || "ຄ່າບໍລິການ"} +₭${Number(serviceFeeAmount || 0).toLocaleString()}`,
        metadata: {
          refCode: `ORD-${orderId.slice(-6).toUpperCase()}`,
          orderId,
          serviceFeeAmount,
          serviceFeeLabel
        }
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // 3. ADD PRODUCT OR CUSTOM SERVICE ITEM TO AN EXISTING BILL
    if (action === "ADD_ITEM_TO_BILL") {
      const { orderId, tableId, productId, customServiceName, customServicePrice, quantity = 1 } = body;
      const qty = Math.max(1, Number(quantity) || 1);

      const result = await prisma.$transaction(async (tx) => {
        let targetProductId = productId;
        let unitPrice = 0;

        if (productId) {
          const prod = await tx.product.findFirst({
            where: { id: productId, organizationId }
          });
          if (!prod) throw new Error("ບໍ່ພົບສິນຄ້າທີ່ເລືອກ");
          unitPrice = prod.price;

          // Decrement stock if available
          if (prod.stock >= qty) {
            await tx.product.update({
              where: { id: prod.id },
              data: { stock: { decrement: qty } }
            });
            await tx.stockMovement.create({
              data: {
                productId: prod.id,
                userId,
                organizationId,
                type: "SALE",
                quantity: -qty,
                reason: "ເພີ່ມລາຍການເຂົ້າບິນ (Cashier)"
              }
            });
          }
        } else if (customServiceName) {
          unitPrice = Math.max(0, Number(customServicePrice) || 0);
          // Find or create a service product entry so it links cleanly with OrderItem
          let serviceProd = await tx.product.findFirst({
            where: {
              organizationId,
              name: customServiceName.trim()
            }
          });
          if (!serviceProd) {
            serviceProd = await tx.product.create({
              data: {
                organizationId,
                sellerId: userId,
                name: customServiceName.trim(),
                description: "ບໍລິການເສີມ / Custom Service (Cashier)",
                price: unitPrice,
                stock: 9999,
                category: "SERVICE",
                status: "ACTIVE",
                images: []
              }
            });
          }
          targetProductId = serviceProd.id;
        } else {
          throw new Error("ກະລຸນາເລືອກສິນຄ້າ ຫຼື ລະບຸຊື່ບໍລິການ");
        }

        let targetOrder = orderId
          ? await tx.order.findFirst({ where: { id: orderId, organizationId } })
          : null;

        const realTableId = tableId && !String(tableId).startsWith("order-") ? tableId : null;

        if (!targetOrder) {
          targetOrder = await tx.order.create({
            data: {
              organizationId,
              tableId: realTableId,
              status: "PENDING",
              totalAmount: unitPrice * qty,
              customerName: body.customerName || (realTableId ? "ລູກຄ້າໂຕະ" : "ລູກຄ້າໜ້າຮ້ານ"),
              customerEmail: "walkin@store.com",
              paymentMethod: "CASH",
              items: {
                create: [
                  {
                    productId: targetProductId,
                    quantity: qty,
                    price: unitPrice,
                    status: "SERVED"
                  }
                ]
              }
            }
          });

          if (realTableId) {
            await tx.table.update({
              where: { id: realTableId },
              data: { status: "OCCUPIED", currentOrderId: targetOrder.id }
            });
          }
        } else {
          // Check if the same product with the same price already exists in the order
          const existingItem = await tx.orderItem.findFirst({
            where: {
              orderId: targetOrder.id,
              productId: targetProductId,
              price: unitPrice
            }
          });

          if (existingItem) {
            await tx.orderItem.update({
              where: { id: existingItem.id },
              data: { quantity: existingItem.quantity + qty }
            });
          } else {
            await tx.orderItem.create({
              data: {
                orderId: targetOrder.id,
                productId: targetProductId,
                quantity: qty,
                price: unitPrice,
                status: "SERVED"
              }
            });
          }

          const allItems = await tx.orderItem.findMany({
            where: { orderId: targetOrder.id }
          });
          const newSubtotal = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

          targetOrder = await tx.order.update({
            where: { id: targetOrder.id },
            data: { totalAmount: newSubtotal }
          });
        }

        return targetOrder;
      });

      return NextResponse.json({ success: true, order: result });
    }

    // 4. UPDATE OR REMOVE AN ORDER ITEM FROM BILL
    if (action === "UPDATE_ITEM_QTY" || action === "REMOVE_ITEM_FROM_BILL") {
      const { orderId, itemId, quantity } = body;
      if (!orderId || !itemId) {
        return NextResponse.json({ error: "orderId and itemId are required" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const ord = await tx.order.findFirst({
          where: { id: orderId, organizationId }
        });
        if (!ord) throw new Error("Order not found");

        const item = await tx.orderItem.findFirst({
          where: { id: itemId, orderId }
        });
        if (!item) throw new Error("Order item not found");

        if (action === "REMOVE_ITEM_FROM_BILL" || Number(quantity) <= 0) {
          await tx.product.updateMany({
            where: { id: item.productId, organizationId },
            data: { stock: { increment: item.quantity } }
          });
          await tx.orderItem.delete({ where: { id: item.id } });
        } else {
          const newQty = Number(quantity);
          const diff = newQty - item.quantity;
          if (diff !== 0) {
            await tx.product.updateMany({
              where: { id: item.productId, organizationId },
              data: { stock: { increment: -diff } }
            });
            await tx.orderItem.update({
              where: { id: item.id },
              data: { quantity: newQty }
            });
          }
        }

        const remainingItems = await tx.orderItem.findMany({ where: { orderId } });
        const newSubtotal = remainingItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await tx.order.update({
          where: { id: orderId },
          data: { totalAmount: newSubtotal }
        });
      });

      return NextResponse.json({ success: true });
    }

    // 5. OPEN NEW BILL (Table or Standalone Walk-in / Service Bill)
    if (action === "OPEN_NEW_BILL") {
      const { tableId, customerName, newTableName } = body;
      const result = await prisma.$transaction(async (tx) => {
        let targetTableId = tableId && tableId !== "STANDALONE" ? tableId : null;

        if (newTableName && newTableName.trim()) {
          let zone = await tx.zone.findFirst({ where: { organizationId } });
          if (!zone) {
            zone = await tx.zone.create({
              data: { name: "ໂຊນຫຼັກ (Main Zone)", organizationId }
            });
          }
          const createdTable = await tx.table.create({
            data: {
              name: newTableName.trim(),
              seats: 4,
              status: "OCCUPIED",
              zoneId: zone.id
            }
          });
          targetTableId = createdTable.id;
        }

        const newOrder = await tx.order.create({
          data: {
            organizationId,
            tableId: targetTableId,
            status: "PENDING",
            totalAmount: 0,
            customerName: customerName?.trim() || (targetTableId ? "ລູກຄ້າໂຕະ" : "ບິນບໍລິການໜ້າຮ້ານ"),
            customerEmail: "walkin@store.com",
            paymentMethod: "CASH"
          }
        });

        if (targetTableId) {
          await tx.table.update({
            where: { id: targetTableId },
            data: { status: "OCCUPIED", currentOrderId: newOrder.id }
          });
        }

        return { order: newOrder, tableId: targetTableId || `order-${newOrder.id}` };
      });

      await recordAuditLog({
        action: "ORDER_CREATED",
        entityType: "ORDER",
        entityId: result.order?.id,
        organizationId,
        userId,
        details: `ເປີດບິນໃໝ່ ສຳລັບ ${customerName || (result.tableId ? "ລູກຄ້າໂຕະ" : "ບິນບໍລິການໜ້າຮ້ານ")}`,
        metadata: {
          refCode: result.order ? `ORD-${result.order.id.slice(-6).toUpperCase()}` : undefined,
          tableId: result.tableId,
          customerName
        }
      });

      return NextResponse.json({ success: true, ...result });
    }

    // 6. CANCEL BILL / CLEAR TABLE
    if (action === "CANCEL_BILL") {
      const { orderId, tableId } = body;
      await recordAuditLog({
        action: "ORDER_CANCELLED",
        entityType: "ORDER",
        entityId: orderId || (tableId ? String(tableId) : null),
        organizationId,
        userId,
        details: `ຍົກເລີກບິນ ${orderId ? `#ORD-${orderId.slice(-6).toUpperCase()}` : `ໂຕະ ${tableId}`} ແລະ ຄືນສະຕັອກສິນຄ້າ`,
        metadata: {
          refCode: orderId ? `ORD-${orderId.slice(-6).toUpperCase()}` : undefined,
          orderId,
          tableId
        }
      });
      await prisma.$transaction(async (tx) => {
        const realTableId = tableId && !String(tableId).startsWith("order-") ? tableId : null;

        if (orderId) {
          const order = await tx.order.findFirst({
            where: { id: orderId, organizationId },
            include: { items: true }
          });

          if (order) {
            for (const item of order.items || []) {
              await tx.product.updateMany({
                where: { id: item.productId, organizationId },
                data: { stock: { increment: item.quantity } }
              });
            }
            await tx.orderItem.deleteMany({ where: { orderId: order.id } });
            await tx.order.delete({ where: { id: order.id } });
          }
        } else if (realTableId) {
          // Cancel all pending orders on this table if no specific orderId was passed
          const pendingOrders = await tx.order.findMany({
            where: { tableId: realTableId, organizationId, status: "PENDING" },
            include: { items: true }
          });
          for (const ord of pendingOrders) {
            for (const item of ord.items || []) {
              await tx.product.updateMany({
                where: { id: item.productId, organizationId },
                data: { stock: { increment: item.quantity } }
              });
            }
            await tx.orderItem.deleteMany({ where: { orderId: ord.id } });
            await tx.order.delete({ where: { id: ord.id } });
          }
        }

        if (realTableId) {
          const remaining = await tx.order.count({
            where: { tableId: realTableId, organizationId, status: "PENDING" }
          });
          if (remaining === 0) {
            await tx.table.updateMany({
              where: { id: realTableId, zone: { organizationId } },
              data: { status: "AVAILABLE", currentOrderId: null }
            });
          }
        }
      });

      return NextResponse.json({ success: true });
    }

    // 7. MOVE TABLE (Transfer bill to another table)
    if (action === "MOVE_TABLE") {
      const { sourceTableId, targetTableId, orderId } = body;
      if (!targetTableId) {
        return NextResponse.json({ error: "targetTableId is required" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const targetTable = await tx.table.findFirst({
          where: { id: targetTableId, zone: { organizationId } }
        });
        if (!targetTable) throw new Error("Target table not found");

        if (orderId) {
          await tx.order.update({
            where: { id: orderId },
            data: { tableId: targetTable.id }
          });
        } else if (sourceTableId && !String(sourceTableId).startsWith("order-")) {
          await tx.order.updateMany({
            where: { tableId: sourceTableId, organizationId, status: "PENDING" },
            data: { tableId: targetTable.id }
          });
        }

        // Set target table to OCCUPIED
        await tx.table.update({
          where: { id: targetTable.id },
          data: { status: "OCCUPIED" }
        });

        // If source table has no more pending orders, set to AVAILABLE
        if (sourceTableId && !String(sourceTableId).startsWith("order-")) {
          const remaining = await tx.order.count({
            where: { tableId: sourceTableId, organizationId, status: "PENDING" }
          });
          if (remaining === 0) {
            await tx.table.update({
              where: { id: sourceTableId },
              data: { status: "AVAILABLE", currentOrderId: null }
            });
          }
        }
      });

      await recordAuditLog({
        action: "TABLE_MOVED",
        entityType: "TABLE",
        entityId: targetTableId,
        organizationId,
        userId,
        details: `ຍ້າຍໂຕະ / ໂອນບິນ ຈາກໂຕະ ${sourceTableId} ໄປຫາໂຕະ ${targetTableId}`,
        metadata: {
          sourceTableId,
          targetTableId,
          orderId
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[CASHIER_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
