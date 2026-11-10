import { NextResponse } from "next/server";
import { saveOrganizedUpload } from "@/lib/upload-organizer";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// IP-based rate limit: max 15 uploads per IP per 10 minutes
const ipUploadMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 15;

function checkUploadRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipUploadMap.get(ip);
  if (!record || now > record.resetAt) {
    ipUploadMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_UPLOADS_PER_WINDOW) return false;
  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!checkUploadRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many uploads. Please wait before uploading again." },
        { status: 429 }
      );
    }

    const referer = request.headers.get("referer") || "";
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storeSlug = (formData.get("storeSlug") as string) || null;
    const customerPhone = (formData.get("customerPhone") as string) || null;
    const customerName = (formData.get("customerName") as string) || null;
    const category = (formData.get("category") as string) || "payment-slips";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File exceeds 100MB limit" }, { status: 413 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = MIME_TO_EXT[file.type] || file.type.split("/")[1] || "jpg";

    const saved = await saveOrganizedUpload(buffer, {
      storeSlug,
      customerPhone,
      customerName,
      category,
      referer,
      mimeType: file.type,
      extension,
    });

    return NextResponse.json({
      url: saved.url,
      deduplicated: saved.deduplicated,
    });
  } catch (error) {
    console.error("[PUBLIC_UPLOAD_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
