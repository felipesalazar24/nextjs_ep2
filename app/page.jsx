"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
} from "react-bootstrap";
import Link from "next/link";
import { useCart } from "./context/CartContext";

// Componente para imagen con placeholder en caso de error
const ProductImage = (props) => {
  const [imgSrc, setImgSrc] = useState(props.src);

  const handleError = () => {
    setImgSrc(
      "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible"
    );
  };

  useEffect(() => {
    setImgSrc(props.src);
  }, [props.src]);

  return (
    <Card.Img
      variant="top"
      src={imgSrc}
      alt={props.alt}
      style={props.style}
      onError={handleError}
    />
  );
};

/**
 * Helper de ofertas (inline, sin crear archivos nuevos)
 * - loadOffers() => intenta /api/offers y fallback a localStorage.createdOffers
 * - getOfferForProduct(offersMap, product)
 * - getEffectivePrice(product, offer)
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

  // Merge: created (admin/local) overrides server
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

export default function HomePage() {
  const [productos, setProductos] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ofertas
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersList, setOffersList] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setOffersLoading(true);

      try {
        // Traer productos y ventas en paralelo.
        const [prodRes, salesRes] = await Promise.all([
          fetch("/api/productos"),
          fetch(`/api/sales?ts=${Date.now()}`),
        ]);

        if (!prodRes.ok) throw new Error("Error al cargar productos");

        const prodData = await prodRes.json();

        let salesData = [];
        if (salesRes && salesRes.ok) {
          salesData = await salesRes.json();
        } else {
          salesData = [];
        }

        // Cargar ofertas (server + localStorage fallback)
        const { offersMap: om } = await loadOffers();

        if (!mounted) return;

        setProductos(Array.isArray(prodData) ? prodData : []);
        setSales(Array.isArray(salesData) ? salesData : []);
        setOffersMap(om);

        // construir lista de ofertas asociadas a productos (filtrar solo con newPrice válido)
        const arr = [];
        for (const [pid, o] of om.entries()) {
          const prod = (prodData || []).find(
            (p) => String(p.id ?? p._id ?? p.sku) === pid
          );
          if (!prod) continue;
          const oldPrice = Number(o.oldPrice ?? prod.precio ?? 0);
          const newPrice = Number(o.newPrice ?? 0);
          const percent =
            Number(o.percent) ||
            (oldPrice && newPrice
              ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
              : 0);
          if (!newPrice || newPrice <= 0) continue;
          arr.push({
            productId: pid,
            product: prod,
            oldPrice,
            newPrice,
            percent,
            source: o.source || "server",
            raw: o,
          });
        }
        // sort by percent desc
        arr.sort(
          (a, b) =>
            (b.percent || 0) - (a.percent || 0) ||
            (a.newPrice || 0) - (b.newPrice || 0)
        );
        setOffersList(arr);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error");
        setProductos([]);
        setSales([]);
        setOffersMap(new Map());
        setOffersList([]);
      } finally {
        if (mounted) {
          setLoading(false);
          setOffersLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4 text-center">
        <h2>Error al cargar productos</h2>
        <p className="text-muted">{error}</p>
      </Container>
    );
  }

  // Construir mapa de ventas (cantidad vendida por producto)
  const soldMap = {};
  for (const sale of Array.isArray(sales) ? sales : []) {
    if (!sale || !Array.isArray(sale.items)) continue;
    for (const it of sale.items) {
      const pid = it.id ?? it.productId ?? it._id ?? it.sku ?? null;
      const key = String(pid ?? it.nombre ?? JSON.stringify(it));
      const qty = Number(it.cantidad ?? it.qty ?? it.quantity ?? 1) || 0;
      soldMap[key] = (soldMap[key] || 0) + qty;
    }
  }

  // Añadir totalSold a cada producto de forma robusta
  const productsWithSales = (Array.isArray(productos) ? productos : []).map(
    (p) => {
      const key = String(p.id ?? p._id ?? p.sku ?? p.nombre ?? "");
      return { ...p, totalSold: soldMap[key] || 0 };
    }
  );

  // Ordenar por totalSold y tomar top 8
  const top = productsWithSales
    .slice()
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 8);

  // Si no hay ventas registradas usamos los primeros 8 productos como fallback
  const hasSales = top.some((p) => (p.totalSold || 0) > 0);
  const destacados = hasSales ? top : (productos || []).slice(0, 8);

  // Merge offers into destacados so offers appear inline among products
  const destacadosWithOffers = destacados.map((p) => {
    const offer = getOfferForProduct(offersMap, p);
    const ef = getEffectivePrice(p, offer);
    return { ...p, offer, ef };
  });

  // Preparar filas (2 filas de 4) using merged list
  const primeraFila = destacadosWithOffers.slice(0, 4);
  const segundaFila = destacadosWithOffers.slice(4, 8);

  const safeSrc = (s) => {
    if (!s)
      return "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible";
    try {
      const str = String(s);
      if (str.startsWith("data:")) return str;
      if (typeof window !== "undefined" && !/^https?:\/\//i.test(str))
        return new URL(str, window.location.origin).href;
      return str;
    } catch {
      return String(s);
    }
  };

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
    <>
      {/* Hero Section */}
      <section
        className="hero-section py-5"
        style={{ background: "#0b1226", color: "#fff" }}
      >
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Eleva tu Experiencia Gaming
              </h1>
              <p className="lead mb-4">
                Descubre los mejores productos gaming con tecnología de punta.
                Desde mouse de alta precisión hasta teclados mecánicos y
                audífonos inmersivos.
              </p>
              <div className="d-flex gap-3">
                <Link href="/productos" className="btn btn-light btn-lg">
                  Ver Productos
                </Link>
                <Link href="/ofertas" className="btn btn-outline-light btn-lg">
                  Ofertas Especiales
                </Link>
              </div>
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <div className="bg-white rounded p-4 shadow">
                  <h5 className="text-dark">🎮 Productos Destacados</h5>
                  <p className="text-muted">Los más vendidos de la tienda</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Ofertas especiales (integradas entre los destacados) */}
      <Container className="py-5">
        <Row className="text-center mb-3">
          <Col>
            <h2 className="fw-bold">Productos Destacados</h2>
            <p className="text-muted">Los favoritos de nuestros clientes</p>
          </Col>
        </Row>

        {/* Primera fila (4 productos) */}
        <Row className="g-4 mb-4">
          {primeraFila.map((producto) => (
            <Col key={String(producto.id ?? producto.nombre)} sm={6} md={3}>
              <Card className="h-100 shadow-sm border-0">
                <div
                  style={{
                    position: "relative",
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  {producto.ef && producto.ef.percent ? (
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
                      -{producto.ef.percent}%
                    </Badge>
                  ) : null}
                  <ProductImage
                    src={safeSrc(producto.imagen)}
                    alt={producto.nombre}
                    style={{
                      height: "150px",
                      objectFit: "contain",
                      padding: "15px",
                    }}
                  />
                </div>

                <Card.Body className="text-center">
                  <Card.Title className="h6">{producto.nombre}</Card.Title>

                  <Card.Text className="text-primary fw-bold">
                    {producto.ef && producto.ef.oldPrice ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#777",
                            marginRight: 8,
                          }}
                        >
                          $
                          {Number(producto.ef.oldPrice).toLocaleString("es-CL")}
                        </span>
                        <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(producto.ef.price).toLocaleString("es-CL")}
                        </span>
                      </>
                    ) : (
                      <>
                        $
                        {typeof producto.precio === "number"
                          ? producto.precio.toLocaleString("es-CL")
                          : producto.precio}
                      </>
                    )}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Producto
                    </Link>
                    <Button
                      variant="primary"
                      className="btn-sm"
                      onClick={() =>
                        handleAddToCart(
                          producto,
                          producto.ef && producto.ef.price
                            ? producto.ef.price
                            : producto.precio
                        )
                      }
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Vendidos: {producto.totalSold ?? 0}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Segunda fila (otra fila debajo con 4 productos) */}
        <Row className="g-4">
          {segundaFila.map((producto) => (
            <Col key={String(producto.id ?? producto.nombre)} sm={6} md={3}>
              <Card className="h-100 shadow-sm border-0">
                <div
                  style={{
                    position: "relative",
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  {producto.ef && producto.ef.percent ? (
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
                      -{producto.ef.percent}%
                    </Badge>
                  ) : null}
                  <ProductImage
                    src={safeSrc(producto.imagen)}
                    alt={producto.nombre}
                    style={{
                      height: "150px",
                      objectFit: "contain",
                      padding: "15px",
                    }}
                  />
                </div>

                <Card.Body className="text-center">
                  <Card.Title className="h6">{producto.nombre}</Card.Title>

                  <Card.Text className="text-primary fw-bold">
                    {producto.ef && producto.ef.oldPrice ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#777",
                            marginRight: 8,
                          }}
                        >
                          $
                          {Number(producto.ef.oldPrice).toLocaleString("es-CL")}
                        </span>
                        <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(producto.ef.price).toLocaleString("es-CL")}
                        </span>
                      </>
                    ) : (
                      <>
                        $
                        {typeof producto.precio === "number"
                          ? producto.precio.toLocaleString("es-CL")
                          : producto.precio}
                      </>
                    )}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Producto
                    </Link>
                    <Button
                      variant="primary"
                      className="btn-sm"
                      onClick={() =>
                        handleAddToCart(
                          producto,
                          producto.ef && producto.ef.price
                            ? producto.ef.price
                            : producto.precio
                        )
                      }
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Vendidos: {producto.totalSold ?? 0}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
