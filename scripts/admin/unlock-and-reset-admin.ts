import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import bcrypt from "bcryptjs";

async function main() {
  const { default: prisma } = await import("../src/lib/prisma");
  console.log("Unlocking accounts and resetting admin password...");

  const hashedPassword = await bcrypt.hash("123", 10);

  // 1. Unlock ALL users and reset failed login attempts
  const unlockResult = await prisma.user.updateMany({
    data: {
      lockoutUntil: null,
      failedLoginAttempts: 0,
    },
  });
  console.log(`Unlocked ${unlockResult.count} accounts.`);

  // 2. Set admin@saas.io password to '123'
  const adminSaas = await prisma.user.findUnique({ where: { email: "admin@saas.io" } });
  if (adminSaas) {
    await prisma.user.update({
      where: { email: "admin@saas.io" },
      data: {
        password: hashedPassword,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        status: "ACTIVE",
      },
    });
    console.log("✅ Successfully reset admin@saas.io password to: 123");
  } else {
    console.log("❌ User admin@saas.io not found!");
  }

  // 3. Set admin@laosys.site password to '123'
  const adminLaosys = await prisma.user.findUnique({ where: { email: "admin@laosys.site" } });
  if (adminLaosys) {
    await prisma.user.update({
      where: { email: "admin@laosys.site" },
      data: {
        password: hashedPassword,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        status: "ACTIVE",
      },
    });
    console.log("✅ Successfully reset admin@laosys.site password to: 123");
  }

  // 4. Set demo@laosys.com / geesvn@laosys.site password to '123'
  const demoUsers = ["demo@laosys.com", "demo@laosys.site", "geesvn@laosys.site", "restaurant@laosys.site"];
  for (const email of demoUsers) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          lockoutUntil: null,
          failedLoginAttempts: 0,
          status: "ACTIVE",
        },
      });
      console.log(`✅ Successfully reset ${email} password to: 123`);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
