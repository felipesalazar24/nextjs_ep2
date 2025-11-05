import { NextResponse } from "next/server";
import { getAll, add } from "../../../lib/jsonUsers";
import fs from "fs";
import path from "path";

/**
 * GET /api/usuarios  -> lista (sin password)
 * POST /api/usuarios -> crea usuario y persiste en data/usuarios.json (filesystem)
 *
 * Nota: el filesystem en entornos serverless (Vercel) es efímero. Este endpoint:
 * - usa lib/jsonUsers.add para guardar en data/usuarios.json (funciona en dev).
 * - en Vercel también intentará escribir en filesystem (existirá mientras la instancia viva).
 * - No hace commits a GitHub ni usa APIs externas.
 */

const DATA_FILE = path.join(process.cwd(), "data", "usuarios.json");

// GET handler: devuelve lista de usuarios (sin password)
export async function GET() {
  try {
    const items = await getAll();
    const safe = items.map(({ password, ...rest }) => {
      void password;
      return rest;
    });
    return NextResponse.json(safe);
  } catch (err) {
    console.error("GET /api/usuarios error:", err);
    return NextResponse.json(
      { error: "Error leyendo usuarios" },
      { status: 500 }
    );
  }
}

// POST handler: crea usuario usando lib/jsonUsers.add y confirma escritura en filesystem
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "email y password son requeridos" },
        { status: 400 }
      );
    }

    // Crea el usuario (lib/jsonUsers.add ya escribe en data/usuarios.json)
    const newUser = await add(body);

    // Comprobación opcional: verificar que el fichero data/usuarios.json existe y es legible
    try {
      if (fs.existsSync(DATA_FILE)) {
        // Si quieres ver el contenido para debug descomenta la línea siguiente:
        // console.log("usuarios.json content after add:", fs.readFileSync(DATA_FILE, "utf8").slice(0, 1000));
      } else {
        console.warn(
          "POST /api/usuarios: data/usuarios.json no existe inmediatamente después de add()"
        );
      }
    } catch (fsErr) {
      console.warn(
        "No se pudo leer data/usuarios.json tras add():",
        fsErr && fsErr.message
      );
    }

    // Devolver el usuario creado (lib/jsonUsers retorna user sin password)
    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error("POST /api/usuarios error:", err);
    if (err && err.code === "DUPLICATE_EMAIL") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err && err.code === "VALIDATION_ERROR") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al crear usuario", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
