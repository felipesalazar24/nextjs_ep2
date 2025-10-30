import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'productos.json'); // <- Nombre correcto: productos.json

async function readDb() {
  try {
    const txt = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    // Si no existe, devolvemos array vacío (y el código cliente lo mostrará vacío)
    if (err.code === 'ENOENT') {
      console.warn(`[jsonDb] DB file not found at ${DB_FILE} — returning []`);
      return [];
    }
    console.error('[jsonDb] Error leyendo DB:', err);
    throw err;
  }
}

async function writeDb(data) {
  // Aseguramos que la carpeta exista antes de escribir
  const dir = path.dirname(DB_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function getAll() {
  return await readDb();
}

export async function getById(id) {
  const items = await readDb();
  return items.find((p) => p.id === id) || null;
}

export async function add(item) {
  const items = await readDb();
  const maxId = items.reduce((m, x) => (x.id > m ? x.id : m), 0);
  const nextId = maxId + 1;
  const newItem = { id: nextId, ...item };
  items.push(newItem);
  await writeDb(items);
  return newItem;
}

export async function update(id, updates) {
  const items = await readDb();
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, id };
  await writeDb(items);
  return items[idx];
}

export async function remove(id) {
  const items = await readDb();
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  await writeDb(items);
  return true;
}