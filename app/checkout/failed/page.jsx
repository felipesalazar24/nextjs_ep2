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
 * Página de pago fallido
 * Basada en la página de éxito pero con mensaje/estado de fallo.
 * Lee los detalles del último intento guardado en sessionStorage ('lastFailedOrder')
 * y los muestra. Incluye botones para volver a productos o al inicio.
 *
 * Pegar en: app/checkout/failed/page.jsx
 */

export default function CheckoutFailedPage() {
  const router = useRouter();

  // Estado
  const [orderIdParam, setOrderIdParam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

  // Leemos la query 'order' desde window.location.search en el cliente
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

  // Cargamos intento desde sessionStorage (cliente)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem("lastFailedOrder");
        if (raw) {
          const parsed = JSON.parse(raw);
          // Si viene orderIdParam, podrías validar coincidencia aquí
          setAttempt(parsed);
        }
      }
    } catch (err) {
      // ignore parse errors
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
                        attempt.items.map((it, index) => {
                          const offer = getOfferForProduct(offersMap, it);
                          const ef = getEffectivePrice(it, offer);
                          const qty =
                            Number(it.cantidad || it.quantity || it.qty || 1) ||
                            1;
                          const key = it.id ?? `${index}-${it.nombre}`;

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
                                  `$${Number(
                                    it.precio || it.price || 0
                                  ).toLocaleString("es-CL")}`
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
