import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const sampleCustomers = [
  { name: "ທ່ານ ສົມໄຊ ວົງສາ", phone: "020 5555 8899", address: "ບ້ານໂພນສີນວນ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ນາງ ສຸພາພອນ ແກ້ວມະນີ", phone: "020 7777 6655", address: "ບ້ານທ່າເດື່ອ, ເມືອງຫາດຊາຍຟອງ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ທ່ານ ຄຳຫຼ້າ ພົມມະວົງ", phone: "020 9999 1122", address: "ບ້ານດົງປ່າລານ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ນາງ ວັນນີ ຈັນທະລາ", phone: "020 2222 3344", address: "ບ້ານໜອງບອນ, ເມືອງໄຊເຊດຖາ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ທ່ານ ບຸນມີ ສີສົມບັດ", phone: "020 5555 1234", address: "ບ້ານສະພັງໝໍ້, ເມືອງໄຊເຊດຖາ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ນາງ ເກສອນ ວິໄລສັກ", phone: "020 9876 5432", address: "ບ້ານສີຫອມ, ເມືອງຈັນທະບູລີ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ທ່ານ ສັກສິດ ລັດຕະນະ", phone: "020 5678 1234", address: "ບ້ານວັດນາກ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ນາງ ມະນີວັນ ເພັດສະຫວ່າງ", phone: "020 2345 6789", address: "ບ້ານທົ່ງພານທອງ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ" },
  { name: "ທ່ານ ອານຸສິດ ສະຫວັນ", phone: "020 5555 7788", address: "ນະຄອນໄກສອນ ພົມວິຫານ, ແຂວງສະຫວັນນະເຂດ" },
  { name: "ນາງ ດາວວອນ ຫຼວງພະບາງ", phone: "020 7788 9900", address: "ບ້ານຊຽງທອງ, ນະຄອນຫຼວງພະບາງ" },
];

const extraProductsByBizType: Record<string, Array<{ name: string; category: string; price: number; stock: number; images: string[] }>> = {
  RESTAURANT: [
    { name: "ລາບງົວລົດເດັດ (Lao Spicy Beef Salad)", category: "ອາຫານຈານດຽວ", price: 65000, stock: 80, images: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"] },
    { name: "ປາເຜົາເກືອພ້ອມຊຸດຜັກ (Grilled Fish with Herbs)", category: "ອາຫານຈານດຽວ", price: 120000, stock: 40, images: ["https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80"] },
    { name: "ຊາໄທເຢັນ (Iced Thai Tea)", category: "ເຄື່ອງດື່ມ", price: 25000, stock: 120, images: ["https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"] },
    { name: "ໄກ່ທອດສະໝຸນໄພ (Herbal Fried Chicken)", category: "ອາຫານທານຫຼິ້ນ", price: 55000, stock: 90, images: ["https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80"] },
    { name: "ແກງໜໍ່ໄມ້ໃບຢ່ານາງ (Lao Bamboo Soup)", category: "ອາຫານຈານດຽວ", price: 40000, stock: 60, images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80"] },
  ],
  RETAIL: [
    { name: "ເບຍລາວ ກະປ໋ອງ 330ml (ແພັກ 6)", category: "ເຄື່ອງດື່ມ", price: 65000, stock: 200, images: ["https://images.unsplash.com/photo-1608270196042-a8690097e277?w=800&auto=format&fit=crop&q=80"] },
    { name: "ນ້ຳມັນພືດ 1 ລິດ (Cooking Oil)", category: "ເຄື່ອງປຸງ", price: 38000, stock: 100, images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80"] },
    { name: "ສະບູ່ກ້ອນ Protex (ແພັກ 4 ກ້ອນ)", category: "ເຄື່ອງໃຊ້ສ່ວນຕົວ", price: 32000, stock: 150, images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80"] },
    { name: "ຢາສີຟັນ Colgate Total 150g", category: "ເຄື່ອງໃຊ້ສ່ວນຕົວ", price: 28000, stock: 120, images: ["https://images.unsplash.com/photo-1559591937-ab7925e01f68?w=800&auto=format&fit=crop&q=80"] },
    { name: "ນ້ຳຢາຊັກຜ້າ Breeze 1500ml", category: "ເຄື່ອງໃຊ້ໃນບ້ານ", price: 85000, stock: 80, images: ["https://images.unsplash.com/photo-1585830812416-a6c86b145e71?w=800&auto=format&fit=crop&q=80"] },
  ],
  FASHION: [
    { name: "ເສື້ອເຊີດຜ້າຝ້າຍລາວແທ້ (Lao Cotton Shirt)", category: "ເສື້ອຜ້າ", price: 250000, stock: 50, images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"] },
    { name: "ສິ້ນໄໝລາວ ຖັກທໍລາຍບູຮານ (Traditional Lao Sinh)", category: "ເຄື່ອງນຸ່ງພື້ນເມືອງ", price: 650000, stock: 25, images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80"] },
    { name: "ກະເປົ໋າສະພາຍໜັງແທ້ (Classic Leather Bag)", category: "ກະເປົ໋າ", price: 450000, stock: 35, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80"] },
    { name: "ແວ່ນຕາກັນແດດ UV400 Modern Style", category: "ເຄື່ອງປະດັບ", price: 180000, stock: 60, images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80"] },
  ],
  ELECTRONICS: [
    { name: "ຫູຟັງໄຮ້ສາຍ Sony WH-1000XM5", category: "ເຄື່ອງສຽງ", price: 6800000, stock: 15, images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"] },
    { name: "ພາວເວີແບັງ Anker 20,000 mAh Fast Charge", category: "ອຸປະກອນເສີມ", price: 650000, stock: 45, images: ["https://images.unsplash.com/photo-1609592424209-27d4726e1a12?w=800&auto=format&fit=crop&q=80"] },
    { name: "ສາຍຊາດ USB-C to Lightning Braided 2m", category: "ອຸປະກອນເສີມ", price: 150000, stock: 100, images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"] },
    { name: "ຄີບອດກົນໄກ Keychron K8 Pro Wireless", category: "ອຸປະກອນຄອມພິວເຕີ", price: 1850000, stock: 20, images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"] },
  ],
  GENERIC: [
    { name: "ຊຸດຂອງຂວັນພຣີມຽມ ກາເຟ & ຊາລາວ (Lao Tea & Coffee Set)", category: "ຂອງຂວັນ", price: 350000, stock: 50, images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"] },
    { name: "ທຽນຫອມອໂຣມາ ອໍແກນິກ (Organic Scented Candle)", category: "ເຄື່ອງໃຊ້ໃນບ້ານ", price: 120000, stock: 65, images: ["https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80"] },
    { name: "ແກ້ວເກັບຄວາມເຢັນ Stanley Quencher 30oz", category: "ເຄື່ອງໃຊ້ໃນບ້ານ", price: 420000, stock: 40, images: ["https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80"] },
    { name: "ກະເປົ໋າຜ້າລົດໂລກຮ້ອນ Eco-Friendly Tote", category: "ກະເປົ໋າ", price: 55000, stock: 120, images: ["https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?w=800&auto=format&fit=crop&q=80"] },
  ],
};

async function main() {
  const { default: prisma } = await import("../src/lib/prisma");

  console.log("Starting deep enrichment for ALL stores in the database...");
  const orgs = await prisma.organization.findMany();

  for (const org of orgs) {
    console.log(`\n========================================`);
    console.log(`Enriching Store: ${org.name} (${org.slug}) - Type: ${org.businessType}`);
    console.log(`========================================`);

    // 1. Add extra Categories & Products
    const bizType = org.businessType || "GENERIC";
    const extras = extraProductsByBizType[bizType] || extraProductsByBizType["GENERIC"];

    for (const item of extras) {
      const existingProd = await prisma.product.findFirst({
        where: { organizationId: org.id, name: item.name },
      });
      if (!existingProd) {
        await prisma.product.create({
          data: {
            organizationId: org.id,
            name: item.name,
            category: item.category,
            price: item.price,
            stock: item.stock,
            images: item.images,
            status: "ACTIVE",
          },
        });
      }
    }

    // 2. Ensure Warehouses exist and populate Warehouse Stock for ALL products
    let warehouses = await prisma.warehouse.findMany({
      where: { organizationId: org.id },
    });
    if (warehouses.length === 0) {
      await prisma.warehouse.createMany({
        data: [
          { name: "ຄັງສິນຄ້າຫຼັກ (Main Warehouse - ວຽງຈັນ)", location: "ນະຄອນຫຼວງວຽງຈັນ", organizationId: org.id },
          { name: "ຄັງສິນຄ້າສາຂາ 2 (Branch Store - ສາຂາ)", location: "ສະຫວັນນະເຂດ", organizationId: org.id },
        ],
      });
      warehouses = await prisma.warehouse.findMany({ where: { organizationId: org.id } });
    }

    const allProducts = await prisma.product.findMany({ where: { organizationId: org.id } });
    for (const prod of allProducts) {
      for (const wh of warehouses) {
        await prisma.stock.upsert({
          where: {
            productId_warehouseId: {
              productId: prod.id,
              warehouseId: wh.id,
            },
          },
          update: {},
          create: {
            productId: prod.id,
            warehouseId: wh.id,
            quantity: Math.floor(Math.random() * 100) + 30,
          },
        });
      }
    }

    // 3. Ensure Suppliers exist
    const suppliersCount = await prisma.supplier.count({ where: { organizationId: org.id } });
    if (suppliersCount === 0) {
      await prisma.supplier.createMany({
        data: [
          { name: "ບໍລິສັດ ລາວ ເບເວີເຣດ ຈຳກັດ", contactName: "ທ່ານ ສົມສັກ", email: "contact@laobeverage.la", phone: "020 5555 1111", address: "ບ້ານໂພນສີນວນ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: org.id },
          { name: "ບໍລິສັດ ກະສິກຳ ອິນຊີ ຈຳກັດ", contactName: "ນາງ ມະນີວັນ", email: "sales@laoorganic.com", phone: "020 5555 2222", address: "ບ້ານທ່າເດື່ອ, ເມືອງຫາດຊາຍຟອງ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: org.id },
          { name: "ບໍລິສັດ ພຣີມຽມ ອິມພອດ-ເອັກພອດ ຈຳກັດ", contactName: "ທ່ານ ຄຳໄສ", email: "import@laopremium.com", phone: "020 5555 3333", address: "ບ້ານດົງປ່າລານ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: org.id },
          { name: "ບໍລິສັດ ລາວ ດິສທຣິບິວເຊີນ ຈຳກັດ", contactName: "ທ່ານ ວິໄລ", email: "info@laodistribution.com", phone: "020 5555 4444", address: "ບ້ານໜອງບອນ, ເມືອງໄຊເຊດຖາ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: org.id },
        ],
      });
    }

    // 4. Ensure Coupons exist
    const couponsCount = await prisma.coupon.count({ where: { organizationId: org.id } });
    if (couponsCount < 5) {
      const extraCoupons = [
        { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrderVal: 50000, maxDiscount: 20000, isActive: true, usageCount: 5, organizationId: org.id },
        { code: "SPECIAL20", type: "PERCENTAGE", value: 20, minOrderVal: 100000, maxDiscount: 50000, isActive: true, usageCount: 12, organizationId: org.id },
        { code: "FLAT15K", type: "FIXED", value: 15000, minOrderVal: 60000, maxDiscount: 15000, isActive: true, usageCount: 8, organizationId: org.id },
        { code: "VIP50", type: "PERCENTAGE", value: 50, minOrderVal: 300000, maxDiscount: 150000, isActive: true, usageCount: 15, organizationId: org.id },
        { code: "LUCKY88", type: "FIXED", value: 88000, minOrderVal: 200000, maxDiscount: 88000, isActive: true, usageCount: 20, organizationId: org.id },
      ];
      for (const c of extraCoupons) {
        const exists = await prisma.coupon.findFirst({ where: { organizationId: org.id, code: c.code } });
        if (!exists) {
          await prisma.coupon.create({ data: c });
        }
      }
    }

    // 5. Create ShareLinks for FOMO marketing
    const shareLinksCount = await prisma.shareLink.count({ where: { organizationId: org.id } });
    if (shareLinksCount === 0 && allProducts.length > 0) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.shareLink.create({
        data: {
          token: `PROMO-${org.slug}-VIP`,
          expiresAt: nextMonth,
          status: "ACTIVE",
          productIds: allProducts.slice(0, 3).map((p: any) => p.id),
          organizationId: org.id,
        },
      });
      await prisma.shareLink.create({
        data: {
          token: `FLASH-${org.slug}-DEAL`,
          expiresAt: nextMonth,
          status: "ACTIVE",
          productIds: allProducts.slice(0, 5).map((p: any) => p.id),
          organizationId: org.id,
        },
      });
    }

    // 6. Add Realistic Historical Orders AND Transactions
    if (allProducts.length > 0) {
      const existingOrdersCount = await prisma.order.count({ where: { organizationId: org.id } });
      const neededOrders = Math.max(0, 25 - existingOrdersCount);
      if (neededOrders > 0) {
        console.log(`Adding ${neededOrders} new realistic orders with transactions...`);

        const now = new Date();
        for (let i = 0; i < neededOrders; i++) {
          const product = allProducts[Math.floor(Math.random() * allProducts.length)];
          const customer = sampleCustomers[i % sampleCustomers.length];
          const qty = Math.floor(Math.random() * 3) + 1;
          const total = product.price * qty;

          // Spread date across last 30 days
          const orderDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
          const status = i % 4 === 0 ? "PENDING" : i % 5 === 0 ? "PROCESSING" : "COMPLETED";
          const paymentMethod = i % 2 === 0 ? "CASH" : "TRANSFER";

          const order = await prisma.order.create({
            data: {
              organizationId: org.id,
              totalAmount: total,
              status: status,
              paymentMethod: paymentMethod,
              customerName: customer.name,
              customerPhone: customer.phone,
              customerAddress: customer.address,
              createdAt: orderDate,
              updatedAt: orderDate,
              items: {
                create: [
                  {
                    productId: product.id,
                    quantity: qty,
                    price: product.price,
                  },
                ],
              },
            },
          });

          // If COMPLETED, create income Transaction for real dashboard sales graphs
          if (status === "COMPLETED") {
            await prisma.transaction.create({
              data: {
                amount: total,
                status: "COMPLETED",
                paymentMethod: paymentMethod,
                reference: `TRX-${orderDate.getTime()}-${i}`,
                organizationId: org.id,
                orderId: order.id,
                createdAt: orderDate,
                updatedAt: orderDate,
              },
            });
          }
        }
      }
    }

    // 7. Add Audit Logs
    await prisma.auditLog.create({
      data: {
        action: "ENRICH_STORE_DATA",
        details: `Automated enrichment of store ${org.name} with extra products, warehouse stocks, suppliers, coupons, and orders.`,
        organizationId: org.id,
      },
    });

    console.log(`Successfully enriched store: ${org.name}`);
  }

  console.log("\n====================================================");
  console.log("ALL STORES IN THE DATABASE HAVE BEEN DEEPLY ENRICHED!");
  console.log("====================================================");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
