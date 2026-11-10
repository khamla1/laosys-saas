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

    const items = await (prisma as any).coachingClass.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[COACHING_GET]", error);
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
    const { name, description, coachName, maxStudents, scheduleInfo, price } = body;

    const coachingClass = await (prisma as any).coachingClass.create({
      data: {
        name,
        description,
        coachName,
        maxStudents: Number(maxStudents) || 1,
        scheduleInfo,
        price: Number(price) || 0,
        organizationId,
      },
    });

    return NextResponse.json(coachingClass);
  } catch (error) {
    console.error("[COACHING_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
