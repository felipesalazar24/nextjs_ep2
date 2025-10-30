import { NextResponse } from 'next/server';
import { getAll, add } from '../../../lib/jsonUsers';

// GET /api/usuarios  -> lista (sin password)
// POST /api/usuarios -> crear usuario { email, password, nombre? }

export async function GET() {
  const items = await getAll();
  const safe = items.map(({ password, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'email y password son requeridos' }, { status: 400 });
    }
    const newUser = await add(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    if (err.code === 'DUPLICATE_EMAIL') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear usuario', details: err.message }, { status: 500 });
  }
}