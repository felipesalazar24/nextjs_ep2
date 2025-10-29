// app/page.jsx
"use client";

import { Container, Row, Col, Card } from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";

// Componente para imagen
const ProductImage = (props) => {
  const [imgSrc, setImgSrc] = useState(props.src);

  const handleError = () => {
    setImgSrc("https://via.placeholder.com/150x150/cccccc/969696?text=Imagen");
  };

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

const productos = [
  {
    id: 1,
    nombre: "Logitech G502",
    precio: 83000,
    imagen: "/assets/productos/M1.jpg",
    descripcion: "Mouse gaming de alta precisión",
    atributo: "Mouse",
  },
  {
    id: 2,
    nombre: "Logitech G305",
    precio: 35000,
    imagen: "/assets/productos/M2.1.jpg",
    descripcion: "Mouse inalámbrico gaming",
    atributo: "Mouse",
  },
  {
    id: 4,
    nombre: "Redragon Kumara",
    precio: 26000,
    imagen: "/assets/productos/T1.jpg",
    descripcion: "Teclado mecánico RGB",
    atributo: "Teclado",
  },
  {
    id: 7,
    nombre: "Logitech G435",
    precio: 58000,
    imagen: "/assets/productos/A1.jpg",
    descripcion: "Audífonos inalámbricos gaming",
    atributo: "Audifono",
  },
];

export default function HomePage() {
  const productosDestacados = productos.slice(0, 4);

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

        <Row className="g-4">
          {productosDestacados.map((producto) => (
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
                    ${producto.precio.toLocaleString("es-CL")}
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
