import { exportMultiSheetExcel, ExcelSheetConfig } from "./excel";

function visualBar(perc: number, label?: string): string {
  const p = Math.max(0, Math.min(100, perc));
  const totalBlocks = 16;
  const filled = Math.round((p / 100) * totalBlocks);
  const empty = totalBlocks - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `${bar}  ${p.toFixed(0)}%${label ? ` (${label})` : ""}`;
}

/**
 * Generates and downloads a 5-sheet Comprehensive Business Report Workbook ("แยกหน้า สวยๆ")
 * including Executive Summary, Sales Revenue, Trending SKUs, Inventory Stock, and Customer KPIs,
 * ALL equipped with visual ASCII/Unicode progress bars ("มีกราฟข้อมูลต่างๆ ด้วย").
 */
export function exportComprehensiveReportExcel() {
  const sheets: ExcelSheetConfig[] = [
    // ── Sheet 1: Executive Summary ──
    {
      sheetName: "1. ພາບລວມ (Summary)",
      title: "ລາຍງານພາບລວມທຸລະກິດ & ກາບສະຖິຕິ (EXECUTIVE SUMMARY DASHBOARD)",
      subtitle: "ສະຫຼຸບຕົວເລກສຳຄັນປະຈຳເດືອນ ແລະ ກາບຕົວຊີ້ວັດການເຕີບໂຕ (KPIs)",
      headers: ["ລຳດັບ", "ຕົວຊີ້ວັດ (KPI Metric)", "ມູນຄ່າ / ຈຳນວນ", "ກາບຕົວຊີ້ວັດ (Visual Trend Bar Chart)", "ສະຖານະ"],
      data: [
        [1, "ຍອດຂາຍລວມທັງໝົດ (Total Revenue)", "₭412,500,000", visualBar(100, "+18.4%"), "ດີຫຼາຍ (Excellent)"],
        [2, "ຈຳນວນບິນ / ອໍເດີທັງໝົດ (Total Orders)", "1,429 ບິນ", visualBar(92, "+12.1%"), "ດີຫຼາຍ (Excellent)"],
        [3, "ຍອດສະເລ່ຍຕໍ່ບິນ (AOV)", "₭288,500", visualBar(78, "+5.6%"), "ປົກກະຕິ (Good)"],
        [4, "ລູກຄ້າໃໝ່ (New Customers)", "284 ຄົນ", visualBar(85, "+24.0%"), "ດີຫຼາຍ (Excellent)"],
        [5, "ອັດຕາຄວາມພึงພໍໃຈລູກຄ້າ (CSAT Score)", "98.5%", visualBar(98, "5 ດາວ"), "ດີເລີດ (Outstanding)"],
      ],
      summaryRow: [
        "ສະຫຼຸບລວມ / SUMMARY",
        "5 ຕົວຊີ້ວັດຫຼັກ",
        "₭412,500,000",
        visualBar(95, "ພາບລວມດີຫຼາຍ"),
        "ຜ່ານເກນປະເມີນ",
      ],
    },

    // ── Sheet 2: Sales Revenue Breakdown ──
    {
      sheetName: "2. ຍອດຂາຍ (Sales)",
      title: "ລາຍງານຍອດຂາຍ ແລະ ກາບສັດສ່ວນລາຍອາທິດ (SALES ANALYTICS & CHARTS)",
      subtitle: "ວິເຄາະຍອດຂາຍ, ຈຳນວນບິນ ແລະ ສັດສ່ວນແຕ່ລະອາທິດໃນເດືອນນີ້",
      headers: ["ລຳດັບ", "ຊ່ວງເວລາ (Period)", "ຍອດຂາຍ (Revenue ₭)", "ຈຳນວນບິນ (Orders)", "ກາບສັດສ່ວນຍອດຂາຍ (Visual Sales Bar Chart)", "ສັດສ່ວນ (%)"],
      data: [
        [1, "ອາທິດທີ 1 (Week 1)", "₭88,200,000", "310 ບິນ", visualBar(60, "ຕໍ່າສຸດ"), "21.38%"],
        [2, "ອາທິດທີ 2 (Week 2)", "₭105,400,000", "365 ບິນ", visualBar(75, "ປົກກະຕິ"), "25.55%"],
        [3, "ອາທິດທີ 3 (Week 3)", "₭94,100,000", "332 ບິນ", visualBar(68, "ປົກກະຕິ"), "22.81%"],
        [4, "ອາທິດທີ 4 (Week 4)", "₭124,800,000", "422 ບິນ", visualBar(100, "ສູງສຸດ!"), "30.25%"],
      ],
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "4 ອາທິດ",
        "₭412,500,000",
        "1,429 ບິນ",
        visualBar(100, "ລວມ 100%"),
        "100.00%",
      ],
    },

    // ── Sheet 3: Trending SKUs & Forecast ──
    {
      sheetName: "3. ສິນຄ້າຂາຍດີ (Trending)",
      title: "ລາຍງານສິນຄ້າມາແຮງ & ກາບຄາດຄະເນ (TRENDING SKUs & FORECAST CHART)",
      subtitle: "ອັນດັບສິນຄ້າທີ່ເຕີບໂຕສູງສຸດ ແລະ ແນວໂນ້ມຄວາມຕ້ອງການຈາກ AI",
      headers: ["ອັນດັບ", "ຊື່ສິນຄ້າ / ບໍລິການ", "ໝວດໝູ່", "ອັດຕາການເຕີບໂຕ", "ກາບຄວາມຕ້ອງການ (Demand Bar)", "ຄາດຄະເນ (AI Forecast)"],
      data: [
        [1, "Trek Domane SL6 (ລົດຖີບເສືອໝອບ)", "ລົດຖີບ", "+48%", visualBar(100, "ຮ້ອນແຮງ!"), "ຄວາມຕ້ອງການສູງຫຼາຍ (ຄາດວ່າຂາຍໄດ້ 25 ຄັນ)"],
        [2, "Yonex Astrox 99 Pro (ໄມ້ຕີດອກປີກໄກ່)", "ອຸປະກອນກິລາ", "+35%", visualBar(82, "ສູງ"), "ຄວາມຕ້ອງການສູງ (ຄາດວ່າຂາຍໄດ້ 50 ໄມ້)"],
        [3, "ບໍລິການຕັ້ງສູນລໍ້ ແລະ ລ້າງໂສ້ລົດຖີບ", "ສ້ອມແປງ", "+29%", visualBar(70, "ປົກກະຕິ"), "ເຕີບໂຕຕໍ່ເນື່ອງ (60+ ຄັ້ງ/ເດືອນ)"],
        [4, "ຈອງເດີ່ນແບັດມິນຕັນ VIP (18:00-21:00)", "ເດີ່ນກິລາ", "+22%", visualBar(60, "ປົກກະຕິ"), "ເຕັມເກືອບທຸກວັນ (ແນະນຳເປີດໂປຣໂມຊັ່ນຕອນເຊົ້າ)"],
        [5, "Garmin Fenix 7 Sapphire Solar", "ອຸປະກອນກິລາ", "+18%", visualBar(50, "ຄົງທີ່"), "ຄວາມຕ້ອງການຄົງທີ່ (ຄາດວ່າຂາຍໄດ້ 20 ເຮືອນ)"],
      ],
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "5 ລາຍການອັນດັບຕົ້ນ",
        "3 ໝວດໝູ່",
        "+30.4% ສະເລ່ຍ",
        visualBar(85, "ແນວໂນ້ມດີຫຼາຍ"),
        "ແນະນຳຕື່ມສະຕັອກລ່ວງໜ້າ",
      ],
    },

    // ── Sheet 4: Inventory & Stock Health ──
    {
      sheetName: "4. ສະຕ໋ອກ (Inventory)",
      title: "ລາຍງານສະຖານະຄັງສິນຄ້າ & ກາບສະຕັອກ (INVENTORY HEALTH CHARTS)",
      subtitle: "ຕິດຕາມຈຳນວນສິນຄ້າໃນຄັງ, ກາບລະດັບສະຕັອກ ແລະ ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ",
      headers: ["ລຳດັບ", "ຊື່ສິນຄ້າ", "ໝວດໝູ່", "ຈຳນວນໃນຄັງ", "ກາບລະດັບສະຕັອກ (Stock Level Bar Chart)", "ສະຖານະ (Alert)"],
      data: [
        [1, "Trek Domane SL6 (ລົດຖີບເສືອໝອບ)", "ລົດຖີບ", "4 ຊິ້ນ", visualBar(20, "ໃກ້ໝົດ"), "ໃກ້ໝົດ (LOW STOCK - ສັ່ງດ່ວນ)"],
        [2, "Yonex Astrox 99 Pro (ໄມ້ຕີດອກປີກໄກ່)", "ອຸປະກອນກິລາ", "15 ຊິ້ນ", visualBar(75, "ພຽງພໍ"), "ປົກກະຕິ (OK)"],
        [3, "Garmin Fenix 7 Sapphire Solar", "ອຸປະກອນກິລາ", "8 ຊິ້ນ", visualBar(60, "ພຽງພໍ"), "ປົກກະຕິ (OK)"],
        [4, "ຢາງລົດຖີບ Continental 700x25c", "ອະໄຫຼ່", "6 ຊິ້ນ", visualBar(30, "ໃກ້ໝົດ"), "ໃກ້ໝົດ (LOW STOCK - ສັ່ງດ່ວນ)"],
        [5, "ໝວກກັນກະທົບ Kask Protone", "ອຸປະກອນ", "24 ຊິ້ນ", visualBar(90, "ເຕັມຄັງ"), "ປົກກະຕິ (OK)"],
      ],
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "5 ລາຍການ",
        "4 ໝວດໝູ່",
        "57 ຊິ້ນ",
        visualBar(55, "ສະເລ່ຍ 55%"),
        "2 ລາຍການຄວນສັ່ງເພີ່ມ",
      ],
    },

    // ── Sheet 5: Customer KPIs ──
    {
      sheetName: "5. ລູກຄ້າ (Customers)",
      title: "ລາຍງານສະຖິຕິລູກຄ້າ & ກາບສັດສ່ວນ (CUSTOMER & LOYALTY CHARTS)",
      subtitle: "ການເຕີບໂຕຂອງລູກຄ້າແຕ່ລະກຸ່ມ, ຍອດໃຊ້ຈ່າຍ ແລະ ອັດຕາການຊື້ຊ້ຳ",
      headers: ["ລຳດັບ", "ກຸ່ມລູກຄ້າ (Segment)", "ຈຳນວນ (ຄົນ)", "ກາບສັດສ່ວນລູກຄ້າ (Customer Segment Bar)", "ຍອດໃຊ້ຈ່າຍສະເລ່ຍ (₭)", "ອັດຕາການຊື້ຊ້ຳ (%)"],
      data: [
        [1, "VIP Members (ສະມາຊິກ VIP)", "45 ຄົນ", visualBar(25, "ລູກຄ້າຊັ້ນດີ"), "₭12,400,000", "84.5%"],
        [2, "Regular Customers (ລູກຄ້າປະຈຳ)", "128 ຄົນ", visualBar(65, "ຊື້ຊ້ຳປົກກະຕິ"), "₭3,850,000", "62.0%"],
        [3, "New Customers (ລູກຄ້າໃໝ່ເດືອນນີ້)", "284 ຄົນ", visualBar(100, "ລູກຄ້າໃໝ່"), "₭950,000", "18.5%"],
      ],
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "3 ກຸ່ມລູກຄ້າ",
        "457 ຄົນ",
        visualBar(100, "ລວມທຸກກຸ່ມ"),
        "₭4,250,000 ສະເລ່ຍ",
        "55.0% ສະເລ່ຍ",
      ],
    },
  ];

  exportMultiSheetExcel({
    filename: "SaaS_Master_Business_Report.xlsx",
    sheets,
  });
}
