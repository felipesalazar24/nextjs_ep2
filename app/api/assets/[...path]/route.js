import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

/**
 * GET /api/assets/<...path>
 * Lee archivos desde data/assets/<...path> y los devuelve con Content-Type adecuado.
 * Usado por el rewrite /assets/:path* -> /api/assets/:path*
 */

const extToMime = (ext) => {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
};

export async function GET(request, { params }) {
  try {
    const parts = Array.isArray(params.path) ? params.path : [params.path];
    // Normalizar y evitar rutas fuera de data/assets
    const relPath = path.posix.join(...parts);
    if (relPath.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "assets", relPath);

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const mime = extToMime(path.extname(filePath) || "");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mime,
        // cache largo para assets estáticos
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("app/api/assets GET error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}