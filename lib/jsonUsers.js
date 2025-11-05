import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";

/**
 * lib/jsonUsers.js
 *
 * - En desarrollo usa ./data/usuarios.json (para que workbench/dev siga igual).
 * - En producción (ej. Vercel) usa un directorio temporal escribible (os.tmpdir()).
 * - Puedes forzar la ruta con la variable de entorno USERS_DATA_DIR.
 *
 * Nota: el filesystem en entornos serverless sigue siendo efímero. Esto solo
 * asegura que la función pueda escribir/leer en runtime (mientras la instancia exista).
 */

const DEV_DIR = path.join(process.cwd(), "data");
const PROD_FALLBACK_DIR = path.join(os.tmpdir(), "nextjs_ep2_data"); // escribible en runtime
const BASE_DIR =
  process.env.USERS_DATA_DIR ||
  (process.env.NODE_ENV === "development" ? DEV_DIR : PROD_FALLBACK_DIR);

const DB_FILE = path.join(BASE_DIR, "usuarios.json");
// ruta alternativa legacy (por compatibilidad): ./data/usuarios.json en repo
const LEGACY_FILE = path.join(process.cwd(), "data", "usuarios.json");

async function readDb() {
  // Intentar leer desde DB_FILE (preferido)
  try {
    const txt = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    if (err.code === "ENOENT") {
      // Si no existe DB_FILE, intentar legacy file (útil si en dev se creó en repo/data)
      try {
        const legacyTxt = await fs.readFile(LEGACY_FILE, "utf8");
        return JSON.parse(legacyTxt || "[]");
      } catch (err2) {
        if (err2.code === "ENOENT") {
          return [];
        }
        console.error("[jsonUsers] legacy read error:", err2);
        throw err2;
      }
    }
    console.error("[jsonUsers] read error:", err);
    throw err;
  }
}

async function writeDb(data) {
  try {
    // Asegurar directorio base
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    // Escribir en DB_FILE (ruta elegida)
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[jsonUsers] write error:", err);
    throw err;
  }
}

export async function getAll() {
  return await readDb();
}

export async function getById(id) {
  const items = await readDb();
  return items.find((u) => u.id === id) || null;
}

export async function getByEmail(email) {
  const items = await readDb();
  return items.find((u) => u.email === email) || null;
}

export async function add(user) {
  // user must include at least email & password
  if (!user || !user.email || !user.password) {
    const err = new Error("email y password son requeridos");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const items = await readDb();

  // evitar emails duplicados
  if (items.some((u) => u.email === user.email)) {
    const err = new Error("email ya registrado");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  const maxId = items.reduce((m, x) => (x.id > m ? x.id : m), 0);
  const nextId = maxId + 1;

  // Forzar rol = 'user' siempre (no permitir rol desde front-end)
  const newUser = {
    id: nextId,
    email: user.email,
    password: user.password, // texto plano (según requisito actual)
    nombre: user.nombre || "",
    telefono: user.telefono || "",
    region: user.region || "",
    comuna: user.comuna || "",
    rol: "user",
    // incluye cualquier otro campo aceptable en extra
    ...(user.extra && typeof user.extra === "object" ? user.extra : {}),
  };

  items.push(newUser);
  await writeDb(items);

  // devolver sin password
  const safe = { ...newUser };
  delete safe.password;
  return safe;
}

export async function update(id, updates) {
  const items = await readDb();
  const idx = items.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  // Evitar que el rol sea modificado desde el front-end:
  if (updates && Object.prototype.hasOwnProperty.call(updates, "rol")) {
    delete updates.rol;
  }

  // No permitimos que el front cambie id
  const merged = { ...items[idx], ...updates, id };

  items[idx] = merged;
  await writeDb(items);

  // devolver sin password
  const safe = { ...items[idx] };
  delete safe.password;
  return safe;
}

export async function remove(id) {
  const items = await readDb();
  const idx = items.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  await writeDb(items);
  return true;
}

export async function validateCredentials(email, plainPassword) {
  const user = await getByEmail(email);
  if (!user) return null;
  // comparación en texto plano (NO segura, aceptado por tu requisito)
  if (user.password !== plainPassword) return null;

  const safe = { ...user };
  delete safe.password;
  return safe;
}
