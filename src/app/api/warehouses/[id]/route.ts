import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, location } = body;

    const warehouse = await prisma.warehouse.updateMany({
      where: { id, organizationId },
      data: { name, location }
    });

    if (warehouse.count === 0) {
      return NextResponse.json({ error: "Warehouse not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update warehouse:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.warehouse.deleteMany({
      where: { id, organizationId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Warehouse not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete warehouse:", error);
    if ((error as any).code === "P2014" || (error as any).code === "P2003") {
      return NextResponse.json({ error: "Cannot delete warehouse because it contains stock." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
