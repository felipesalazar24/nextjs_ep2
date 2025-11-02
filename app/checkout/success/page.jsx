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
 * Página de compra exitosa
 * Lee los detalles del último pedido guardado en sessionStorage ('lastOrder')
 * y los muestra. También incluye botones para imprimir o volver al home.
 *
 * Pegar en: app/checkout/success/page.jsx
 */

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderIdParam = params ? params.get("order") : null;

  const [order, setOrder] = useState(null);
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastOrder");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!orderIdParam || parsed.id === orderIdParam) {
          setOrder(parsed);
        } else {
          // if not matching, still show stored order
          setOrder(parsed);
        }
      }
    } catch (err) {
      // ignore
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

  const handlePrint = () => {
    window.print();
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
                        order.items.map((it) => (
                          <tr key={it.id}>
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
                              ${Number(it.precio || 0).toLocaleString("es-CL")}
                            </td>
                            <td className="text-center">
                              {Number(it.cantidad || 0)}
                            </td>
                            <td className="text-end">
                              $
                              {(
                                Number(it.precio || 0) *
                                  Number(it.cantidad || 0) || 0
                              ).toLocaleString("es-CL")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted">
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
                    <Button
                      variant="outline-primary"
                      onClick={() => router.push("/")}
                    >
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
