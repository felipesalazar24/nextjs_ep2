import { NextResponse } from "next/server";
import { getAll, add } from "../../../lib/jsonUsers";

// GET /api/usuarios  -> lista (sin password)
export async function GET() {
  const items = await getAll();
  const safe = items.map(({ password, ...rest }) => {
    void password;
    return rest;
  });
  return NextResponse.json(safe);
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "email y password son requeridos" },
        { status: 400 }
      );
    }
    const newUser = await add(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error("POST /api/usuarios error:", err);
    if (err.code === "DUPLICATE_EMAIL") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Error al crear usuario", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
