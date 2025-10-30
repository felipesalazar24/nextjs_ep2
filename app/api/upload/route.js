import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

/**
 * Route handler para app/api/upload:
 * - POST: recibe JSON { files: [{ name, data }] } donde data es dataURL o base64.
 * - DELETE: recibe JSON { file: "/assets/..." } para borrar.
 * - Guarda archivos en public/assets/productos usando randomUUID() para el nombre.
 * - No utiliza 'uuid' externo para evitar dependencia.
 */

const ensureUploadsDir = (uploadsDir) => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const mimeToExt = (mime) => {
  if (!mime) return "";
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("png")) return ".png";
  if (m.includes("gif")) return ".gif";
  if (m.includes("webp")) return ".webp";
  if (m.includes("svg")) return ".svg";
  return "";
};

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const files = Array.isArray(body.files) ? body.files : [];

    if (!files.length) {
      return NextResponse.json({ files: [] }, { status: 400 });
    }

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "productos"
    );
    ensureUploadsDir(uploadsDir);

    const savedFiles = [];

    for (const f of files) {
      const { name = "", data = "" } = f;

      // soporta data URLs: data:image/jpeg;base64,....
      const match =
        typeof data === "string" && data.match(/^data:([^;]+);base64,(.+)$/);
      let mime = null;
      let b64 = null;
      if (match) {
        mime = match[1];
        b64 = match[2];
      } else {
        // si viene solo base64 (o con prefijo base64,)
        b64 =
          typeof data === "string"
            ? data.replace(/^base64,/, "").replace(/\s+/g, "")
            : null;
      }

      // Preferir la extensión provista en el nombre; si no, inferir por mime
      let ext = path.extname(name).toLowerCase(); // incluye el punto si existe
      if (!ext) {
        ext = mimeToExt(mime) || "";
      }

      // Generar nombre único con randomUUID() y asegurar solo UNA vez la extensión
      const uuid =
        typeof randomUUID === "function"
          ? randomUUID()
          : Date.now().toString(36);
      const filename = ext ? `${uuid}${ext}` : uuid;
      const destPath = path.join(uploadsDir, filename);

      if (!b64) {
        // No hay datos válidos: omitir
        console.warn("Archivo sin base64 válido, omitiendo:", name);
        continue;
      }

      // Escribir fichero
      const buffer = Buffer.from(b64, "base64");
      fs.writeFileSync(destPath, buffer);

      const publicUrl = `/assets/productos/${filename}`;
      savedFiles.push(publicUrl);
    }

    return NextResponse.json({ files: savedFiles }, { status: 200 });
  } catch (err) {
    console.error("app/api/upload POST error:", err);
    return NextResponse.json(
      { error: "Error subiendo archivos" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const file = body.file;
    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // quitar slash inicial si viene con /
    const publicPath = file.replace(/^\/+/, "");
    const fullPath = path.join(process.cwd(), "public", publicPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return NextResponse.json({ ok: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (err) {
    console.error("app/api/upload DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
