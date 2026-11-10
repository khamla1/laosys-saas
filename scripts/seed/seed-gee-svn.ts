import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import fs from 'fs';

async function main() {
  console.log("===============================================================");
  console.log(" 🔥 SEEDING GEE SVN RESTAURANT INTO LAOSYS PLATFORM");
  console.log("===============================================================");

  // 1. Copy 14 food images from C:\Users\khamla\Downloads\ggg to public/uploads/gee-svn
  const sourceDir = 'C:\\Users\\khamla\\Downloads\\ggg';
  const targetDir = path.join(process.cwd(), 'public', 'uploads', 'gee-svn');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir)
    .filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'))
    .sort();

  console.log(`Found ${files.length} images in ${sourceDir}. Copying to ${targetDir}...`);
  files.forEach((file, index) => {
    const srcPath = path.join(sourceDir, file);
    const destName = `menu${index + 1}.jpeg`;
    const destPath = path.join(targetDir, destName);
    fs.copyFileSync(srcPath, destPath);
  });

  // 2. Hash Password '123'
  const hashedPassword = await bcrypt.hash('123', 10);

  // 3. Create/Update Users for Gee Svn
  console.log("Creating/Updating Users with password '123'...");
  const owner1 = await prisma.user.upsert({
    where: { email: 'geesvn@laosys.site' },
    update: {
      name: 'Gee Svn Owner',
      password: hashedPassword,
      role: 'SELLER',
      status: 'ACTIVE'
    },
    create: {
      name: 'Gee Svn Owner',
      email: 'geesvn@laosys.site',
      password: hashedPassword,
      role: 'SELLER',
      status: 'ACTIVE'
    }
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'geesvn@gmail.com' },
    update: {
      name: 'Gee Svn Owner (Gmail)',
      password: hashedPassword,
      role: 'SELLER',
      status: 'ACTIVE'
    },
    create: {
      name: 'Gee Svn Owner (Gmail)',
      email: 'geesvn@gmail.com',
      password: hashedPassword,
      role: 'SELLER',
      status: 'ACTIVE'
    }
  });

  // Also update super admin so they can manage
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'admin@saas.io' }
  });
  if (superAdmin) {
    await prisma.user.update({
      where: { email: 'admin@saas.io' },
      data: { password: hashedPassword }
    });
  }

  // Also update demo user if exists
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@laosys.com' }
  });
  if (demoUser) {
    await prisma.user.update({
      where: { email: 'demo@laosys.com' },
      data: { password: hashedPassword }
    });
  }

  // 4. Create/Update Organization "Gee Svn"
  console.log("Creating/Updating Organization 'Gee Svn' (slug: gee-svn)...");
  const org = await prisma.organization.upsert({
    where: { slug: 'gee-svn' },
    update: {
      name: 'Gee Svn',
      businessType: 'RESTAURANT',
      enabledModules: ['RESTAURANT', 'POS', 'INVENTORY', 'CORE', 'ECOMMERCE']
    },
    create: {
      name: 'Gee Svn',
      slug: 'gee-svn',
      businessType: 'RESTAURANT',
      enabledModules: ['RESTAURANT', 'POS', 'INVENTORY', 'CORE', 'ECOMMERCE']
    }
  });

  // 5. Link users to Organization
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: owner1.id,
        organizationId: org.id
      }
    },
    update: { role: 'OWNER' },
    create: {
      userId: owner1.id,
      organizationId: org.id,
      role: 'OWNER'
    }
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: owner2.id,
        organizationId: org.id
      }
    },
    update: { role: 'OWNER' },
    create: {
      userId: owner2.id,
      organizationId: org.id,
      role: 'OWNER'
    }
  });

  // 6. Update or Create Storefront
  const storefront = await prisma.storefront.findUnique({
    where: { organizationId: org.id }
  });
  if (storefront) {
    await prisma.storefront.update({
      where: { organizationId: org.id },
      data: {
        theme: 'dark',
        bannerUrl: '/uploads/gee-svn/menu10.jpeg',
        customDomain: 'gee-svn.laosys.site',
        metadata: {
          seo: {
            metaTitle: 'Gee Svn Restaurant | ร้านอาหารส้มตำแซ่บนัว',
            metaDescription: 'ร้านอาหารอีสานส้มตำ Gee Svn รสเด็ด แซ่บนัว ปลาร้าต้มสุกสูตรพิเศษ พร้อมระบบสั่งอาหาร POS'
          }
        }
      }
    });
  } else {
    await prisma.storefront.create({
      data: {
        organizationId: org.id,
        theme: 'dark',
        bannerUrl: '/uploads/gee-svn/menu10.jpeg',
        customDomain: 'gee-svn.laosys.site',
        metadata: {
          seo: {
            metaTitle: 'Gee Svn Restaurant | ร้านอาหารส้มตำแซ่บนัว',
            metaDescription: 'ร้านอาหารอีสานส้มตำ Gee Svn รสเด็ด แซ่บนัว ปลาร้าต้มสุกสูตรพิเศษ พร้อมระบบสั่งอาหาร POS'
          }
        }
      }
    });
  }

  // 7. Clear Existing Products for Gee Svn to ensure clean 14 items
  await prisma.product.deleteMany({
    where: { organizationId: org.id }
  });

  // 8. Create Categories and 14 Menu Items
  const menuItems = [
    { name: "ตำซั่วหมูยออุบล Gee Svn", price: 80, category: "ตำเส้น / ตำซั่ว", desc: "ส้มตำซั่วหมูยออุบล ปลาร้าหอมแซ่บนัว เผ็ดจัดจ้าน", img: "/uploads/gee-svn/menu1.jpeg" },
    { name: "ตำป่าเครื่องแน่น Gee Svn Special", price: 120, category: "ตำป่าเครื่องแน่น", desc: "ตำป่าเครื่องแน่นสไตล์ Gee Svn ครบเครื่องทั้งหมูยอ ขนมจีน ถั่วคั่ว", img: "/uploads/gee-svn/menu2.jpeg" },
    { name: "ตำซั่วปลากรอบปลาร้าหอม", price: 90, category: "ตำเส้น / ตำซั่ว", desc: "ตำซั่วปลากรอบกรุบกรอบ หอมกลิ่นปลาร้าต้มสุกสูตรเฉพาะ", img: "/uploads/gee-svn/menu3.jpeg" },
    { name: "ตำขนมจีนผักบุ้งกรอบ", price: 70, category: "ตำเส้น / ตำซั่ว", desc: "ตำขนมจีนเหนียวนุ่ม ใส่ผักบุ้งกรุบกรอบ แซ่บนัวถึงใจ", img: "/uploads/gee-svn/menu4.jpeg" },
    { name: "ตำซั่วถั่วคั่วแซ่บนัว", price: 75, category: "ส้มตำแซ่บนัว", desc: "ตำซั่วสูตรคลาสสิก หอมถั่วคั่วสดใหม่ แซ่บนัวทุกคำ", img: "/uploads/gee-svn/menu5.jpeg" },
    { name: "ตำป่าหมูยอปลากรอบแซ่บสะดุ้ง", price: 110, category: "ตำป่าเครื่องแน่น", desc: "ตำป่าซูเปอร์แซ่บ หมูยออุบลแน่นๆ พร้อมปลากรอบ", img: "/uploads/gee-svn/menu6.jpeg" },
    { name: "ตำหอยนาหมูยอแซ่บลืมกลับบ้าน", price: 100, category: "ตำป่าเครื่องแน่น", desc: "ตำหอยนาเนื้อเด้งๆ คู่กับหมูยอนุ่มๆ รสจัดจ้านแบบอีสานแท้", img: "/uploads/gee-svn/menu7.jpeg" },
    { name: "ตำซั่วอีสานดั้งเดิม", price: 70, category: "ส้มตำแซ่บนัว", desc: "ตำซั่วอีสานแท้ ปลาร้านัวกลมกล่อม หอมกลิ่นมะนาวสด", img: "/uploads/gee-svn/menu8.jpeg" },
    { name: "ตำมาม่าหมูยอสุดแซ่บ", price: 85, category: "ตำเส้น / ตำซั่ว", desc: "ตำเส้นมาม่าเหนียวนุ่ม เข้ากันได้ดีกับหมูยอและน้ำส้มตำนัวๆ", img: "/uploads/gee-svn/menu9.jpeg" },
    { name: "ตำป่ารวมมิตร Gee Svn Supreme", price: 130, category: "ตำป่าเครื่องแน่น", desc: "เมนูซิกเนเจอร์อันดับหนึ่ง เครื่องล้นจานความพรีเมียมจากร้าน Gee Svn", img: "/uploads/gee-svn/menu10.jpeg" },
    { name: "ตำหอยนามาม่าเครื่องล้น", price: 115, category: "ตำเส้น / ตำซั่ว", desc: "ความแซ่บลงตัวของเส้นมาม่าและหอยนาคัดพิเศษ", img: "/uploads/gee-svn/menu11.jpeg" },
    { name: "ตำซั่วหมูยอถั่วคั่วหอม", price: 85, category: "ส้มตำแซ่บนัว", desc: "ตำซั่วหมูยอผสมถั่วลิสงคั่วเอง หอมกรุ่น แซ่บครบรส", img: "/uploads/gee-svn/menu12.jpeg" },
    { name: "ตำป่าอีสานหอยนาแซ่บนัว", price: 110, category: "ตำป่าเครื่องแน่น", desc: "ตำป่าอีสานเครื่องแน่น ใส่หอยนาและผักลวกสดใหม่", img: "/uploads/gee-svn/menu13.jpeg" },
    { name: "ตำซิกเนเจอร์ Gee Svn อันดับ 1", price: 140, category: "ตำซิกเนเจอร์", desc: "สุดยอดเมนูประจำร้าน Gee Svn รสชาติพรีเมียมวัตถุดิบคัดเกรดดีที่สุด", img: "/uploads/gee-svn/menu14.jpeg" },
  ];

  console.log("Inserting 14 products into Gee Svn organization...");
  for (const item of menuItems) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.desc,
        category: item.category,
        price: item.price,
        stock: 100,
        minStock: 5,
        status: "ACTIVE",
        images: [item.img],
        organizationId: org.id
      }
    });
    console.log(`  + Added product: ${item.name} (฿${item.price})`);
  }

  // 9. Create Default Zones and Tables for Gee Svn
  console.log("Setting up Restaurant Zones and Tables...");
  const existingZones = await prisma.zone.findMany({
    where: { organizationId: org.id }
  });
  for (const z of existingZones) {
    await prisma.table.deleteMany({ where: { zoneId: z.id } });
  }
  await prisma.zone.deleteMany({
    where: { organizationId: org.id }
  });

  const zone1 = await prisma.zone.create({
    data: {
      name: "ໃນຮ້ານ (Indoor)",
      organizationId: org.id
    }
  });

  const zone2 = await prisma.zone.create({
    data: {
      name: "ນອກຮ້ານ (Outdoor)",
      organizationId: org.id
    }
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.table.create({
      data: {
        name: `${i}`,
        seats: 4,
        status: "AVAILABLE",
        zoneId: zone1.id
      }
    });
  }

  for (let i = 6; i <= 8; i++) {
    await prisma.table.create({
      data: {
        name: `${i}`,
        seats: 6,
        status: "AVAILABLE",
        zoneId: zone2.id
      }
    });
  }
  console.log("  + Created 2 Zones and 8 Tables");

  console.log("===============================================================");
  console.log(" ✅ SEEDING COMPLETE!");
  console.log("---------------------------------------------------------------");
  console.log("  Storefront URL: http://localhost:3000/shop/gee-svn");
  console.log("  Domain URL:     https://laosys.site/shop/gee-svn");
  console.log("  Login Email:    geesvn@laosys.site  (or geesvn@gmail.com / admin@saas.io)");
  console.log("  Login Password: 123");
  console.log("===============================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
