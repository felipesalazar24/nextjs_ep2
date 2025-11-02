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

export default function CheckoutFailedPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderIdParam = params ? params.get("order") : null;

  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastFailedOrder");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!orderIdParam || parsed.id === orderIdParam) {
          setAttempt(parsed);
        } else {
          // si no coincide, aún así mostrar el stored attempt
          setAttempt(parsed);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [orderIdParam]);

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
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(attempt.items) &&
                      attempt.items.length > 0 ? (
                        attempt.items.map((it) => (
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
