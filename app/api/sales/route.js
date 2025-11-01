"use server";

import fs from "fs";
import path from "path";

/**
 * API route (POST) to persist a sale (order) to data/sales.json
 * - Creates data/sales.json if missing.
 * - Appends the incoming order object (with server timestamp) to the array.
 * - Returns the saved order object with server-added fields (savedAt).
 *
 * Pegar en: app/api/sales/route.js
 */

const DATA_DIR = path.join(process.cwd(), "data");
const SALES_FILE = path.join(DATA_DIR, "sales.json");

async function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SALES_FILE)) {
      fs.writeFileSync(SALES_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    throw err;
  }
}

export async function POST(req) {
  try {
    await ensureDataFile();

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

    // Build server-side record (do not trust client for timestamps)
    const serverRecord = {
      ...body,
      savedAt: new Date().toISOString(),
    };

    sales.push(serverRecord);

    // Write back (pretty)
    fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2), "utf8");

    return new Response(JSON.stringify({ ok: true, record: serverRecord }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in /api/sales:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
