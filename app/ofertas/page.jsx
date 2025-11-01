"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import Link from "next/link";
import { useCart } from "../context/CartContext";

/**
 * Página pública de Ofertas
 * - Combina ofertas desde /api/offers y localStorage (createdOffers) para mostrar todas.
 * - Muestra productos en un grid (tarjetas) similares a /productos,
 *   pero únicamente los que tengan oferta activa.
 * - Cada tarjeta muestra imagen, nombre, categoría, precio original tachado,
 *   precio oferta destacado y badge con porcentaje. Botón Ver Detalles y Agregar al carrito.
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

  const { addToCart } = useCart();

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

  // Combine serverOffers + createdOffers where createdOffers (admin fallback) override server if same productId
  const ofertas = useMemo(() => {
    const map = new Map();

    for (const o of serverOffers || []) {
      const pid = normalizeId(
        o.productId ?? o.id ?? (o.product && (o.product.id ?? o.product._id))
      );
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
      const prod = productos.find(
        (p) => normalizeId(p.id ?? p._id ?? p.sku) === pid
      );
      if (!prod) continue;
      const oldPrice = Number(o.oldPrice ?? prod.precio ?? 0);
      const newPrice = Number(o.newPrice ?? 0);
      const percent =
        Number(o.percent) ||
        (oldPrice && newPrice
          ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
          : 0);
      if (!newPrice || newPrice <= 0) continue; // ignore invalid offers
      arr.push({
        productId: pid,
        product: prod,
        oldPrice,
        newPrice,
        percent,
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

  const safeSrc = (s) => {
    if (!s) return "/assets/productos/placeholder.png";
    try {
      const str = String(s);
      if (str.startsWith("data:")) return str;
      if (typeof window !== "undefined" && !/^https?:\/\//i.test(str))
        return new URL(str, window.location.origin).href;
      return str;
    } catch {
      return String(s);
    }
  };

  const handleAddToCart = (product, price) => {
    try {
      if (addToCart && typeof addToCart === "function") {
        // add product with overridden price so cart reflects offer price
        addToCart({ ...product, precio: Number(price) }, 1);
        alert(`¡${product.nombre} agregado al carrito!`);
      } else {
        window.dispatchEvent(
          new CustomEvent("add-to-cart", { detail: { product, price, qty: 1 } })
        );
      }
    } catch (err) {
      console.warn("addToCart error", err);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Ofertas</h3>
        <small className="text-muted">Productos con descuentos</small>
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
        <Row xs={1} md={2} lg={4} className="g-4">
          {ofertas.map((o) => (
            <Col key={o.productId}>
              <Card className="h-100 shadow-sm border-0 product-card">
                <div
                  className="position-relative"
                  style={{ padding: 18, textAlign: "center" }}
                >
                  {o.percent ? (
                    <Badge
                      bg="danger"
                      className="position-absolute"
                      style={{
                        right: 12,
                        top: 12,
                        borderRadius: 6,
                        padding: "6px 8px",
                        fontSize: 12,
                      }}
                    >
                      -{o.percent}%
                    </Badge>
                  ) : null}
                  <img
                    src={safeSrc(
                      o.product.imagen ||
                        (o.product.miniaturas && o.product.miniaturas[0]) ||
                        "/assets/productos/placeholder.png"
                    )}
                    alt={o.product.nombre}
                    style={{ width: "100%", height: 160, objectFit: "contain" }}
                    onError={(e) =>
                      (e.target.src = "/assets/productos/placeholder.png")
                    }
                  />
                </div>

                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h6 mb-2">
                    <Link
                      href={`/productos/${o.product.id}`}
                      className="text-dark text-decoration-none"
                    >
                      {o.product.nombre}
                    </Link>
                  </Card.Title>

                  <small className="text-muted mb-2">
                    {o.product.atributo || o.product.categoria}
                  </small>

                  <div className="mb-3">
                    <div>
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#777",
                          marginRight: 8,
                        }}
                      >
                        ${Number(o.oldPrice || 0).toLocaleString("es-CL")}
                      </span>
                      <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                        ${Number(o.newPrice || 0).toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto d-grid">
                    <Link
                      href={`/productos/${o.product.id}`}
                      className="btn btn-outline-dark btn-sm mb-2"
                    >
                      Ver Detalles
                    </Link>
                    <Button
                      variant="primary"
                      onClick={() => handleAddToCart(o.product, o.newPrice)}
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
