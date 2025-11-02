import { NextResponse } from 'next/server';
import { getById, update, remove } from '../../../../lib/jsonUsers';

// GET /api/usuarios/:id
export async function GET(req, { params }) {
  const id = parseInt(params.id, 10);
  const item = await getById(id);
  if (!item) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  const { password, ...safe } = item;
  return NextResponse.json(safe);
}

// PUT /api/usuarios/:id
export async function PUT(req, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const updates = await req.json();
    const updated = await update(id, updates);
    if (!updated) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar usuario', details: err.message }, { status: 500 });
  }
}

// DELETE /api/usuarios/:id
export async function DELETE(req, { params }) {
  const id = parseInt(params.id, 10);
  const ok = await remove(id);
  if (!ok) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  return NextResponse.json({ success: true });
}