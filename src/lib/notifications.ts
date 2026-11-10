import { notifyDiscordOrder } from "@/lib/discord";
export async function sendLineNotify(token: string, message: string) {
  try {
    const formData = new URLSearchParams();
    formData.append("message", message);

    const res = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: formData.toString()
    });

    if (!res.ok) {
      console.error("LINE Notify Error:", await res.text());
    }
  } catch (error) {
    console.error("Failed to send LINE notification:", error);
  }
}

export async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  try {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: "HTML"
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[TELEGRAM ERROR]", errorText);
    } else {
      console.log("[TELEGRAM SENT] to", cleanChatId);
    }
  } catch (error) {
    console.error("[TELEGRAM ERROR]", error);
  }
}

import prisma from "@/lib/prisma";

export async function notifyNewOrder(storeId: string, orderDetails: { orderId: string, totalAmount: number, customerName: string, itemsSummary?: string, itemsCount?: number, source?: string }) {
  // Legacy function - left here to prevent breakage if there are callers we miss
  try {
    const user = await prisma.user.findUnique({
      where: { id: storeId },
      select: { 
        lineNotifyToken: true, 
        telegramChatId: true,
        telegramEnabled: true
      }
    });

    if (!user) return;

    // Format current date: DD/MM/YYYY • HH:mm
    const now = new Date();
    const messageText = `🔔 ອໍເດີໃໝ່\n\n🧾 Order: #${orderDetails.orderId.slice(-8).toUpperCase()}\n👤 Customer: ${orderDetails.customerName}\n💰 Total: ${orderDetails.totalAmount.toLocaleString()} ₭`;

    const promises = [];

    if (user.lineNotifyToken) {
      promises.push(sendLineNotify(user.lineNotifyToken, messageText.replace(/<[^>]*>?/gm, '')));
    }

    if (user.telegramEnabled && user.telegramChatId) {
      const globalBotToken = process.env.TELEGRAM_BOT_TOKEN;
      if (globalBotToken) {
        promises.push(
          sendTelegramMessage(globalBotToken, user.telegramChatId, messageText)
            .then(() => console.log("[TELEGRAM SENT]", orderDetails.orderId))
        );
      }
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("Error in notifyNewOrder:", error);
  }
}

export type NotificationType = "NEW_ORDER" | "PAYMENT_SUCCESS" | "ORDER_SHIPPED";

export function formatTelegramOrderMessage(order: any): string {
  const orderIdShort = order.id.slice(-8).toUpperCase();
  const customerName = order.customerName || "ບໍ່ລະບຸຊື່";
  const phone = order.customerPhone || "ບໍ່ມີເບີໂທ";
  const totalStr = order.totalAmount?.toLocaleString("en-US") || "0";
  
  const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
  
  let productList = "<i>ບໍ່ມີລາຍການສິນຄ້າ</i>";
  if (order.items && order.items.length > 0) {
    productList = order.items.map((item: any) => {
      const pName = item.product?.name || "ສິນຄ້າ";
      return `• ${pName} × ${item.quantity}`;
    }).join("\n");
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', hour12: false });

  let statusStr = "ລໍຖ້າດຳເນີນການ";
  if (order.status === "PAID") statusStr = "ຈ່າຍເງິນແລ້ວ";

  return `🚀 <b>LAOSYS</b>
🔔 <b>ມີອໍເດີໃໝ່ເຂົ້າມາ</b>

━━━━━━━━━━━━━━━━━━
🧾 <b>ລະຫັດອໍເດີ:</b> #${orderIdShort}
👤 <b>ລູກຄ້າ:</b> ${customerName}
📞 <b>ເບີໂທ:</b> ${phone}
📦 <b>ຈຳນວນສິນຄ້າ:</b> ${itemCount} ລາຍການ
💰 <b>ຍອດລວມ:</b> ${totalStr} ₭

📋 <b>ລາຍການສິນຄ້າ:</b>
${productList}
━━━━━━━━━━━━━━━━━━

🕒 <b>ເວລາ:</b> ${dateStr} ${timeStr}
📍 <b>ສະຖານະ:</b> ${statusStr}

🌐 <i>LAOSYS E-Commerce Platform</i>`;
}

export async function sendOrderNotification(orderId: string, type: NotificationType = "NEW_ORDER", options?: { source?: string }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        organization: {
          include: {
            members: {
              where: { role: "OWNER" },
              include: {
                user: {
                  select: {
                    lineNotifyToken: true,
                    telegramChatId: true,
                    telegramEnabled: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) return;

    // 🚀 Super Admin & Business Discord Alert (Every order in the system)
    notifyDiscordOrder(order, type).catch((err) => console.error("[DISCORD_ORDER_ERROR]", err));

    const ownerUser = order?.organization?.members?.[0]?.user;
    if (!ownerUser) return;

    const messageHtml = formatTelegramOrderMessage(order);
    
    // Also send a fallback simplified text to LINE if they have it
    const lineText = messageHtml.replace(/<[^>]*>?/gm, '');

    const promises = [];

    if (ownerUser.lineNotifyToken) {
      promises.push(sendLineNotify(ownerUser.lineNotifyToken, lineText));
    }

    if (ownerUser.telegramEnabled && ownerUser.telegramChatId) {
      const globalBotToken = process.env.TELEGRAM_BOT_TOKEN;
      if (globalBotToken) {
        promises.push(
          sendTelegramMessage(globalBotToken, ownerUser.telegramChatId, messageHtml)
            .then(() => console.log("[TELEGRAM SENT]", order.id))
        );
      }
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("[TELEGRAM ERROR]", error);
  }
}

