import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const globalBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!globalBotToken) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured on the server." }, { status: 500 });
    }

    const message = "✅ ທົດສອບສຳເລັດ\n📱 Telegram ພ້ອມໃຊ້ງານ";

    const res = await fetch(`https://api.telegram.org/bot${globalBotToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[TELEGRAM ERROR]", errorText);
      return NextResponse.json({ error: "Failed to send Telegram message. Please check the Chat ID and ensure you have started the bot." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TELEGRAM ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
