import prisma from "@/lib/prisma";

async function main() {
  const updates = [
    { key: "discord_enabled", value: "true" },
    {
      key: "discord_webhook_1",
      value: "https://discord.com/api/webhooks/1568253705818734736/gkSA_XAkluoeMsklpVc52d-LNm3TTUu7CFo-YUCVWNe3yRODOhhktHj9xNNj01NT7jeG"
    },
    { key: "discord_webhook_1_name", value: "ຊ່ອງ 1: ອໍເດີ & ຍອດຂາຍ (Orders & Sales)" },
    {
      key: "discord_webhook_2",
      value: "https://discord.com/api/webhooks/1568253737007452332/_3M2yc19OtmzOYeWEhXLFUwAPCNoEN3dqfc6PP47EBJ2AlOo9KiS_2J8ebJP1uldajNQ"
    },
    { key: "discord_webhook_2_name", value: "ຊ່ອງ 2: ຄວາມປອດໄພ & ບັນທຶກລະບົບ (Security & Audit Logs)" },
    { key: "discord_route_orders", value: "WEBHOOK_1" },
    { key: "discord_route_security", value: "WEBHOOK_2" },
    { key: "discord_route_audit", value: "WEBHOOK_2" },
    { key: "discord_route_requests", value: "BOTH" },
  ];

  for (const item of updates) {
    await (prisma as any).$runCommandRaw({
      update: "Setting",
      updates: [
        {
          q: { key: item.key },
          u: { $set: { key: item.key, value: item.value, updatedAt: new Date() } },
          upsert: true,
        },
      ],
    });
    console.log(`Saved setting: ${item.key}`);
  }

  console.log("ALL DISCORD SETTINGS INITIALIZED IN MONGODB SUCCESSFULLY!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
