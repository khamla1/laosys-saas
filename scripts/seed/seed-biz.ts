import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const password = "password123";
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const businesses = [
      { email: "restaurant@example.com", name: "Restaurant Demo", type: "RESTAURANT" },
      { email: "cosmetics@example.com", name: "Cosmetics Demo", type: "COSMETICS" },
      { email: "sports@example.com", name: "Sports Demo", type: "RETAIL" },
    ];

    for (const biz of businesses) {
      let user = await prisma.user.findUnique({ where: { email: biz.email } });
      
      if (!user) {
        const orgSlug = biz.name.toLowerCase().replace(/\s+/g, "-");
        
        user = await prisma.user.create({
          data: {
            email: biz.email,
            name: biz.name,
            password: hashedPassword,
            role: "OWNER",
            organization: {
              create: {
                name: biz.name,
                slug: orgSlug,
                businessType: biz.type as any,
                subscriptionStatus: "ACTIVE",
              }
            }
          },
          include: { organization: true }
        });
        console.log(`Created ${biz.name}`);
      } else {
        console.log(`User ${biz.email} already exists`);
      }
    }
    console.log("Done");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
