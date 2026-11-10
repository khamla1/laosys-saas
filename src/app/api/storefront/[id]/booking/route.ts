import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const store = await prisma.organization.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!store) {
      return new NextResponse("Store not found", { status: 404 });
    }

    const resources = await prisma.serviceResource.findMany({
      where: { organizationId: store.id }
    });

    const appointments = await prisma.appointment.findMany({
      where: { 
        organizationId: store.id,
        status: { not: "CANCELLED" },
        startTime: { gte: new Date() } 
      },
      select: {
        id: true,
        resourceId: true,
        startTime: true,
        endTime: true
      }
    });

    return NextResponse.json({ resources, appointments });
  } catch (error) {
    console.error("[STOREFRONT_BOOKING_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = await prisma.organization.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!store) {
      return new NextResponse("Store not found", { status: 404 });
    }

    const body = await request.json();
    const { customerName, customerPhone, startTime, endTime, resourceId } = body;

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "SCHEDULED",
        resourceId,
        organizationId: store.id
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[STOREFRONT_BOOKING_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
