"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container, Table, Spinner, Alert, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Usuarios page
 * - Aplica la misma verificación de acceso que admin/productos/ofertas/page.jsx
 * - Lista usuarios desde /api/usuarios (si existe)
 *
 * Ahora el access-denied botón manda al Home (app/page.jsx).
 */

function userIsAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (user.admin === true) return true;
  const role = (user.role || user.rol || user.roleName || "").toString().toLowerCase();
  if (role === "admin" || role === "administrator") return true;
  if (Array.isArray(user.roles) && user.roles.some((r) => String(r).toLowerCase() === "admin")) return true;
  if (Array.isArray(user.permissions) && (user.permissions.includes("admin") || user.permissions.includes("ADMIN"))) return true;
  const nameCheck = (user.name || user.nombre || user.displayName || "").toString().toLowerCase();
  if (nameCheck.includes("admin")) return true;
  return false;
}

export default function AdminUsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delay redirect if unauthenticated to avoid false redirects while auth hydrates
  useEffect(() => {
    let t;
    if (user === null) {
      t = setTimeout(() => router.push("/login"), 1200);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/usuarios");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar usuarios");
        }
        const data = await res.json().catch(() => []);
        if (!mounted) return;
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error desconocido");
        setUsuarios([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (typeof user === "undefined") {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (user === null) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">Comprobando sesión... serás redirigido al login si no hay sesión.</Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">
          Acceso denegado. Necesitas permisos de administrador para ver esta página.
        </Alert>
        <div>
          <Link href="/" className="btn btn-secondary">Volver al inicio</Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Usuarios</h3>
        <div className="d-flex gap-2">
          <Link href="/admin" className="btn btn-outline-secondary">Volver al panel</Link>
          <Button variant="primary" href="/admin/usuarios/crear">Crear Usuario</Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && usuarios.length === 0 && (
        <Alert variant="info">No hay usuarios registrados.</Alert>
      )}

      {!loading && !error && usuarios.length > 0 && (
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id ?? u._id ?? i}>
                <td>{i + 1}</td>
                <td>{u.nombre || u.name || "-"}</td>
                <td>{u.email || "-"}</td>
                <td>{u.rol || u.role || "-"}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Link href={`/admin/usuarios/${u.id ?? u._id}`} className="btn btn-sm btn-outline-dark">Ver</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}