import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("seedImages") === "true") {
      const sampleImages = [
        "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80", 
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80", 
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80", 
        "https://images.unsplash.com/photo-1576107232684-1279f3908581?w=800&q=80", 
        "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80", 
        "https://images.unsplash.com/photo-1563805042-7684c8a9e1cb?w=800&q=80", 
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80", 
        "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800&q=80", 
      ];
      const products = await prisma.product.findMany();
      let updatedCount = 0;
      for (const product of products) {
        if (!product.images || product.images.length === 0) {
          let img = sampleImages[Math.floor(Math.random() * sampleImages.length)];
          const name = product.name.toLowerCase();
          if (name.includes('coffee') || name.includes('ກາເຟ')) img = sampleImages[0];
          else if (name.includes('cake') || name.includes('ເຄັກ')) img = sampleImages[2];
          else if (name.includes('rice') || name.includes('ເຂົ້າ')) img = sampleImages[1];
          else if (name.includes('fries') || name.includes('burger')) img = sampleImages[3];
          else if (name.includes('matcha') || name.includes('tea') || name.includes('ຊາ')) img = sampleImages[6];
          else if (name.includes('noodle') || name.includes('ເຝີ')) img = sampleImages[7];
          
          await prisma.product.update({
            where: { id: product.id },
            data: { images: [img] }
          });
          updatedCount++;
        }
      }
      return NextResponse.json({ success: true, updatedCount });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    const storefront = await prisma.storefront.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: { slug: true, name: true }
        }
      }
    });

    if (!storefront) {
      // Create a default storefront if it doesn't exist
      const newStorefront = await prisma.storefront.create({
        data: {
          organizationId,
          theme: "light",
        },
      });
      const createdStorefront = await prisma.storefront.findUnique({
        where: { id: newStorefront.id },
        include: {
          organization: { select: { slug: true, name: true } }
        }
      });
      return NextResponse.json(createdStorefront);
    }

    return NextResponse.json(storefront);
  } catch (error) {
    console.error("[STOREFRONT_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Storefront configuration is specific to an organization and can be edited by its members/owners.
    // Tenant Isolation will handle authorization via organizationId.

    const organizationId = (session.user as any).organizationId;
    const body = await request.json();
    const { theme, bannerUrl, customDomain, metadata, name, slug } = body;

    if (name || slug) {
      const cleanSlug = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-") : undefined;
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(cleanSlug ? { slug: cleanSlug } : {})
        }
      });
    }

    const storefront = await prisma.storefront.upsert({
      where: { organizationId },
      create: {
        organizationId,
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

    // Re-fetch to return with organization slug and name
    const updatedWithOrg = await prisma.storefront.findUnique({
      where: { organizationId },
      include: {
        organization: { select: { slug: true, name: true } }
      }
    });

    return NextResponse.json(updatedWithOrg);
  } catch (error) {
    console.error("[STOREFRONT_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
