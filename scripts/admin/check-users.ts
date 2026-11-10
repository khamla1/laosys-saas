import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['restaurant@example.com', 'cosmetics@example.com', 'sports@example.com'] } }
  });
  console.log("Users found:", users.length);
  console.log(users.map((u: any) => u.email).join(', '));
  process.exit(0);
}
check();
