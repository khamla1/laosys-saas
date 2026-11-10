import fs from "fs";
import path from "path";
import crypto from "crypto";
import "dotenv/config";
import prisma from "../src/lib/prisma";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const INDEX_FILE = path.join(UPLOADS_ROOT, "_file-index.json");

function sanitize(input: any, fallback = "item"): string {
  if (!input) return fallback;
  const cleaned = String(input)
    .trim()
    .toLowerCase()
    .replace(/[@.]+/g, "-")
    .replace(/[^a-z0-9\u0E00-\u0E7F\u0E80-\u0EFF_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return cleaned || fallback;
}

function getDateParts(dateObj: any): { dateStr: string; monthStr: string } {
  const d = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
  const offset = 7 * 3600 * 1000;
  const local = new Date(d.getTime() + offset);
  const iso = local.toISOString();
  return {
    dateStr: iso.slice(0, 10),
    monthStr: iso.slice(0, 7),
  };
}

async function main() {
  console.log("=== LAOSYS Smart Uploads Folder Organizer & Deduplicator ===");

  try {
    const orgRes: any = await (prisma as any).$runCommandRaw({ find: "Organization", filter: {} });
    const orgs: any[] = orgRes?.cursor?.firstBatch || [];
    const orgById = new Map<string, { id: string; slug: string; name: string; raw: any }>();
    for (const o of orgs) {
      const id = o._id?.$oid || String(o._id || "");
      orgById.set(id, { id, slug: sanitize(o.slug || o.name, `store-${id.slice(-6)}`), name: o.name, raw: o });
    }

    const prodRes: any = await (prisma as any).$runCommandRaw({ find: "Product", filter: {} });
    const products: any[] = prodRes?.cursor?.firstBatch || [];

    const orderRes: any = await (prisma as any).$runCommandRaw({ find: "Order", filter: {} });
    const orders: any[] = orderRes?.cursor?.firstBatch || [];

    const subReqRes: any = await (prisma as any).$runCommandRaw({ find: "SubscriptionRequest", filter: {} });
    const subReqs: any[] = subReqRes?.cursor?.firstBatch || [];

    const settingRes: any = await (prisma as any).$runCommandRaw({ find: "Setting", filter: {} });
    const settings: any[] = settingRes?.cursor?.firstBatch || [];

    const userRes: any = await (prisma as any).$runCommandRaw({ find: "User", filter: {} });
    const users: any[] = userRes?.cursor?.firstBatch || [];

    const fileUsageMap = new Map<string, { folder: string; label: string; dateObj?: Date }>();

    const registerRef = (urlStr: any, info: { folder: string; label: string; dateObj?: Date }) => {
      if (!urlStr || typeof urlStr !== "string") return;
      if (!urlStr.includes("/uploads/")) return;
      const afterUploads = urlStr.split("/uploads/")[1]?.split("?")[0];
      if (!afterUploads) return;
      const base = path.basename(afterUploads);
      if (!fileUsageMap.has(afterUploads)) {
        fileUsageMap.set(afterUploads, info);
      }
      if (!fileUsageMap.has(base)) {
        fileUsageMap.set(base, info);
      }
    };

    // 1. Map Organizations
    for (const o of orgs) {
      const id = o._id?.$oid || String(o._id || "");
      const slug = orgById.get(id)?.slug || "store";
      if (o.logo) {
        registerRef(o.logo, { folder: `stores/${slug}/storefront`, label: `${slug}_logo` });
      }
      const metaStr = JSON.stringify(o.metadata || {});
      const matches = metaStr.match(/\/uploads\/[^"'\s\\]+/g) || [];
      for (const m of matches) {
        const isVid = m.endsWith(".mp4") || m.endsWith(".webm");
        registerRef(m, {
          folder: isVid ? `stores/${slug}/videos` : `stores/${slug}/storefront`,
          label: isVid ? `${slug}_video` : `${slug}_banner`,
        });
      }
    }

    // 2. Map Products
    for (const p of products) {
      const orgId = p.organizationId?.$oid || String(p.organizationId || "");
      const slug = orgById.get(orgId)?.slug || "general-store";
      const prodLabel = sanitize(p.name, "product");
      if (p.image) {
        registerRef(p.image, { folder: `stores/${slug}/products`, label: prodLabel });
      }
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          registerRef(img, { folder: `stores/${slug}/products`, label: prodLabel });
        }
      }
    }

    // 3. Map Orders (Customer Payment Slips)
    for (const ord of orders) {
      const orgId = ord.organizationId?.$oid || String(ord.organizationId || "");
      const slug = orgById.get(orgId)?.slug || "general-store";
      const createdDate = ord.createdAt?.$date ? new Date(ord.createdAt.$date) : new Date();
      const { monthStr } = getDateParts(createdDate);
      const phone = sanitize(ord.customerPhone, "");
      const cname = sanitize(ord.customerName, "customer");
      const slipLabel = [phone, cname, "slip"].filter(Boolean).join("_");

      if (ord.paymentSlipUrl) {
        registerRef(ord.paymentSlipUrl, {
          folder: `stores/${slug}/payment-slips/${monthStr}`,
          label: slipLabel,
          dateObj: createdDate,
        });
      }
      const metaStr = JSON.stringify(ord.metadata || {});
      const matches = metaStr.match(/\/uploads\/[^"'\s\\]+/g) || [];
      for (const m of matches) {
        registerRef(m, {
          folder: `stores/${slug}/payment-slips/${monthStr}`,
          label: slipLabel,
          dateObj: createdDate,
        });
      }
    }

    // 4. Map SubscriptionRequests (Store Owner Package Renewal Slips)
    for (const sr of subReqs) {
      const orgId = sr.organizationId?.$oid || String(sr.organizationId || "");
      const slug = orgById.get(orgId)?.slug || "store";
      const createdDate = sr.createdAt?.$date ? new Date(sr.createdAt.$date) : new Date();
      const { monthStr } = getDateParts(createdDate);
      const rawStr = JSON.stringify(sr);
      const matches = rawStr.match(/\/uploads\/[^"'\s\\]+/g) || [];
      for (const m of matches) {
        registerRef(m, {
          folder: `admin/package-slips/${monthStr}`,
          label: `${slug}_package-slip`,
          dateObj: createdDate,
        });
      }
    }

    // 5. Map Users & Settings
    for (const u of users) {
      if (u.paymentQrCode) {
        registerRef(u.paymentQrCode, {
          folder: u.role === "ADMIN" ? "admin/qr-codes" : "stores/store-6a64a594/storefront",
          label: `${sanitize(u.name || u.email, "user")}_qr`,
        });
      }
      if (u.image) {
        registerRef(u.image, {
          folder: u.role === "ADMIN" ? "admin/branding" : "stores/store-6a64a594/storefront",
          label: `${sanitize(u.name || u.email, "user")}_avatar`,
        });
      }
    }

    for (const s of settings) {
      const orgId = s.organizationId?.$oid || String(s.organizationId || "");
      const slug = orgId ? orgById.get(orgId)?.slug || "store-6a64a594" : null;
      const valStr = String(s.value || "");
      const matches = valStr.match(/\/uploads\/[^"'\s\\]+/g) || [];
      for (const m of matches) {
        const isVid = m.endsWith(".mp4") || m.endsWith(".webm");
        if (!slug) {
          registerRef(m, {
            folder: s.key?.includes("qr") || s.key?.includes("payment") ? "admin/qr-codes" : "admin/branding",
            label: sanitize(s.key, "admin-setting"),
          });
        } else {
          registerRef(m, {
            folder: isVid ? `stores/${slug}/videos` : `stores/${slug}/storefront`,
            label: `${slug}_${sanitize(s.key, "setting")}`,
          });
        }
      }
    }

    let fileIndex: Record<string, string> = {};
    if (fs.existsSync(INDEX_FILE)) {
      try {
        fileIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
      } catch {
        fileIndex = {};
      }
    }

    const hashToRelPath = new Map<string, string>();
    const urlReplacementMap = new Map<string, string>();
    let movedCount = 0;
    let deduplicatedCount = 0;
    let savedBytes = 0;

    // Move legacy `public/uploads/gee-svn` into `public/uploads/stores/gee-svn/products`
    const legacyGeeDir = path.join(UPLOADS_ROOT, "gee-svn");
    if (fs.existsSync(legacyGeeDir) && fs.statSync(legacyGeeDir).isDirectory()) {
      const targetGeeDir = path.join(UPLOADS_ROOT, "stores", "gee-svn", "products");
      fs.mkdirSync(targetGeeDir, { recursive: true });
      for (const fname of fs.readdirSync(legacyGeeDir)) {
        const srcPath = path.join(legacyGeeDir, fname);
        if (!fs.statSync(srcPath).isFile()) continue;
        const destPath = path.join(targetGeeDir, fname);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
        fs.unlinkSync(srcPath);
        const newRel = `stores/gee-svn/products/${fname}`;
        fileIndex[`gee-svn/${fname}`] = newRel;
        fileIndex[fname] = newRel;
        urlReplacementMap.set(`/uploads/gee-svn/${fname}`, `/uploads/${newRel}`);
        movedCount++;
      }
      try {
        fs.rmdirSync(legacyGeeDir);
      } catch {}
    }

    // Create standard empty folders so Admin & Store structure is visible immediately in Windows Explorer
    const standardFolders = [
      "admin/qr-codes",
      "admin/branding",
      "admin/package-slips",
      "stores/store-6a64a594/products",
      "stores/store-6a64a594/payment-slips",
      "stores/store-6a64a594/storefront",
      "stores/store-6a64a594/videos",
      "stores/store-6a64a594/gallery",
    ];
    for (const sf of standardFolders) {
      fs.mkdirSync(path.join(UPLOADS_ROOT, ...sf.split("/")), { recursive: true });
    }

    // Process all loose files in the root of `public/uploads/`
    const rootEntries = fs.readdirSync(UPLOADS_ROOT, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (!entry.isFile()) continue;
      if (entry.name === "_file-index.json" || entry.name === "Thumbs.db") {
        if (entry.name === "Thumbs.db") {
          try {
            fs.unlinkSync(path.join(UPLOADS_ROOT, entry.name));
          } catch {}
        }
        continue;
      }

      const fullPath = path.join(UPLOADS_ROOT, entry.name);
      const stat = fs.statSync(fullPath);
      const buf = fs.readFileSync(fullPath);
      const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
      const shortHash = sha256.slice(0, 10);
      const rawExt = (entry.name.split(".").pop() || "jpg").toLowerCase();
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;

      if (hashToRelPath.has(sha256)) {
        const existingRel = hashToRelPath.get(sha256)!;
        fileIndex[entry.name] = existingRel;
        urlReplacementMap.set(`/uploads/${entry.name}`, `/uploads/${existingRel}`);
        fs.unlinkSync(fullPath);
        deduplicatedCount++;
        savedBytes += stat.size;
        continue;
      }

      const usage = fileUsageMap.get(entry.name);
      const { dateStr, monthStr } = getDateParts(usage?.dateObj || stat.mtime);

      let targetFolder = "";
      let prefix = "";

      if (usage) {
        targetFolder = usage.folder;
        prefix = `${dateStr}_${usage.label}`;
      } else {
        const lowerName = entry.name.toLowerCase();
        const isVideo = ext === "mp4" || ext === "webm";
        if (isVideo) {
          targetFolder = `stores/store-6a64a594/videos`;
          prefix = `${dateStr}_store-6a64a594_video`;
        } else if (lowerName.includes("screenshot") || lowerName.includes("whatsapp")) {
          targetFolder = `stores/store-6a64a594/payment-slips/${monthStr}`;
          prefix = `${dateStr}_customer_slip`;
        } else {
          targetFolder = `stores/store-6a64a594/gallery`;
          prefix = `${dateStr}_media`;
        }
      }

      const destDir = path.join(UPLOADS_ROOT, ...targetFolder.split("/"));
      fs.mkdirSync(destDir, { recursive: true });

      const newFilename = `${prefix}_${shortHash}.${ext}`;
      const newRel = `${targetFolder}/${newFilename}`;
      const destFullPath = path.join(destDir, newFilename);

      fs.writeFileSync(destFullPath, buf);
      fs.unlinkSync(fullPath);

      hashToRelPath.set(sha256, newRel);
      fileIndex[entry.name] = newRel;
      fileIndex[newFilename] = newRel;
      fileIndex[`sha256:${sha256}`] = newRel;
      urlReplacementMap.set(`/uploads/${entry.name}`, `/uploads/${newRel}`);
      movedCount++;
    }

    fs.writeFileSync(INDEX_FILE, JSON.stringify(fileIndex, null, 2), "utf-8");

    // 6. Update database URL references so DB records point cleanly to the new organized paths
    const replaceUrlsInString = (str: string): string => {
      let out = str;
      for (const [oldUrl, newUrl] of urlReplacementMap.entries()) {
        if (out.includes(oldUrl)) {
          out = out.split(oldUrl).join(newUrl);
        }
      }
      return out;
    };

    let dbUpdatedDocs = 0;
    const collectionsToUpdate = ["Organization", "Product", "Order", "SubscriptionRequest", "User", "Setting", "Storefront", "MediaGallery"];

    for (const colName of collectionsToUpdate) {
      const res: any = await (prisma as any).$runCommandRaw({ find: colName, filter: {} });
      const docs: any[] = res?.cursor?.firstBatch || [];
      const updates: any[] = [];

      for (const doc of docs) {
        const rawJson = JSON.stringify(doc);
        if (!rawJson.includes("/uploads/")) continue;
        const replacedJson = replaceUrlsInString(rawJson);
        if (replacedJson !== rawJson) {
          const parsedDoc = JSON.parse(replacedJson);
          const { _id, ...fieldsWithoutId } = parsedDoc;
          updates.push({
            q: { _id },
            u: { $set: fieldsWithoutId },
          });
          dbUpdatedDocs++;
        }
      }

      if (updates.length > 0) {
        await (prisma as any).$runCommandRaw({
          update: colName,
          updates,
          ordered: false,
        });
      }
    }

    console.log(`SUCCESS: Organized ${movedCount} files into structured folders.`);
    console.log(`SUCCESS: Deduplicated ${deduplicatedCount} duplicate files (Freed ${(savedBytes / (1024 * 1024)).toFixed(2)} MB!).`);
    console.log(`SUCCESS: Updated ${dbUpdatedDocs} database records to new organized URLs.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("ORGANIZE_ERROR:", err);
  process.exit(1);
});
