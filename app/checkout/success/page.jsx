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
import { useRouter } from "next/navigation";

/**
 * Página de compra exitosa (Client Component)
 * - No usa useSearchParams para evitar CSR-bailout durante el build.
 * - Lee el parámetro `order` desde window.location.search dentro de useEffect.
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
    product.id ?? product.productId ?? product._id ?? product.sku ?? ""
  ).trim();
  return offersMap.get(pid) || null;
};

const getEffectivePrice = (product, offer) => {
  const raw = Number(product.precio ?? product.price ?? 0) || 0;
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

export default function CheckoutSuccessPage() {
  const router = useRouter();

  // estado
  const [orderIdParam, setOrderIdParam] = useState(null);
  const [order, setOrder] = useState(null);
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

  // Leer la query 'order' desde window.location.search (solo en cliente)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const order = sp.get("order");
        setOrderIdParam(order);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Cargar el último pedido desde sessionStorage (cliente)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem("lastOrder");
        if (raw) {
          const parsed = JSON.parse(raw);
          // si orderIdParam viene, podrías validar coincidencia; por ahora mostramos lo almacenado
          setOrder(parsed);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [orderIdParam]);

  // Cargar ofertas (cliente)
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

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

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
                  <h4 className="text-success">✓ Se ha realizado la compra</h4>
                  <small className="text-muted">
                    Código orden: {order?.id || orderIdParam || "—"}
                  </small>
                </div>
                <Badge bg="light" text="dark">
                  Completado
                </Badge>
              </div>

              {order ? (
                <>
                  <h6 className="mb-2">Información del cliente</h6>
                  <Row className="mb-3">
                    <Col md={4}>
                      <strong>Nombre:</strong> {order.customer?.nombre}
                    </Col>
                    <Col md={4}>
                      <strong>Correo:</strong> {order.customer?.email}
                    </Col>
                    <Col md={4}>
                      <strong>Teléfono:</strong>{" "}
                      {order.customer?.telefono || "-"}
                    </Col>
                  </Row>

                  <h6 className="mb-2">Dirección de entrega</h6>
                  <p className="text-muted mb-3">
                    {order.customer?.calle}{" "}
                    {order.customer?.depto ? `, ${order.customer.depto}` : ""} —{" "}
                    {order.customer?.comuna}, {order.customer?.region}
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
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((it, idx) => {
                          const offer = getOfferForProduct(offersMap, it);
                          const ef = getEffectivePrice(it, offer);
                          const qty =
                            Number(it.cantidad || it.quantity || it.qty || 1) ||
                            1;
                          const key = it.id ?? `${idx}-${it.nombre}`;
                          return (
                            <tr key={key}>
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
                                  `$${Number(it.precio || 0).toLocaleString(
                                    "es-CL"
                                  )}`
                                )}
                              </td>

                              <td className="text-center">
                                {ef && ef.percent ? (
                                  <Badge bg="danger">-{ef.percent}%</Badge>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>

                              <td className="text-center">{qty}</td>

                              <td className="text-end">
                                $
                                {(
                                  Number(ef.price || it.precio || 0) * qty || 0
                                ).toLocaleString("es-CL")}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No hay items en la orden
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  <div className="d-flex justify-content-between align-items-center">
                    <div />
                    <div className="text-end">
                      <div className="fw-bold">Total pagado</div>
                      <div className="h4 text-primary">
                        ${Number(order.total || 0).toLocaleString("es-CL")}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <Button variant="secondary" onClick={handlePrint}>
                      Imprimir boleta en PDF
                    </Button>
                    <Button variant="outline-primary" onClick={handleHome}>
                      Volver al inicio
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-2">
                    No se encontró información de la orden.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => router.push("/productos")}
                    >
                      Ver Productos
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => router.push("/")}
                    >
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
