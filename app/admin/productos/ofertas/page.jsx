"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

/**
 * Página administrativa de Ofertas dentro de: app/admin/productos/ofertas/page.jsx
 *
 * Mejoras:
 * - No redirige inmediatamente al login si user aún está indefinido (auth cargando).
 * - Si user === null espera un breve timeout antes de redirigir (se cancela si user se setea).
 * - Detección de admin robusta (user.role, user.rol, user.isAdmin, etc).
 */

function userIsAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (user.admin === true) return true;
  const role = (user.role || user.rol || user.roleName || "")
    .toString()
    .toLowerCase();
  if (role === "admin" || role === "administrator") return true;
  if (
    Array.isArray(user.roles) &&
    user.roles.some((r) => String(r).toLowerCase() === "admin")
  )
    return true;
  if (
    Array.isArray(user.permissions) &&
    (user.permissions.includes("admin") || user.permissions.includes("ADMIN"))
  )
    return true;
  const nameCheck = (user.name || user.nombre || user.displayName || "")
    .toString()
    .toLowerCase();
  if (nameCheck.includes("admin")) return true;
  return false;
}

export default function AdminProductOffersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [productos, setProductos] = useState([]);
  const [serverOffers, setServerOffers] = useState([]);
  const [createdOffers, setCreatedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  // Si user === null (no logueado) esperamos un corto timeout antes de redirigir.
  // Esto evita redirecciones falsas mientras el auth-context se hidrata (user === undefined).
  useEffect(() => {
    let t;
    if (user === null) {
      // espera 1200ms antes de redirigir; durante ese tiempo user puede actualizarse.
      t = setTimeout(() => {
        router.push("/login");
      }, 1200);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [user, router]);

  // Load products + server offers + local created offers (fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pRes, oRes] = await Promise.all([
          fetch("/api/productos"),
          fetch("/api/offers").catch(() => null),
        ]);

        if (!pRes.ok) {
          const data = await pRes.json().catch(() => ({}));
          throw new Error(data.error || "Error al obtener productos");
        }
        const prodData = await pRes.json().catch(() => []);
        let offersData = [];
        if (oRes && oRes.ok) {
          offersData = await oRes.json().catch(() => []);
        }

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("createdOffers")
            : null;
        const parsed = stored ? JSON.parse(stored) : [];

        if (!mounted) return;
        setProductos(Array.isArray(prodData) ? prodData : []);
        setServerOffers(Array.isArray(offersData) ? offersData : []);
        setCreatedOffers(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error al cargar datos");
        setProductos([]);
        setServerOffers([]);
        setCreatedOffers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const ofertas = useMemo(() => {
    const map = new Map();

    for (const o of serverOffers || []) {
      const pid = String(o.productId ?? o.id ?? o.product?.id ?? "");
      if (!pid) continue;
      map.set(pid, { ...o, source: "server" });
    }

    for (const o of createdOffers || []) {
      const pid = String(o.productId ?? "");
      if (!pid) continue;
      map.set(pid, { ...o, source: "admin" });
    }

    const arr = [];
    for (const [pid, o] of map.entries()) {
      const prod = productos.find(
        (p) => String(p.id ?? p._id ?? p.sku) === pid
      );
      if (!prod) continue;
      arr.push({
        productId: pid,
        product: prod,
        oldPrice: o.oldPrice ?? prod.precio ?? null,
        newPrice: o.newPrice ?? null,
        percent:
          o.percent ??
          (o.oldPrice && o.newPrice
            ? Math.round(((o.oldPrice - o.newPrice) / o.oldPrice) * 100)
            : 0),
        source: o.source || "admin",
        raw: o,
      });
    }

    arr.sort(
      (a, b) =>
        (b.percent || 0) - (a.percent || 0) ||
        (a.newPrice || 0) - (b.newPrice || 0)
    );
    return arr;
  }, [serverOffers, createdOffers, productos]);

  const handleDeleteOffer = async (productId) => {
    const pid = String(productId);
    setServerOffers((prev) =>
      (prev || []).filter((o) => String(o.productId) !== pid)
    );
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("createdOffers")
        : null;
    try {
      const parsed = stored ? JSON.parse(stored) : [];
      const filtered = parsed.filter((o) => String(o.productId) !== pid);
      localStorage.setItem("createdOffers", JSON.stringify(filtered));
      setCreatedOffers(filtered);
    } catch (err) {
      console.warn("Error updating localStorage", err);
    }

    try {
      await fetch(`/api/offers/${encodeURIComponent(pid)}`, {
        method: "DELETE",
      });
    } catch (err) {
      // ignore
    }
  };

  // Mientras auth se está cargando (user === undefined) mostramos spinner para evitar denegación temprana
  if (typeof user === "undefined") {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  // Si user === null el useEffect anterior lanzará redirección tras el timeout; mostramos aviso mientras tanto
  if (user === null) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          Comprobando sesión... serás redirigido al login si no hay sesión.
        </Alert>
      </Container>
    );
  }

  // Si user existe pero no es admin mostramos acceso denegado
  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Acceso denegado. Necesitas permisos de administrador para ver esta
          página.
        </Alert>
        <Link href="/admin" className="btn btn-secondary">
          Volver al panel
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h3 className="mb-0">Ofertas (Admin)</h3>
          <small className="text-muted">
            Crear y gestionar ofertas de productos
          </small>
        </div>

        <div className="d-flex gap-2">
          <Link href="/admin" className="btn btn-outline-secondary">
            Volver al panel
          </Link>
          <Link href="/admin/productos" className="btn btn-outline-secondary">
            Volver a Productos
          </Link>
          <Link href="/admin/productos/ofertas" className="btn btn-primary">
            Crear / Gestionar Ofertas
          </Link>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Ofertas activas</h5>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          )}

          {!loading && ofertas.length === 0 && (
            <div className="text-center text-muted py-4">
              No hay ofertas activas.
            </div>
          )}

          {!loading && ofertas.length > 0 && (
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Precio original</th>
                  <th>Precio oferta</th>
                  <th>Descuento</th>
                  <th>Fuente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((o, idx) => (
                  <tr key={String(o.productId)}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={
                            o.product.imagen ||
                            "/assets/productos/placeholder.png"
                          }
                          alt={o.product.nombre}
                          style={{
                            width: 56,
                            height: 40,
                            objectFit: "contain",
                          }}
                          onError={(e) =>
                            (e.target.src = "/assets/productos/placeholder.png")
                          }
                        />
                        <div>
                          <div>{o.product.nombre}</div>
                          <small className="text-muted">
                            {o.product.atributo || o.product.categoria}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>${Number(o.oldPrice || 0).toLocaleString("es-CL")}</td>
                    <td>${Number(o.newPrice || 0).toLocaleString("es-CL")}</td>
                    <td>{o.percent ? `-${o.percent}%` : "-"}</td>
                    <td>
                      <Badge bg={o.source === "server" ? "info" : "secondary"}>
                        {o.source}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          href={`/productos/${o.product.id}`}
                          className="btn btn-outline-sm btn-outline-dark btn-sm"
                        >
                          Ver
                        </Link>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteOffer(o.productId)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
