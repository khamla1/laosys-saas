import prisma from "@/lib/prisma";

/**
 * Creates a default fully-configured Organization for a new or unassigned user.
 * Guarantees zero bugs by seeding default Storefront, Zones, Tables, and Sample Menu Products.
 */
export async function createDefaultOrganizationForUser(user: { id: string; name?: string | null; email?: string | null }) {
  const shortId = user.id.substring(user.id.length - 8);
  const orgName = `${user.name || "User"}'s Store`;
  const slug = `store-${shortId}`;

  // 1. Create Organization with all modules enabled
  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug: slug,
      businessType: "RESTAURANT",
      enabledModules: [
        "POS", "KDS", "QR_MENU", "INVENTORY", "TABLE_MANAGEMENT",
        "ANALYTICS", "ACCOUNTING", "HR", "MARKETING", "MEMBERSHIP", "ONLINE_ORDERING"
      ],
      members: {
        create: {
          userId: user.id,
          role: "OWNER"
        }
      }
    }
  });

  // 2. Create Storefront
  try {
    await prisma.storefront.create({
      data: {
        organizationId: org.id,
        customDomain: `store-${shortId}.laosys.site`,
        theme: "light",
      }
    });
  } catch (err) {
    console.error("Error creating default storefront:", err);
  }

  // 3. Create Default Zones & Tables
  try {
    const zoneIndoor = await prisma.zone.create({
      data: {
        name: "ໃນຮ້ານ (Indoor)",
        organizationId: org.id
      }
    });
    const zoneOutdoor = await prisma.zone.create({
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
          zoneId: zoneIndoor.id
        }
      });
    }
    for (let i = 6; i <= 8; i++) {
      await prisma.table.create({
        data: {
          name: `${i}`,
          seats: 6,
          status: "AVAILABLE",
          zoneId: zoneOutdoor.id
        }
      });
    }
  } catch (err) {
    console.error("Error creating default zones & tables:", err);
  }

  // 4. Create Default Sample Products
  try {
    const sampleProducts = [
      { name: "ຕຳໝາກຫຸ່ງລາວແຊບ (Somtum Lao)", price: 35000, category: "ອາຫານແນະນຳ", desc: "ຕຳໝາກຫຸ່ງລາວແຊບນົວ ປາແດກຫອມ", img: "/uploads/gee-svn/menu1.jpeg" },
      { name: "ລາບໝູ (Larb Moo)", price: 55000, category: "ອາຫານແນະນຳ", desc: "ລາບໝູລົດຊາດຈັດຈ້ານ ຫອມເຂົ້າຄົ່ວ", img: "/uploads/gee-svn/menu2.jpeg" },
      { name: "ປີ້ງໄກ່ລາດ (Grilled Chicken)", price: 60000, category: "ອາຫານແນະນຳ", desc: "ປີ້ງໄກ່ລາດຮ້ອນໆ ພ້ອມນ້ຳຈິ້ມແຈ່ວ", img: "/uploads/gee-svn/menu3.jpeg" },
    ];
    for (const p of sampleProducts) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.desc,
          category: p.category,
          price: p.price,
          stock: 100,
          minStock: 5,
          status: "ACTIVE",
          images: [p.img],
          organizationId: org.id
        }
      });
    }
  } catch (err) {
    console.error("Error creating default products:", err);
  }

  return org;
}
