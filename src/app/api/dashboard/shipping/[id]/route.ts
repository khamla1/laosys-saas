import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    const existingRoute = await prisma.shippingRoute.findUnique({ where: { id } });
    if (existingRoute && existingRoute.organizationId === organizationId) {
      const updated = await prisma.shippingRoute.update({
        where: { id },
        data: {
          destination: body.destination !== undefined ? body.destination : existingRoute.destination,
          carrier: body.carrier !== undefined ? body.carrier : existingRoute.carrier,
          trackingNumber: body.trackingNumber !== undefined ? body.trackingNumber : existingRoute.trackingNumber,
          status: body.status !== undefined ? body.status : existingRoute.status,
        },
      });
      return NextResponse.json(updated);
    }

    // Fallback: check Order
    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (existingOrder && existingOrder.organizationId === organizationId) {
      let nextStatus = existingOrder.status;
      if (body.status === "PENDING") nextStatus = "PENDING";
      else if (body.status === "SHIPPED") nextStatus = "SHIPPED";
      else if (body.status === "DELIVERED") nextStatus = "COMPLETED";

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: nextStatus,
        },
      });
      return NextResponse.json(updatedOrder);
    }

    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existingRoute = await prisma.shippingRoute.findUnique({ where: { id } });
    if (existingRoute && existingRoute.organizationId === organizationId) {
      await prisma.shippingRoute.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (existingOrder && existingOrder.organizationId === organizationId) {
      await prisma.order.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
