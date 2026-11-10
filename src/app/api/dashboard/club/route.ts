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

    const items = await prisma.club.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    
    const body = await req.json();
    const { name, description, logo, status } = body;

    const newItem = await prisma.club.create({
      data: {
        name,
        clubCode: body.clubCode || `CLUB-${Date.now()}`,
        description,
        image: logo || undefined,
        foundedDate: body.foundedDate ? new Date(body.foundedDate) : new Date(),
        status: status || "ACTIVE",
        organizationId
      }
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
