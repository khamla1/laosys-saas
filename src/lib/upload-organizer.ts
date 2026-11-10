import fs from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const PUBLIC_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
export const FILE_INDEX_PATH = path.join(PUBLIC_UPLOADS_ROOT, "_file-index.json");

export type UploadCategory =
  | "products"
  | "payment-slips"
  | "package-slips"
  | "storefront"
  | "videos"
  | "gallery"
  | "qr-codes"
  | "branding"
  | "general";

export interface UploadContextInput {
  organizationId?: string | null;
  storeSlug?: string | null;
  userRole?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  category?: string | null;
  label?: string | null;
  referer?: string | null;
  mimeType: string;
  extension: string;
}

export function getVientianeDateParts(date = new Date()): { dateStr: string; monthStr: string } {
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs);
  const iso = local.toISOString();
  return {
    dateStr: iso.slice(0, 10),  // YYYY-MM-DD
    monthStr: iso.slice(0, 7),  // YYYY-MM
  };
}

export function sanitizeSlugSegment(input?: string | null, fallback = "item"): string {
  if (!input) return fallback;
  const cleaned = String(input)
    .trim()
    .toLowerCase()
    .replace(/[@.]+/g, "-")
    // Allow alphanumeric, Lao/Thai Unicode characters, and hyphens
    .replace(/[^a-z0-9\u0E00-\u0E7F\u0E80-\u0EFF_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return cleaned || fallback;
}

const orgSlugCache = new Map<string, string>();

export async function resolveStoreSlug(organizationId?: string | null, explicitSlug?: string | null): Promise<string> {
  if (explicitSlug && explicitSlug.trim()) {
    return sanitizeSlugSegment(explicitSlug, "general-store");
  }
  if (!organizationId) return "general-store";

  const cached = orgSlugCache.get(organizationId);
  if (cached) return cached;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true, name: true },
    });
    if (org?.slug) {
      const clean = sanitizeSlugSegment(org.slug, organizationId.slice(-8));
      orgSlugCache.set(organizationId, clean);
      return clean;
    }
  } catch {}

  return sanitizeSlugSegment(organizationId.slice(-8), "store");
}

export function detectUploadCategory(ctx: UploadContextInput): {
  isAdminScope: boolean;
  category: UploadCategory;
  storeSlugFromReferer?: string;
} {
  const ref = (ctx.referer || "").toLowerCase();
  const explicitCat = (ctx.category || "").toLowerCase().trim();
  const isVideo = ctx.mimeType.startsWith("video/");

  // Extract store slug if referer is /shop/[slug]
  let storeSlugFromReferer: string | undefined;
  const shopMatch = ref.match(/\/shop\/([^/?#]+)/i);
  if (shopMatch && shopMatch[1]) {
    storeSlugFromReferer = decodeURIComponent(shopMatch[1]);
  }

  // 1. Package subscription renewal slips uploaded by store owners (/dashboard/billing)
  if (explicitCat === "package-slips" || explicitCat === "billing" || ref.includes("/dashboard/billing")) {
    return { isAdminScope: true, category: "package-slips", storeSlugFromReferer };
  }

  // 2. Super Admin system uploads (/admin/* or explicit admin category)
  if (
    explicitCat === "admin-qr" ||
    explicitCat === "qr-codes" ||
    explicitCat === "admin" ||
    ref.includes("/admin/")
  ) {
    const subCat: UploadCategory =
      explicitCat === "qr-codes" || explicitCat === "admin-qr" || ref.includes("payment")
        ? "qr-codes"
        : "branding";
    return { isAdminScope: true, category: subCat, storeSlugFromReferer };
  }

  // 3. Customer payment transfer slips (from storefront or checkout)
  if (
    explicitCat === "payment-slips" ||
    explicitCat === "payment-slip" ||
    explicitCat === "slip" ||
    ref.includes("/shop/") ||
    ref.includes("/buy/")
  ) {
    return { isAdminScope: false, category: "payment-slips", storeSlugFromReferer };
  }

  // 4. Videos
  if (isVideo || explicitCat === "videos" || explicitCat === "video") {
    return { isAdminScope: false, category: "videos", storeSlugFromReferer };
  }

  // 5. Products
  if (explicitCat === "products" || explicitCat === "product" || ref.includes("/products")) {
    return { isAdminScope: false, category: "products", storeSlugFromReferer };
  }

  // 6. Media Gallery
  if (explicitCat === "gallery" || ref.includes("/media/gallery")) {
    return { isAdminScope: false, category: "gallery", storeSlugFromReferer };
  }

  // 7. Storefront settings / Seller QR / Banners / Logos
  if (
    explicitCat === "storefront" ||
    ref.includes("/storefront") ||
    ref.includes("/settings") ||
    ref.includes("/ecommerce")
  ) {
    return { isAdminScope: false, category: "storefront", storeSlugFromReferer };
  }

  return { isAdminScope: false, category: "general", storeSlugFromReferer };
}

export function loadFileIndex(): Record<string, string> {
  try {
    if (fs.existsSync(FILE_INDEX_PATH)) {
      return JSON.parse(fs.readFileSync(FILE_INDEX_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

export function updateFileIndex(entries: Record<string, string>) {
  try {
    if (!fs.existsSync(PUBLIC_UPLOADS_ROOT)) {
      fs.mkdirSync(PUBLIC_UPLOADS_ROOT, { recursive: true });
    }
    const current = loadFileIndex();
    const merged = { ...current, ...entries };
    fs.writeFileSync(FILE_INDEX_PATH, JSON.stringify(merged, null, 2), "utf-8");
  } catch (e) {
    console.warn("[FILE_INDEX_UPDATE_WARN]", e);
  }
}

/**
 * Saves an uploaded file buffer into an organized folder hierarchy inside `public/uploads/`
 * with human-readable date + user/phone/label + SHA-256 content deduplication.
 */
export async function saveOrganizedUpload(
  buffer: Buffer,
  ctx: UploadContextInput
): Promise<{ url: string; relativePath: string; deduplicated: boolean }> {
  const { dateStr, monthStr } = getVientianeDateParts();
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const shortHash = sha256.slice(0, 10);

  const detected = detectUploadCategory(ctx);
  const resolvedStoreSlug = await resolveStoreSlug(
    ctx.organizationId,
    ctx.storeSlug || detected.storeSlugFromReferer
  );

  const actorTag = sanitizeSlugSegment(
    ctx.customerPhone ||
      ctx.label ||
      ctx.customerName ||
      ctx.userName ||
      (ctx.userEmail ? ctx.userEmail.split("@")[0] : null),
    "user"
  );

  let subFolderRel = "";
  let filePrefix = "";

  if (detected.isAdminScope) {
    if (detected.category === "package-slips") {
      subFolderRel = `admin/package-slips/${monthStr}`;
      filePrefix = `${dateStr}_${resolvedStoreSlug}_${actorTag}_pkg-slip`;
    } else if (detected.category === "qr-codes") {
      subFolderRel = `admin/qr-codes`;
      filePrefix = `${dateStr}_admin_${actorTag}_qr`;
    } else {
      subFolderRel = `admin/branding`;
      filePrefix = `${dateStr}_admin_${actorTag}`;
    }
  } else {
    switch (detected.category) {
      case "payment-slips": {
        const phoneSeg = sanitizeSlugSegment(ctx.customerPhone, "");
        const nameSeg = sanitizeSlugSegment(ctx.customerName, "");
        const who = [phoneSeg, nameSeg].filter(Boolean).join("_") || actorTag;
        subFolderRel = `stores/${resolvedStoreSlug}/payment-slips/${monthStr}`;
        filePrefix = `${dateStr}_${who}_slip`;
        break;
      }
      case "products":
        subFolderRel = `stores/${resolvedStoreSlug}/products`;
        filePrefix = `${dateStr}_${actorTag}_product`;
        break;
      case "videos":
        subFolderRel = `stores/${resolvedStoreSlug}/videos`;
        filePrefix = `${dateStr}_${actorTag}_video`;
        break;
      case "gallery":
        subFolderRel = `stores/${resolvedStoreSlug}/gallery`;
        filePrefix = `${dateStr}_${actorTag}_media`;
        break;
      case "storefront":
        subFolderRel = `stores/${resolvedStoreSlug}/storefront`;
        filePrefix = `${dateStr}_${actorTag}_storefront`;
        break;
      default:
        subFolderRel = `stores/${resolvedStoreSlug}/general`;
        filePrefix = `${dateStr}_${actorTag}_file`;
        break;
    }
  }

  const targetDir = path.join(PUBLIC_UPLOADS_ROOT, ...subFolderRel.split("/"));
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = ctx.extension.replace(/^\./, "").toLowerCase() || "jpg";

  // Check if a file with the exact same SHA-256 shortHash already exists in this folder (Deduplication!)
  const existingInFolder = fs.readdirSync(targetDir);
  const suffixPattern = `_${shortHash}.${ext}`;
  const matchedExisting = existingInFolder.find((f) => f.toLowerCase().endsWith(suffixPattern));

  if (matchedExisting) {
    const rel = `${subFolderRel}/${matchedExisting}`;
    return {
      url: `/uploads/${rel}`,
      relativePath: rel,
      deduplicated: true,
    };
  }

  const filename = `${filePrefix}_${shortHash}.${ext}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, buffer);

  const relativePath = `${subFolderRel}/${filename}`;
  updateFileIndex({
    [filename]: relativePath,
    [`sha256:${sha256}`]: relativePath,
  });

  return {
    url: `/uploads/${relativePath}`,
    relativePath,
    deduplicated: false,
  };
}
