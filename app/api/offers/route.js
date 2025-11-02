import fs from "fs";
import path from "path";

/**
 * GET /api/offers
 * POST /api/offers
 *
 * POST body expected (example):
 * {
 *   productId: "123",
 *   newPrice: 19990,        // optional if percent provided
 *   percent: 20,            // optional if newPrice provided
 *   oldPrice: 24990,        // optional
 *   createdAt: "..."
 * }
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
  } catch (e) {
    console.error("ensureDataFileSync error:", e);
    throw e;
  }
}

function readOffersSync() {
  try {
    ensureDataFileSync();
    const raw = fs.readFileSync(OFFERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("readOffersSync error:", e);
    return [];
  }
}

function writeOffersSync(offers) {
  fs.writeFileSync(OFFERS_FILE, JSON.stringify(offers, null, 2), "utf8");
}

export async function GET() {
  try {
    const offers = readOffersSync();
    return new Response(JSON.stringify(offers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/offers error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productId = String(body.productId ?? "").trim();
    if (!productId) {
      return new Response(JSON.stringify({ error: "productId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newPrice = body.newPrice != null ? Number(body.newPrice) : null;
    const percent = body.percent != null ? Number(body.percent) : null;
    const oldPrice = body.oldPrice != null ? Number(body.oldPrice) : null;

    if (!newPrice && !percent) {
      return new Response(
        JSON.stringify({ error: "newPrice or percent is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let computedNewPrice = newPrice;
    if (computedNewPrice == null && percent != null && oldPrice != null) {
      computedNewPrice = Math.round(oldPrice * (1 - percent / 100));
    }

    const offers = readOffersSync();

    const record = {
      productId,
      newPrice: computedNewPrice,
      percent: percent != null ? Math.round(percent) : null,
      oldPrice: oldPrice != null ? Math.round(oldPrice) : null,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const filtered = offers.filter((o) => String(o.productId) !== productId);
    filtered.push(record);
    writeOffersSync(filtered);

    return new Response(JSON.stringify({ ok: true, record }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/offers error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
