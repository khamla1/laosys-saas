import fs from 'fs';
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

async function main() {
  const { default: prisma } = await import('../src/lib/prisma');
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
  console.log('Recent orders:');
  console.log(JSON.stringify(orders, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
