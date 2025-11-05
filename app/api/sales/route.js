"use server";

import fs from "fs";
import path from "path";
import os from "os";

/**
 * API route para ventas:
 * - GET: devuelve data/sales.json (array)
 * - POST: persiste una venta en data/sales.json (crea archivo/carpeta si hace falta)
 *
 * Comportamiento mejorado:
 * - En desarrollo usa ./data/sales.json (como antes).
 * - En producción (ej. Vercel) usa un directorio temporal escribible (os.tmpdir())
 *   o la ruta especificada por la variable de entorno SALES_DATA_DIR.
 * - Esto evita errores de EACCES/ENOENT al intentar escribir dentro del bundle del repo
 *   en entornos serverless.
 */

const DEV_DIR = path.join(process.cwd(), "data");
const PROD_FALLBACK_DIR = path.join(os.tmpdir(), "nextjs_ep2_data"); // escribible en runtime
const BASE_DIR =
  process.env.SALES_DATA_DIR ||
  (process.env.NODE_ENV === "development" ? DEV_DIR : PROD_FALLBACK_DIR);

const DATA_DIR = BASE_DIR;
const SALES_FILE = path.join(DATA_DIR, "sales.json");

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SALES_FILE)) {
      fs.writeFileSync(SALES_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    // volver a lanzar para que el handler lo capture y lo loguee
    throw err;
  }
}

export async function GET() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(SALES_FILE, "utf8");
    let sales = [];
    try {
      sales = JSON.parse(raw);
      if (!Array.isArray(sales)) sales = [];
    } catch {
      sales = [];
    }
    return new Response(JSON.stringify(sales), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error GET /api/sales:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    ensureDataFile();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read current sales
    let sales = [];
    try {
      const raw = fs.readFileSync(SALES_FILE, "utf8");
      sales = JSON.parse(raw);
      if (!Array.isArray(sales)) sales = [];
    } catch {
      sales = [];
    }

    const serverRecord = {
      ...body,
      savedAt: new Date().toISOString(),
    };

    sales.push(serverRecord);

    fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2), "utf8");

    return new Response(JSON.stringify({ ok: true, record: serverRecord }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error POST /api/sales:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
