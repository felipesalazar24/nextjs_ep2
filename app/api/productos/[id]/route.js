import { NextResponse } from "next/server";
import { getById, update, remove } from "../../../../lib/jsonDb";

/**
 * Helper: extrae el id del path del request evitando usar `context.params`
 * Lo hacemos así para evitar la comprobación/runtime que exige await sobre context,
 * y así evitar el warning "params should be awaited before using its properties".
 */
function extractIdFromReq(req) {
  try {
    // req.url es la URL completa; la parte pathname contiene /api/productos/:id
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean); // ['api','productos','123']
    const last = parts[parts.length - 1];
    const id = parseInt(String(last || ""), 10);
    return Number.isNaN(id) ? null : id;
  } catch (err) {
    return null;
  }
}

// GET /api/productos/:id
export async function GET(req, context) {
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
  } catch (err) {
    console.error("GET /api/productos/[id] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT /api/productos/:id
export async function PUT(req, context) {
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
  } catch (err) {
    console.error("PUT /api/productos/[id] error:", err);
    return NextResponse.json(
      {
        error: "Payload inválido o error interno",
        details: String(err?.message || err),
      },
      { status: 400 }
    );
  }
}

// DELETE /api/productos/:id
export async function DELETE(req, context) {
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
  } catch (err) {
    console.error("DELETE /api/productos/[id] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
