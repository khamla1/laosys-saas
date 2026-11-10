import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const routes = await prisma.shippingRoute.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        OR: [
          { tableId: null },
          { customerAddress: { not: null } },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const manualItems = routes.map((r) => ({
      id: r.id,
      type: "MANUAL",
      destination: r.destination,
      carrier: r.carrier,
      trackingNumber: r.trackingNumber || "",
      status: r.status || "PENDING",
      customerName: r.destination,
      customerPhone: "-",
      customerAddress: r.destination,
      customerNote: "-",
      totalAmount: 0,
      orderItems: [],
      createdAt: r.createdAt,
    }));

    const orderItems = orders.map((o) => {
      let status = "PENDING";
      const s = o.status as string;
      if (s === "SHIPPED" || s === "IN_TRANSIT" || s === "PROCESSING") {
        status = "SHIPPED";
      } else if (s === "COMPLETED" || s === "DELIVERED" || s === "PAID") {
        status = "DELIVERED";
      }

      // Determine Carrier from formattedAddress or default
      let carrier = "Anousith / ขนส่งด่วน";
      if (o.customerAddress?.includes("PICKUP") || o.customerAddress?.includes("รับเครื่องเอง")) {
        carrier = "Store Pickup (ຮັບເຄື່ອງໜ້າຮ້ານ)";
      } else if (o.customerAddress?.includes("MESSENGER") || o.customerAddress?.includes("แมสเซนเจอร์")) {
        carrier = "Messenger Delivery";
      }

      return {
        id: o.id,
        type: "ONLINE_ORDER",
        destination: o.customerAddress || o.customerName || "ວຽງຈັນ",
        carrier,
        trackingNumber: `ORD-${o.id.slice(-6).toUpperCase()}`,
        status,
        customerName: o.customerName || "ລູກຄ້າອອນລາຍ",
        customerPhone: o.customerPhone || "-",
        customerAddress: o.customerAddress || "-",
        customerNote: (o as any).note || o.customerNote || "-",
        totalAmount: o.totalAmount || 0,
        orderItems: o.items.map((i) => ({
          name: i.product?.name || "ສິນຄ້າ",
          quantity: i.quantity,
          price: i.price,
        })),
        createdAt: o.createdAt,
      };
    });

    const allItems = [...orderItems, ...manualItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { destination, carrier, trackingNumber, status } = body;

    if (!destination || !carrier) {
      return NextResponse.json({ error: "destination and carrier are required" }, { status: 400 });
    }

    const newItem = await prisma.shippingRoute.create({
      data: {
        destination,
        carrier,
        trackingNumber: trackingNumber || "",
        status: status || "PENDING",
        organizationId,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
