import {
  verifyMobileRequest,
  mobileSuccess,
  mobileError,
  handleCorsOptions,
} from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(req: Request) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const sinceParam = searchParams.get("since");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      organizationId: auth.organizationId,
    };

    if (statusParam && statusParam.toUpperCase() !== "ALL") {
      whereClause.status = statusParam.toUpperCase();
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = { gt: sinceDate };
      }
    }

    if (search) {
      whereClause.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { couponCode: { contains: search, mode: "insensitive" } },
      ];
      // If search looks like MongoDB ObjectId or partial ID
      if (search.length >= 6) {
        whereClause.OR.push({ id: { contains: search } });
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                },
              },
            },
          },
          table: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formattedOrders = orders.map((order) => {
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const itemsPreview = order.items
        .map((item) => `${item.product?.name || "ສິນຄ້າ"} x${item.quantity}`)
        .slice(0, 3)
        .join(", ") + (order.items.length > 3 ? ` +ອີກ ${order.items.length - 3} ລາຍການ` : "");

      const orderRef = `#ORD-${order.id.slice(-6).toUpperCase()}`;

      return {
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
          discountAmount: order.discountAmount || 0,
          couponCode: order.couponCode || null,
        },
        table: order.table ? order.table.name : null,
        itemsCount,
        itemsPreview,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return mobileSuccess({
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      pollTimestamp: new Date().toISOString(),
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error("[MOBILE_ORDERS_GET]", error);
    return mobileError("Failed to fetch orders", 500, error.message);
  }
}
