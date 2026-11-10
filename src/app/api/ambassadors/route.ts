import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;

    const items = await (prisma as any).ambassador.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[AMBASSADORS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const body = await request.json();
    const { name, sportType, socialMedia, promoCode, sponsorshipAmount } = body;

    const ambassador = await (prisma as any).ambassador.create({
      data: {
        name,
        sportType,
        socialMedia,
        promoCode: promoCode || null,
        sponsorshipAmount: Number(sponsorshipAmount) || 0,
        organizationId,
      },
    });

    return NextResponse.json(ambassador);
  } catch (error) {
    console.error("[AMBASSADORS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
