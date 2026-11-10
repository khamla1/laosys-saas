import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendDiscordEmbed, getDiscordConfig } from "@/lib/discord";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const target = body.target || "BOTH"; // "WEBHOOK_1" | "WEBHOOK_2" | "BOTH"
    const config = await getDiscordConfig();

    if (target === "WEBHOOK_1" && !config.webhook1) {
      return NextResponse.json({ error: "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Webhook 1" }, { status: 400 });
    }
    if (target === "WEBHOOK_2" && !config.webhook2) {
      return NextResponse.json({ error: "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Webhook 2" }, { status: 400 });
    }

    const userName = (session?.user as any)?.name || "Super Admin";
    const userEmail = (session?.user as any)?.email || "admin@saas.la";
    const timestampSec = Math.floor(Date.now() / 1000);

    // If testing Webhook 1 or Both: Send Perfect Order Receipt (No broken boxes)
    if (target === "WEBHOOK_1" || target === "BOTH") {
      await sendDiscordEmbed(
        "WEBHOOK_1",
        {
          author: {
            name: "LAOSYS POS & COMMERCIAL ENGINE",
            icon_url: config.bot1Avatar || "https://img.icons8.com/3d-fluency/94/shopping-cart.png",
          },
          title: "🧾 ໃບບິນຮັບເງິນ (Sales Receipt) • #TEST-8899",
          description:
            "────────────────────────────────────────\n" +
            "🏪 **ຮ້ານຄ້າ:** `Super Admin Store (HQ)`\n" +
            "💳 **ການຊຳລະ:** `🟢 PAID (ທົດສອບສຳເລັດ 100%)`\n" +
            "────────────────────────────────────────",
          color: 0x10b981, // Emerald Green
          thumbnail: {
            url: "https://img.icons8.com/3d-fluency/188/bank-card-back-side.png",
          },
          fields: [
            {
              name: "👤 ຂໍ້ມູນລູກຄ້າ",
              value: `• **${userName}**\n• 📧 \`${userEmail}\``,
              inline: true,
            },
            {
              name: "💳 ຊ່ອງທາງຊຳລະ",
              value: "• **BCEL OnePay QR**\n• ຍອດ: **₭ 450,000**",
              inline: true,
            },
            {
              name: "📦 ລາຍການສິນຄ້າໃນບິນ (Order Items):",
              value:
                "• **1. TaylorMade Stealth 2 Driver**\n" +
                "  ↳ ຈຳນວນ: `1` × `₭ 350,000` = `₭ 350,000`\n\n" +
                "• **2. ໝວກກ໊ອຟ Titleist Tour Cap**\n" +
                "  ↳ ຈຳນວນ: `1` × `₭ 100,000` = `₭ 100,000`\n" +
                "────────────────────────────────────────\n" +
                "💰 **ຍອດລວມທັງໝົດ (TOTAL):** `₭ 450,000`",
              inline: false,
            },
            {
              name: "🕒 ຂໍ້ມູນເພີ່ມເຕີມ",
              value: `────────────────────────────────────────\n▸ ສາຂາ: **ສຳນັກງານໃຫຍ່** • ເວລາ: <t:${timestampSec}:R>`,
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
    }

    // If testing Webhook 2 or Both: Send Perfect Security Alert (No broken boxes)
    if (target === "WEBHOOK_2" || target === "BOTH") {
      await sendDiscordEmbed(
        "WEBHOOK_2",
        {
          author: {
            name: "LAOSYS CYBER SENTINEL • SECURITY HUB",
            icon_url: config.bot2Avatar || "https://img.icons8.com/3d-fluency/94/shield.png",
          },
          title: "🛡️ ບັນທຶກຄວາມປອດໄພ • SECURITY_VERIFIED",
          description:
            "────────────────────────────────────────\n" +
            "🔐 **ເຫດການ:** `SECURITY_AUDIT_VERIFIED`\n" +
            "⚡ **ລະດັບ:** `NORMAL (ປອດໄພ 100%)`\n" +
            "────────────────────────────────────────",
          color: 0x3b82f6, // Cyber Blue
          thumbnail: {
            url: "https://img.icons8.com/3d-fluency/188/fingerprint-scan.png",
          },
          fields: [
            {
              name: "👤 ບັນຊີຜູ້ໃຊ້ (Account)",
              value: `• **${userName}**\n• \`${userEmail}\``,
              inline: true,
            },
            {
              name: "🔑 ສິດທິ (Role)",
              value: "• 👑 **SUPER_ADMIN**\n• ສະຖານະ: `ACTIVE`",
              inline: true,
            },
            {
              name: "🌐 IP Address & Device",
              value: "• `26.86.176.51`\n• `LAN / VPN`",
              inline: true,
            },
            {
              name: "📋 ລາຍລະອຽດການເຂົ້າເຖິງ",
              value:
                "```yaml\n" +
                "ເຂົ້າສູ່ລະບົບຈັດການ Super Admin Dashboard ສຳເລັດ\n" +
                "Session: ປອດໄພ 100% (Authorized Access)\n" +
                "```",
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
    }

    return NextResponse.json({
      success: true,
      message: `ສົ່ງຂໍ້ຄວາມທົດສອບຮູບແບບໃໝ່ (ເສັ້ນຊື່ ແລະ ອ່ານງ່າຍ 100%) ໄປທີ່ ${target} ສຳເລັດແລ້ວ!`,
    });
  } catch (error) {
    console.error("[TEST_DISCORD_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
