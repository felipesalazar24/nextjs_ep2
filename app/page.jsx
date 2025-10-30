"use client";

import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/productos")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar productos");
        return res.json();
      })
      .then((data) => {
        if (mounted) setProductos(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError(err.message || "Error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
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

  // Tomamos hasta 8 productos destacados
  const destacados = productos.slice(0, 8);
  const primeraFila = destacados.slice(0, 4);
  const segundaFila = destacados.slice(4, 8);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section py-5">
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
            <Col key={producto.id} sm={6} md={3}>
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
                  <Link
                    href={`/productos/${producto.id}`}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Ver Producto
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Segunda fila (otra fila debajo con 4 productos) */}
        <Row className="g-4">
          {segundaFila.map((producto) => (
            <Col key={producto.id} sm={6} md={3}>
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
                  <Link
                    href={`/productos/${producto.id}`}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Ver Producto
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
