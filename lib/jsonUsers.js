import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'usuarios.json');

async function readDb() {
  try {
    const txt = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

async function writeDb(data) {
  const dir = path.dirname(DB_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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
    const err = new Error('email y password son requeridos');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const items = await readDb();

  // evitar emails duplicados
  if (items.some((u) => u.email === user.email)) {
    const err = new Error('email ya registrado');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const maxId = items.reduce((m, x) => (x.id > m ? x.id : m), 0);
  const nextId = maxId + 1;

  // NOTA: aquí guardamos la contraseña tal cual (texto plano)
  const newUser = {
    id: nextId,
    email: user.email,
    password: user.password,
    nombre: user.nombre || '',
    rol: user.rol || 'user',
    ...user.extra
  };

  items.push(newUser);
  await writeDb(items);

  // devolver sin password
  const { password, ...safe } = newUser;
  return safe;
}

export async function update(id, updates) {
  const items = await readDb();
  const idx = items.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  // Actualizamos tal cual; si updates.password viene, se guarda en texto plano
  items[idx] = { ...items[idx], ...updates, id };
  await writeDb(items);
  const { password, ...safe } = items[idx];
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
  // comparación en texto plano (NO segura)
  if (user.password !== plainPassword) return null;
  const { password, ...safe } = user;
  return safe;
}