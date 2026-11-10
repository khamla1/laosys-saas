import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, eachDayOfInterval, eachMonthOfInterval, format } from "date-fns";

export type DateRangeType = "today" | "week" | "month" | "year" | "all";

export function getDateRanges(range: DateRangeType) {
  const now = new Date();
  
  let currentStart: Date;
  let currentEnd: Date = now;
  let previousStart: Date;
  let previousEnd: Date;

  switch (range) {
    case "today":
      currentStart = startOfDay(now);
      previousStart = startOfDay(subDays(now, 1));
      previousEnd = endOfDay(subDays(now, 1));
      break;
    case "week":
      currentStart = startOfWeek(now, { weekStartsOn: 1 });
      previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      break;
    case "month":
      currentStart = startOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = endOfMonth(subMonths(now, 1));
      break;
    case "year":
      currentStart = startOfYear(now);
      previousStart = startOfYear(subYears(now, 1));
      previousEnd = endOfYear(subYears(now, 1));
      break;
    case "all":
    default:
      currentStart = new Date(0); // Beginning of time
      previousStart = new Date(0);
      previousEnd = new Date(0);
      break;
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
}

export function generateTrendCategories(range: DateRangeType, start: Date, end: Date) {
  if (range === "today") {
    return [format(start, "MMM dd")];
  }
  
  if (range === "week" || range === "month") {
    return eachDayOfInterval({ start, end }).map(d => format(d, "MMM dd"));
  }
  
  if (range === "year" || range === "all") {
    // Note: if "all", it might be massive, but let's assume it spans a few years
    return eachMonthOfInterval({ start, end }).map(d => format(d, "MMM yyyy"));
  }
  
  return [];
}

export function calculateGrowth(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
