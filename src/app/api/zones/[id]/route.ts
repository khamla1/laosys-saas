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

    const existingZone = await prisma.zone.findUnique({
      where: { id }
    });

    if (!existingZone || existingZone.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const zone = await prisma.zone.update({
      where: { id },
      data: {
        name: body.name,
      }
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error("[ZONE_PUT]", error);
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

    const existingZone = await prisma.zone.findUnique({
      where: { id }
    });

    if (!existingZone || existingZone.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.zone.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ZONE_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
