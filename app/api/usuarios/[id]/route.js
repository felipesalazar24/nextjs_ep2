import { NextResponse } from "next/server";
import { getById, update, remove } from "../../../../lib/jsonUsers";

// GET /api/usuarios/:id
export async function GET(_req, { params }) {
  const id = Number.parseInt(String(params?.id ?? ""), 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const item = await getById(id);
    if (!item) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    const safe = { ...item };
    delete safe.password;
    return NextResponse.json(safe);
  } catch (e) {
    console.error("GET /api/usuarios/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
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
    if (!updated) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    const safe = { ...updated };
    delete safe.password;
    return NextResponse.json(safe);
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
export async function DELETE(_req, { params }) {
  const id = Number.parseInt(String(params?.id ?? ""), 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const ok = await remove(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/usuarios/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
