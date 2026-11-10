import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";
    const organizationId = (session.user as any).organizationId;

    const order = await logger.trackQuery(`GET /api/orders/${id}`, () => prisma.order.findUnique({
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
              }
            }
          }
        },
        table: true
      }
    }), 150);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin && order.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enterprise Caching for detail fetches
    return NextResponse.json(order, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
        'Vary': 'Cookie'
      }
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";
    const organizationId = (session.user as any).organizationId;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin && order.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentStatus = order.status;
    const newStatus = body.status;

    if (currentStatus === newStatus) {
      return NextResponse.json(order);
    }

    // --- Strict Order Status System ---
    // Transition Map
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!isAdmin) {
      // Rule: COMPLETED and CANCELLED are locked
      if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
        return NextResponse.json({ error: `Order is ${currentStatus} and cannot be changed.` }, { status: 400 });
      }

      // Rule: Check transition map
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        return NextResponse.json({ error: `Invalid transition from ${currentStatus} to ${newStatus}.` }, { status: 400 });
      }
    }

    // Perform Update and Audit Logging in a transaction
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: newStatus },
      }),
      prisma.auditLog.create({
        data: {
          action: "UPDATE_ORDER_STATUS",
          details: `ປ່ຽນສະຖານະອໍເດີ #${id.slice(-6).toUpperCase()} ຈາກ ${currentStatus} ເປັນ ${newStatus}`,
          userId: userId,
          organizationId: order.organizationId,
          metadata: {
            entityType: "ORDER",
            entityId: id,
            refCode: `ORD-${id.slice(-6).toUpperCase()}`,
            oldStatus: currentStatus,
            newStatus: newStatus,
          }
        }
      }),
      (prisma as any).notification.create({
        data: {
          organizationId: order.organizationId,
          title: "ສະຖານະອໍເດີປ່ຽນແປງ (Order Status)",
          message: `ອໍເດີ (Order) #${id.slice(-6)} ປ່ຽນເປັນ ${newStatus}`,
          type: "ORDER",
          link: "/dashboard/orders"
        }
      })
    ]);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only admins can delete orders" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Delete related OrderItems first, then the Order (if cascade delete is not setup)
    await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { orderId: id }
      }),
      prisma.order.delete({
        where: { id },
      }),
      prisma.auditLog.create({
        data: {
          action: "DELETE_ORDER",
          details: `ລຶບອໍເດີ #${id.slice(-6).toUpperCase()}`,
          userId: (session.user as any).id,
          organizationId: order.organizationId,
          metadata: {
            entityType: "ORDER",
            entityId: id,
            refCode: `ORD-${id.slice(-6).toUpperCase()}`,
          }
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
