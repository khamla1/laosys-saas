import prisma from "../src/lib/prisma";

async function main() {
  console.log("Migrating existing SELLERS to Organizations...");
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER' },
    include: { organizations: true }
  });

  let migrated = 0;
  for (const user of sellers) {
    if (user.organizations.length === 0) {
      console.log(`Creating organization for user: ${user.email}`);
      const newOrg = await prisma.organization.create({
        data: {
          name: `${user.name || "User"}'s Store`,
          slug: `store-${user.id.substring(0, 8)}`,
          members: {
            create: {
              userId: user.id,
              role: "OWNER"
            }
          }
        }
      });
      migrated++;
    }
  }
  console.log(`Migration complete. Created ${migrated} organizations.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
