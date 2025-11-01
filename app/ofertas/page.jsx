"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from "react-bootstrap";
import Link from "next/link";

/**
 * Página pública de Ofertas
 * - Combina ofertas desde /api/offers y localStorage (createdOffers) para mostrar todas.
 * - Muestra producto, precio original, precio oferta y %.
 * - Enlace al producto.
 */

function normalizeId(v) {
  return String(v ?? "").trim();
}

export default function OfertasPage() {
  const [productos, setProductos] = useState([]);
  const [serverOffers, setServerOffers] = useState([]);
  const [createdOffers, setCreatedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          throw new Error(data.error || "Error al cargar productos");
        }
        const prodData = await pRes.json().catch(() => []);
        let offersData = [];
        if (oRes && oRes.ok) {
          offersData = await oRes.json().catch(() => []);
        }

        const stored = typeof window !== "undefined" ? localStorage.getItem("createdOffers") : null;
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

  // Combine serverOffers + createdOffers where createdOffers (admin fallback) override server if same productId
  const ofertas = useMemo(() => {
    const map = new Map();

    for (const o of serverOffers || []) {
      const pid = normalizeId(o.productId ?? o.id ?? (o.product && (o.product.id ?? o.product._id)));
      if (!pid) continue;
      map.set(pid, { ...o, source: "server" });
    }

    for (const o of createdOffers || []) {
      const pid = normalizeId(o.productId ?? "");
      if (!pid) continue;
      map.set(pid, { ...o, source: "admin" });
    }

    const arr = [];
    for (const [pid, o] of map.entries()) {
      const prod = productos.find((p) => normalizeId(p.id ?? p._id ?? p.sku) === pid);
      if (!prod) continue;
      arr.push({
        productId: pid,
        product: prod,
        oldPrice: o.oldPrice ?? prod.precio ?? null,
        newPrice: o.newPrice ?? null,
        percent: o.percent ?? (o.oldPrice && o.newPrice ? Math.round(((o.oldPrice - o.newPrice) / o.oldPrice) * 100) : 0),
        source: o.source || "admin",
        raw: o,
      });
    }

    arr.sort((a, b) => (b.percent || 0) - (a.percent || 0) || (a.newPrice || 0) - (b.newPrice || 0));
    return arr;
  }, [serverOffers, createdOffers, productos]);

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Ofertas</h3>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && ofertas.length === 0 && (
        <Alert variant="info">No hay ofertas activas.</Alert>
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
              <tr key={o.productId}>
                <td>{idx + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={o.product.imagen || (o.product.miniaturas && o.product.miniaturas[0]) || "/assets/productos/placeholder.png"}
                      alt={o.product.nombre}
                      style={{ width: 56, height: 40, objectFit: "contain" }}
                      onError={(e) => (e.target.src = "/assets/productos/placeholder.png")}
                    />
                    <div>
                      <div>{o.product.nombre}</div>
                      <small className="text-muted">{o.product.atributo || o.product.categoria}</small>
                    </div>
                  </div>
                </td>
                <td>${Number(o.oldPrice || 0).toLocaleString("es-CL")}</td>
                <td>${Number(o.newPrice || 0).toLocaleString("es-CL")}</td>
                <td>{o.percent ? `-${o.percent}%` : "-"}</td>
                <td><Badge bg={o.source === "server" ? "info" : "secondary"}>{o.source}</Badge></td>
                <td>
                  <div className="d-flex gap-2">
                    <Link href={`/productos/${o.product.id}`} className="btn btn-outline-dark btn-sm">Ver</Link>
                    {/* No eliminamos ofertas desde aquí (solo admin) */}
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