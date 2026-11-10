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

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const where: any = { organizationId };

    if (dateParam) {
      const d = new Date(dateParam);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      where.startTime = { gte: start, lte: end };
    } else if (startParam && endParam) {
      where.startTime = { gte: new Date(startParam), lte: new Date(endParam) };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        resource: true
      },
      orderBy: { startTime: 'asc' }
    });

    return NextResponse.json(appointments);
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
    const { customerName, customerPhone, startTime, endTime, status, resourceId } = body;

    if (!customerName || !startTime || !endTime || !resourceId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || "SCHEDULED",
        resourceId,
        organizationId
      },
      include: {
        resource: true
      }
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
