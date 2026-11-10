import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function seedAllBusinesses() {
  const password = "password123";
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const businesses = [
    {
      emails: ["restaurant@laosys.site", "restaurant@example.com"],
      name: "ຮ້ານອາຫານເຝີແຊບ & ຄາເຟ່ (Pho Zaap & Café)",
      slug: "restaurant-demo",
      type: "RESTAURANT",
      modules: ["POS", "INVENTORY", "RESTAURANT", "RECIPE", "KDS", "ECOMMERCE"],
      products: [
        { name: "ຜັດໄທກຸ້ງສົດ (Pad Thai Shrimp)", category: "ອາຫານຈານດຽວ", price: 50000, stock: 100, images: ["https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຕົ້ມຍຳກຸ້ງນ້ຳຂຸ້ນ (Tom Yum Goong)", category: "ອາຫານຈານດຽວ", price: 85000, stock: 50, images: ["https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເຝີຊີ້ນງົວລວມ (Lao Beef Pho)", category: "ອາຫານຈານດຽວ", price: 45000, stock: 100, images: ["https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຕຳໝາກຫຸ່ງປູປາແດກ (Lao Papaya Salad)", category: "ອາຫານທານຫຼິ້ນ", price: 30000, stock: 80, images: ["https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80"] },
        { name: "ລາເຕ້ເຢັນຂົ້ວກາງ (Iced Latte)", category: "ເຄື່ອງດື່ມ", price: 25000, stock: 100, images: ["https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຊາຂຽວນົມເຢັນ (Iced Matcha Latte)", category: "ເຄື່ອງດື່ມ", price: 28000, stock: 100, images: ["https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນ້ຳໝາກນາວໂຊດາ (Lemon Soda)", category: "ເຄື່ອງດື່ມ", price: 20000, stock: 100, images: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເຂົ້າຜັດປູ (Crab Fried Rice)", category: "ອາຫານຈານດຽວ", price: 60000, stock: 70, images: ["https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["sports@laosys.site", "sports@example.com"],
      name: "ລາວ ສະປອດ & ຟິດເນດ (Lao Sports & Fitness Club)",
      slug: "sports-demo",
      type: "SPORTS_CLUB",
      modules: ["POS", "INVENTORY", "SPORTS", "BOOKING", "ECOMMERCE"],
      products: [
        { name: "ໄມ້ຕີດອກປີກໄກ່ Yonex Astrox 99", category: "ອຸປະກອນກິລາ", price: 1500000, stock: 15, images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80"] },
        { name: "ລູກດອກປີກໄກ່ Yonex AS-30 (1 ຫຼອດ)", category: "ອຸປະກອນກິລາ", price: 250000, stock: 50, images: ["https://images.unsplash.com/photo-1613918431703-b09ff33a103c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເກີບແລ່ນ Nike Air Zoom Pegasus", category: "ເກີບກິລາ", price: 1200000, stock: 20, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເສື້ອກິລາແຫ້ງໄວ Pro Dry-Fit T-Shirt", category: "ເສື້ອຜ້າກິລາ", price: 150000, stock: 60, images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80"] },
        { name: "ດຳເບວ 10kg (Rubber Encased Dumbbell)", category: "ຟິດເນດ", price: 350000, stock: 15, images: ["https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເສື່ອໂຍຄະ Premium NBR 10mm", category: "ຟິດເນດ", price: 180000, stock: 30, images: ["https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["retail@laosys.site", "retail@example.com"],
      name: "ລາວ ມິນິມາດ ພລັສ (Lao MiniMart Plus)",
      slug: "retail-demo",
      type: "RETAIL",
      modules: ["POS", "INVENTORY", "ECOMMERCE"],
      products: [
        { name: "ນ້ຳດື່ມຫົວເສືອ 1500ml (ແພັກ 6 ຕຸກ)", category: "ເຄື່ອງດື່ມ", price: 25000, stock: 100, images: ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເຂົ້າສານຫອມມະລິ 5 ກິໂລ (Jasmine Rice)", category: "ອາຫານແຫ້ງ", price: 120000, stock: 50, images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນົມສົດໂຄກຸນ ຈືດ 1L (Fresh Milk)", category: "ເຄື່ອງດື່ມ", price: 32000, stock: 60, images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80"] },
        { name: "ກາເຟສຳເລັດຮູບ Nescafé Red Cup 380g", category: "ເຄື່ອງດື່ມ", price: 75000, stock: 40, images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຂະໜົມມັນຝຣັ່ງທອດ Lay's Original 75g", category: "ຂະໜົມທານຫຼິ້ນ", price: 15000, stock: 80, images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນ້ຳອັດລົມ Coca-Cola 325ml (ແຄນ)", category: "ເຄື່ອງດື່ມ", price: 10000, stock: 120, images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["service@laosys.site", "service@example.com"],
      name: "ລາວ ເຊີວິດ & ອໍໂຕແຄຣ໌ (Lao Auto & Home Service)",
      slug: "service-demo",
      type: "SERVICE",
      modules: ["POS", "INVENTORY", "SERVICE", "BOOKING", "ECOMMERCE"],
      products: [
        { name: "ບໍລິການລ້າງລົດພຣີມຽມຄາແຄຣ໌ + ເຄືອບເງົາ", category: "ບໍລິການ", price: 120000, stock: 100, images: ["https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80"] },
        { name: "ປ່ຽນຖ່າຍນ້ຳມັນເຄື່ອງ Mobil 1 ສັງເຄາະແທ້", category: "ບໍລິການ", price: 450000, stock: 30, images: ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80"] },
        { name: "ລ້າງແອເຮືອນ/ຫ້ອງການ ຂະໜາດ 12,000 BTU", category: "ບໍລິການ", price: 150000, stock: 50, images: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນ້ຳຍາລ້າງລົດ ແລະ ເຄືອບສີ 3M Car Wash", category: "ສິນຄ້າ", price: 85000, stock: 40, images: ["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຜ້າເຊັດລົດໄມໂຄຣໄຟເບີ Premium Microfiber", category: "ສິນຄ້າ", price: 35000, stock: 60, images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80"] },
        { name: "ບໍລິການຂັດສີ ແລະ ເຄືອບແກ້ວເຕັມລະບົບ", category: "ບໍລິການ", price: 1800000, stock: 20, images: ["https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["clinic@laosys.site", "clinic@example.com"],
      name: "ລາວ ບິວຕີ້ ຄລີນິກ & ສະປາ (Lao Beauty Clinic & Spa)",
      slug: "clinic-demo",
      type: "CLINIC",
      modules: ["POS", "INVENTORY", "CLINIC", "BOOKING", "ECOMMERCE"],
      products: [
        { name: "ຄອຣ໌ສເລເຊີໜ້າໃສ IPL Skin Rejuvenation (5 ຄັ້ງ)", category: "ຄອຣ໌ສປິ່ນປົວ", price: 1800000, stock: 50, images: ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນວດນ້ຳມັນອາໂຣມ່າ ອໍແກນິກ 90 ນາທີ (Aroma Spa)", category: "ສະປາ", price: 350000, stock: 50, images: ["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເຊຣັ່ມວິຕາມິນຊີເຂັ້ມຂົ້ນ Vitamin C Glow Serum 30ml", category: "ຜະລິດຕະພັນ", price: 380000, stock: 30, images: ["https://images.unsplash.com/photo-1608248597359-0e7d52616d51?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຄຣີມກັນແດດຄລີນິກສູດອ່ອນໂຍນ Daily UV Shield SPF 50+", category: "ຜະລິດຕະພັນ", price: 220000, stock: 40, images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80"] },
        { name: "ມາສ໌ກໜ້າຄໍລາເຈນເຂັ້ມຂົ້ນ Hydrogel Eye & Face Mask", category: "ຜະລິດຕະພັນ", price: 75000, stock: 60, images: ["https://images.unsplash.com/photo-1567721913486-6585f069b332?w=800&auto=format&fit=crop&q=80"] },
        { name: "ບໍລິການມາດຕະຖານຜິວໜ້າໄຮໂດຣເຟຊຽວ (Hydro-Facial)", category: "ຄອຣ໌ສປິ່ນປົວ", price: 450000, stock: 50, images: ["https://images.unsplash.com/photo-1512290900672-1f04e1cff483?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["fashion@laosys.site", "fashion@example.com"],
      name: "ວຽງຈັນ ແຟຊັ່ນ ສະຕູດີໂອ (Vientiane Fashion Studio)",
      slug: "fashion-demo",
      type: "FASHION",
      modules: ["POS", "INVENTORY", "ECOMMERCE"],
      products: [
        { name: "ເສື້ອຢືດແຂນສັ້ນ Vintage Oversized Cotton T-Shirt", category: "ເສື້ອ", price: 180000, stock: 50, images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"] },
        { name: "ໂສ້ງຢີນສ໌ຂາກະບອກ Classic Blue Denim Jeans", category: "ໂສ້ງ", price: 350000, stock: 40, images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເສື້ອເຊີດຜ້າລິນິນມິນິມອນ Linen Relaxed Shirt", category: "ເສື້ອ", price: 240000, stock: 35, images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ກະເປົ໋າສະພາຍໜັງແທ້ Italian Leather Crossbody Bag", category: "ກະເປົ໋າ", price: 650000, stock: 20, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80"] },
        { name: "ໝວກແກັບປັກໂລໂກ້ Classic Cotton Baseball Cap", category: "ເຄື່ອງປະດັບ", price: 95000, stock: 60, images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເສື້ອແຈັກເກັດຜ້າຢີນສ໌ Vintage Denim Jacket", category: "ເສື້ອແຈັກເກັດ", price: 450000, stock: 25, images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["cosmetics@laosys.site", "cosmetics@example.com"],
      name: "ລາວ ກຼອສ ບິວຕີ້ (Lao Gloss & Glow Cosmetics)",
      slug: "cosmetics-demo",
      type: "COSMETICS",
      modules: ["POS", "INVENTORY", "ECOMMERCE"],
      products: [
        { name: "ລິບສະຕິກເນື້ອແມັດ Velvet Matte Lipstick - Ruby Red", category: "ເຄື່ອງສຳອາງ", price: 120000, stock: 60, images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80"] },
        { name: "ແປ້ງພັບຄຸມມັນ Cushion Foundation SPF 50 PA+++", category: "ເຄື່ອງສຳອາງ", price: 260000, stock: 40, images: ["https://images.unsplash.com/photo-1590156206657-b3e8e29a8f4c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ອາຍແຊໂດວ໌ພາເລັດ 12 ສີ Sunset Warm Eye Palette", category: "ເຄື່ອງສຳອາງ", price: 320000, stock: 30, images: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80"] },
        { name: "ໂຟມລ້າງໜ້າສູດອ່ອນໂຍນ Gentle Amino Acid Cleanser 150ml", category: "ບຳລຸງຜິວ", price: 140000, stock: 50, images: ["https://images.unsplash.com/photo-1556228722-194a7585806c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນ້ຳຫອມໂອເດິພາຟູມ Luxury Rose Floral EDP 50ml", category: "ນ້ຳຫອມ", price: 480000, stock: 25, images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເຊຣັ່ມບຳລຸງຜິວໃສ Niacinamide 10% + Zinc 1%", category: "ບຳລຸງຜິວ", price: 210000, stock: 45, images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["electronics@laosys.site", "electronics@example.com"],
      name: "ລາວ ດິຈິຕອນ & ໄອທີ (Lao Digital Electronics)",
      slug: "electronics-demo",
      type: "ELECTRONICS",
      modules: ["POS", "INVENTORY", "REPAIR", "ECOMMERCE"],
      products: [
        { name: "ໂທລະສັບມືຖື iPhone 15 Pro Max 256GB (Natural Titanium)", category: "ໂທລະສັບ", price: 24500000, stock: 10, images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຫູຟັງໄຮ້ສາຍ Apple AirPods Pro (2nd Generation)", category: "ອຸປະກອນເສີມ", price: 4200000, stock: 25, images: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80"] },
        { name: "ແລັບທັອບ MacBook Air M3 13-inch 16GB/512GB", category: "ຄອມພິວເຕີ", price: 26000000, stock: 8, images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"] },
        { name: "ລຳໂພງໄຮ້ສາຍ Marshall Emberton II Bluetooth Speaker", category: "ເຄື່ອງສຽງ", price: 2900000, stock: 15, images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80"] },
        { name: "ປລັກໄຟກັນກະຊາກ Smart Surge Protector USB-C (5M)", category: "ອຸປະກອນເສີມ", price: 180000, stock: 40, images: ["https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&auto=format&fit=crop&q=80"] },
        { name: "ໂມງອັດສະລິຍະ Apple Watch Series 9 GPS 45mm", category: "ແກັດເຈັດ", price: 8500000, stock: 12, images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
    {
      emails: ["all@laosys.site", "admin@laosys.site", "demo@laosys.site", "demo@laosys.com", "all@example.com"],
      name: "ລາວຊິສ ເມກ້າ ສຕໍຣ໌ (LAOSYS Mega Store All-In-One)",
      slug: "all-in-one-demo",
      type: "GENERIC",
      modules: ["POS", "INVENTORY", "RESTAURANT", "RECIPE", "KDS", "SPORTS", "BOOKING", "SERVICE", "CLINIC", "REPAIR", "ECOMMERCE"],
      products: [
        { name: "ຜັດໄທກຸ້ງສົດ (Pad Thai Shrimp)", category: "ອາຫານ", price: 50000, stock: 100, images: ["https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80"] },
        { name: "ລາເຕ້ເຢັນຂົ້ວກາງ (Iced Latte)", category: "ເຄື່ອງດື່ມ", price: 25000, stock: 100, images: ["https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເກີບແລ່ນ Nike Air Zoom Pegasus", category: "ກິລາ", price: 1200000, stock: 20, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"] },
        { name: "ໄມ້ຕີດອກປີກໄກ່ Yonex Astrox 99", category: "ກິລາ", price: 1500000, stock: 15, images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80"] },
        { name: "ລິບສະຕິກເນື້ອແມັດ Velvet Matte Lipstick", category: "ເຄື່ອງສຳອາງ", price: 120000, stock: 60, images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80"] },
        { name: "ໂທລະສັບມືຖື iPhone 15 Pro Max 256GB", category: "ເຄື່ອງໃຊ້ໄຟຟ້າ", price: 24500000, stock: 10, images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"] },
        { name: "ເສື້ອຢືດແຂນສັ້ນ Vintage Oversized T-Shirt", category: "ແຟຊັ່ນ", price: 180000, stock: 50, images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"] },
        { name: "ຄອຣ໌ສເລເຊີໜ້າໃສ IPL Skin Rejuvenation", category: "ຄລີນິກ", price: 1800000, stock: 50, images: ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80"] },
        { name: "ບໍລິການລ້າງລົດພຣີມຽມຄາແຄຣ໌ + ເຄືອບເງົາ", category: "ບໍລິການ", price: 120000, stock: 100, images: ["https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80"] },
        { name: "ນ້ຳດື່ມຫົວເສືອ 1500ml (ແພັກ 6 ຕຸກ)", category: "ມິນິມາດ", price: 25000, stock: 100, images: ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80"] },
      ],
    },
  ];

  let totalProductsCreated = 0;
  let totalOrdersCreated = 0;
  let totalUsersCreated = 0;

  for (const biz of businesses) {
    // Clean up old ones by slug or emails
    await prisma.organization.deleteMany({
      where: { slug: biz.slug },
    });
    for (const email of biz.emails) {
      await prisma.user.deleteMany({
        where: { email },
      });
    }

    // 1. Create Organization
    const org = await prisma.organization.create({
      data: {
        name: biz.name,
        slug: biz.slug,
        businessType: biz.type as any,
        subscriptionStatus: "ACTIVE",
        enabledModules: biz.modules,
      },
    });

    const orgId = org.id;
    if (!orgId) continue;

    // 2. Create Users for all associated emails
    for (const email of biz.emails) {
      await prisma.user.create({
        data: {
          email: email,
          name: biz.name,
          password: hashedPassword,
          role: "SELLER",
          status: "ACTIVE",
          organizations: {
            create: {
              organizationId: orgId,
              role: "OWNER",
            },
          },
        },
      });
      totalUsersCreated++;
    }

    // 3. Create Products with beautiful Unsplash images
    const createdProducts = [];
    for (const prodData of biz.products) {
      const p = await prisma.product.create({
        data: {
          name: prodData.name,
          category: prodData.category,
          price: prodData.price,
          stock: prodData.stock,
          images: prodData.images,
          status: "ACTIVE",
          organizationId: orgId,
        },
      });
      createdProducts.push(p);
      totalProductsCreated++;
    }

    // 3.5 Create Categories for this business
    const uniqueCategories = Array.from(new Set(biz.products.map((p) => p.category)));
    for (const catName of uniqueCategories) {
      await prisma.category.create({
        data: {
          name: catName,
          description: `ໝວດໝູ່ສິນຄ້າຄຸນນະພາບສູງປະຈຳຮ້ານ ${biz.name}`,
          status: "ACTIVE",
          organizationId: orgId,
        },
      });
    }

    // 3.6 Create Suppliers (ຜູ້ສະໜອງ) for this business
    await prisma.supplier.createMany({
      data: [
        { name: "ບໍລິສັດ ລາວ ເບເວີເຣດ ຈຳກັດ", contactName: "ທ່ານ ສົມສັກ", email: "contact@laobeverage.la", phone: "020 5555 1111", address: "ບ້ານໂພນສີນວນ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: orgId },
        { name: "ບໍລິສັດ ກະສິກຳ ອິນຊີ ຈຳກັດ (Lao Organic Farm)", contactName: "ນາງ ມະນີວັນ", email: "sales@laoorganic.com", phone: "020 5555 2222", address: "ບ້ານທ່າເດື່ອ, ເມືອງຫາດຊາຍຟອງ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: orgId },
        { name: "ບໍລິສັດ ພຣີມຽມ ອິມພອດ-ເອັກພອດ ຈຳກັດ", contactName: "ທ່ານ ຄຳໄສ", email: "import@laopremium.com", phone: "020 5555 3333", address: "ບ້ານດົງປ່າລານ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: orgId },
        { name: "ບໍລິສັດ ລາວ ດິສທຣິບິວເຊີນ ຈຳກັດ (Lao Distribution)", contactName: "ທ່ານ ວິໄລ", email: "info@laodistribution.com", phone: "020 5555 4444", address: "ບ້ານໜອງບອນ, ເມືອງໄຊເຊດຖາ, ນະຄອນຫຼວງວຽງຈັນ", organizationId: orgId },
      ],
    });

    // 3.7 Create Warehouses for this business
    await prisma.warehouse.createMany({
      data: [
        { name: "ຄັງສິນຄ້າຫຼັກ (Main Warehouse - ວຽງຈັນ)", location: "ນະຄອນຫຼວງວຽງຈັນ", organizationId: orgId },
        { name: "ຄັງສິນຄ້າສາຂາ 2 (Branch Store - ສາຂາ)", location: "ສະຫວັນນະເຂດ", organizationId: orgId },
      ],
    });

    // 3.8 Create Coupons for this business
    await prisma.coupon.createMany({
      data: [
        { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrderVal: 50000, maxDiscount: 20000, isActive: true, usageCount: 5, organizationId: orgId },
        { code: "SPECIAL20", type: "PERCENTAGE", value: 20, minOrderVal: 100000, maxDiscount: 50000, isActive: true, usageCount: 12, organizationId: orgId },
        { code: "FLAT15K", type: "FIXED", value: 15000, minOrderVal: 60000, maxDiscount: 15000, isActive: true, usageCount: 8, organizationId: orgId },
      ],
    });

    // 3.9 Create Storefront with Banners & SEO Metadata
    await prisma.storefront.deleteMany({
      where: {
        OR: [
          { customDomain: `${biz.slug}.laosys.site` },
          { organizationId: orgId },
        ],
      },
    });

    await prisma.storefront.create({
      data: {
        organizationId: orgId,
        customDomain: `${biz.slug}.laosys.site`,
        theme: biz.type === "FASHION" || biz.type === "COSMETICS" ? "minimal" : biz.type === "ELECTRONICS" ? "cyberpunk" : biz.type === "RESTAURANT" ? "nature" : "dark",
        bannerUrl: biz.products[0]?.images[0] || "",
        metadata: {
          banners: biz.products.slice(0, 3).map((p) => ({ url: p.images[0], type: "image" })),
          seo: {
            title: biz.name,
            description: `ຍິນດີຕ້ອນຮັບສູ່ ${biz.name} - ຮ້ານຄ້າອອນລາຍຄຸນນະພາບ ພ້ອມບໍລິການຈັດສົ່ງທົ່ວປະເທດລາວ`,
          },
        },
      },
    });

    // 4. Create Restaurant Zones & Tables if applicable
    if (biz.type === "RESTAURANT" || biz.type === "GENERIC") {
      await prisma.zone.create({
        data: {
          name: "Indoor (ໃນຮ້ານ)",
          organizationId: orgId,
          tables: {
            create: [
              { name: "T01", seats: 4 },
              { name: "T02", seats: 4 },
              { name: "T03", seats: 2 },
              { name: "T04", seats: 6 },
            ],
          },
        },
      });
      await prisma.zone.create({
        data: {
          name: "Outdoor (ລະບຽງ)",
          organizationId: orgId,
          tables: {
            create: [
              { name: "O01", seats: 4 },
              { name: "O02", seats: 4 },
            ],
          },
        },
      });

      await prisma.modifierGroup.create({
        data: {
          name: "ຄວາມເຜັດ (Spicy Level)",
          organizationId: orgId,
          isRequired: false,
          modifiers: {
            create: [
              { name: "ເຜັດນ້ອຍ (Mild)", price: 0 },
              { name: "ເຜັດກາງ (Medium)", price: 0 },
              { name: "ເຜັດຫຼາຍ (Spicy)", price: 0 },
            ],
          },
        },
      });
    }

    // 5. Create ServiceResources if applicable
    if (["SPORTS_CLUB", "SERVICE", "CLINIC", "GENERIC"].includes(biz.type)) {
      await prisma.serviceResource.createMany({
        data: [
          {
            name:
              biz.type === "SPORTS_CLUB"
                ? "ສະໜາມດອກປີກໄກ່ 1 (Badminton Court 1)"
                : biz.type === "CLINIC"
                ? "ຫ້ອງປິ່ນປົວ VIP 1"
                : "ອູ່ຊ່າງລົດ Bay 1",
            type: "ROOM",
            organizationId: orgId,
          },
          {
            name:
              biz.type === "SPORTS_CLUB"
                ? "ຄຣູຝຶກ ສົມສັກ (Coach Somsak)"
                : biz.type === "CLINIC"
                ? "ແພດຍິງ ສຸພາພອນ (Dr. Supaporn)"
                : "ຊ່າງ ສົມຫວັງ (Technician Somwang)",
            type: "STAFF",
            organizationId: orgId,
          },
        ],
      });
    }

    // 6. Create 15 realistic dummy Orders with customer details for analytics & lists
    const sampleCustomers = [
      { name: "ທ່ານ ສົມໄຊ ວົງສາ", phone: "020 5555 8899", address: "ບ້ານໂພນສີນວນ, ເມືອງສີສັດຕະນາກ" },
      { name: "ນາງ ສຸພາພອນ ແກ້ວມະນີ", phone: "020 7777 6655", address: "ບ້ານທ່າເດື່ອ, ເມືອງຫາດຊາຍຟອງ" },
      { name: "ທ່ານ ຄຳຫຼ້າ ພົມມະວົງ", phone: "020 9999 1122", address: "ບ້ານດົງປ່າລານ, ເມືອງສີສັດຕະນາກ" },
      { name: "ນາງ ວັນນີ ຈັນທະລາ", phone: "020 2222 3344", address: "ບ້ານໜອງບອນ, ເມືອງໄຊເຊດຖາ" },
      { name: "ທ່ານ ບຸນມີ ສີສົມບັດ", phone: "020 5555 1234", address: "ບ້ານສະພັງໝໍ້, ເມືອງໄຊເຊດຖາ" },
      { name: "ນາງ ເກສອນ ວິໄລສັກ", phone: "020 9876 5432", address: "ບ້ານສີຫອມ, ເມືອງຈັນທະບູລີ" },
      { name: "ທ່ານ ສັກສິດ ລັດຕະນະ", phone: "020 5678 1234", address: "ບ້ານວັດນາກ, ເມືອງສີສັດຕະນາກ" },
      { name: "ນາງ ມະນີວັນ ເພັດສະຫວ່າງ", phone: "020 2345 6789", address: "ບ້ານທົ່ງພານທອງ, ເມືອງສີສັດຕະນາກ" },
    ];

    for (let i = 0; i < 15; i++) {
      if (createdProducts.length === 0) continue;
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const randomCustomer = sampleCustomers[i % sampleCustomers.length];
      const qty = Math.floor(Math.random() * 3) + 1;
      const total = randomProduct.price * qty;

      await prisma.order.create({
        data: {
          organizationId: orgId,
          totalAmount: total,
          status: i % 5 === 0 ? "PENDING" : "PAID",
          customerName: randomCustomer.name,
          customerPhone: randomCustomer.phone,
          customerAddress: randomCustomer.address,
          items: {
            create: [
              {
                productId: randomProduct.id,
                quantity: qty,
                price: randomProduct.price,
              },
            ],
          },
        },
      });
      totalOrdersCreated++;
    }
  }

  return {
    success: true,
    totalBusinesses: businesses.length,
    totalUsersCreated,
    totalProductsCreated,
    totalOrdersCreated,
  };
}
