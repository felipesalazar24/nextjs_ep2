"use client";

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner } from "react-bootstrap";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/**
 * Página de Ofertas
 * - Carga /api/productos (misma API que usas en Home).
 * - Detecta automáticamente productos en oferta buscando campos comunes:
 *   - precio_oferta, precioOferta, ofertaPrecio, salePrice
 *   - descuento, descuentoPercent, discount
 *   También considera productos que tengan precio original y precio de oferta (precio && precio_oferta).
 * - Muestra grid de productos en oferta con porcentaje calculado, precio anterior tachado y precio nuevo.
 * - Botón "Agregar al carrito" respeta el contexto useCart y obliga a login si corresponde al usar useAuth.
 *
 * Pega este archivo en: app/ofertas/page.jsx
 */

const POSSIBLE_NEW_PRICE_KEYS = ["precio_oferta", "precioOferta", "ofertaPrecio", "salePrice", "priceOffer"];
const POSSIBLE_DISCOUNT_KEYS = ["descuento", "descuentoPercent", "discount", "discountPercent"];
const POSSIBLE_OLD_PRICE_KEYS = ["precio_original", "precioOriginal", "oldPrice", "priceOld"];

function getDiscountInfo(producto) {
  // intenta extraer newPrice, oldPrice y % de descuento
  let newPrice = null;
  let oldPrice = null;
  let percent = null;

  // buscar new price en keys conocidas
  for (const k of POSSIBLE_NEW_PRICE_KEYS) {
    if (producto[k] != null && producto[k] !== "") {
      newPrice = Number(producto[k]);
      break;
    }
  }

  // buscar precio viejo u original
  for (const k of POSSIBLE_OLD_PRICE_KEYS) {
    if (producto[k] != null && producto[k] !== "") {
      oldPrice = Number(producto[k]);
      break;
    }
  }

  // si no encontramos oldPrice pero hay precio normal y newPrice, usar precio normal como oldPrice
  if (!oldPrice && producto.precio != null && newPrice) {
    oldPrice = Number(producto.precio);
  }

  // si no hay newPrice pero existe un campo de descuento porcentual y precio, calcular newPrice
  for (const k of POSSIBLE_DISCOUNT_KEYS) {
    if ((producto[k] != null && producto[k] !== "") && producto.precio != null) {
      const disc = Number(producto[k]) || 0;
      percent = disc;
      newPrice = Number(producto.precio) * (1 - disc / 100);
      oldPrice = Number(producto.precio);
      break;
    }
  }

  // si tenemos oldPrice y newPrice, calcular percent
  if (oldPrice && newPrice && !percent) {
    percent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  }

  // si detectamos newPrice smaller than precio, and precio exists, set oldPrice accordingly
  if (!oldPrice && producto.precio != null && newPrice && Number(producto.precio) > newPrice) {
    oldPrice = Number(producto.precio);
    if (!percent) percent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  }

  // Considerar también si producto tiene campo booleano "oferta" o "onSale"
  const onSaleFlag = producto.oferta || producto.onSale || producto.isOnSale || producto.sale;

  const hasOffer = Boolean(
    (newPrice != null && oldPrice != null && oldPrice > newPrice) ||
      (percent != null && percent > 0) ||
      onSaleFlag
  );

  // Normalizar precios a integers (o 2 decimals)
  if (newPrice != null) newPrice = Number(Number(newPrice).toFixed(0));
  if (oldPrice != null) oldPrice = Number(Number(oldPrice).toFixed(0));

  return { hasOffer, oldPrice, newPrice, percent: percent || 0 };
}

export default function OfertasPage() {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [productos, setProductos] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/productos");
        if (!res.ok) throw new Error("Error al cargar productos");
        const data = await res.json();
        if (!mounted) return;
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error al cargar productos");
        setProductos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // calcular ofertas a partir de productos cargados
    const arr = (productos || [])
      .map((p) => {
        const info = getDiscountInfo(p);
        return { producto: p, ...info };
      })
      .filter((x) => x.hasOffer)
      // ordenar por % descuento descendente, luego por nuevo precio ascendente
      .sort((a, b) => {
        const byPercent = (b.percent || 0) - (a.percent || 0);
        if (byPercent !== 0) return byPercent;
        return (a.newPrice || 0) - (b.newPrice || 0);
      });

    setOfertas(arr);
  }, [productos]);

  const handleAddToCart = (p) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    addToCart(p, 1);
    alert(`${p.nombre} agregado al carrito`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <h4>Error</h4>
        <p className="text-muted">{error}</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold">Ofertas</h2>
        <p className="text-muted">Aprovecha los mejores descuentos disponibles</p>
      </div>

      {ofertas.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="mb-3">No hay ofertas activas por el momento</h5>
          <p className="text-muted">Revisa más tarde o visita nuestra sección de productos.</p>
          <Link href="/productos" className="btn btn-primary">Ver Productos</Link>
        </div>
      ) : (
        <Row className="g-4">
          {ofertas.map(({ producto, oldPrice, newPrice, percent }) => (
            <Col key={producto.id ?? producto.nombre} sm={6} md={4} lg={3}>
              <Card className="h-100 shadow-sm">
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, background: "#fff" }}>
                  <img
                    src={producto.imagen || "/assets/productos/placeholder.png"}
                    alt={producto.nombre}
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                    onError={(e) => (e.target.src = "/assets/productos/placeholder.png")}
                  />
                  <Badge bg="danger" style={{ position: "absolute", left: 12, top: 12 }}>{percent > 0 ? `-${percent}%` : "Oferta"}</Badge>
                </div>

                <Card.Body className="d-flex flex-column">
                  <h6 className="mb-1">{producto.nombre}</h6>
                  <div className="mb-2">
                    {oldPrice ? (
                      <div style={{ fontSize: 14 }}>
                        <span style={{ textDecoration: "line-through", color: "#999", marginRight: 8 }}>
                          ${Number(oldPrice).toLocaleString("es-CL")}
                        </span>
                        <span className="text-primary fw-bold">
                          ${Number(newPrice ?? producto.precio ?? 0).toLocaleString("es-CL")}
                        </span>
                      </div>
                    ) : (
                      <div className="text-primary fw-bold">
                        ${Number(newPrice ?? producto.precio ?? 0).toLocaleString("es-CL")}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto d-grid gap-2">
                    <Link href={`/productos/${producto.id}`} className="btn btn-outline-dark btn-sm">
                      Ver Detalles
                    </Link>
                    <Button variant="success" size="sm" onClick={() => handleAddToCart(producto)}>
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