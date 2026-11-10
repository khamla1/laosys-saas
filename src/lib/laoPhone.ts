/**
 * Smart Lao Phone Number Normalizer & Formatter
 * Supports all common ways users in Laos type phone numbers:
 * - 8 digits only: "55558888" -> "02055558888"
 * - 10 digits with 20: "2055558888" -> "02055558888"
 * - 11 digits with 020: "02055558888" -> "02055558888"
 * - With +856 / 856 / 00856: "+856 20 5555 8888" -> "02055558888"
 * - 030 numbers: "305558888" or "0305558888" or 7 digits "5558888" -> "0305558888"
 * - Also converts Lao (໐-໙) and Thai (๐-๙) digits to standard 0-9.
 */

const LAO_DIGITS = "໐໑໒໓໔໕໖໗໘໙";
const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

export function toAsciiDigits(input: string): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    const laoIdx = LAO_DIGITS.indexOf(ch);
    if (laoIdx !== -1) {
      out += String(laoIdx);
      continue;
    }
    const thaiIdx = THAI_DIGITS.indexOf(ch);
    if (thaiIdx !== -1) {
      out += String(thaiIdx);
      continue;
    }
    out += ch;
  }
  return out;
}

export function normalizeLaoPhone(raw: string | null | undefined): {
  isValid: boolean;
  normalized: string; // e.g. "02055558888"
  formatted: string;  // e.g. "020 5555 8888"
  carrierHint: string; // e.g. "Unitel (020 9x)", "Lao Telecom (020 5x)", "ETL (020 2x)", "Best/TPlus (020 7x)", "Sky Telecom (020 8x)"
  error?: string;
} {
  if (!raw) {
    return {
      isValid: false,
      normalized: "",
      formatted: "",
      carrierHint: "",
      error: "ກະລຸນາປ້ອນເບີໂທລະສັບ",
    };
  }

  // 1. Convert Lao/Thai digits and strip all non-digit characters
  let digits = toAsciiDigits(raw).replace(/\D/g, "");

  if (!digits) {
    return {
      isValid: false,
      normalized: "",
      formatted: "",
      carrierHint: "",
      error: "ກະລຸນາປ້ອນຕົວເລກເບີໂທລະສັບ",
    };
  }

  // 2. Strip international prefix 00856 or 856
  if (digits.startsWith("00856")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("856") && digits.length >= 10) {
    digits = digits.slice(3);
  }

  // If after stripping 856 it starts with 020 or 030, keep; if 20 or 30, handled below
  let normalized = "";

  // Case 1: 11 digits starting with 020 (e.g. 02055558888)
  if (digits.length === 11 && digits.startsWith("020")) {
    normalized = digits;
  }
  // Case 2: 10 digits starting with 20 (e.g. 2055558888)
  else if (digits.length === 10 && digits.startsWith("20")) {
    normalized = "0" + digits;
  }
  // Case 3: 8 digits directly (e.g. 55558888, 91234567, 77123456, 22334455)
  else if (digits.length === 8) {
    normalized = "020" + digits;
  }
  // Case 4: 9 digits starting with 0 (user typed 055558888 instead of 02055558888)
  else if (digits.length === 9 && digits.startsWith("0") && !digits.startsWith("030") && !digits.startsWith("021")) {
    normalized = "020" + digits.slice(1);
  }
  // Case 5: 10 digits starting with 030 (e.g. 0305558888)
  else if (digits.length === 10 && digits.startsWith("030")) {
    normalized = digits;
  }
  // Case 6: 9 digits starting with 30 (e.g. 305558888)
  else if (digits.length === 9 && digits.startsWith("30")) {
    normalized = "0" + digits;
  }
  // Case 7: 7 digits directly (030 local number, e.g. 5558888)
  else if (digits.length === 7) {
    normalized = "030" + digits;
  }
  // Case 8: 9 digits starting with 021 (Vientiane landline 021XXXXXX)
  else if (digits.length === 9 && digits.startsWith("021")) {
    normalized = digits;
  }
  // Case 9: 8 digits starting with 21 (21XXXXXX) -> handled in Case 3 unless 021
  else {
    return {
      isValid: false,
      normalized: digits,
      formatted: digits,
      carrierHint: "",
      error: "ຮູບແບບເບີໂທບໍ່ຖືກຕ້ອງ (ຕົວຢ່າງ: 020 5555 8888, 20 5555 8888 ຫຼື 5555 8888)",
    };
  }

  // Format nicely for display
  let formatted = normalized;
  let carrierHint = "ເບີໂທມາດຕະຖານລາວ";

  if (normalized.startsWith("020") && normalized.length === 11) {
    const sub = normalized.slice(3);
    formatted = `020 ${sub.slice(0, 4)} ${sub.slice(4)}`;
    const firstSub = sub[0];
    if (firstSub === "5") carrierHint = "Lao Telecom (M-Phone)";
    else if (firstSub === "9") carrierHint = "Unitel";
    else if (firstSub === "7") carrierHint = "TPlus / Beeline";
    else if (firstSub === "2") carrierHint = "ETL";
    else if (firstSub === "8") carrierHint = "Best Telecom / Sky";
  } else if (normalized.startsWith("030") && normalized.length === 10) {
    const sub = normalized.slice(3);
    formatted = `030 ${sub.slice(0, 3)} ${sub.slice(3)}`;
    carrierHint = "ເບີ 030 (ໂທລະສັບລາວ)";
  } else if (normalized.startsWith("021") && normalized.length === 9) {
    const sub = normalized.slice(3);
    formatted = `021 ${sub.slice(0, 3)} ${sub.slice(3)}`;
    carrierHint = "ເບີຕັ້ງໂຕະ ນະຄອນຫຼວງ (021)";
  }

  return {
    isValid: true,
    normalized,
    formatted,
    carrierHint,
  };
}
