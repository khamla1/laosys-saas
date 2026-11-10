import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { saveOrganizedUpload } from "@/lib/upload-organizer";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const referer = request.headers.get("referer") || "";
    const uploadMode = request.headers.get("x-upload-mode");
    const headerCategory = request.headers.get("x-upload-category");
    const headerLabel = request.headers.get("x-upload-label");
    const headerStoreSlug = request.headers.get("x-store-slug");
    const contentType = (request.headers.get("content-type") || "").split(";")[0].trim();

    // Fast path: Direct raw binary streaming
    if (uploadMode === "raw" || ALLOWED_MIME_TYPES.includes(contentType)) {
      const fileType = (request.headers.get("x-file-type") || contentType).trim();
      const declaredSize = Number(request.headers.get("x-file-size") || request.headers.get("content-length") || 0);

      if (!ALLOWED_MIME_TYPES.includes(fileType)) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Only JPG, PNG, WebP, GIF, MP4, and WebM are allowed." },
          { status: 415 }
        );
      }

      if (declaredSize > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: "File exceeds 100MB limit" }, { status: 413 });
      }

      const bytes = await request.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const extension = MIME_TO_EXT[fileType] || fileType.split("/")[1] || "jpg";

      const saved = await saveOrganizedUpload(buffer, {
        organizationId: user.organizationId || null,
        storeSlug: headerStoreSlug || null,
        userRole: user.role || null,
        userName: user.name || null,
        userEmail: user.email || null,
        category: headerCategory || null,
        label: headerLabel || null,
        referer,
        mimeType: fileType,
        extension,
      });

      return NextResponse.json({
        success: true,
        url: saved.url,
        deduplicated: saved.deduplicated,
      });
    }

    // Standard fallback: multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const formCategory = (formData.get("category") as string) || headerCategory || null;
    const formLabel = (formData.get("label") as string) || headerLabel || file?.name?.replace(/\.[^.]+$/, "") || null;
    const formStoreSlug = (formData.get("storeSlug") as string) || headerStoreSlug || null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File exceeds 100MB limit" }, { status: 413 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPG, PNG, WebP, GIF, MP4, and WebM are allowed." },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = MIME_TO_EXT[file.type] || file.type.split("/")[1] || "jpg";

    const saved = await saveOrganizedUpload(buffer, {
      organizationId: user.organizationId || null,
      storeSlug: formStoreSlug,
      userRole: user.role || null,
      userName: user.name || null,
      userEmail: user.email || null,
      category: formCategory,
      label: formLabel,
      referer,
      mimeType: file.type,
      extension,
    });

    return NextResponse.json({
      success: true,
      url: saved.url,
      deduplicated: saved.deduplicated,
    });
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
