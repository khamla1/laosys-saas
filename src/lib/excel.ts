import XLSX from "xlsx-js-style";

export interface ExcelSheetConfig {
  sheetName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  data: (string | number | null | undefined)[][];
  summaryRow?: (string | number | null | undefined)[];
}

export interface ExcelSingleExportConfig extends ExcelSheetConfig {
  filename: string;
}

export interface ExcelMultiSheetConfig {
  filename: string;
  sheets: ExcelSheetConfig[];
}

/**
 * Generates an ASCII/Unicode Progress Bar Chart string for Excel cells
 * e.g. "██████████████░░░░░░  70.0%"
 */
function createVisualBar(percent: number, customLabel?: string): string {
  const p = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  const totalBlocks = 16;
  const filled = Math.round((p / 100) * totalBlocks);
  const empty = totalBlocks - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `${bar}  ${p.toFixed(0)}%${customLabel ? ` (${customLabel})` : ""}`;
}

/**
 * Theme configuration for different data report types so each report looks
 * visually distinct and tailored to its domain ("ทำให้แตกต่างกัน")
 */
interface ReportTheme {
  primaryBg: string;      // Banner Background Hex (e.g. 065F46)
  headerBg: string;       // Table Header Background Hex
  accentColor: string;    // Text / Accent Hex
  lightBg: string;        // Light spacer fill Hex
  titlePrefix: string;    // Emoji prefix
  kpiTitle: string;       // KPI block title
  metricLabel: string;    // What the number represents
}

function getReportTheme(title: string, sheetName: string): ReportTheme {
  const combined = `${title} ${sheetName}`.toLowerCase();

  if (combined.includes("ສະຕ໋ອກ") || combined.includes("stock") || combined.includes("inventory")) {
    return {
      primaryBg: "065F46",  // Deep Emerald Green
      headerBg: "0D9488",   // Teal
      accentColor: "047857",
      lightBg: "ECFDF5",
      titlePrefix: "📦",
      kpiTitle: "📈 ສະຖິຕິຄັງສິນຄ້າ ແລະ ລະດັບສະຕັອກ (INVENTORY METRICS)",
      metricLabel: "ຈຳນວນໃນຄັງ (Stock Qty)",
    };
  } else if (combined.includes("ອໍເດີ") || combined.includes("order") || combined.includes("ບິນ") || combined.includes("sales")) {
    return {
      primaryBg: "1E3A8A",  // Deep Royal Blue
      headerBg: "2563EB",   // Vibrant Blue
      accentColor: "1D4ED8",
      lightBg: "EFF6FF",
      titlePrefix: "🛒",
      kpiTitle: "📈 ສະຖິຕິຍອດຂາຍ ແລະ ໃບບິນ (SALES & ORDERS METRICS)",
      metricLabel: "ມູນຄ່າຍອດຂາຍ (Order Amount)",
    };
  } else if (combined.includes("ສິນຄ້າ") || combined.includes("product") || combined.includes("ລາຄາ")) {
    return {
      primaryBg: "581C87",  // Deep Purple
      headerBg: "7C3AED",   // Violet
      accentColor: "6D28D9",
      lightBg: "F5F3FF",
      titlePrefix: "🏷️",
      kpiTitle: "📈 ສະຖິຕິສິນຄ້າໃນຮ້ານ ແລະ ລາຄາ (PRODUCTS & PRICING METRICS)",
      metricLabel: "ລາຄາຂາຍ (Price ₭)",
    };
  } else if (combined.includes("ລູກຄ້າ") || combined.includes("customer") || combined.includes("member")) {
    return {
      primaryBg: "78350F",  // Deep Gold / Amber
      headerBg: "D97706",   // Amber
      accentColor: "B45309",
      lightBg: "FFFBEB",
      titlePrefix: "👥",
      kpiTitle: "📈 ສະຖິຕິລູກຄ້າ ແລະ ສະມາຊິກ (CUSTOMERS & LOYALTY METRICS)",
      metricLabel: "ຄະແນນ / ຍອດຊື້",
    };
  } else if (combined.includes("ຄູປອງ") || combined.includes("coupon") || combined.includes("promo")) {
    return {
      primaryBg: "831843",  // Rose / Pink
      headerBg: "DB2777",   // Pink
      accentColor: "BE185D",
      lightBg: "FDF2F8",
      titlePrefix: "🎟️",
      kpiTitle: "📈 ສະຖິຕິໂປຣໂມຊັ່ນ ແລະ ຄູປອງ (COUPONS & PROMOTIONS)",
      metricLabel: "ມູນຄ່າສ່ວນຫຼຸດ / ການໃຊ້",
    };
  } else if (combined.includes("ຜູ້ສະໜອງ") || combined.includes("supplier") || combined.includes("partner")) {
    return {
      primaryBg: "134E4A",  // Deep Cyan / Teal
      headerBg: "0E7490",   // Cyan
      accentColor: "0F766E",
      lightBg: "ECFEFF",
      titlePrefix: "🤝",
      kpiTitle: "📈 ສະຖິຕິຄູ່ຄ້າ ແລະ ຜູ້ສະໜອງ (SUPPLIERS ANALYTICS)",
      metricLabel: "ຈຳນວນລາຍການຕິດຕໍ່",
    };
  } else {
    return {
      primaryBg: "1E293B",  // Deep Slate
      headerBg: "475569",   // Slate Gray
      accentColor: "334155",
      lightBg: "F8FAFC",
      titlePrefix: "🏢",
      kpiTitle: "📈 ສະຖິຕິພາບລວມຂໍ້ມູນ (DATA OVERVIEW METRICS)",
      metricLabel: "ຄ່າຂໍ້ມູນ (Value)",
    };
  }
}

/**
 * Analyze real table data to extract true mathematical metrics and top item percentages
 * so that visual graphs are 100% based on the actual data ("ให้มันเป็นไปตามข้อมูล")
 */
function analyzeRealData(headers: string[], data: (string | number | null | undefined)[][]) {
  const totalRows = data.length;

  // 1. Identify key column indices from headers
  let nameColIdx = 1; // Default second column (usually after index #1)
  let metricColIdx = -1;
  let statusColIdx = headers.length - 1; // Usually last column is status

  headers.forEach((h, idx) => {
    const text = h.toLowerCase();
    if (text.includes("ຊື່") || text.includes("name") || text.includes("ລະຫັດ") || text.includes("id")) {
      nameColIdx = idx;
    }
    if (text.includes("ຈຳນວນ") || text.includes("qty") || text.includes("ລາຄາ") || text.includes("price") || text.includes("ຍອດ") || text.includes("amount") || text.includes("ມູນຄ່າ")) {
      metricColIdx = idx;
    }
    if (text.includes("ສະຖານະ") || text.includes("status")) {
      statusColIdx = idx;
    }
  });

  // If no metric column explicitly found, use the column before status or column index 2/3
  if (metricColIdx === -1) {
    metricColIdx = Math.min(Math.max(1, headers.length - 2), headers.length - 1);
  }

  // 2. Extract numeric values from the metric column across all rows
  const parsedRows = data.map((row, idx) => {
    const nameVal = row[nameColIdx] || row[0] || `ລາຍການ ${idx + 1}`;
    const rawVal = row[metricColIdx];
    let numVal = 0;
    if (typeof rawVal === "number") {
      numVal = rawVal;
    } else if (typeof rawVal === "string") {
      const cleaned = rawVal.replace(/[₭$,%ຊິ້ນຄົນບິນລາຍການ ]/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) numVal = parsed;
    }
    const statusVal = row[statusColIdx] || "ປົກກະຕິ (OK)";
    return {
      index: idx + 1,
      name: nameVal.toString(),
      rawValue: rawVal !== null && rawVal !== undefined ? rawVal.toString() : numVal.toString(),
      numValue: numVal,
      status: statusVal.toString(),
      originalRow: row,
    };
  });

  // Calculate actual aggregate math
  const maxNum = Math.max(1, ...parsedRows.map((r) => r.numValue));
  const totalNum = parsedRows.reduce((sum, r) => sum + r.numValue, 0);
  const avgNum = totalRows > 0 ? totalNum / totalRows : 0;

  // Calculate health/status rates
  const okCount = parsedRows.filter((r) => {
    const s = r.status.toLowerCase();
    return s.includes("ok") || s.includes("active") || s.includes("ປົກກະຕິ") || s.includes("completed") || s.includes("ພຽງພໍ");
  }).length;
  const healthRate = totalRows > 0 ? Math.round((okCount / totalRows) * 100) : 100;

  return {
    totalRows,
    maxNum,
    totalNum,
    avgNum,
    healthRate,
    parsedRows,
    metricColIdx,
    nameColIdx,
  };
}

/**
 * Builds a beautifully structured and rich-styled Worksheet for the data table
 */
function buildWorksheet(config: ExcelSheetConfig): XLSX.WorkSheet {
  const { title, subtitle, headers, data, summaryRow } = config;
  const theme = getReportTheme(title, config.sheetName);

  const aoa: (string | number | null | undefined)[][] = [];

  // Row 0: Title Header
  aoa.push([`${theme.titlePrefix} ${title}`]);

  // Row 1: Subtitle / Timestamp
  const nowStr = new Date().toLocaleString("lo-LA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  aoa.push([`📅 ວັນທີອອກລາຍງານ: ${nowStr}${subtitle ? `  |  ${subtitle}` : ""}`]);

  // Row 2: Blank spacing row
  aoa.push([]);

  // Row 3: Table Column Headers
  aoa.push(headers);

  // Rows 4+: Data Rows
  data.forEach((row) => {
    aoa.push(row);
  });

  // Optional Summary Row
  let summaryRowIndex = -1;
  if (summaryRow && summaryRow.length > 0) {
    aoa.push([]);
    aoa.push(summaryRow);
    summaryRowIndex = aoa.length - 1;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const numCols = Math.max(
    headers.length,
    ...data.map((r) => r.length),
    summaryRow ? summaryRow.length : 0,
    3
  );

  // 1. Configure Row Heights (!rows)
  const rowsConfig: XLSX.RowInfo[] = [];
  for (let r = 0; r < aoa.length; r++) {
    if (r === 0) {
      rowsConfig.push({ hpt: 40 }); // Tall Title Banner
    } else if (r === 1) {
      rowsConfig.push({ hpt: 24 }); // Subtitle Row
    } else if (r === 2) {
      rowsConfig.push({ hpt: 12 }); // Empty Spacer
    } else if (r === 3) {
      rowsConfig.push({ hpt: 30 }); // Column Headers
    } else if (r === summaryRowIndex) {
      rowsConfig.push({ hpt: 32 }); // Summary Totals Row
    } else if (r === summaryRowIndex - 1) {
      rowsConfig.push({ hpt: 10 }); // Empty Spacer before summary
    } else {
      rowsConfig.push({ hpt: 25 }); // Standard Data Row
    }
  }
  ws["!rows"] = rowsConfig;

  // 2. Configure Merged Cells (!merges) for Title (A1) and Subtitle (A2)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
  ];

  // 3. Apply Premium Rich Styles to Every Cell
  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: "s", v: "" };
      }
      const cell = ws[cellRef];

      // A) Title Banner (Row 0)
      if (r === 0) {
        cell.s = {
          font: { name: "Calibri", sz: 16, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: theme.primaryBg } }, // Distinct Report Theme
          alignment: { horizontal: "left", vertical: "center", indent: 1 },
          border: {
            top: { style: "medium", color: { rgb: theme.primaryBg } },
            bottom: { style: "medium", color: { rgb: theme.headerBg } },
            left: { style: "medium", color: { rgb: theme.primaryBg } },
            right: { style: "medium", color: { rgb: theme.primaryBg } },
          },
        };
      }
      // B) Subtitle / Timestamp (Row 1)
      else if (r === 1) {
        cell.s = {
          font: { name: "Calibri", sz: 11, italic: true, color: { rgb: "334155" } },
          fill: { fgColor: { rgb: theme.lightBg } },
          alignment: { horizontal: "left", vertical: "center", indent: 1 },
          border: {
            bottom: { style: "thin", color: { rgb: "CBD5E1" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } },
          },
        };
      }
      // C) Spacer rows (Row 2, and row before summary)
      else if (r === 2 || r === summaryRowIndex - 1) {
        cell.s = {
          fill: { fgColor: { rgb: "FFFFFF" } },
        };
      }
      // D) Table Column Headers (Row 3)
      else if (r === 3) {
        cell.s = {
          font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "medium", color: { rgb: theme.accentColor } },
            bottom: { style: "medium", color: { rgb: theme.accentColor } },
            left: { style: "thin", color: { rgb: theme.accentColor } },
            right: { style: "thin", color: { rgb: theme.accentColor } },
          },
        };
      }
      // E) Summary Totals Row
      else if (r === summaryRowIndex) {
        cell.s = {
          font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "1E3A8A" } },
          fill: { fgColor: { rgb: "FEF3C7" } }, // Warm Gold Highlight (#FEF3C7)
          alignment: {
            horizontal: c === 0 ? "left" : "center",
            vertical: "center",
          },
          border: {
            top: { style: "medium", color: { rgb: "F59E0B" } },
            bottom: { style: "double", color: { rgb: "D97706" } }, // Accounting double border
            left: { style: "thin", color: { rgb: "FDE68A" } },
            right: { style: "thin", color: { rgb: "FDE68A" } },
          },
        };
      }
      // F) Data Rows (Rows 4 to N)
      else {
        const isEvenRow = (r - 4) % 2 === 0;
        const rowBgColor = isEvenRow ? "FFFFFF" : "F8FAFC";

        let hAlign = "left";
        const valStr = (cell.v || "").toString().trim();
        if (c === 0) {
          hAlign = "center";
        } else if (
          valStr.startsWith("₭") ||
          valStr.endsWith("%") ||
          valStr.endsWith("ຊິ້ນ") ||
          valStr.endsWith("ຄົນ") ||
          valStr.endsWith("ບິນ") ||
          valStr.endsWith("ຄັ້ງ") ||
          valStr.endsWith("ລາຍການ") ||
          /^[0-9,.-]+$/.test(valStr)
        ) {
          hAlign = "right";
        } else if (
          valStr === "Active" ||
          valStr === "Off" ||
          valStr === "OK" ||
          valStr.includes("ປົກກະຕິ") ||
          valStr.includes("LOW STOCK")
        ) {
          hAlign = "center";
        }

        let fontColor = "1E293B";
        if (valStr.includes("█")) {
          fontColor = theme.accentColor;
        }

        cell.s = {
          font: { name: "Calibri", sz: 11, color: { rgb: fontColor } },
          fill: { fgColor: { rgb: rowBgColor } },
          alignment: { horizontal: hAlign, vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } },
          },
        };
      }
    }
  }

  // 4. Auto-calculate Column Widths (!cols)
  const colWidths: XLSX.ColInfo[] = [];
  for (let c = 0; c < numCols; c++) {
    let maxLen = (headers[c] || "").toString().length;
    data.forEach((row) => {
      const val = row[c];
      if (val !== null && val !== undefined) {
        const len = val.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    if (summaryRow && summaryRow[c] !== undefined && summaryRow[c] !== null) {
      const len = summaryRow[c]!.toString().length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push({ wch: Math.min(Math.max(maxLen + 6, 16), 68) });
  }
  ws["!cols"] = colWidths;

  return ws;
}

/**
 * Builds a dedicated "📊 Chart & Visual Summary" worksheet with ASCII/Unicode graph bars
 * 100% CALCULATED FROM ACTUAL TABLE DATA and stylized with a UNIQUE THEME ("ทำให้แตกต่างกัน และเป็นไปตามข้อมูล")!
 */
function buildChartSummaryWorksheet(config: ExcelSheetConfig): XLSX.WorkSheet {
  const { title, subtitle, headers, data } = config;
  const theme = getReportTheme(title, config.sheetName);
  const analysis = analyzeRealData(headers, data);

  const aoa: (string | number | null | undefined)[][] = [];

  // Row 0: Banner
  aoa.push([`${theme.titlePrefix} ພາບລວມ & ກາບສະຖິຕິ (EXECUTIVE CHART DASHBOARD)`]);

  // Row 1: Subtitle
  const nowStr = new Date().toLocaleString("lo-LA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  aoa.push([`📅 ວິເຄາະຈາກຂໍ້ມູນຈິງ: ${nowStr}  |  ${title}`]);

  // Row 2: Spacer
  aoa.push([]);

  // Row 3: KPI Summary Title
  aoa.push([theme.kpiTitle]);

  // Rows 4-6: KPI Cards calculated from REAL DATA
  aoa.push(["ລຳດັບ", "ຕົວຊີ້ວັດຫຼັກ (KPI Metric)", "ຈຳນວນ / ມູນຄ່າຈິງ", "ກາບແນວໂນ້ມ (Visual Data Bar)", "ສະຖານະ"]);
  aoa.push([1, "ຈຳນວນລາຍການທັງໝົດໃນລະບົບ (Total Records)", `${analysis.totalRows} ລາຍການ`, createVisualBar(100), "ຄົບຖ້ວນ (100%)"]);
  aoa.push([2, "ອັດຕາຄວາມສົມບູນ & ປົກກະຕິ (Health Rate)", `${analysis.healthRate}%`, createVisualBar(analysis.healthRate), analysis.healthRate >= 90 ? "ດີຫຼາຍ (Excellent)" : "ຕ້ອງກວດສອບ (Alert)"]);
  aoa.push([
    3,
    `ຄ່າສູງສຸດຂອງ ${theme.metricLabel} (Max Value)`,
    `₭${analysis.maxNum.toLocaleString()}`,
    createVisualBar(100),
    "ຄ່າສູງສຸດ (MAX)",
  ]);
  aoa.push([
    4,
    `ຄ່າສະເລ່ຍຂອງ ${theme.metricLabel} (Average)`,
    `₭${Math.round(analysis.avgNum).toLocaleString()}`,
    createVisualBar(analysis.maxNum > 0 ? (analysis.avgNum / analysis.maxNum) * 100 : 50),
    "ຄ່າສະເລ່ຍ (AVG)",
  ]);

  // Row 8: Spacer
  aoa.push([]);

  // Row 9: Visual Chart Title
  aoa.push([`📊 ກາບສັດສ່ວນຂໍ້ມູນຈິງແຍກລາຍການ (ACTUAL DATA PROGRESS BAR CHART)`]);

  // Row 10: Visual Chart Headers
  aoa.push(["ອັນດັບ", "ຊື່ລາຍການ / ຂໍ້ມູນ (Item Name)", `${theme.metricLabel}`, "ກາບສັດສ່ວນຂໍ້ມູນຈິງ (Real Data Visual Bar Chart)", "ສະຖານະ"]);

  // Take top rows and calculate THEIR TRUE PERCENTAGES from real data!
  const sortedRows = [...analysis.parsedRows].sort((a, b) => b.numValue - a.numValue);
  const topRows = sortedRows.slice(0, 15);

  topRows.forEach((row, idx) => {
    // True percentage relative to the maximum numeric value in this table!
    const truePerc = analysis.maxNum > 0 ? Math.round((row.numValue / analysis.maxNum) * 100) : 100;
    const visualBar = createVisualBar(truePerc);
    aoa.push([
      `#${idx + 1}`,
      row.name,
      row.rawValue,
      visualBar,
      row.status,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Apply styles
  const numCols = 5;
  const totalRows = aoa.length;

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 4 } },
  ];

  ws["!rows"] = aoa.map((_, r) => {
    if (r === 0) return { hpt: 40 };
    if (r === 1) return { hpt: 24 };
    if (r === 3 || r === 9) return { hpt: 28 };
    if (r === 4 || r === 10) return { hpt: 30 };
    return { hpt: 26 };
  });

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };
      const cell = ws[cellRef];

      if (r === 0) {
        cell.s = {
          font: { name: "Calibri", sz: 16, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: theme.primaryBg } }, // Unique theme background
          alignment: { horizontal: "left", vertical: "center", indent: 1 },
        };
      } else if (r === 1) {
        cell.s = {
          font: { name: "Calibri", sz: 11, italic: true, color: { rgb: "334155" } },
          fill: { fgColor: { rgb: theme.lightBg } },
          alignment: { horizontal: "left", vertical: "center", indent: 1 },
        };
      } else if (r === 3 || r === 9) {
        cell.s = {
          font: { name: "Calibri", sz: 13, bold: true, color: { rgb: theme.primaryBg } },
          fill: { fgColor: { rgb: theme.lightBg } },
          alignment: { horizontal: "left", vertical: "center", indent: 1 },
        };
      } else if (r === 4 || r === 10) {
        cell.s = {
          font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: theme.headerBg } }, // Unique theme header
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: theme.accentColor } },
            bottom: { style: "medium", color: { rgb: theme.accentColor } },
          },
        };
      } else {
        const isEven = r % 2 === 0;
        const valStr = (cell.v || "").toString();
        const isBar = valStr.includes("█");
        cell.s = {
          font: {
            name: "Calibri",
            sz: 11,
            bold: isBar || c === 0,
            color: { rgb: isBar ? theme.accentColor : "1E293B" },
          },
          fill: { fgColor: { rgb: isEven ? "FFFFFF" : "F8FAFC" } },
          alignment: {
            horizontal: c === 0 || c === 4 ? "center" : isBar ? "left" : "left",
            vertical: "center",
          },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } },
          },
        };
      }
    }
  }

  ws["!cols"] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 24 },
    { wch: 38 }, // Wide column for visual progress bar chart!
    { wch: 22 },
  ];

  return ws;
}

/**
 * Export a single sheet Excel file WITH a built-in 📊 Chart & Visual Summary tab ("มีกราฟข้อมูลต่างๆ ด้วย")!
 */
export function exportToExcel(config: ExcelSingleExportConfig) {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Sheet 1: Dedicated 📊 Visual Chart Dashboard Sheet based on ACTUAL DATA and UNIQUE THEMES
    const chartWs = buildChartSummaryWorksheet(config);
    XLSX.utils.book_append_sheet(wb, chartWs, "📊 ພາບລວມ-ກາບ (Charts)");

    // 2. Sheet 2: Styled Data Table Sheet
    const dataWs = buildWorksheet(config);
    const cleanSheetName = (config.sheetName || "Data")
      .replace(/[\\/?*[]]/g, "")
      .slice(0, 26);
    XLSX.utils.book_append_sheet(wb, dataWs, `📑 ${cleanSheetName}`);

    const finalFilename = config.filename.endsWith(".xlsx")
      ? config.filename
      : `${config.filename}.xlsx`;

    XLSX.writeFile(wb, finalFilename);
  } catch (err) {
    console.error("Failed to export Excel:", err);
  }
}

/**
 * Export a multi-sheet Excel file
 */
export function exportMultiSheetExcel(config: ExcelMultiSheetConfig) {
  try {
    const wb = XLSX.utils.book_new();

    config.sheets.forEach((sheetConfig, index) => {
      const ws = buildWorksheet(sheetConfig);
      const cleanSheetName = (sheetConfig.sheetName || `Sheet_${index + 1}`)
        .replace(/[\\/?*[]]/g, "")
        .slice(0, 31);

      XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
    });

    const finalFilename = config.filename.endsWith(".xlsx")
      ? config.filename
      : `${config.filename}.xlsx`;

    XLSX.writeFile(wb, finalFilename);
  } catch (err) {
    console.error("Failed to export multi-sheet Excel:", err);
  }
}
