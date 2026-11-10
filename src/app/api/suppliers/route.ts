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

    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
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
    const { name, contactName, email, phone, address, contactInfo } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName: contactName || contactInfo || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        organizationId
      }
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
