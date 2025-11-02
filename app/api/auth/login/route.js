import { NextResponse } from 'next/server';
import { validateCredentials } from '../../../../lib/jsonUsers';

// POST /api/auth/login  { email, password } -> devuelve usuario (sin password) o 401

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email y password son requeridos' }, { status: 400 });
    }

    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Devuelve usuario (sin password). Frontend decide qué hacer (localStorage / state)
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: 'Error al autenticar', details: err.message }, { status: 500 });
  }
}