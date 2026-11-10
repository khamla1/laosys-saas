import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    let whereClause: any = { organizationId };

    if (startParam && endParam) {
      whereClause.startTime = {
        gte: new Date(startParam),
        lte: new Date(endParam)
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        resource: true,
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("[APPOINTMENTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const body = await request.json();
    const { customerName, customerPhone, startTime, endTime, resourceId, status } = body;

    if (!customerName || !startTime || !endTime || !resourceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify resource belongs to org
    const resource = await prisma.serviceResource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || "SCHEDULED",
        resourceId,
        organizationId,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
