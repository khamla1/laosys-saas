import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const organizationId = (session.user as any).organizationId;
    const body = await request.json();

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment || existingAppointment.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        resourceId: body.resourceId,
        status: body.status,
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const organizationId = (session.user as any).organizationId;
    const body = await request.json();

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment || existingAppointment.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: body.status,
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const organizationId = (session.user as any).organizationId;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment || existingAppointment.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[APPOINTMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
