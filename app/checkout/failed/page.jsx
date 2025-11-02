"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
} from "react-bootstrap";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Página de pago fallido (Client Component)
 * - Esta página usa useSearchParams / sessionStorage, por eso debe ser un Client Component.
 * - Pegar / reemplazar en: app/checkout/failed/page.jsx
 */

const loadOffers = async () => {
  let serverOffers = [];
  try {
    const res = await fetch("/api/offers").catch(() => null);
    if (res && res.ok) serverOffers = await res.json().catch(() => []);
  } catch (err) {
    serverOffers = [];
  }

  let created = [];
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("createdOffers");
      created = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    created = [];
  }

  const map = new Map();
  for (const o of serverOffers || []) {
    const pid = String(o.productId ?? o.id ?? "").trim();
    if (!pid) continue;
    map.set(pid, { ...o, source: "server" });
  }
  for (const o of created || []) {
    const pid = String(o.productId ?? "").trim();
    if (!pid) continue;
    map.set(pid, { ...o, source: "admin" });
  }

  return { offersArray: Array.from(map.values()), offersMap: map };
};

const getOfferForProduct = (offersMap, product) => {
  if (!offersMap || !product) return null;
  const pid = String(
    product.id ??
      product.productId ??
      product._id ??
      product.sku ??
      product.codigo ??
      ""
  ).trim();
  return offersMap.get(pid) || null;
};

const getEffectivePrice = (product, offer) => {
  const raw =
    Number(product.precio ?? product.price ?? product.amount ?? 0) || 0;
  if (!offer) return { oldPrice: null, price: raw, percent: 0 };
  const oldPrice = Number(offer.oldPrice ?? raw) || raw;
  let price = Number(offer.newPrice ?? 0);
  let percent = Number(offer.percent ?? 0);

  if (!price && percent && oldPrice)
    price = Math.round(oldPrice * (1 - percent / 100));
  if (!percent && price && oldPrice)
    percent = Math.round(((oldPrice - price) / oldPrice) * 100);
  if (!price || price <= 0) price = raw;

  return { oldPrice: oldPrice || null, price, percent: percent || 0 };
};

export default function CheckoutFailedPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderIdParam = params ? params.get("order") : null;

  const [attempt, setAttempt] = useState(null);
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" &&
        sessionStorage.getItem("lastFailedOrder");
      if (raw) {
        const parsed = JSON.parse(raw);
        setAttempt(parsed);
      }
    } catch (err) {
      // ignore parse errors
    }
  }, [orderIdParam]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setOffersLoading(true);
      try {
        const { offersMap: om } = await loadOffers();
        if (!mounted) return;
        setOffersMap(om);
      } catch (err) {
        console.warn("Error cargando ofertas:", err);
        if (mounted) setOffersMap(new Map());
      } finally {
        if (mounted) setOffersLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleHome = () => {
    router.push("/");
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4 className="text-danger">✕ No se pudo realizar el pago</h4>
                  <small className="text-muted">
                    Intento: {attempt?.id || orderIdParam || "—"}
                  </small>
                </div>
                <Badge bg="light" text="dark">
                  Fallido
                </Badge>
              </div>

              {attempt ? (
                <>
                  <h6 className="mb-2">Información del cliente</h6>
                  <Row className="mb-3">
                    <Col md={4}>
                      <strong>Nombre:</strong> {attempt.customer?.nombre}
                    </Col>
                    <Col md={4}>
                      <strong>Correo:</strong> {attempt.customer?.email}
                    </Col>
                    <Col md={4}>
                      <strong>Teléfono:</strong>{" "}
                      {attempt.customer?.telefono || "-"}
                    </Col>
                  </Row>

                  <h6 className="mb-2">Dirección de entrega</h6>
                  <p className="text-muted mb-3">
                    {attempt.customer?.calle}{" "}
                    {attempt.customer?.depto
                      ? `, ${attempt.customer.depto}`
                      : ""}{" "}
                    — {attempt.customer?.comuna}, {attempt.customer?.region}
                  </p>

                  <h6 className="mb-2">Productos</h6>
                  <Table responsive bordered size="sm" className="mb-3">
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th className="text-end">Precio</th>
                        <th className="text-center">Oferta</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(attempt.items) &&
                      attempt.items.length > 0 ? (
                        attempt.items.map((it) => {
                          const offer = getOfferForProduct(offersMap, it);
                          const ef = getEffectivePrice(it, offer);
                          const qty =
                            Number(it.cantidad || it.quantity || it.qty || 1) ||
                            1;

                          return (
                            <tr key={it.id ?? `${it.nombre}-${Math.random()}`}>
                              <td style={{ width: 80 }}>
                                {it.imagen ? (
                                  <img
                                    src={it.imagen}
                                    alt={it.nombre}
                                    style={{
                                      width: 64,
                                      height: 48,
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : null}
                              </td>
                              <td>{it.nombre}</td>

                              {/* Precio: mostrar precio original (oldPrice) strike-through cuando hay oferta */}
                              <td className="text-end">
                                {ef && ef.oldPrice ? (
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#777",
                                    }}
                                  >
                                    $
                                    {Number(ef.oldPrice).toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                ) : (
                                  `$${Number(
                                    it.precio || it.price || 0
                                  ).toLocaleString("es-CL")}`
                                )}
                              </td>

                              {/* Oferta: mostrar % de descuento */}
                              <td className="text-center">
                                {ef && ef.percent ? (
                                  <Badge bg="danger">-{ef.percent}%</Badge>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>

                              <td className="text-center">{qty}</td>

                              {/* Subtotal: usar precio efectivo (oferta si aplica) */}
                              <td className="text-end">
                                $
                                {(
                                  Number(
                                    ef.price || it.precio || it.price || 0
                                  ) * qty || 0
                                ).toLocaleString("es-CL")}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No hay items en el intento
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  <div className="d-flex justify-content-between align-items-center">
                    <div />
                    <div className="text-end">
                      <div className="fw-bold">Total</div>
                      <div className="h4 text-primary">
                        ${Number(attempt.total || 0).toLocaleString("es-CL")}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <Button
                      variant="success"
                      onClick={() => router.push("/checkout")}
                    >
                      Volver a realizar el pago
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => router.push("/carrito")}
                    >
                      Ir al carrito
                    </Button>
                    <Button variant="outline-primary" onClick={handleHome}>
                      Volver al inicio
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-2">
                    No se encontró información del intento de pago.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => router.push("/productos")}
                    >
                      Ver Productos
                    </Button>
                    <Button variant="outline-secondary" onClick={handleHome}>
                      Volver al inicio
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
