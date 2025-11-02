import { NextResponse } from "next/server";
import { getById, update, remove } from "../../../../lib/jsonDb";

/**
 * Helper: extrae el id del path del request evitando usar `context.params`
 * Lo hacemos así para evitar la comprobación/runtime que exige await sobre context,
 * y así evitar el warning "params should be awaited before using its properties".
 */
function extractIdFromReq(req) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const id = parseInt(String(last || ""), 10);
    return Number.isNaN(id) ? null : id;
  } catch (e) {
    console.error("extractIdFromReq error:", e);
    return null;
  }
}

// GET /api/productos/:id
export async function GET(req) {
  const id = extractIdFromReq(req);
  if (id === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const item = await getById(id);
    if (!item) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(item);
  } catch (e) {
    console.error("GET /api/productos/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT /api/productos/:id
export async function PUT(req) {
  const id = extractIdFromReq(req);
  if (id === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const updates = await req.json();
    const updated = await update(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PUT /api/productos/[id] error:", e);
    return NextResponse.json(
      {
        error: "Payload inválido o error interno",
        details: String(e?.message || e),
      },
      { status: 400 }
    );
  }
}

// DELETE /api/productos/:id
export async function DELETE(req) {
  const id = extractIdFromReq(req);
  if (id === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const ok = await remove(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/productos/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
