import { NextResponse } from "next/server";

const BACKEND_BASE = "https://backendusuariogametech-production.up.railway.app";

/**
 * Helper to proxy requests to the backend API.
 * Returns an object with { ok, status, data }.
 */
async function proxyFetch(path: string, options: RequestInit = {}) {
  const url = `${BACKEND_BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    // Try to parse JSON, but fallback if no body.
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: { message: "Bad gateway", error: String(error) },
    };
  }
}

/**
 * GET handler
 * - GET /api/usuario -> list all users (proxied to backend GET /api/v1/usuarios)
 * - GET /api/usuario?id=123 -> get user by id (proxied to backend GET /api/v1/usuarios/id/{id})
 * - GET /api/usuario?email=...&contrasenia=... -> "login" style lookup: fetch all and match email+contrasenia
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  const contrasenia = url.searchParams.get("contrasenia");

  try {
    if (id) {
      // GET by id
      const { ok, status, data } = await proxyFetch(
        `/api/v1/usuarios/id/${encodeURIComponent(id)}`
      );
      if (!ok) return NextResponse.json({ error: data }, { status });
      return NextResponse.json(data, { status });
    }

    if (email && contrasenia) {
      // No dedicated login endpoint on the backend: fetch all users and find the match.
      const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`);
      if (!ok) return NextResponse.json({ error: data }, { status });
      if (!Array.isArray(data))
        return NextResponse.json(
          { error: "Unexpected backend response" },
          { status: 502 }
        );

      const found = data.find(
        (u: any) =>
          String(u.email).toLowerCase() === String(email).toLowerCase() &&
          String(u.contrasenia) === String(contrasenia)
      );
      if (!found)
        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        );
      return NextResponse.json(found, { status: 200 });
    }

    // List all users
    const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`);
    if (!ok) {
      // If backend returned no content (204) or other non-ok, forward that status.
      return NextResponse.json({ error: data }, { status });
    }
    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST -> create a new user
 * For robustness we apply a few defaults similarly to original frontend logic:
 * - if telefono missing or <= 0 -> set 0
 * - if fechaCreacion missing -> set today (YYYY-MM-DD)
 * - if rol missing -> 'cliente'
 *
 * Proxies to backend POST /api/v1/usuarios
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) || {};

    // Basic normalization / defaults before sending to backend
    if (!body.telefono || Number(body.telefono) <= 0) body.telefono = 0;
    if (!body.fechaCreacion) {
      body.fechaCreacion = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    }
    if (!body.rol) body.rol = "cliente";

    const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid request body", error: String(error) },
      { status: 400 }
    );
  }
}

/**
 * PUT -> update a user
 * Expects an 'id' query param (preferred) or body.id
 * Proxies to backend PUT /api/v1/usuarios/actualizar/{id}
 */
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const body = (await request.json()) || {};
    const id = idParam || body.id;

    if (!id) {
      return NextResponse.json(
        { message: "Missing id parameter for update" },
        { status: 400 }
      );
    }

    // send update to backend
    const { ok, status, data } = await proxyFetch(
      `/api/v1/usuarios/actualizar/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    );

    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid request body", error: String(error) },
      { status: 400 }
    );
  }
}

/**
 * DELETE -> delete a user by id
 * Expects query param 'id'
 * Proxies to backend DELETE /api/v1/usuarios/id/{id}
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing id parameter for delete" },
        { status: 400 }
      );
    }

    const { ok, status, data } = await proxyFetch(
      `/api/v1/usuarios/id/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );

    if (!ok) return NextResponse.json({ error: data }, { status });
    // backend likely returns 204 No Content; forward that status.
    return NextResponse.json(data ?? { message: "Deleted" }, { status });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS -> respond to preflight CORS checks (useful when calling from browser)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
