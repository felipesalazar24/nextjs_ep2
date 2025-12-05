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
 * Página de compra exitosa
 * - Si existe query param ?order=<id> intenta obtener pedido desde /api/ventas/:id
 * - Si no, usa sessionStorage.lastOrder como fallback (comportamiento previo)
 * - Normaliza la estructura del pedido para mostrarlo independientemente de la forma del backend
 */

function normalizeOrder(raw) {
  // raw puede venir con distintas formas; intentamos normalizar a:
  // { id, customer: { nombre, email, telefono, calle, depto, comuna, region }, items: [{ id, nombre, imagen, precio, cantidad, subtotal }], total, fecha, direccion }
  if (!raw) return null;
  // Si ya tiene items
  if (Array.isArray(raw.items) && raw.items.length >= 0) {
    return {
      id: raw.id ?? raw.codigo ?? raw.orderId,
      customer: raw.customer ?? raw.cliente ?? raw.usuario ?? {},
      items: raw.items.map((it, idx) => ({
        id: it.id ?? it.productoId ?? idx,
        nombre: it.nombre ?? it.title ?? `Producto ${it.id ?? it.productoId ?? idx}`,
        imagen: it.imagen ?? it.image ?? null,
        precio: Number(it.precio ?? it.precio_unitario ?? it.precioUnitario ?? 0),
        cantidad: Number(it.cantidad ?? it.quantity ?? 1),
        subtotal: Number(it.subtotal ?? (it.precio ? it.precio * (it.cantidad || 1) : (it.precio_unitario || it.precioUnitario || 0) * (it.cantidad || 1))),
      })),
      total: Number(raw.total ?? raw.amount ?? 0),
      fecha: raw.fecha ?? raw.date ?? null,
      direccion: raw.direccion ?? null,
    };
  }

  // Si tiene 'detalles' (estructura del backend Java)
  if (Array.isArray(raw.detalles)) {
    const items = raw.detalles.map((d, idx) => ({
      id: d.productoId ?? idx,
      nombre: d.nombre ?? `Producto ${d.productoId ?? idx}`,
      imagen: d.imagen ?? null,
      precio: Number(d.precioUnitario ?? d.precio_unitario ?? 0),
      cantidad: Number(d.cantidad ?? 1),
      subtotal: Number(d.subtotal ?? (d.precioUnitario || d.precio_unitario || 0) * (d.cantidad || 1)),
    }));
    return {
      id: raw.id,
      customer: raw.cliente ?? raw.customer ?? {},
      items,
      total: Number(raw.total ?? 0),
      fecha: raw.fecha ?? null,
      direccion: raw.direccion ?? null,
    };
  }

  // fallback: return raw minimally wrapped
  return {
    id: raw.id ?? raw.orderId,
    customer: raw.customer ?? {},
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total ?? 0),
    fecha: raw.fecha ?? null,
    direccion: raw.direccion ?? null,
  };
}

export default function CheckoutSuccessPage() {
  const router = useRouter();

  const [orderIdParam, setOrderIdParam] = useState(null);
  const [order, setOrder] = useState(null);
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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

  // Si viene orderIdParam, solicitamos al backend el pedido vía la nueva API /api/ventas/:id
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!orderIdParam) return;
      setLoading(true);
      setFetchError(null);
      try {
        const base = process?.env?.NEXT_PUBLIC_BASE_URL ?? "";
        const res = await fetch(`${base}/api/ventas/${encodeURIComponent(orderIdParam)}`, {
          headers: { "Accept": "application/json" },
        });
        if (!mounted) return;
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          setFetchError(`Error ${res.status}: ${txt}`);
          setOrder(null);
          return;
        }
        const data = await res.json().catch(() => null);
        const normalized = normalizeOrder(data);
        setOrder(normalized);
      } catch (err) {
        console.warn("Error fetching order by id:", err);
        if (!mounted) return;
        setFetchError("Error al obtener información del pedido");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [orderIdParam]);

  // Cargar el último pedido desde sessionStorage (cliente) si no vino por query param
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem("lastOrder");
        if (raw) {
          const parsed = JSON.parse(raw);
          const normalized = normalizeOrder(parsed);
          // Solo setear si no hay order traído por query param
          setOrder((prev) => prev ?? normalized);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [orderIdParam]);

  // Cargar ofertas (cliente) - mantiene comportamiento previo
  useEffect(() => {
    let mounted = true;
    (async () => {
      setOffersLoading(true);
      try {
        // loadOffers puede existir en otras utilidades del repo; si no, simplemente setea vacío
        if (typeof window !== "undefined" && typeof window.loadOffers === "function") {
          const { offersMap: om } = await window.loadOffers();
          if (!mounted) return;
          setOffersMap(om);
        } else {
          // fallback: vacío
          setOffersMap(new Map());
        }
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

              {loading ? (
                <div className="text-center py-4">Cargando información del pedido...</div>
              ) : fetchError ? (
                <div className="text-center py-4 text-danger">{fetchError}</div>
              ) : order ? (
                <>
                  <h6 className="mb-2">Información del cliente</h6>
                  <Row className="mb-3">
                    <Col md={4}>
                      <strong>Nombre:</strong> {order.customer?.nombre ?? order.customer?.name ?? "-"}
                    </Col>
                    <Col md={4}>
                      <strong>Correo:</strong> {order.customer?.email ?? "-"}
                    </Col>
                    <Col md={4}>
                      <strong>Teléfono:</strong> {order.customer?.telefono ?? "-"}
                    </Col>
                  </Row>

                  <h6 className="mb-2">Dirección de entrega</h6>
                  <p className="text-muted mb-3">
                    {order.direccion ?? order.customer?.calle ?? "-"}{" "}
                    {order.customer?.depto ? `, ${order.customer.depto}` : ""} —{" "}
                    {order.customer?.comuna ?? order.customer?.city ?? "-"}, {order.customer?.region ?? "-"}
                  </p>

                  <h6 className="mb-2">Productos</h6>
                  <Table responsive bordered size="sm" className="mb-3">
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th className="text-end">Precio</th>
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
                                Number(it.subtotal ?? (it.precio || 0) * (it.cantidad || 1)) || 0
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