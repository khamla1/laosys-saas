import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const media = await prisma.mediaGallery.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(media);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { title, imageUrl, description, addedBy } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const media = await prisma.mediaGallery.create({
      data: {
        title,
        imageUrl,
        description,
        addedBy,
        organizationId
      }
    });

    return NextResponse.json(media);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
