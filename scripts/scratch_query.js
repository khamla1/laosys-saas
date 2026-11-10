const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const { PrismaClient } = require('./src/generated/prisma-v2/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { id: { contains: 'PRD' } },
        { barcode: { contains: 'PRD' } },
        { sku: { contains: 'PRD' } },
        { name: { contains: 'PRD' } }
      ]
    }
  });
  console.log('PRD products:', products.map(p => ({ id: p.id, name: p.name, barcode: p.barcode, sku: p.sku, status: p.status })));
  
  const latest = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, barcode: true, sku: true, status: true, organizationId: true }
  });
  console.log('Latest 5 products:', latest);

  const shareLinks = await prisma.shareLink.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, token: true, productIds: true, status: true, expiresAt: true, organizationId: true }
  });
  console.log('Recent share links:', shareLinks);
}

run().catch(console.error).finally(() => prisma.$disconnect());
