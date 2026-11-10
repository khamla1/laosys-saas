import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, slug, businessType, ownerName, ownerEmail } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing required fields (name, slug)" }, { status: 400 });
    }

    // Check slug uniqueness
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingOrg) {
      return NextResponse.json({ error: "Slug is already in use" }, { status: 400 });
    }

    let ownerUserId = (session.user as any).id;

    // If ownerEmail is provided, find or create the owner User
    if (ownerEmail) {
      let user = await prisma.user.findUnique({
        where: { email: ownerEmail },
      });

      if (!user) {
        const defaultPassword = await bcrypt.hash("123456", 10);
        user = await prisma.user.create({
          data: {
            name: ownerName || name,
            email: ownerEmail,
            password: defaultPassword,
            role: "SELLER",
            status: "ACTIVE",
          },
        });
      }
      ownerUserId = user.id;
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug: cleanSlug,
        businessType: businessType || "GENERIC",
        status: "ACTIVE",
        members: {
          create: {
            userId: ownerUserId,
            role: "OWNER",
          },
        },
      },
      include: {
        package: true,
        members: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(org);
  } catch (error: any) {
    console.error("[ADMIN_ORGANIZATIONS_POST]", error);
    return NextResponse.json({ error: error.message || "Failed to create organization" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const orgs = await prisma.organization.findMany({
      include: {
        package: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orgs);
  } catch (error: any) {
    console.error("[ADMIN_ORGANIZATIONS_GET]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch organizations" }, { status: 500 });
  }
}
