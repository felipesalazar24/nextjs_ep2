import { NextResponse } from "next/server";
import { getById, update, remove } from "../../../../lib/jsonDb";

// GET /api/productos/:id
export async function GET(req, { params }) {
  const id = parseInt(params.id, 10);
  const item = await getById(id);
  if (!item)
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  return NextResponse.json(item);
}

// PUT /api/productos/:id
export async function PUT(req, { params }) {
  const id = parseInt(params.id, 10);
  const updates = await req.json();
  const updated = await update(id, updates);
  if (!updated)
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  return NextResponse.json(updated);
}

// DELETE /api/productos/:id
export async function DELETE(req, { params }) {
  const id = parseInt(params.id, 10);
  const ok = await remove(id);
  if (!ok)
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  return NextResponse.json({ success: true });
}
