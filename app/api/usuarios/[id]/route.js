import { NextResponse } from "next/server";
import { getById, update, remove } from "../../../../lib/jsonUsers";

// GET /api/usuarios/:id
export async function GET(req, { params }) {
  const id = parseInt(params.id, 10);
  const item = await getById(id);
  if (!item)
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  const { password, ...safe } = item;
  void password; // mark as used to satisfy linter
  return NextResponse.json(safe);
}

// PUT /api/usuarios/:id
export async function PUT(req, { params }) {
  const id = Number.parseInt(String(params?.id ?? ""), 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const updates = await req.json();
    const updated = await update(id, updates);
    if (!updated)
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PUT /api/usuarios/[id] error:", e);
    return NextResponse.json(
      {
        error: "Error al actualizar usuario",
        details: String(e?.message || e),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/usuarios/:id
export async function DELETE(req, { params }) {
  const id = parseInt(params.id, 10);
  try {
    const ok = await remove(id);
    if (!ok)
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/usuarios/[id] error:", e);
    return NextResponse.json(
      { error: "Error al eliminar usuario", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
