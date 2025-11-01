import fs from "fs";
import path from "path";

/**
 * DELETE /api/offers/[id]
 * Removes offers where productId === id
 */

const DATA_DIR = path.join(process.cwd(), "data");
const OFFERS_FILE = path.join(DATA_DIR, "offers.json");

function ensureDataFileSync() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(OFFERS_FILE)) {
      fs.writeFileSync(OFFERS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    throw err;
  }
}

function readOffersSync() {
  try {
    ensureDataFileSync();
    const raw = fs.readFileSync(OFFERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeOffersSync(offers) {
  fs.writeFileSync(OFFERS_FILE, JSON.stringify(offers, null, 2), "utf8");
}

export async function DELETE(req, { params }) {
  try {
    const id = String(params?.id ?? "").trim();
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const offers = readOffersSync();
    const filtered = offers.filter((o) => String(o.productId) !== id);

    writeOffersSync(filtered);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("DELETE /api/offers/[id] error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}