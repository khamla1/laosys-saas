const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const { PrismaClient } = require('./src/generated/prisma-v2/client');
const prisma = new PrismaClient();

async function run() {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      status: true,
      createdAt: true,
      organization: { select: { slug: true } }
    }
  });
  console.log(JSON.stringify(orders, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
