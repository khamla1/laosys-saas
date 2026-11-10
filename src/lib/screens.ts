/**
 * LAOSYS Enterprise Screen Registry (Cuscen ERP / SAP Standard Screen IDs)
 * Maps every dashboard screen and report to an enterprise standard Screen ID.
 */

export interface ScreenDefinition {
  screenId: string;
  path: string;
  titleLa: string;
  titleEn: string;
  module: string;
  descriptionLa?: string;
}

export const SCREEN_REGISTRY: ScreenDefinition[] = [
  // ─── Dashboard & Executive (DSH) ───
  {
    screenId: "DSH000001",
    path: "/dashboard",
    titleLa: "ໜ້າຫຼັກແດຊບອດ",
    titleEn: "Executive Dashboard",
    module: "Dashboard",
    descriptionLa: "ພາບລວມທຸລະກິດ, ສະຫຼຸບຍອດຂາຍ, ແລະ ຂໍ້ມູນສຳຄັນ",
  },
  {
    screenId: "ADT000001",
    path: "/dashboard/audit-logs",
    titleLa: "ປະຫວັດການແກ້ໄຂລະບົບ",
    titleEn: "System Audit Logs",
    module: "Audit",
    descriptionLa: "ບັນທຶກປະຫວັດການແກ້ໄຂ, ສ້າງ, ລຶບ, ແຍກບິນ, ລວມບິນ ແລະ ການປ່ຽນແປງຂໍ້ມູນ",
  },

  // ─── Rentals Module (RNT) ───
  {
    screenId: "RNT000001",
    path: "/dashboard/rental/issue",
    titleLa: "ອອກບິນເຊົ່າອຸປະກອນ",
    titleEn: "Rental Issue & Return",
    module: "Rentals",
    descriptionLa: "ອອກບິນເຊົ່າອຸປະກອນໃໝ່, ຮັບຄືນ, ແລະ ສະແກນບິນ",
  },
  {
    screenId: "RNT000002",
    path: "/dashboard/rental/equipment",
    titleLa: "ຄຸ້ມຄອງອຸປະກອນເຊົ່າ",
    titleEn: "Rental Equipment Management",
    module: "Rentals",
    descriptionLa: "ຈັດການລາຍການອຸປະກອນ, ມູນຄ່າເຊົ່າ, ແລະ ຄ່າປະກັນມັດຈຳ",
  },
  {
    screenId: "RNT000003",
    path: "/dashboard/rental/overdue",
    titleLa: "ລາຍການກາຍກຳນົດສົ່ງ",
    titleEn: "Overdue Rentals Tracking",
    module: "Rentals",
    descriptionLa: "ຕິດຕາມລາຍການເຊົ່າທີ່ກາຍກຳນົດ ແລະ ຄຳນວນຄ່າປັບໃໝ",
  },
  {
    screenId: "RNT000004",
    path: "/dashboard/rental/fines",
    titleLa: "ຄ່າປັບໃໝ & ເງິນມັດຈຳ",
    titleEn: "Rental Fines & Deposits",
    module: "Rentals",
    descriptionLa: "ສະສາງເງິນມັດຈຳ, ໃບບິນຄ່າປັບໃໝ, ແລະ ລາຍການເຊົ່າສຳເລັດ",
  },

  // ─── Point of Sale (POS) ───
  {
    screenId: "POS000001",
    path: "/dashboard/pos",
    titleLa: "ໜ້າຂາຍໜ້າຮ້ານ (POS)",
    titleEn: "Cashier POS Counter",
    module: "POS",
    descriptionLa: "ຂາຍສິນຄ້າໜ້າຮ້ານ, ຄິດໄລ່ເງິນ, ຍິງບາໂຄດ, ແລະ ອອກໃບບິນ",
  },

  // ─── Products & Catalog (PRD) ───
  {
    screenId: "PRD000001",
    path: "/dashboard/products",
    titleLa: "ລາຍການສິນຄ້າທັງໝົດ",
    titleEn: "Product Catalog",
    module: "Products",
    descriptionLa: "ລາຍການສິນຄ້າ, ລາຄາ, ສະຕັອກ, ແລະ ສະຖານະ",
  },
  {
    screenId: "PRD000002",
    path: "/dashboard/products/create",
    titleLa: "ເພີ່ມສິນຄ້າໃໝ່",
    titleEn: "Create New Product",
    module: "Products",
    descriptionLa: "ສ້າງສິນຄ້າໃໝ່, ກຳນົດບາໂຄດ, ຕົ້ນທຶນ, ແລະ ລາຄາຂາຍ",
  },
  {
    screenId: "PRD000003",
    path: "/dashboard/products/categories",
    titleLa: "ໝວດໝູ່ສິນຄ້າ",
    titleEn: "Product Categories",
    module: "Products",
    descriptionLa: "ຈັດການໝວດໝູ່ຫຼັກ ແລະ ໝວດໝູ່ຍ່ອຍ",
  },
  {
    screenId: "PRD000004",
    path: "/dashboard/products/barcodes",
    titleLa: "ພິມບາໂຄດສິນຄ້າ",
    titleEn: "Barcode Generator & Printing",
    module: "Products",
    descriptionLa: "ພິມສະຕິກເກີບາໂຄດຕິດສິນຄ້າທຸກຂະໜາດ",
  },
  {
    screenId: "PRD000005",
    path: "/dashboard/products/brands",
    titleLa: "ຍີ່ຫໍ້ສິນຄ້າ",
    titleEn: "Product Brands",
    module: "Products",
    descriptionLa: "ຈັດການຍີ່ຫໍ້ ແລະ ຜູ້ຜະລິດສິນຄ້າ",
  },
  {
    screenId: "PRD000006",
    path: "/dashboard/products/price-lists",
    titleLa: "ຕາຕະລາງລາຄາ",
    titleEn: "Price Lists Management",
    module: "Products",
    descriptionLa: "ກຳນົດລາຄາຂາຍຍົກ-ຂາຍຍ່ອຍ ແລະ ລາຄາສະມາຊິກ",
  },

  // ─── Inventory & Warehouses (INV) ───
  {
    screenId: "INV000001",
    path: "/dashboard/inventory",
    titleLa: "ພາບລວມສາງສິນຄ້າ",
    titleEn: "Inventory Overview",
    module: "Inventory",
    descriptionLa: "ພາບລວມສິນຄ້າຄົງຄັງ, ມູນຄ່າສິນຄ້າ, ແລະ ຍອດຄົງເຫຼືອ",
  },
  {
    screenId: "INV000002",
    path: "/dashboard/inventory/warehouses",
    titleLa: "ຄຸ້ມຄອງສາງສິນຄ້າ",
    titleEn: "Warehouse Locations",
    module: "Inventory",
    descriptionLa: "ຈັດການສາງຫຼັກ, ສາງຍ່ອຍ, ແລະ ຈຸດເກັບສິນຄ້າ",
  },
  {
    screenId: "INV000003",
    path: "/dashboard/inventory/purchase-orders",
    titleLa: "ໃບສັ່ງຊື້ສິນຄ້າ (PO)",
    titleEn: "Purchase Orders",
    module: "Inventory",
    descriptionLa: "ລາຍການໃບສັ່ງຊື້, ຕິດຕາມການຮັບເຄື່ອງ, ແລະ ໃບ PO",
  },
  {
    screenId: "INV000004",
    path: "/dashboard/inventory/purchase-orders/new",
    titleLa: "ສ້າງໃບສັ່ງຊື້ໃໝ່",
    titleEn: "Create Purchase Order",
    module: "Inventory",
    descriptionLa: "ອອກໃບສັ່ງຊື້ສິນຄ້າໄປຫາ Supplier",
  },
  {
    screenId: "INV000005",
    path: "/dashboard/inventory/suppliers",
    titleLa: "ຜູ້ສະໜອງສິນຄ້າ",
    titleEn: "Supplier Management",
    module: "Inventory",
    descriptionLa: "ຖານຂໍ້ມູນຜູ້ສະໜອງສິນຄ້າ (Suppliers/Vendors)",
  },
  {
    screenId: "INV000006",
    path: "/dashboard/inventory/transfers",
    titleLa: "ໂອນຍ້າຍສິນຄ້າລະຫວ່າງສາງ",
    titleEn: "Stock Transfers",
    module: "Inventory",
    descriptionLa: "ໃບໂອນຍ້າຍສິນຄ້າຂ້າມສາງ ຫຼື ຂ້າມສາຂາ",
  },
  {
    screenId: "INV000007",
    path: "/dashboard/inventory/count",
    titleLa: "ກວດນັບສິນຄ້າໃນສາງ",
    titleEn: "Stock Count & Audit",
    module: "Inventory",
    descriptionLa: "ກວດນັບສະຕັອກຕົວຈິງ ແລະ ປັບຍອດຄົງເຫຼືອ",
  },
  {
    screenId: "INV000008",
    path: "/dashboard/inventory/alerts",
    titleLa: "ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ",
    titleEn: "Low Stock Alerts",
    module: "Inventory",
    descriptionLa: "ລາຍການສິນຄ້າທີ່ຫຼຸດຕ່ຳກວ່າຍອດ Min Stock",
  },
  {
    screenId: "INV000009",
    path: "/dashboard/inventory/expiry",
    titleLa: "ຕິດຕາມວັນໝົດອາຍຸ",
    titleEn: "Batch & Expiry Tracking",
    module: "Inventory",
    descriptionLa: "ລາຍການສິນຄ້າໃກ້ໝົດອາຍຸ (FEFO/FIFO)",
  },
  {
    screenId: "INV000010",
    path: "/dashboard/inventory/serial",
    titleLa: "ເລກ Serial Number",
    titleEn: "Serial Number Tracking",
    module: "Inventory",
    descriptionLa: "ຕິດຕາມເລກ Serial Number ຂອງອຸປະກອນແຕ່ລະຊິ້ນ",
  },

  // ─── Orders & Sales (ORD) ───
  {
    screenId: "ORD000001",
    path: "/dashboard/orders/all",
    titleLa: "ລາຍການຂາຍທັງໝົດ",
    titleEn: "All Sales Orders",
    module: "Orders",
    descriptionLa: "ລາຍການບິນຂາຍທຸກຊ່ອງທາງ",
  },
  {
    screenId: "ORD000002",
    path: "/dashboard/orders/history",
    titleLa: "ປະຫວັດການຂາຍ",
    titleEn: "Order History",
    module: "Orders",
    descriptionLa: "ປະຫວັດບິນຂາຍຍ້ອນຫຼັງ ແລະ ພິມບິນຄືນ",
  },
  {
    screenId: "ORD000003",
    path: "/dashboard/orders/online",
    titleLa: "ອໍເດີອອນລາຍ",
    titleEn: "Online Store Orders",
    module: "Orders",
    descriptionLa: "ອໍເດີທີ່ສັ່ງຜ່ານໜ້າຮ້ານອອນລາຍ",
  },
  {
    screenId: "ORD000004",
    path: "/dashboard/orders/pending",
    titleLa: "ອໍເດີລໍຖ້າຈັດສົ່ງ",
    titleEn: "Pending Orders",
    module: "Orders",
    descriptionLa: "ລາຍການອໍເດີທີ່ລໍຖ້າການຫຸ້ມຫໍ່ ແລະ ຈັດສົ່ງ",
  },
  {
    screenId: "ORD000005",
    path: "/dashboard/returns",
    titleLa: "ຮັບຄືນສິນຄ້າ",
    titleEn: "Sales Returns & Refunds",
    module: "Orders",
    descriptionLa: "ບັນທຶກການຮັບຄືນສິນຄ້າ ແລະ ສົ່ງເງິນຄືນ",
  },

  // ─── Reports & Business Intelligence (RPT) ───
  {
    screenId: "RPT000001",
    path: "/dashboard/reports/sales",
    titleLa: "ລາຍງານຍອດຂາຍ",
    titleEn: "Sales Analysis Report",
    module: "Reports",
    descriptionLa: "ວິເຄາະຍອດຂາຍຕາມວັນ, ເດືອນ, ປີ ແລະ ຊ່ອງທາງຊຳລະ",
  },
  {
    screenId: "RPT000002",
    path: "/dashboard/reports/trending",
    titleLa: "ລາຍງານສິນຄ້າຍອດນິຍົມ",
    titleEn: "Trending & Top Selling Products",
    module: "Reports",
    descriptionLa: "ສິນຄ້າຂາຍດີອັນດັບ 1-100 ແລະ ທ່າອ່ຽງຄວາມຕ້ອງການ",
  },
  {
    screenId: "RPT000003",
    path: "/dashboard/reports",
    titleLa: "ສູນລວມລາຍງານທຸລະກິດ",
    titleEn: "Business Reports Center",
    module: "Reports",
    descriptionLa: "ລາຍງານພາບລວມທຸລະກິດ ແລະ ການດຳເນີນງານ",
  },
  {
    screenId: "RPT000004",
    path: "/dashboard/rental/fines",
    titleLa: "ລາຍງານການເຊົ່າ & ຮັບຄືນ",
    titleEn: "Rental Settlement & Fines Report",
    module: "Reports",
    descriptionLa: "ສະຫຼຸບລາຍຮັບຄ່າເຊົ່າ, ຄ່າປັບໃໝ, ແລະ ເງິນມັດຈຳ (Cuscen Style)",
  },
  {
    screenId: "RPT000005",
    path: "/dashboard/accounting/journals",
    titleLa: "ລາຍງານບັນຊີລາຍວັນ",
    titleEn: "General Journal Report",
    module: "Reports",
    descriptionLa: "ສະຫຼຸບລາຍການບັນຊີລາຍວັນ ແລະ ເລກທີບັນຊີ",
  },

  // ─── Repairs & Service Center (RPR) ───
  {
    screenId: "RPR000001",
    path: "/dashboard/repairs/tickets",
    titleLa: "ໃບຮັບສ້ອມແປງ",
    titleEn: "Repair Service Tickets",
    module: "Repairs",
    descriptionLa: "ອອກໃບຮັບສ້ອມ, ປະເມີນອາການ, ແລະ ລາຄາສ້ອມແປງ",
  },
  {
    screenId: "RPR000002",
    path: "/dashboard/repairs/parts",
    titleLa: "ຄັງອາໄຫຼ່ສ້ອມແປງ",
    titleEn: "Spare Parts Inventory",
    module: "Repairs",
    descriptionLa: "ຈັດການອາໄຫຼ່ ແລະ ອຸປະກອນສ້ອມແປງ",
  },
  {
    screenId: "RPR000003",
    path: "/dashboard/repairs/status",
    titleLa: "ຕິດຕາມສະຖານະງານສ້ອມ",
    titleEn: "Repair Status Board",
    module: "Repairs",
    descriptionLa: "ກະດານຕິດຕາມຂັ້ນຕອນການສ້ອມແປງຂອງຊ່າງ",
  },
  {
    screenId: "RPR000004",
    path: "/dashboard/repairs/warranty",
    titleLa: "ການຮັບປະກັນງານສ້ອມ",
    titleEn: "Warranty Claims & Management",
    module: "Repairs",
    descriptionLa: "ກວດສອບ ແລະ ເຄລມປະກັນງານສ້ອມແປງ",
  },

  // ─── Restaurant, Dining & KDS (RST) ───
  {
    screenId: "RST000001",
    path: "/dashboard/restaurant/zones",
    titleLa: "ຈັດການໂຕະ & ໂຊນ",
    titleEn: "Table & Zone Layout",
    module: "Restaurant",
    descriptionLa: "ແຜນຜັງໂຕະອາຫານ, ໂຊນ VIP, ແລະ ສະຖານະໂຕະ",
  },
  {
    screenId: "RST000002",
    path: "/dashboard/restaurant/kitchen",
    titleLa: "ໜ້າຈໍຄົວ (KDS)",
    titleEn: "Kitchen Display System (KDS)",
    module: "Restaurant",
    descriptionLa: "ໜ້າຈໍສະແດງລາຍການອາຫານສຳລັບພໍ່ຄົວ/ແມ່ຄົວ",
  },
  {
    screenId: "RST000003",
    path: "/dashboard/restaurant/cashier",
    titleLa: "ແຄຊເຊຍຮ້ານອາຫານ",
    titleEn: "Restaurant Cashier Desk",
    module: "Restaurant",
    descriptionLa: "ຄິດໄລ່ເງິນຕາມໂຕະ, ຮວມບິນ, ແລະ ແຍກບິນ",
  },
  {
    screenId: "RST000004",
    path: "/dashboard/restaurant/modifiers",
    titleLa: "ຕົວເລືອກອາຫານ (Modifiers)",
    titleEn: "Food Modifiers & Options",
    module: "Restaurant",
    descriptionLa: "ລະດັບຄວາມຫວານ, ຄວາມເຜັດ, ແລະ ທັອບປິ້ງພິເສດ",
  },
  {
    screenId: "RST000005",
    path: "/dashboard/restaurant/recipes",
    titleLa: "ສູດອາຫານ & ວັດຖຸດິບ",
    titleEn: "Recipe & Cost Management (BOM)",
    module: "Restaurant",
    descriptionLa: "ຄິດໄລ່ຕົ້ນທຶນວັດຖຸດິບ ແລະ ສູດອາຫານ",
  },
  {
    screenId: "RST000006",
    path: "/dashboard/restaurant/split-merge",
    titleLa: "ແຍກ ແລະ ລວມໂຕະ",
    titleEn: "Split & Merge Tables",
    module: "Restaurant",
    descriptionLa: "ຍ້າຍໂຕະ, ລວມໂຕະ, ແລະ ແຍກລາຍການສັ່ງ",
  },

  // ─── Accounting, Invoicing & Billing (ACC) ───
  {
    screenId: "ACC000001",
    path: "/dashboard/accounting/invoices",
    titleLa: "ໃບແຈ້ງໜີ້ (Invoices)",
    titleEn: "Customer Invoices",
    module: "Accounting",
    descriptionLa: "ອອກໃບແຈ້ງໜີ້, ຕິດຕາມໜີ້ຕ້ອງຮັບ, ແລະ ໃບວາງບິນ",
  },
  {
    screenId: "ACC000002",
    path: "/dashboard/accounting/invoices/new",
    titleLa: "ສ້າງໃບແຈ້ງໜີ້ໃໝ່",
    titleEn: "Create New Invoice",
    module: "Accounting",
    descriptionLa: "ອອກໃບແຈ້ງໜີ້ ແລະ ໃບຮຽກເກັບເງິນໃໝ່",
  },
  {
    screenId: "ACC000003",
    path: "/dashboard/quotations",
    titleLa: "ໃບສະເໜີລາຄາ (Quotations)",
    titleEn: "Quotations & Estimates",
    module: "Accounting",
    descriptionLa: "ອອກໃບສະເໜີລາຄາໃຫ້ລູກຄ້າ ແລະ ປ່ຽນເປັນໃບບິນ",
  },
  {
    screenId: "ACC000004",
    path: "/dashboard/accounting/installments",
    titleLa: "ລະບົບຜ່ອນຊຳລະ",
    titleEn: "Installment Plans",
    module: "Accounting",
    descriptionLa: "ສັນຍາຜ່ອນຊຳລະ, ງວດຊຳລະ, ແລະ ດອກເບ້ຍ",
  },
  {
    screenId: "ACC000005",
    path: "/dashboard/accounting/chart-of-accounts",
    titleLa: "ຜັງບັນຊີ",
    titleEn: "Chart of Accounts",
    module: "Accounting",
    descriptionLa: "ຜັງບັນຊີມາດຕະຖານ, ໝວດຊັບສິນ, ແລະ ໜີ້ສິນ",
  },
  {
    screenId: "ACC000006",
    path: "/dashboard/accounting/tax",
    titleLa: "ພາສີ & ອາກອນ",
    titleEn: "Tax Configuration & Reports",
    module: "Accounting",
    descriptionLa: "ອາກອນມູນຄ່າເພີ່ມ (VAT) ແລະ ພາສີທຸລະກິດ",
  },
  {
    screenId: "ACC000007",
    path: "/dashboard/accounting/commissions",
    titleLa: "ຄ່າຄອມມິດຊັນ",
    titleEn: "Commissions Management",
    module: "Accounting",
    descriptionLa: "ຄິດໄລ່ ແລະ ຈ່າຍຄ່າຄອມມິດຊັນຝ່າຍຂາຍ",
  },
  {
    screenId: "ACC000008",
    path: "/dashboard/accounting/purchases",
    titleLa: "ບັນທຶກລາຍຈ່າຍຈັດຊື້",
    titleEn: "Purchase Expenses",
    module: "Accounting",
    descriptionLa: "ບັນທຶກຄ່າໃຊ້ຈ່າຍ ແລະ ໃບບິນຈັດຊື້ພາຍໃນ",
  },

  // ─── Customer Relationship Management (CRM) ───
  {
    screenId: "CRM000001",
    path: "/dashboard/customers",
    titleLa: "ຖານຂໍ້ມູນລູກຄ້າ",
    titleEn: "Customer Directory",
    module: "CRM",
    descriptionLa: "ລາຍຊື່ລູກຄ້າ, ເບີໂທ, ທີ່ຢູ່, ແລະ ຍອດຊື້ສະສົມ",
  },
  {
    screenId: "CRM000002",
    path: "/dashboard/customers/points",
    titleLa: "ຄະແນນສະສົມ (Points)",
    titleEn: "Loyalty Points System",
    module: "CRM",
    descriptionLa: "ຄະແນນສະສົມຈາກການຊື້ ແລະ ການແລກຂອງລາງວັນ",
  },
  {
    screenId: "CRM000003",
    path: "/dashboard/customers/membership",
    titleLa: "ລະດັບສະມາຊິກ",
    titleEn: "Membership Tiers",
    module: "CRM",
    descriptionLa: "ຈັດການລະດັບສະມາຊິກ Silver, Gold, Platinum",
  },
  {
    screenId: "CRM000004",
    path: "/dashboard/customers/loyalty",
    titleLa: "ໂຄງການລາງວັນ (Loyalty)",
    titleEn: "Loyalty Programs",
    module: "CRM",
    descriptionLa: "ກົດເກນການສະສົມແຕ້ມ ແລະ ສິດພິເສດ",
  },
  {
    screenId: "CRM000005",
    path: "/dashboard/coupons",
    titleLa: "ຄູປອງສ່ວນຫຼຸດ",
    titleEn: "Discount Coupons & Vouchers",
    module: "CRM",
    descriptionLa: "ສ້າງລະຫັດຄູປອງ ແລະ ໂປຣໂມຊັ່ນສ່ວນຫຼຸດ",
  },

  // ─── Human Resources & Staff (HRM) ───
  {
    screenId: "HRM000001",
    path: "/dashboard/staff",
    titleLa: "ລາຍຊື່ພະນັກງານ",
    titleEn: "Staff Management",
    module: "HRM",
    descriptionLa: "ຈັດການບັນຊີພະນັກງານ ແລະ ກຳນົດສິດເຂົ້າເຖິງ",
  },
  {
    screenId: "HRM000002",
    path: "/dashboard/hr/employees",
    titleLa: "ໂປຣໄຟລ໌ພະນັກງານ",
    titleEn: "Employee Directory & Profiles",
    module: "HRM",
    descriptionLa: "ຂໍ້ມູນພະນັກງານ, ຕຳແໜ່ງ, ແລະ ເງິນເດືອນ",
  },
  {
    screenId: "HRM000003",
    path: "/dashboard/attendance",
    titleLa: "ບັນທຶກການລົງເວລາ",
    titleEn: "Time & Attendance",
    module: "HRM",
    descriptionLa: "ລົງເວລາເຂົ້າ-ອອກວຽກ, ຂາດ, ລາ, ມາຊ້າ",
  },
  {
    screenId: "HRM000004",
    path: "/dashboard/hr/commission",
    titleLa: "ຄອມມິດຊັນພະນັກງານ",
    titleEn: "Staff Commission Payouts",
    module: "HRM",
    descriptionLa: "ສະຫຼຸບຍອດຄອມມິດຊັນພະນັກງານລາຍເດືອນ",
  },

  // ─── Settings & System Configuration (SET) ───
  {
    screenId: "SET000001",
    path: "/dashboard/settings",
    titleLa: "ຕັ້ງຄ່າຮ້ານຄ້າທົ່ວໄປ",
    titleEn: "General Store Settings",
    module: "Settings",
    descriptionLa: "ຊື່ຮ້ານ, ໂລໂກ້, ທີ່ຢູ່, ແລະ ຂໍ້ມູນຕິດຕໍ່",
  },
  {
    screenId: "SET000002",
    path: "/dashboard/settings/branches",
    titleLa: "ຈັດການສາຂາຮ້ານ",
    titleEn: "Store Branches",
    module: "Settings",
    descriptionLa: "ເພີ່ມສາຂາ ແລະ ແຍກການດຳເນີນງານຕາມສາຂາ",
  },
  {
    screenId: "SET000003",
    path: "/dashboard/settings/receipts",
    titleLa: "ຕັ້ງຄ່າໃບບິນ & ໂລໂກ້",
    titleEn: "Receipt & Invoice Template Settings",
    module: "Settings",
    descriptionLa: "ຮູບແບບໃບບິນນ້ອຍ 80mm, ໃບບິນໃຫຍ່ A4, ແລະ QR ໂອນເງິນ",
  },
  {
    screenId: "SET000004",
    path: "/dashboard/settings/payments",
    titleLa: "ຊ່ອງທາງການຊຳລະເງິນ",
    titleEn: "Payment Gateways & QR Code",
    module: "Settings",
    descriptionLa: "ຕັ້ງຄ່າ BCEL OnePay, PromptPay, ເງິນສົດ, ແລະ ໂອນຜ່ານທະນາຄານ",
  },
  {
    screenId: "SET000005",
    path: "/dashboard/settings/shipping",
    titleLa: "ຕັ້ງຄ່າການຈັດສົ່ງ",
    titleEn: "Delivery & Shipping Providers",
    module: "Settings",
    descriptionLa: "ຕັ້ງຄ່າບໍລິສັດຂົນສົ່ງ ແລະ ຄ່າຈັດສົ່ງ",
  },
  {
    screenId: "SET000006",
    path: "/dashboard/billing",
    titleLa: "ແພັກເກດ & ການຕໍ່ອາຍຸ",
    titleEn: "Subscription Billing & Packages",
    module: "Settings",
    descriptionLa: "ຈັດການແພັກເກດລະບົບ ແລະ ແຈ້ງຕໍ່ອາຍຸສັນຍາ",
  },

  // ─── Booking, Services & Facilities (BKG) ───
  {
    screenId: "BKG000001",
    path: "/dashboard/booking/appointments",
    titleLa: "ປະຕິທິນຈອງນັດໝາຍ",
    titleEn: "Booking Calendar & Appointments",
    module: "Booking",
    descriptionLa: "ຕາຕະລາງນັດໝາຍລູກຄ້າ, ແບ່ງຕາມພະນັກງານ ແລະ ຫ້ອງບໍລິການ",
  },
  {
    screenId: "BKG000002",
    path: "/dashboard/facilities/book",
    titleLa: "ຈັດການສະໜາມ ແລະ ຄອດ",
    titleEn: "Court & Field Management",
    module: "Booking",
    descriptionLa: "ຈອງສະໜາມກິລາ, ຄອດແບັດ, ສະໜາມບານ ແລະ ຄິດໄລ່ຊົ່ວໂມງ",
  },
  {
    screenId: "BKG000003",
    path: "/dashboard/facilities/calendar",
    titleLa: "ຕາຕະລາງຈອງສະໜາມ & ຫ້ອງ",
    titleEn: "Facility Booking Calendar",
    module: "Booking",
    descriptionLa: "ຕາຕະລາງຈອງສະໜາມກິລາ, ຫ້ອງປະຊຸມ ແລະ ອຸປະກອນ",
  },
  {
    screenId: "BKG000004",
    path: "/dashboard/booking/resources",
    titleLa: "ຊັບພະຍາກອນການຈອງ",
    titleEn: "Booking Resources",
    module: "Booking",
    descriptionLa: "ຈັດການຫ້ອງບໍລິການ, ຕຽງ, ສະໜາມ, ແລະ ອຸປະກອນ",
  },
  {
    screenId: "BKG000005",
    path: "/dashboard/coaching/classes",
    titleLa: "ຫ້ອງຮຽນ & ໂຄດຊິ້ງ",
    titleEn: "Coaching Classes & Schedule",
    module: "Services",
    descriptionLa: "ຈັດການຄອດຮຽນ, ຕາຕະລາງຄູເຝິກ, ແລະ ນັກຮຽນ",
  },
  {
    screenId: "BKG000006",
    path: "/dashboard/fitting/measure",
    titleLa: "ບໍລິການຟິດຕິ້ງ (Size)",
    titleEn: "Tailoring & Custom Fitting",
    module: "Services",
    descriptionLa: "ບັນທຶກຂະໜາດຮູບຮ່າງ, ວັດແທກຕົວ ແລະ ຄຳສັ່ງຕັດຫຍິບ",
  },
  {
    screenId: "BKG000007",
    path: "/dashboard/clinic/history",
    titleLa: "ປະຫວັດການປິ່ນປົວ (Clinic)",
    titleEn: "Clinic Medical Records",
    module: "Services",
    descriptionLa: "ປະຫວັດການປິ່ນປົວຄົນໄຂ້, ອາການ, ແລະ ການຈ່າຍຢາ",
  },
  {
    screenId: "BKG000008",
    path: "/dashboard/clinic/certificates",
    titleLa: "ອອກໃບຮັບຮອງແພດ",
    titleEn: "Medical Certificates",
    module: "Services",
    descriptionLa: "ອອກໃບຢັ້ງຢືນການແພດ ແລະ ໃບກວດສຸຂະພາບ",
  },
  {
    screenId: "BKG000009",
    path: "/dashboard/tech/sync",
    titleLa: "ອຸປະກອນອັດສະລິຍະ",
    titleEn: "Smart Devices Sync",
    module: "Services",
    descriptionLa: "ເຊື່ອມຕໍ່ ແລະ ຊິງຄ໌ຂໍ້ມູນອຸປະກອນ IoT",
  },
  {
    screenId: "BKG000010",
    path: "/dashboard/second-hand/consignment",
    titleLa: "ສິນຄ້າມືສອງ & ຝາກຂາຍ",
    titleEn: "Second-Hand Consignment",
    module: "Specialized",
    descriptionLa: "ຮັບຝາກຂາຍສິນຄ້າມືສອງ ແລະ ແບ່ງເປີເຊັນ",
  },

  // ─── Specialized Industry Aliases (SPEC) ───
  {
    screenId: "SPEC000001",
    path: "/dashboard/booking/appointments",
    titleLa: "ປະຕິທິນຈອງນັດໝາຍ",
    titleEn: "Booking Calendar & Appointments",
    module: "Booking",
    descriptionLa: "ຕາຕະລາງນັດໝາຍລູກຄ້າ, ແບ່ງຕາມພະນັກງານ ແລະ ຫ້ອງບໍລິການ",
  },
  {
    screenId: "SPEC000002",
    path: "/dashboard/facilities/calendar",
    titleLa: "ຈອງສະໜາມ & ຫ້ອງປະຊຸມ",
    titleEn: "Facility Booking Calendar",
    module: "Specialized",
    descriptionLa: "ຕາຕະລາງຈອງສະໜາມກິລາ, ຫ້ອງ, ແລະ ອຸປະກອນ",
  },
  {
    screenId: "SPEC000003",
    path: "/dashboard/second-hand/consignment",
    titleLa: "ສິນຄ້າມືສອງ & ຝາກຂາຍ",
    titleEn: "Second-Hand Consignment",
    module: "Specialized",
    descriptionLa: "ຮັບຝາກຂາຍສິນຄ້າມືສອງ ແລະ ແບ່ງເປີເຊັນ",
  },
  {
    screenId: "SPEC000004",
    path: "/dashboard/customization/fitting",
    titleLa: "ຕັດຫຍິບ & ວັດຂະໜາດ",
    titleEn: "Tailoring & Fitting Orders",
    module: "Specialized",
    descriptionLa: "ບັນທຶກຂະໜາດຮູບຮ່າງ ແລະ ຄຳສັ່ງຕັດຫຍິບ",
  },
  {
    screenId: "SPEC000005",
    path: "/dashboard/clinic/history",
    titleLa: "ປະຫວັດການປິ່ນປົວ",
    titleEn: "Clinic Medical Records",
    module: "Specialized",
    descriptionLa: "ປະຫວັດການປິ່ນປົວຄົນໄຂ້ ແລະ ການຈ່າຍຢາ",
  },
  {
    screenId: "SPEC000006",
    path: "/dashboard/coaching/classes",
    titleLa: "ຫ້ອງຮຽນ & ຕາຕະລາງສອນ",
    titleEn: "Coaching & Classes",
    module: "Specialized",
    descriptionLa: "ຈັດການຄອດຮຽນ, ຕາຕະລາງຄູເຝິກ, ແລະ ນັກຮຽນ",
  },
];

/**
 * Fast Lookup Map by Screen ID (Case-insensitive)
 */
const SCREEN_BY_ID = new Map<string, ScreenDefinition>();
const SCREEN_BY_PATH = new Map<string, ScreenDefinition>();

SCREEN_REGISTRY.forEach((screen) => {
  SCREEN_BY_ID.set(screen.screenId.toUpperCase(), screen);
  SCREEN_BY_PATH.set(screen.path, screen);
});

/**
 * Retrieve screen definition by its Screen ID (e.g. 'RNT000001' or 'rnt000001')
 */
export function getScreenById(screenId: string): ScreenDefinition | undefined {
  if (!screenId) return undefined;
  return SCREEN_BY_ID.get(screenId.trim().toUpperCase());
}

/**
 * Retrieve screen definition by pathname (exact or prefix)
 */
export function getScreenByPath(pathname: string): ScreenDefinition | undefined {
  if (!pathname) return undefined;
  // Clean query strings if present
  const cleanPath = pathname.split("?")[0];

  // 1. Exact match
  if (SCREEN_BY_PATH.has(cleanPath)) {
    return SCREEN_BY_PATH.get(cleanPath);
  }

  // 2. Best prefix match (longest matching route)
  let bestMatch: ScreenDefinition | undefined;
  let maxLen = 0;

  for (const screen of SCREEN_REGISTRY) {
    if (cleanPath === screen.path) {
      return screen;
    }
    if (cleanPath.startsWith(screen.path + "/") && screen.path.length > maxLen) {
      bestMatch = screen;
      maxLen = screen.path.length;
    }
  }

  return bestMatch;
}

/**
 * Append or ensure screenId query parameter is attached to a given URL/Path
 */
export function resolvePathWithScreenId(path: string, fallbackScreenId?: string): string {
  const [basePath, queryStr] = path.split("?");
  const params = new URLSearchParams(queryStr || "");

  if (params.has("screenId")) {
    return path;
  }

  const def = getScreenByPath(basePath);
  const targetScreenId = def?.screenId || fallbackScreenId;

  if (targetScreenId) {
    params.set("screenId", targetScreenId);
    return `${basePath}?${params.toString()}`;
  }

  return path;
}
