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

    const storefront = await prisma.storefront.findUnique({
      where: { organizationId: id },
    });

    if (!storefront) {
      // Create a default storefront if it doesn't exist
      const newStorefront = await prisma.storefront.create({
        data: {
          organizationId: id,
          theme: "light",
        },
      });
      return NextResponse.json(newStorefront);
    }

    return NextResponse.json(storefront);
  } catch (error) {
    console.error("[ADMIN_STOREFRONT_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    const { theme, bannerUrl, customDomain, metadata } = body;

    const storefront = await prisma.storefront.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        theme: theme || "light",
        bannerUrl,
        customDomain,
        metadata,
      },
      update: {
        theme,
        bannerUrl,
        customDomain,
        metadata,
      },
    });

    return NextResponse.json(storefront);
  } catch (error: any) {
    console.error("[ADMIN_STOREFRONT_PATCH]", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Custom domain is already in use by another store" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
