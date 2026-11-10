import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path, { join } from "path";
import fs, { existsSync } from "fs";
import { loadFileIndex, PUBLIC_UPLOADS_ROOT } from "@/lib/upload-organizer";

export const dynamic = "force-dynamic";

function findFileRecursivelyByName(dir: string, targetName: string): string | null {
  if (!existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFileRecursivelyByName(full, targetName);
      if (found) return found;
    } else if (entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase()) {
      return full;
    }
  }
  return null;
}

export async function GET(request: Request, props: any) {
  try {
    const params = await (props.params instanceof Promise ? props.params : Promise.resolve(props.params));
    const { filename } = params;

    if (!filename) {
      return new NextResponse("Filename is required", { status: 400 });
    }

    const safeName = path.basename(decodeURIComponent(filename));
    let resolvedFullPath = join(PUBLIC_UPLOADS_ROOT, safeName);

    if (!existsSync(resolvedFullPath) || !fs.statSync(resolvedFullPath).isFile()) {
      const fileIndex = loadFileIndex();
      const mappedRel = fileIndex[safeName];
      if (mappedRel) {
        const candidate = join(PUBLIC_UPLOADS_ROOT, ...mappedRel.split("/"));
        if (existsSync(candidate) && fs.statSync(candidate).isFile()) {
          resolvedFullPath = candidate;
        }
      }
      if (!existsSync(resolvedFullPath) || !fs.statSync(resolvedFullPath).isFile()) {
        const found = findFileRecursivelyByName(PUBLIC_UPLOADS_ROOT, safeName);
        if (found) {
          resolvedFullPath = found;
        } else {
          return new NextResponse("File not found", { status: 404 });
        }
      }
    }

    const fileBuffer = await readFile(resolvedFullPath);
    const extension = resolvedFullPath.split(".").pop()?.toLowerCase();

    let contentType = "application/octet-stream";
    if (extension === "png") contentType = "image/png";
    else if (extension === "jpg" || extension === "jpeg") contentType = "image/jpeg";
    else if (extension === "webp") contentType = "image/webp";
    else if (extension === "gif") contentType = "image/gif";
    else if (extension === "svg") contentType = "image/svg+xml";
    else if (extension === "mp4") contentType = "video/mp4";
    else if (extension === "webm") contentType = "video/webm";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[SERVE_UPLOAD_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
