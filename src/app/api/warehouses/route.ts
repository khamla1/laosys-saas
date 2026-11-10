import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, location } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
        organizationId
      }
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error("Failed to create warehouse:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
