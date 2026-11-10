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

    const existingTable = await prisma.table.findUnique({
      where: { id },
      include: { zone: true }
    });

    if (!existingTable || existingTable.zone.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        name: body.name,
        seats: body.seats ? parseInt(body.seats) : undefined,
      }
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("[TABLE_PUT]", error);
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

    const existingTable = await prisma.table.findUnique({
      where: { id },
      include: { zone: true }
    });

    if (!existingTable || existingTable.zone.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.table.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TABLE_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
