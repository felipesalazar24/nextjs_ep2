import { NextResponse } from "next/server";
import { getAll, add } from "../../../lib/jsonDb";

// GET /api/productos
export async function GET() {
  const items = await getAll();
  return NextResponse.json(items);
}

// POST /api/productos
export async function POST(req) {
  try {
    const body = await req.json();
    // Validaciones mínimas (ajusta según necesites)
    if (!body.nombre || typeof body.precio !== "number") {
      return NextResponse.json(
        { error: "nombre y precio son requeridos (precio número)" },
        { status: 400 }
      );
    }
    const newItem = await add(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al crear producto", details: err.message },
      { status: 500 }
    );
  }
}
