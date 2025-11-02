"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { getProductos } from "../../../lib/products"; // wrapper que expone los productos

// Configuración visual y textos por categoría
const CATEGORIES = [
  {
    key: "mouse",
    title: "Mouse Gaming",
    description: "Precisión y velocidad para gamers profesionales",
    btnVariant: "primary",
  },
  {
    key: "teclado",
    title: "Teclados Mecánicos",
    description: "Respuesta táctil y durabilidad excepcional",
    btnVariant: "success",
  },
  {
    key: "audifono",
    title: "Audífonos Gaming",
    description: "Sonido envolvente y comodidad para largas sesiones",
    btnVariant: "warning",
  },
  {
    key: "monitor",
    title: "Monitores Gaming",
    description: "Alta tasa de refresco y colores vibrantes",
    btnVariant: "dark",
  },
];

/**
 * NOTA:
 * - Se añadió la lógica local de ofertas (no se crean archivos nuevos).
 * - loadOffers obtiene /api/offers y fallback a localStorage.createdOffers.
 * - getOfferForProduct / getEffectivePrice calculan precio efectivo y %.
 * - safeSrc ha sido ajustada para NO convertir rutas relativas a URLs absolutas,
 *   evitando así mismatches de hidratación SSR/client.
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
  const pid = String(product.id ?? product._id ?? product.sku ?? "").trim();
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

/**
 * safeSrc (IMPORTANT)
 * - Devuelve exactamente la misma cadena tanto en servidor como en cliente.
 * - No convierte rutas relativas a URL absolutas con `window` o `new URL`,
 *   evitando así mismatches de hidratación.
 * - Acepta data: y http(s) absoluto; en otros casos devuelve la ruta tal cual.
 */
const safeSrc = (s) => {
  if (!s) return "/assets/productos/placeholder.png";
  try {
    const str = String(s);
    if (str.startsWith("data:") || /^https?:\/\//i.test(str)) return str;
    // Return the path as-is (relative paths stay relative)
    return str;
  } catch {
    return "/assets/productos/placeholder.png";
  }
};

export default function CategoriaPage() {
  const params = useParams();
  const tipoCategoria = params?.tipo ?? "";
  const productos = getProductos();
  const { addToCart } = useCart();

  // Normalizar: el parámetro de ruta puede venir en minúsculas
  const tipoLower = String(tipoCategoria).toLowerCase();

  // Filtrar productos por categoría (ignora mayúsculas / minúsculas)
  const productosCategoria = productos.filter(
    (producto) =>
      String(producto.atributo || producto.categoria || "").toLowerCase() ===
      tipoLower
  );

  const getCategoryVariant = (atributo) => {
    const variants = {
      mouse: "primary",
      teclado: "success",
      audifono: "warning",
      monitor: "info",
    };
    return variants[atributo] || "secondary";
  };

  // Preparar datos para los "cards" de navegación de categorías:
  // - contar productos por categoría
  // - elegir una imagen representativa (primer producto de la categoría)
  const categoriaStats = useMemo(() => {
    const map = {};
    for (const cat of CATEGORIES) {
      map[cat.key] = { count: 0, image: null, meta: cat };
    }
    for (const p of productos) {
      const key = String(p.atributo || p.categoria || "").toLowerCase();
      if (!map[key]) continue;
      map[key].count += 1;
      if (!map[key].image && p.imagen) map[key].image = p.imagen;
    }
    return map;
  }, [productos]);

  // Mostrar cards de categorías EXCLUYENDO la categoría activa
  const categoriasParaMostrar = CATEGORIES.filter((c) => c.key !== tipoLower);

  // Offers state
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

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

  const handleAddToCart = (product, price) => {
    try {
      if (addToCart && typeof addToCart === "function") {
        addToCart({ ...product, precio: Number(price) }, 1);
      } else {
        window.dispatchEvent(
          new CustomEvent("add-to-cart", { detail: { product, price, qty: 1 } })
        );
      }
      alert(`¡${product.nombre} agregado al carrito!`);
    } catch (err) {
      console.warn("addToCart error", err);
    }
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/categoria">Categorías</Breadcrumb.Item>
        <Breadcrumb.Item active>{tipoCategoria}</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 text-capitalize">{tipoCategoria}</h2>

      {offersLoading && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {productosCategoria.length > 0 ? (
        <Row className="g-4">
          {productosCategoria.map((producto) => {
            const offer = getOfferForProduct(offersMap, producto);
            const ef = getEffectivePrice(producto, offer);
            return (
              <Col key={producto.id} md={4} lg={3}>
                <Card className="h-100 shadow-sm">
                  <div
                    style={{
                      position: "relative",
                      padding: 12,
                      textAlign: "center",
                    }}
                  >
                    {ef && ef.percent ? (
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
                        -{ef.percent}%
                      </Badge>
                    ) : null}
                    <Card.Img
                      variant="top"
                      src={safeSrc(producto.imagen)}
                      style={{
                        height: 160,
                        objectFit: "contain",
                        padding: 12,
                        background: "#fff",
                      }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen";
                      }}
                    />
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mb-0">{producto.nombre}</h5>
                      <Badge
                        bg={getCategoryVariant(
                          String(
                            producto.atributo || producto.categoria || ""
                          ).toLowerCase()
                        )}
                      >
                        {producto.atributo || producto.categoria}
                      </Badge>
                    </div>

                    {/* Precio: mostrar tachado + oferta si aplica, mantener formato original si no */}
                    <div className="text-primary fw-bold mb-3">
                      {ef && ef.oldPrice ? (
                        <div>
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#777",
                              marginRight: 8,
                            }}
                          >
                            ${Number(ef.oldPrice).toLocaleString("es-CL")}
                          </span>
                          <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                            ${Number(ef.price).toLocaleString("es-CL")}
                          </span>
                        </div>
                      ) : (
                        <div style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(producto.precio).toLocaleString("es-CL")}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto d-grid gap-2">
                      <Link
                        href={`/productos/${producto.id}`}
                        className="btn btn-outline-dark btn-sm"
                      >
                        Ver Detalles
                      </Link>

                      <Button
                        variant="primary"
                        className="btn-sm"
                        onClick={() => handleAddToCart(producto, ef.price)}
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
      ) : (
        <Row>
          <Col className="text-center">
            <div className="py-5">
              <h3 className="h4 text-muted">
                No hay productos en esta categoría
              </h3>
              <Link href="/productos" className="btn btn-primary mt-3">
                Ver Todos
              </Link>
            </div>
          </Col>
        </Row>
      )}

      {/* ---------------------------
          Panel de categorías visual (cards) con imagen, badge y botón "Explorar Categoría"
          SE EXCLUYE la categoría activa (no aparece entre los cards)
          --------------------------- */}
      <div className="mt-5">
        <h4 className="mb-3">Explorar categorías</h4>
        <Row className="g-4">
          {categoriasParaMostrar.map((cat) => {
            const stat = categoriaStats[cat.key] || { count: 0, image: null };
            const imgSrc =
              stat.image ||
              `/assets/category/${cat.key}.png` ||
              "https://via.placeholder.com/400x300?text=Categoria";
            const btnVariant = cat.btnVariant || "secondary";

            return (
              <Col key={cat.key} md={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <div style={{ position: "relative" }}>
                    <Card.Img
                      variant="top"
                      src={imgSrc}
                      style={{
                        height: 240,
                        objectFit: "contain",
                        padding: 20,
                        background: "#fff",
                      }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300/ffffff/cccccc?text=Imagen+Categoría";
                      }}
                    />
                    <Badge
                      bg="primary"
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 5,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                      }}
                    >
                      {stat.count} productos
                    </Badge>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <h5 className="mb-1 text-center">{cat.title}</h5>
                    <p className="text-muted text-center small mb-3">
                      {cat.description}
                    </p>

                    <div className="mt-auto d-grid">
                      <Link
                        href={`/categoria/${String(cat.key).toLowerCase()}`}
                        className={`btn btn-${btnVariant}`}
                      >
                        Explorar Categoría
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </Container>
  );
}
