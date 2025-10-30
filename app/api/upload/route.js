import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

// POST /api/upload  (ya existente) -> guarda archivos
export async function POST(req) {
  try {
    const body = await req.json();
    const files = Array.isArray(body.files) ? body.files : (body.file ? [body.file] : []);
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se recibieron archivos' }, { status: 400 });
    }

    const destDir = path.join(process.cwd(), 'public', 'assets', 'productos');
    await fs.mkdir(destDir, { recursive: true });

    const saved = [];

    for (const f of files) {
      if (!f || !f.data || !f.name) continue;
      const m = String(f.data).match(/^data:(.+);base64,(.+)$/);
      if (!m) {
        const rawBase64 = f.data;
        const ext = path.extname(f.name) || '.jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
        const filePath = path.join(destDir, fileName);
        await fs.writeFile(filePath, Buffer.from(rawBase64, 'base64'));
        saved.push(`/assets/productos/${fileName}`);
        continue;
      }
      const mime = m[1];
      const b64 = m[2];
      let ext = '.jpg';
      if (mime === 'image/png') ext = '.png';
      else if (mime === 'image/webp') ext = '.webp';
      else if (mime === 'image/gif') ext = '.gif';
      else if (mime === 'image/svg+xml') ext = '.svg';
      else if (mime === 'image/jpeg') ext = '.jpg';

      const base = path.basename(f.name).replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,6)}-${base || 'img'}${ext}`;
      const filePath = path.join(destDir, fileName);

      await fs.writeFile(filePath, Buffer.from(b64, 'base64'));
      saved.push(`/assets/productos/${fileName}`);
    }

    return NextResponse.json({ files: saved }, { status: 201 });
  } catch (err) {
    console.error('upload error', err);
    return NextResponse.json({ error: 'Error guardando archivos', details: String(err.message) }, { status: 500 });
  }
}

// DELETE /api/upload  -> borra un archivo dado su path público (/assets/productos/...)
export async function DELETE(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const file = body.file || body.path;
    if (!file || typeof file !== 'string') {
      return NextResponse.json({ error: 'Se requiere la propiedad "file" con la ruta pública' }, { status: 400 });
    }

    // Seguridad: solo permitir rutas dentro de /assets/productos
    const allowedPrefix = '/assets/productos/';
    if (!file.startsWith(allowedPrefix)) {
      return NextResponse.json({ error: 'Ruta no permitida' }, { status: 400 });
    }

    const relPath = file.replace(/^\/+/, ''); // quita slash inicial
    const absPath = path.join(process.cwd(), 'public', relPath);
    const destDir = path.join(process.cwd(), 'public', 'assets', 'productos');

    // Evitar path traversal: verificar que absPath empiece con destDir
    const resolved = path.resolve(absPath);
    const resolvedDest = path.resolve(destDir);
    if (!resolved.startsWith(resolvedDest)) {
      return NextResponse.json({ error: 'Ruta fuera de la carpeta permitida' }, { status: 400 });
    }

    try {
      await fs.unlink(resolved);
      return NextResponse.json({ deleted: file }, { status: 200 });
    } catch (fsErr) {
      if (fsErr.code === 'ENOENT') {
        return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
      }
      console.error('fs unlink error', fsErr);
      return NextResponse.json({ error: 'Error eliminando archivo', details: String(fsErr.message) }, { status: 500 });
    }
  } catch (err) {
    console.error('DELETE /api/upload error', err);
    return NextResponse.json({ error: 'Error procesando la solicitud', details: String(err.message) }, { status: 500 });
  }
}