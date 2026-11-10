import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { telegramChatId: true, telegramEnabled: true }
    });

    if (!user || !user.telegramChatId) {
      return NextResponse.json({ error: "Store does not have a Telegram Chat ID configured." }, { status: 400 });
    }

    const globalBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!globalBotToken) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured on the server." }, { status: 500 });
    }

    await sendTelegramMessage(
      globalBotToken,
      user.telegramChatId,
      "✅ <b>Test notification from LAOSYS</b>\n\nIf you see this, notifications are working correctly for this store."
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Test Telegram Notification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
