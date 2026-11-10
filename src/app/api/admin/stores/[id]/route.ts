import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const store = await prisma.organization.findUnique({
      where: { id },
      include: {
        package: true,
      }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error: any) {
    console.error("[ADMIN_STORE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    
    // We can update name, slug, businessType, subscriptionExpiresAt, enabledModules, metadata
    const { name, slug, businessType, subscriptionExpiresAt, enabledModules, metadata } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (businessType !== undefined) updateData.businessType = businessType;
    if (subscriptionExpiresAt !== undefined) updateData.subscriptionExpiresAt = subscriptionExpiresAt;
    if (enabledModules !== undefined) updateData.enabledModules = enabledModules;
    
    // For metadata, we merge if it exists
    if (metadata !== undefined) {
      const existing = await prisma.organization.findUnique({ where: { id } });
      updateData.metadata = {
        ...(existing?.metadata as object || {}),
        ...metadata
      };
    }

    const store = await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(store);
  } catch (error: any) {
    console.error("[ADMIN_STORE_PATCH]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_STORE_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PUT = PATCH;
