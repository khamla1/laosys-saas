import {
  verifyMobileRequest,
  mobileSuccess,
  mobileError,
  handleCorsOptions,
} from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
                category: true,
                metadata: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            zone: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!order) {
      return mobileError("Order not found", 404);
    }

    if (order.organizationId !== auth.organizationId && !auth.isAdmin) {
      return mobileError("Access denied to this order", 403);
    }

    const items = order.items.map((item) => {
      const prodMeta = (item.product?.metadata as any) || {};
      return {
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || "ສິນຄ້າ",
        productImage: item.product?.images?.[0] || null,
        categoryName: item.product?.category || null,
        barcode: prodMeta.barcode || null,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        status: item.status,
        modifiers: item.modifiers,
        metadata: item.metadata,
      };
    });

    const orderRef = `#ORD-${order.id.slice(-6).toUpperCase()}`;

    return mobileSuccess({
      order: {
        id: order.id,
        orderNumber: orderRef,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: "LAK",
        customer: {
          name: order.customerName || "ລູກຄ້າທົ່ວໄປ",
          phone: order.customerPhone || null,
          email: order.customerEmail || null,
          address: order.customerAddress || null,
          note: order.customerNote || null,
        },
        payment: {
          method: order.paymentMethod,
          slipUrl: order.paymentSlipUrl || null,
          couponCode: order.couponCode || null,
          discountAmount: order.discountAmount || 0,
        },
        table: order.table
          ? {
              id: order.table.id,
              name: order.table.name,
              zone: order.table.zone?.name || null,
            }
          : null,
        itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
        items,
        metadata: order.metadata,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("[MOBILE_ORDER_DETAIL_GET]", error);
    return mobileError("Failed to fetch order details", 500, error.message);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const newStatus = body.status;
    const note = body.note;

    if (!newStatus) {
      return mobileError("New status is required (e.g. PROCESSING, COMPLETED, CANCELLED)", 400);
    }

    const validStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(newStatus)) {
      return mobileError(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(", ")}`, 400);
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return mobileError("Order not found", 404);
    }

    if (order.organizationId !== auth.organizationId && !auth.isAdmin) {
      return mobileError("Access denied to this order", 403);
    }

    const oldStatus = order.status;

    if (oldStatus === newStatus) {
      return mobileSuccess({
        message: `Order status is already ${newStatus}`,
        order: { id, status: newStatus },
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus as any,
      },
    });

    // Record audit log entry
    try {
      await recordAuditLog({
        action: "UPDATE",
        tableName: "Order",
        recordId: id,
        oldData: { status: oldStatus },
        newData: { status: newStatus, note, updatedVia: "MOBILE_API" },
        organizationId: auth.organizationId,
        operatorName: `Mobile App (${auth.authMethod || "API"})`,
        operatorRole: "API_INTEGRATION",
      });
    } catch {
      // audit log error shouldn't fail order update
    }

    const orderRef = `#ORD-${id.slice(-6).toUpperCase()}`;

    return mobileSuccess({
      message: `Order ${orderRef} status updated to ${newStatus}`,
      order: {
        id: updated.id,
        orderNumber: orderRef,
        oldStatus,
        newStatus: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("[MOBILE_ORDER_STATUS_PATCH]", error);
    return mobileError("Failed to update order status", 500, error.message);
  }
}
