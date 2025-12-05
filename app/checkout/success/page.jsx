"use client";

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Table, Button, Spinner } from "react-bootstrap";
import { useRouter } from "next/navigation";
import * as assetsClient from "../../lib/assetsClient";

/**
 * Página de éxito del checkout (mejorada)
 * - Lee sessionStorage.lastOrder y muestra resumen del pedido.
 * - Para cada línea de detalle intenta obtener la imagen principal:
 *    1) usa detalle.imagen / detalle.image si existe
 *    2) si assetsClient.getPrimaryImage está disponible, la usa con { id: productoId }
 *    3) fallback a placeholder
 * - Hace sólo 1 petición por item (getPrimaryImage) y cachea resultados en memory state.
 * - Evita mostrar un número (productoId) como nombre: si el campo nombre es solo dígitos,
 *   lo reemplaza por un texto genérico 'Producto' o por otro campo textual disponible.
 */

const PLACEHOLDER = "/assets/productos/placeholder.png";

function getDisplayNameFromDetail(d) {
  // Prefer textual candidates that are not purely numeric
  const candidates = [d.nombre, d.productName, d.title, d.productoNombre, d.nombreProducto];
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c).trim();
    if (s === "") continue;
    // skip if it's only a number (e.g. "6")
    if (/^\d+$/.test(s)) continue;
    return s;
  }
  // If none textual found, try a friendly fallback using product id (but not showing raw number alone)
  const pid = d.productoId ?? d.productId ?? d.id ?? null;
  if (pid) return `Producto #${pid}`;
  return "Producto";
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [imagesMap, setImagesMap] = useState({}); // key -> image url

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // 1) intentar sessionStorage.lastOrder
        let parsed = null;
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("lastOrder");
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = null;
            }
          }

          // 2) si no hay session, intentar query param ?order=<id> para fetch /api/ventas/:id
          if (!parsed) {
            const params = new URLSearchParams(window.location.search);
            const orderId = params.get("order");
            if (orderId) {
              try {
                const res = await fetch(`/api/ventas/${encodeURIComponent(orderId)}`).catch(() => null);
                if (res && res.ok) {
                  const data = await res.json().catch(() => null);
                  parsed = data?.venta ?? data ?? null;
                }
              } catch (err) {
                // ignore
              }
            }
          }
        }

        if (!mounted) return;

        if (!parsed) {
          setError("No se encontró información del pedido. Si completaste el pago, revisa tu correo o contacta soporte.");
          setLoading(false);
          return;
        }

        setOrder(parsed);

        // Resolve images for detalles (one request per item, prefer detalle.imagen then assetsClient)
        const detalles = Array.isArray(parsed.detalles) ? parsed.detalles : parsed.items ?? parsed.lineItems ?? [];
        if (!Array.isArray(detalles) || detalles.length === 0) {
          setLoading(false);
          return;
        }

        const nextMap = {};
        await Promise.all(
          detalles.map(async (d, idx) => {
            try {
              // Prefer explicit image fields
              const explicit = d.imagen ?? d.image ?? d.img ?? d.thumbnail ?? null;
              if (explicit && typeof explicit === "string" && explicit.trim()) {
                nextMap[idx] = explicit;
                return;
              }

              // If assetsClient is available and exposes getPrimaryImage, use it (single request per item)
              if (assetsClient && typeof assetsClient.getPrimaryImage === "function") {
                const name = d.nombre ?? d.productName ?? d.title ?? String(d.productoId ?? d.productId ?? "");
                try {
                  const url = await assetsClient.getPrimaryImage(name, d.categoria ?? d.category ?? "", { id: d.productoId ?? d.productId ?? undefined });
                  if (url) {
                    nextMap[idx] = url;
                    return;
                  }
                } catch (err) {
                  // fallthrough to placeholder
                }
              }

              // Last resort: placeholder
              nextMap[idx] = PLACEHOLDER;
            } catch (err) {
              nextMap[idx] = PLACEHOLDER;
            }
          })
        );

        if (!mounted) return;
        setImagesMap(nextMap);
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError("Error al leer los datos del pedido.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <h4>Gracias por tu compra</h4>
                <p className="text-muted">
                  No encontramos los datos del pedido en esta sesión. Si completaste el pago,
                  revisa el correo que indicaste o contacta soporte.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Button variant="primary" onClick={() => router.push("/productos")}>Ver productos</Button>
                  <Button variant="outline-secondary" onClick={() => router.push("/contacto")}>Contactar soporte</Button>
                </div>
                {error && <div className="mt-3 text-danger small">{error}</div>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  const orderId = order.id ?? order.orderId ?? order.pedidoId ?? order._id ?? "";
  const direccion = order.direccion ?? order.meta?.direccion ?? order.address ?? "";
  const meta = order.meta ?? {};
  const detalles = Array.isArray(order.detalles) ? order.detalles : order.items ?? order.lineItems ?? [];

  const total = order.total ?? detalles.reduce((s, d) => s + Number(d.subtotal ?? d.precioUnitario ?? d.price ?? 0), 0);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-2">¡Pedido recibido!</h3>
              <p className="text-muted">
                Gracias por tu compra. Se ha generado el pedido <strong>{orderId}</strong>.
                Revisa tu correo para más detalles.
              </p>

              <Row className="mt-4">
                <Col md={6}>
                  <h6>Datos del pedido</h6>
                  <div className="small text-muted">Total</div>
                  <div className="h5 mb-2">${Number(total || 0).toLocaleString("es-CL")}</div>

                  <div className="small text-muted">Dirección</div>
                  <div className="mb-2">{direccion || meta?.direccion || "-"}</div>

                  <div className="small text-muted">Contacto</div>
                  <div>{meta?.nombre || meta?.email || "-"}</div>
                  <div className="small text-muted">{meta?.telefono || ""}</div>
                </Col>

                <Col md={6}>
                  <h6>Resumen de artículos</h6>
                  {detalles && detalles.length > 0 ? (
                    <Table size="sm" bordered hover className="mt-2">
                      <thead>
                        <tr>
                          <th style={{ width: 320 }}>Producto</th>
                          <th style={{ width: 80 }}>Cant.</th>
                          <th style={{ width: 120 }} className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((d, i) => {
                          const nombre = getDisplayNameFromDetail(d);
                          const cantidad = Number(d.cantidad ?? d.qty ?? d.quantity ?? 1) || 1;
                          const subtotal = Number(d.subtotal ?? d.precioUnitario ?? d.price ?? 0) || 0;
                          const imgSrc = imagesMap[i] || PLACEHOLDER;
                          return (
                            <tr key={i}>
                              <td style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <img
                                  src={imgSrc}
                                  alt={String(nombre)}
                                  style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 4 }}
                                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; e.currentTarget.onerror = null; }}
                                />
                                <div style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>
                              </td>
                              <td className="text-center">{cantidad}</td>
                              <td className="text-end">${Number(subtotal).toLocaleString("es-CL")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-muted small">No hay detalles disponibles.</div>
                  )}
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-3">
                <Button variant="outline-primary" className="me-2" onClick={() => router.push("/productos")}>Seguir comprando</Button>
                <Button variant="primary" onClick={() => router.push("/contacto")}>Contactar soporte</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}