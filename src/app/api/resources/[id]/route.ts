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

    const existingResource = await prisma.serviceResource.findUnique({
      where: { id }
    });

    if (!existingResource || existingResource.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const resource = await prisma.serviceResource.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
      }
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("[RESOURCE_PUT]", error);
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

    const existingResource = await prisma.serviceResource.findUnique({
      where: { id }
    });

    if (!existingResource || existingResource.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.serviceResource.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESOURCE_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
