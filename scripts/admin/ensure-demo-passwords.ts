import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import bcrypt from "bcryptjs";

async function main() {
  const { default: prisma } = await import("../src/lib/prisma");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const updated = await prisma.user.updateMany({
    data: {
      password: hashedPassword,
    },
  });

  console.log(`Successfully ensured ALL ${updated.count} users have password: password123`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
