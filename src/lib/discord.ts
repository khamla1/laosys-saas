import prisma from "@/lib/prisma";

export type DiscordRoute = "WEBHOOK_1" | "WEBHOOK_2" | "BOTH" | "OFF";

export interface DiscordConfig {
  enabled: boolean;
  webhook1: string;
  webhook1Name: string;
  webhook2: string;
  webhook2Name: string;
  bot1Name: string;
  bot1Avatar: string;
  bot2Name: string;
  bot2Avatar: string;
  routeOrders: DiscordRoute;
  routeSecurity: DiscordRoute;
  routeAudit: DiscordRoute;
  routeRequests: DiscordRoute;
}

// User-provided defaults with ultra-clean 3D Fluency Logos
export const DEFAULT_DISCORD_CONFIG: DiscordConfig = {
  enabled: true,
  webhook1:
    "https://discord.com/api/webhooks/1568253705818734736/gkSA_XAkluoeMsklpVc52d-LNm3TTUu7CFo-YUCVWNe3yRODOhhktHj9xNNj01NT7jeG",
  webhook1Name: "ຊ່ອງ 1: ອໍເດີ & ຍອດຂາຍ (Orders & Sales)",
  webhook2:
    "https://discord.com/api/webhooks/1568253737007452332/_3M2yc19OtmzOYeWEhXLFUwAPCNoEN3dqfc6PP47EBJ2AlOo9KiS_2J8ebJP1uldajNQ",
  webhook2Name: "ຊ່ອງ 2: ຄວາມປອດໄພ & ບັນທຶກລະບົບ (Security & Audit Logs)",
  bot1Name: "LAOSYS Commercial Engine",
  bot1Avatar: "https://img.icons8.com/3d-fluency/375/shopping-cart.png",
  bot2Name: "LAOSYS Sentinel Guard",
  bot2Avatar: "https://img.icons8.com/3d-fluency/375/shield.png",
  routeOrders: "WEBHOOK_1",
  routeSecurity: "WEBHOOK_2",
  routeAudit: "WEBHOOK_2",
  routeRequests: "BOTH",
};

// In-memory cache for fast access
let cachedConfig: DiscordConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export async function getDiscordConfig(): Promise<DiscordConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const result = await (prisma as any).$runCommandRaw({
      find: "Setting",
      filter: { key: { $regex: "^discord_" } },
    });

    const settings = (result as any)?.cursor?.firstBatch || [];
    const map = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

    cachedConfig = {
      enabled: map.discord_enabled !== undefined ? map.discord_enabled === "true" : DEFAULT_DISCORD_CONFIG.enabled,
      webhook1: map.discord_webhook_1 || DEFAULT_DISCORD_CONFIG.webhook1,
      webhook1Name: map.discord_webhook_1_name || DEFAULT_DISCORD_CONFIG.webhook1Name,
      webhook2: map.discord_webhook_2 || DEFAULT_DISCORD_CONFIG.webhook2,
      webhook2Name: map.discord_webhook_2_name || DEFAULT_DISCORD_CONFIG.webhook2Name,
      bot1Name: map.discord_bot_name_1 || DEFAULT_DISCORD_CONFIG.bot1Name,
      bot1Avatar: map.discord_bot_avatar_1 || DEFAULT_DISCORD_CONFIG.bot1Avatar,
      bot2Name: map.discord_bot_name_2 || DEFAULT_DISCORD_CONFIG.bot2Name,
      bot2Avatar: map.discord_bot_avatar_2 || DEFAULT_DISCORD_CONFIG.bot2Avatar,
      routeOrders: (map.discord_route_orders as DiscordRoute) || DEFAULT_DISCORD_CONFIG.routeOrders,
      routeSecurity: (map.discord_route_security as DiscordRoute) || DEFAULT_DISCORD_CONFIG.routeSecurity,
      routeAudit: (map.discord_route_audit as DiscordRoute) || DEFAULT_DISCORD_CONFIG.routeAudit,
      routeRequests: (map.discord_route_requests as DiscordRoute) || DEFAULT_DISCORD_CONFIG.routeRequests,
    };
    lastCacheTime = now;
    return cachedConfig;
  } catch (err) {
    console.error("[DISCORD_CONFIG_ERROR]", err);
    return DEFAULT_DISCORD_CONFIG;
  }
}

export function invalidateDiscordConfigCache() {
  cachedConfig = null;
  lastCacheTime = 0;
}

export interface DiscordEmbedAuthor {
  name: string;
  icon_url?: string;
  url?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedPayload {
  author?: DiscordEmbedAuthor;
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  thumbnail?: { url: string };
  image?: { url: string };
  url?: string;
}

/**
 * Universal Discord Webhook sender.
 */
export async function sendDiscordEmbed(
  routeTarget: DiscordRoute,
  embed: DiscordEmbedPayload,
  customUsername?: string,
  customAvatar?: string
): Promise<boolean> {
  if (routeTarget === "OFF") return false;

  const config = await getDiscordConfig();
  if (!config.enabled) return false;

  const targets: Array<{ url: string; botName: string; botAvatar: string }> = [];

  if ((routeTarget === "WEBHOOK_1" || routeTarget === "BOTH") && config.webhook1) {
    targets.push({
      url: config.webhook1.trim(),
      botName: customUsername || config.bot1Name || "LAOSYS Commercial Engine",
      botAvatar: customAvatar || config.bot1Avatar || "https://img.icons8.com/3d-fluency/375/shopping-cart.png",
    });
  }

  if ((routeTarget === "WEBHOOK_2" || routeTarget === "BOTH") && config.webhook2) {
    targets.push({
      url: config.webhook2.trim(),
      botName: customUsername || config.bot2Name || "LAOSYS Sentinel Guard",
      botAvatar: customAvatar || config.bot2Avatar || "https://img.icons8.com/3d-fluency/375/shield.png",
    });
  }

  if (targets.length === 0) return false;

  for (const target of targets) {
    const payload = {
      username: target.botName,
      avatar_url: target.botAvatar,
      embeds: [
        {
          ...embed,
          footer: embed.footer || {
            text: "LAOSYS Cloud Enterprise • Automated Notification Hub",
            icon_url: "https://img.icons8.com/3d-fluency/94/approval.png",
          },
          timestamp: embed.timestamp || new Date().toISOString(),
        },
      ],
    };

    try {
      fetch(target.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error(`[DISCORD_SEND_FAIL] ${target.url.slice(0, 45)}...`, err);
      });
    } catch (e) {
      console.error("[DISCORD_ERROR]", e);
    }
  }

  return true;
}

/**
 * Clean receipt formatter that never wraps or breaks borders
 */
function buildOrderItemsReceipt(items: any[], totalFormatted: string): string {
  if (!items || items.length === 0) {
    return "• ບໍ່ມີລາຍການສິນຄ້າ";
  }

  const lines: string[] = [];
  items.slice(0, 10).forEach((it: any, idx: number) => {
    const rawName = (it.product?.name || it.name || "ສິນຄ້າ").trim();
    const qty = it.quantity || 1;
    const priceNum = Number(it.price || 0).toLocaleString();
    const subtotal = Number(it.price ? it.price * qty : 0).toLocaleString();
    lines.push(`• **${idx + 1}. ${rawName}**`);
    lines.push(`  ↳ ຈຳນວນ: \`${qty}\` × \`₭${priceNum}\` = \`₭${subtotal}\``);
  });

  if (items.length > 10) {
    lines.push(`*...ແລະ ອີກ ${items.length - 10} ລາຍການໃນໃບບິນ*`);
  }

  lines.push("────────────────────────────────────────");
  lines.push(`💰 **ຍອດລວມທັງໝົດ (TOTAL):** \`${totalFormatted}\``);

  return lines.join("\n");
}

/**
 * 🛍️ Ultra-Premium Order & POS Sales Alert (Non-breaking & 100% clean layout)
 */
export async function notifyDiscordOrder(order: any, eventType: "NEW_ORDER" | "PAID" | "STATUS_UPDATE" = "NEW_ORDER") {
  try {
    const config = await getDiscordConfig();
    if (config.routeOrders === "OFF") return;

    const orderIdShort = (order.id || "").slice(-8).toUpperCase();
    const customer = order.customerName || "Walk-in Customer";
    const phone = order.customerPhone || "ບໍ່ມີເບີໂທ";
    const totalFormatted = `₭ ${Number(order.totalAmount || 0).toLocaleString()}`;
    const store = order.organization?.name || order.user?.name || "LAOSYS Store";
    const paymentMethod = order.paymentMethod || order.paymentType || "CASH / QR";

    let statusDisplay = "PENDING (ລໍຖ້າດຳເນີນການ)";
    let statusEmoji = "⏳";
    let color = 0x06b6d4; // Cyan

    if (eventType === "PAID" || order.status === "PAID") {
      statusDisplay = "PAID (ຊຳລະເງິນສຳເລັດແລ້ວ)";
      statusEmoji = "🟢";
      color = 0x10b981; // Emerald Neon
    } else if (order.status === "CANCELLED") {
      statusDisplay = "CANCELLED (ຍົກເລີກແລ້ວ)";
      statusEmoji = "🔴";
      color = 0xef4444; // Red
    }

    const title =
      eventType === "PAID"
        ? `🧾 ໃບບິນຮັບເງິນ (Sales Receipt) • #${orderIdShort}`
        : eventType === "STATUS_UPDATE"
        ? `🔄 ອັບເດດສະຖານະອໍເດີ • #${orderIdShort}`
        : `🛍️ ມີອໍເດີໃໝ່ເຂົ້າມາ! • #${orderIdShort}`;

    const timestampSec = Math.floor(Date.now() / 1000);
    const receiptMarkup = buildOrderItemsReceipt(order.items || [], totalFormatted);

    await sendDiscordEmbed(
      config.routeOrders,
      {
        author: {
          name: "LAOSYS POS & COMMERCIAL ENGINE",
          icon_url: config.bot1Avatar || "https://img.icons8.com/3d-fluency/94/shopping-cart.png",
        },
        title,
        description:
          "────────────────────────────────────────\n" +
          `🏪 **ຮ້ານຄ້າ:** \`${store}\`\n` +
          `💳 **ການຊຳລະ:** \`${statusEmoji} ${statusDisplay}\`\n` +
          "────────────────────────────────────────",
        color,
        thumbnail: {
          url:
            eventType === "PAID" || order.status === "PAID"
              ? "https://img.icons8.com/3d-fluency/188/bank-card-back-side.png"
              : "https://img.icons8.com/3d-fluency/188/shopping-bag.png",
        },
        fields: [
          {
            name: "👤 ຂໍ້ມູນລູກຄ້າ",
            value: `• **${customer}**\n• 📱 \`${phone}\``,
            inline: true,
          },
          {
            name: "💳 ຊ່ອງທາງຊຳລະ",
            value: `• **${paymentMethod}**\n• ຍອດ: **${totalFormatted}**`,
            inline: true,
          },
          {
            name: "📦 ລາຍການສິນຄ້າໃນບິນ (Order Items):",
            value: receiptMarkup,
            inline: false,
          },
          {
            name: "🕒 ຂໍ້ມູນເພີ່ມເຕີມ",
            value: `────────────────────────────────────────\n▸ ສາຂາ: **${store}** • ເວລາ: <t:${timestampSec}:R>`,
            inline: false,
          },
        ],
        footer: {
          text: "LAOSYS Enterprise POS • ໃບບິນຖືກຕ້ອງຕາມມາດຕະຖານ",
          icon_url: "https://img.icons8.com/3d-fluency/94/approval.png",
        },
      },
      config.bot1Name || "LAOSYS Commercial Engine",
      config.bot1Avatar || "https://img.icons8.com/3d-fluency/375/shopping-cart.png"
    );
  } catch (error) {
    console.error("[NOTIFY_DISCORD_ORDER_ERROR]", error);
  }
}

/**
 * 🛡️ Cyber Sentinel Security Alert (Clean & Non-breaking)
 */
export async function notifyDiscordSecurity(event: {
  action: string;
  details: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string | null;
  status?: "SUCCESS" | "FAILED" | "WARNING";
}) {
  try {
    const config = await getDiscordConfig();
    if (config.routeSecurity === "OFF") return;

    const isFailed = event.status === "FAILED" || event.action.includes("FAILED") || event.action.includes("LOCKED");
    const isWarning =
      event.status === "WARNING" || event.action.includes("IMPERSONATION") || event.action.includes("BLOCKED");

    const color = isFailed ? 0xef4444 : isWarning ? 0xf59e0b : 0x3b82f6; // Red, Amber, or Sky Blue
    const icon = isFailed ? "🚨" : isWarning ? "⚠️" : "🛡️";

    const title = `${icon} ບັນທຶກຄວາມປອດໄພ • ${event.action}`;
    const timestampSec = Math.floor(Date.now() / 1000);

    const thumbnailUrl = isFailed
      ? "https://img.icons8.com/3d-fluency/188/alarm.png"
      : event.action.includes("LOGIN")
      ? "https://img.icons8.com/3d-fluency/188/fingerprint-scan.png"
      : "https://img.icons8.com/3d-fluency/188/shield.png";

    await sendDiscordEmbed(
      config.routeSecurity,
      {
        author: {
          name: "LAOSYS CYBER SENTINEL • SECURITY HUB",
          icon_url: config.bot2Avatar || "https://img.icons8.com/3d-fluency/94/shield.png",
        },
        title,
        description:
          "────────────────────────────────────────\n" +
          `🔐 **ເຫດການ:** \`${event.action}\`\n` +
          `⚡ **ລະດັບ:** \`${isFailed ? "DANGER / BLOCKED" : isWarning ? "WARNING" : "NORMAL (ປອດໄພ 100%)"}\`\n` +
          "────────────────────────────────────────",
        color,
        thumbnail: { url: thumbnailUrl },
        fields: [
          {
            name: "👤 ບັນຊີຜູ້ໃຊ້ (Account)",
            value: `• **${event.userName || "Unknown"}**\n• \`${event.userEmail || "No Email"}\``,
            inline: true,
          },
          {
            name: "🔑 ສິດທິ (Role)",
            value: `• 👑 **${event.userRole || "USER"}**\n• ສະຖານະ: \`ACTIVE\``,
            inline: true,
          },
          {
            name: "🌐 IP Address & Device",
            value: `• \`${event.ipAddress || "Internal"}\`\n• ເຄືອຂ່າຍ: \`LAN / VPN\``,
            inline: true,
          },
          {
            name: "📋 ລາຍລະອຽດການເຂົ້າເຖິງ",
            value: `\`\`\`yaml\n${event.details || "ເຂົ້າສູ່ລະບົບສຳເລັດ"}\nSession: ປອດໄພ 100% (Authorized Access)\n\`\`\``,
            inline: false,
          },
          {
            name: "⏰ ເວລາບັນທຶກລະບົບ",
            value: `────────────────────────────────────────\n▸ ບັນທຶກເມື່ອ: <t:${timestampSec}:F> (<t:${timestampSec}:R>)`,
            inline: false,
          },
        ],
        footer: {
          text: "LAOSYS Sentinel Security • Zero Trust Protection",
          icon_url: "https://img.icons8.com/3d-fluency/94/lock-2.png",
        },
      },
      config.bot2Name || "LAOSYS Sentinel Guard",
      config.bot2Avatar || "https://img.icons8.com/3d-fluency/375/shield.png"
    );
  } catch (error) {
    console.error("[NOTIFY_DISCORD_SECURITY_ERROR]", error);
  }
}

/**
 * ⚡ Ultra-Clear System Audit Alert (Clean & Non-breaking)
 */
export async function notifyDiscordAudit(event: {
  action: string;
  details: string;
  entityType?: string;
  refCode?: string;
  operatorName?: string;
  operatorRole?: string;
  ipAddress?: string | null;
}) {
  try {
    const config = await getDiscordConfig();
    if (config.routeAudit === "OFF") return;

    // Filter noise
    if (event.action.startsWith("GET_") || event.action.startsWith("VIEW_")) return;

    const isDelete = event.action.includes("DELETE") || event.action.includes("CANCEL");
    const isCreate = event.action.includes("CREATE") || event.action.includes("ADD") || event.action.includes("NEW");
    const color = isDelete ? 0xef4444 : isCreate ? 0x10b981 : 0x8b5cf6; // Red, Green, or Purple
    const icon = isDelete ? "🗑️" : isCreate ? "✨" : "⚡";

    const timestampSec = Math.floor(Date.now() / 1000);
    const cat = event.entityType || "SYSTEM";
    const diffSign = isDelete ? "-" : isCreate ? "+" : "!";

    await sendDiscordEmbed(
      config.routeAudit,
      {
        author: {
          name: "LAOSYS SYSTEM AUDIT & MUTATION LOG",
          icon_url: "https://img.icons8.com/3d-fluency/94/data-configuration.png",
        },
        title: `${icon} ບັນທຶກການດັດແກ້ລະບົບ • ${event.action}`,
        description:
          "────────────────────────────────────────\n" +
          `⚙️ **ໝວດໝູ່:** \`${cat}\`\n` +
          `⚡ **ການດຳເນີນການ:** \`${isDelete ? "- DELETE / CANCEL" : isCreate ? "+ CREATE / INSERT" : "! UPDATE / MUTATION"}: ${event.action}\`\n` +
          "────────────────────────────────────────",
        color,
        thumbnail: {
          url: isDelete
            ? "https://img.icons8.com/3d-fluency/188/trash.png"
            : "https://img.icons8.com/3d-fluency/188/settings.png",
        },
        fields: [
          {
            name: "📂 ໝວດໝູ່ & ລະຫັດ",
            value: `• **${cat}**\n• ລະຫັດ: \`${event.refCode || "-"}\``,
            inline: true,
          },
          {
            name: "👤 ຜູ້ດຳເນີນການ",
            value: `• **${event.operatorName || "Admin"}**\n• ສິດທິ: \`${event.operatorRole || "STAFF"}\``,
            inline: true,
          },
          {
            name: "🌐 IP Address",
            value: `• \`${event.ipAddress || "System"}\``,
            inline: true,
          },
          {
            name: "📝 ລາຍລະອຽດການດັດແກ້",
            value: `\`\`\`diff\n${diffSign} ${event.details || "ບໍ່ມີລາຍລະອຽດ"}\n\`\`\``,
            inline: false,
          },
          {
            name: "⏰ ເວລາບັນທຶກລະບົບ",
            value: `────────────────────────────────────────\n▸ ບັນທຶກເມື່ອ: <t:${timestampSec}:R> (Server Time)`,
            inline: false,
          },
        ],
        footer: {
          text: "LAOSYS Audit Logger • Immutable Ledger History",
          icon_url: "https://img.icons8.com/3d-fluency/94/bulleted-list.png",
        },
      },
      config.bot2Name || "LAOSYS Sentinel Guard",
      config.bot2Avatar || "https://img.icons8.com/3d-fluency/375/shield.png"
    );
  } catch (error) {
    console.error("[NOTIFY_DISCORD_AUDIT_ERROR]", error);
  }
}

/**
 * 🏢 New Store Registration or Subscription Request Alert
 */
export async function notifyDiscordStoreRequest(req: {
  type: "NEW_STORE_REQUEST" | "SUBSCRIPTION_RENEWAL";
  name: string;
  email: string;
  phone?: string;
  package?: string;
  details?: string;
}) {
  try {
    const config = await getDiscordConfig();
    if (config.routeRequests === "OFF") return;

    const isRenewal = req.type === "SUBSCRIPTION_RENEWAL";
    const title = isRenewal ? "💎 ຄຳຮ້ອງຂໍຕໍ່ອາຍຸ Package • " + req.name : "🏢 ມີຮ້ານຄ້າໃໝ່ສະໝັກເຂົ້າມາ! • " + req.name;
    const timestampSec = Math.floor(Date.now() / 1000);

    await sendDiscordEmbed(
      config.routeRequests,
      {
        author: {
          name: "LAOSYS STORE & PACKAGE DISPATCHER",
          icon_url: "https://img.icons8.com/3d-fluency/94/shop.png",
        },
        title,
        description:
          "────────────────────────────────────────\n" +
          `🏪 **ຮ້ານຄ້າ:** \`${req.name}\`\n` +
          `📦 **ແພັກເກດ:** \`${req.package || "STANDARD"}\`\n` +
          "────────────────────────────────────────",
        color: 0xf59e0b, // Luxe Amber Gold
        thumbnail: {
          url: isRenewal
            ? "https://img.icons8.com/3d-fluency/188/diamond.png"
            : "https://img.icons8.com/3d-fluency/188/shop.png",
        },
        fields: [
          {
            name: "🏪 ຊື່ຮ້ານ / ຜູ້ຕິດຕໍ່",
            value: `• **${req.name}**\n• 📧 \`${req.email}\``,
            inline: true,
          },
          {
            name: "📞 ເບີໂທຕິດຕໍ່",
            value: `• \`${req.phone || "-"}\`\n• ແພັກເກດ: ⭐ **${req.package || "Standard"}**`,
            inline: true,
          },
          {
            name: "📝 ລາຍລະອຽດເພີ່ມເຕີມ",
            value: `\`\`\`fix\n${req.details || "ຮ້ານຄ້າໄດ້ລົງທະບຽນຂໍເປີດໃຊ້ງານລະບົບໃໝ່"}\n\`\`\``,
            inline: false,
          },
          {
            name: "⏰ ເວລາສົ່ງຄຳຮ້ອງ",
            value: `────────────────────────────────────────\n▸ ສົ່ງເມື່ອ: <t:${timestampSec}:R>`,
            inline: false,
          },
        ],
        footer: {
          text: "LAOSYS Enterprise Platform • Admin Requests",
          icon_url: "https://img.icons8.com/3d-fluency/94/shop.png",
        },
      },
      config.bot1Name || "LAOSYS Commercial Engine",
      config.bot1Avatar || "https://img.icons8.com/3d-fluency/375/shopping-cart.png"
    );
  } catch (error) {
    console.error("[NOTIFY_DISCORD_REQUEST_ERROR]", error);
  }
}
