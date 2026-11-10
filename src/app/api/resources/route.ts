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

    const resources = await prisma.serviceResource.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("[RESOURCES_GET]", error);
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
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const resource = await prisma.serviceResource.create({
      data: {
        name,
        type, // "ROOM" or "STAFF"
        organizationId,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("[RESOURCES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
