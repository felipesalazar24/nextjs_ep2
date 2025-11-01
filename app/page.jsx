"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import Link from "next/link";

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

export default function HomePage() {
  const [productos, setProductos] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Traer productos y ventas en paralelo.
        // Para evitar cache, añadimos ts en la consulta a /api/sales.
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

        if (!mounted) return;

        setProductos(Array.isArray(prodData) ? prodData : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error");
        setProductos([]);
        setSales([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    // opcional: reintentar cada X segundos para actualizar automáticamente
    // const interval = setInterval(fetchData, 15000);
    // return () => { mounted = false; clearInterval(interval); };
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

  // Preparar filas (2 filas de 4)
  const primeraFila = destacados.slice(0, 4);
  const segundaFila = destacados.slice(4, 8);

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

      {/* Productos Destacados */}
      <Container className="py-5">
        <Row className="text-center mb-5">
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
                <ProductImage
                  src={producto.imagen}
                  alt={producto.nombre}
                  style={{
                    height: "150px",
                    objectFit: "contain",
                    padding: "15px",
                  }}
                />
                <Card.Body className="text-center">
                  <Card.Title className="h6">{producto.nombre}</Card.Title>
                  <Card.Text className="text-primary fw-bold">
                    $
                    {typeof producto.precio === "number"
                      ? producto.precio.toLocaleString("es-CL")
                      : producto.precio}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Producto
                    </Link>
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Agregar al Carrito
                    </Link>
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
                <ProductImage
                  src={producto.imagen}
                  alt={producto.nombre}
                  style={{
                    height: "150px",
                    objectFit: "contain",
                    padding: "15px",
                  }}
                />
                <Card.Body className="text-center">
                  <Card.Title className="h6">{producto.nombre}</Card.Title>
                  <Card.Text className="text-primary fw-bold">
                    $
                    {typeof producto.precio === "number"
                      ? producto.precio.toLocaleString("es-CL")
                      : producto.precio}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Producto
                    </Link>
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Agregar al Carrito
                    </Link>
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
