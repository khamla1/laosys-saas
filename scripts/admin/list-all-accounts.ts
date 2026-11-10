import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const { default: prisma } = await import("../src/lib/prisma");
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      organizations: {
        include: {
          organization: {
            select: {
              name: true,
              slug: true,
              businessType: true,
            },
          },
        },
      },
    },
  });

  console.log("================ USER & STORE LIST ================");
  for (const u of users) {
    const org = u.organizations[0]?.organization;
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.name}`);
    console.log(`Role: ${u.role}`);
    if (org) {
      console.log(`Store: ${org.name}`);
      console.log(`Slug: ${org.slug}`);
      console.log(`Type: ${org.businessType}`);
    } else {
      console.log(`Store: (No store linked)`);
    }
    console.log("---------------------------------------------------");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
