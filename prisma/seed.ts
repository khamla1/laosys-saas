import { PrismaClient } from '../src/generated/prisma-v2/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Prisma Seed...');

  // 1. Create Demo User
  const email = 'demo@laosys.com';
  const existingUser = await prisma.user.findUnique({ 
    where: { email },
    include: { organizations: true } 
  });

  if (existingUser) {
    console.log('Cleaning up existing demo data...');
    if (existingUser.organizations.length > 0) {
      const orgId = existingUser.organizations[0].organizationId;
      await prisma.orderItem.deleteMany({ where: { order: { organizationId: orgId } } });
      await prisma.order.deleteMany({ where: { organizationId: orgId } });
      await prisma.product.deleteMany({ where: { organizationId: orgId } });
      await prisma.userOrganization.deleteMany({ where: { userId: existingUser.id } });
      await prisma.organization.deleteMany({ where: { id: orgId } });
    }
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const hashedPassword = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.create({
    data: {
      name: 'Khamla Demo',
      email: email,
      password: hashedPassword,
      role: 'SELLER',
      status: 'ACTIVE',
    },
  });

  const demoOrg = await prisma.organization.create({
    data: {
      name: "Khamla Coffee & Bakery",
      slug: "khamla-demo",
      businessType: "GENERIC",
    }
  });

  await prisma.userOrganization.create({
    data: {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      role: "OWNER"
    }
  });

  console.log('Created Demo User and Organization:', demoUser.email, demoOrg.name);

  // 2. Create 10 Products
  const productsData = [
    { name: 'Iced Latte', price: 45000, stock: 100, category: 'Beverage', images: ['https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Americano', price: 40000, stock: 150, category: 'Beverage', images: ['https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Matcha Green Tea', price: 55000, stock: 80, category: 'Beverage', images: ['https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Chocolate Croissant', price: 35000, stock: 40, category: 'Bakery', images: ['https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Blueberry Muffin', price: 30000, stock: 50, category: 'Bakery', images: ['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Espresso Beans 500g', price: 120000, stock: 20, category: 'Retail', images: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Caramel Macchiato', price: 50000, stock: 90, category: 'Beverage', images: ['https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Strawberry Cheesecake', price: 65000, stock: 15, category: 'Bakery', images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Cold Brew Bottle', price: 80000, stock: 30, category: 'Retail', images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Oat Milk Latte', price: 60000, stock: 75, category: 'Beverage', images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'] },
  ];

  const products = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        organizationId: demoOrg.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category,
        images: p.images,
        status: 'ACTIVE',
      },
    });
    products.push(prod);
  }

  console.log('Created 10 Demo Products');

  // 3. Create 5 Customers (In memory for Orders)
  const mockCustomers = [
    { name: 'Somchai Vientiane', email: 'somchai@example.com', phone: '02055551111', address: 'Vientiane, Laos' },
    { name: 'Sengdao Luangprabang', email: 'sengdao@example.com', phone: '02055552222', address: 'Luang Prabang, Laos' },
    { name: 'Anousith Savan', email: 'anou@example.com', phone: '02055553333', address: 'Savannakhet, Laos' },
    { name: 'Vilayphon Pakse', email: 'vilay@example.com', phone: '02055554444', address: 'Pakse, Laos' },
    { name: 'Khamphoui Vangvieng', email: 'kham@example.com', phone: '02055555555', address: 'Vang Vieng, Laos' },
  ];

  // 4. Create 200 Demo Orders (Biased towards Today and This Month)
  const orderStatuses: any[] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'PROCESSING', 'SHIPPED'];
  
  for (let i = 0; i < 200; i++) {
    // Random customer
    const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    
    // Random 1 to 3 products
    const orderItemsCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, orderItemsCount);
    
    let totalAmount = 0;
    const orderItemsData = selectedProducts.map(p => {
      const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
      totalAmount += p.price * quantity;
      return {
        productId: p.id,
        quantity: quantity,
        price: p.price,
      };
    });

    // Biased random date: 
    // 20% Today
    // 30% Yesterday to Last Week
    // 50% Last 30 Days
    const now = new Date();
    let pastDate: Date;
    const rand = Math.random();
    if (rand < 0.2) {
      // Today (random time in the last 12 hours)
      pastDate = new Date(now.getTime() - Math.floor(Math.random() * 12 * 60 * 60 * 1000));
    } else if (rand < 0.5) {
      // Last 7 days
      pastDate = new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    } else {
      // Last 30 days
      pastDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    }
    
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

    await prisma.order.create({
      data: {
        organizationId: demoOrg.id,
        totalAmount,
        status: status,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        paymentMethod: Math.random() > 0.5 ? 'CASH' : 'TRANSFER',
        createdAt: pastDate,
        updatedAt: pastDate,
        items: {
          create: orderItemsData
        }
      }
    });
  }

  console.log('Created 200 Demo Orders linked to Customers and Products');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
