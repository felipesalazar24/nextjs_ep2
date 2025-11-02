"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Pagination,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

/**
 * Productos list (app/productos/page.jsx)
 * - Carga productos y ofertas (server + localStorage fallback).
 * - Muestra en cada tarjeta un pequeño cartel de oferta cuando aplica:
 *    * precio original tachado, precio oferta destacado y porcentaje.
 * - Agrega paginación client-side (40 items por página) con controles arriba y abajo.
 */

function normalizeId(v) {
  return String(v ?? "").trim();
}

const safeSrc = (s) => {
  if (!s) return "/assets/productos/placeholder.png";
  try {
    if (String(s).startsWith("data:")) return s;
    if (!String(s).match(/^https?:\/\//i) && typeof window !== "undefined") {
      return new URL(s, window.location.origin).href;
    }
    return String(s);
  } catch {
    return String(s);
  }
};

export default function ProductosPage() {
  const { user } = useAuth();
  const cart = useCart();
  const [productos, setProductos] = useState([]);
  const [serverOffers, setServerOffers] = useState([]);
  const [createdOffers, setCreatedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination state
  const PAGE_SIZE = 40;
  const [page, setPage] = useState(1);

  // Load data
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
        // reset page to 1 when reloading dataset
        setPage(1);
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

  // merge offers (createdOffers override serverOffers for same productId)
  const offersMap = useMemo(() => {
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
    return map;
  }, [serverOffers, createdOffers]);

  const computeOfferFor = (product) => {
    const pid = normalizeId(product.id ?? product._id ?? product.sku);
    const o = offersMap.get(pid);
    if (!o) return null;
    const oldPrice = Number(o.oldPrice ?? product.precio ?? product.price ?? 0);
    const newPrice = Number(o.newPrice ?? 0);
    const percent = Number(
      o.percent ??
        (oldPrice && newPrice
          ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
          : 0)
    );
    if (!newPrice || newPrice <= 0) return null;
    return { oldPrice, newPrice, percent, source: o.source || "server" };
  };

  // Pagination helpers
  const totalPages = Math.max(
    1,
    Math.ceil((productos?.length || 0) / PAGE_SIZE)
  );
  // Keep page in bounds if products change
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (productos || []).slice(start, start + PAGE_SIZE);
  }, [productos, page]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!productos || productos.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">No hay productos para mostrar.</Alert>
      </Container>
    );
  }

  const handleAddToCart = (product, effectivePrice) => {
    try {
      if (cart && typeof cart.addToCart === "function") {
        const item = { ...product, precio: effectivePrice };
        cart.addToCart(item, 1);
        alert(`¡${product.nombre} agregado al carrito!`);
      } else {
        // fallback: dispatch event
        const e = new CustomEvent("add-to-cart", {
          detail: { product, price: effectivePrice, qty: 1 },
        });
        window.dispatchEvent(e);
      }
    } catch (err) {
      console.warn("addToCart error", err);
    }
  };

  return (
    <Container className="py-5">
      {/* Top pagination controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mb-3">
          <Pagination>
            <Pagination.Prev
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            {page > 3 && (
              <>
                <Pagination.Item onClick={() => setPage(1)}>1</Pagination.Item>
                <Pagination.Ellipsis disabled />
              </>
            )}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (pageNum >= page - 2 && pageNum <= page + 2) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === page}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              }
              return null;
            })}
            {page < totalPages - 2 && (
              <>
                <Pagination.Ellipsis disabled />
                <Pagination.Item onClick={() => setPage(totalPages)}>
                  {totalPages}
                </Pagination.Item>
              </>
            )}
            <Pagination.Next
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      )}

      <Row xs={1} md={3} lg={4} className="g-4">
        {paginatedProducts.map((p) => {
          const offer = computeOfferFor(p);
          const displayPrice = offer
            ? offer.newPrice
            : p.precio ?? p.price ?? 0;
          return (
            <Col key={p.id ?? p._id ?? p.sku}>
              <Card className="h-100 shadow-sm">
                <div style={{ padding: 18, textAlign: "center" }}>
                  <img
                    src={safeSrc(
                      p.imagen ||
                        (p.miniaturas && p.miniaturas[0]) ||
                        "/assets/productos/placeholder.png"
                    )}
                    alt={p.nombre}
                    style={{ width: "100%", height: 180, objectFit: "contain" }}
                    onError={(e) =>
                      (e.target.src = "/assets/productos/placeholder.png")
                    }
                  />
                </div>

                <Card.Body className="d-flex flex-column">
                  <div className="mb-2 d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title style={{ fontSize: 16 }}>
                        {p.nombre}
                      </Card.Title>
                      <small className="text-muted">
                        {p.atributo || p.categoria}
                      </small>
                    </div>

                    {offer ? (
                      <Badge bg="danger" className="text-wrap">
                        -{offer.percent}%
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    {offer ? (
                      <div>
                        <div>
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#777",
                              marginRight: 8,
                            }}
                          >
                            ${Number(offer.oldPrice).toLocaleString("es-CL")}
                          </span>
                          <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                            ${Number(offer.newPrice).toLocaleString("es-CL")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#0d6efd", fontWeight: 700 }}>
                        $
                        {Number(p.precio ?? p.price ?? 0).toLocaleString(
                          "es-CL"
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto d-grid">
                    <Link
                      href={`/productos/${p.id ?? p._id ?? p.sku}`}
                      className="btn btn-outline-dark btn-sm mb-2"
                    >
                      Ver Detalles
                    </Link>
                    <Button
                      variant="primary"
                      onClick={() => handleAddToCart(p, displayPrice)}
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Bottom Pagination controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            {page > 3 && (
              <>
                <Pagination.Item onClick={() => setPage(1)}>1</Pagination.Item>
                <Pagination.Ellipsis disabled />
              </>
            )}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (pageNum >= page - 2 && pageNum <= page + 2) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === page}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              }
              return null;
            })}
            {page < totalPages - 2 && (
              <>
                <Pagination.Ellipsis disabled />
                <Pagination.Item onClick={() => setPage(totalPages)}>
                  {totalPages}
                </Pagination.Item>
              </>
            )}
            <Pagination.Next
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      )}
    </Container>
  );
}
