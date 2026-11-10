import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { telegramChatId: true, telegramEnabled: true, lineNotifyToken: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: user,
      connections: []
    });
  } catch (error: any) {
    console.error("Fetch Telegram Settings Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { telegramChatId, telegramEnabled, lineNotifyToken } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        telegramChatId,
        telegramEnabled,
        lineNotifyToken: lineNotifyToken || null
      },
      select: { telegramChatId: true, telegramEnabled: true, lineNotifyToken: true }
    });

    return NextResponse.json({ success: true, settings: updatedUser });
  } catch (error: any) {
    console.error("Update Telegram Settings Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
