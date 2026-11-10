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

    const classes = await prisma.coachingClass.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(classes);
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
    const { name, description, coachName, maxStudents, scheduleInfo, price } = body;

    if (!name || !coachName || !maxStudents || !scheduleInfo) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const newClass = await prisma.coachingClass.create({
      data: {
        name,
        description,
        coachName,
        maxStudents: parseInt(maxStudents),
        scheduleInfo,
        price: price ? parseFloat(price) : 0,
        status: "OPEN",
        organizationId
      }
    });

    return NextResponse.json(newClass);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
