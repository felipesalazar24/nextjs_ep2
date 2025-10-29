// app/productos/page.tsx
"use client"; // ¡IMPORTANTE! Agregar esta línea al inicio

import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";

// Datos de productos
const productos = [
  {
    id: 1,
    nombre: "Logitech G502",
    precio: 83000,
    imagen: "/assets/productos/M1.jpg",
    descripcion:
      "El Logitech G502 LIGHTSPEED es un mouse inalámbrico diseñado para gamers que buscan un alto rendimiento, precisión y libertad de movimiento sin cables.",
    atributo: "Mouse",
  },
  {
    id: 2,
    nombre: "Logitech G305 LightSpeed Wireless",
    precio: 35000,
    imagen: "/assets/productos/M2.1.jpg",
    descripcion:
      "El Logitech G305 LightSpeed es un mouse inalámbrico diseñado para gamers y usuarios que buscan un rendimiento profesional con tecnología avanzada.",
    atributo: "Mouse",
  },
  {
    id: 3,
    nombre: "Logitech G203 Lightsync Blue",
    precio: 20000,
    imagen: "/assets/productos/M3.jpg",
    descripcion:
      "El Logitech G203 Lightsync Black es un mouse gamer alámbrico diseñado para ofrecer precisión, personalización y rendimiento en juegos.",
    atributo: "Mouse",
  },
  {
    id: 4,
    nombre: "Redragon Kumara K552 Rainbow",
    precio: 26000,
    imagen: "/assets/productos/T1.jpg",
    descripcion:
      "El Redragon Kumara K552 Rainbow es un teclado mecánico, diseñado especialmente para gamers y usuarios que buscan un periférico resistente.",
    atributo: "Teclado",
  },
  {
    id: 5,
    nombre: "Logitech G PRO X TKL",
    precio: 182000,
    imagen: "/assets/productos/T2.jpg",
    descripcion:
      "El Logitech PRO X TKL Lightspeed es un teclado mecánico diseñado para jugadores profesionales y entusiastas del gaming.",
    atributo: "Teclado",
  },
  {
    id: 6,
    nombre: "Razer BlackWidow V4 75% - Black",
    precio: 165000,
    imagen: "/assets/productos/T3.jpg",
    descripcion:
      "El Razer BlackWidow V4 75% es un teclado mecánico compacto diseñado para usuarios y gamers que buscan un equilibrio.",
    atributo: "Teclado",
  },
  {
    id: 7,
    nombre: "Logitech G435 - Black/Yellow",
    precio: 58000,
    imagen: "/assets/productos/A1.jpg",
    descripcion:
      "Los Logitech G435 son audífonos inalámbricos diseñados especialmente para gaming, que combinan la tecnología LIGHTSPEED y Bluetooth.",
    atributo: "Audifono",
  },
  {
    id: 8,
    nombre: "Razer BlackShark V2 X",
    precio: 37000,
    imagen: "/assets/productos/A2.jpg",
    descripcion:
      "Los Razer BlackShark V2 X son audífonos diseñados especialmente para gamers y entusiastas de los esports.",
    atributo: "Audifono",
  },
];

// Componente para manejar imágenes con error handling
const ProductImage = ({ src, alt, nombre }) => {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    console.log(`Error cargando imagen: ${src}`);
    setImgSrc(
      "https://via.placeholder.com/300x300/cccccc/969696?text=Imagen+No+Disponible"
    );
  };

  return (
    <Card.Img
      variant="top"
      src={imgSrc}
      alt={alt}
      style={{
        height: "200px",
        objectFit: "cover",
        padding: "15px",
      }}
      onError={handleError}
    />
  );
};

export default function ProductosPage() {
  const getCategoryVariant = (atributo) => {
    const variants = {
      Mouse: "primary",
      Teclado: "success",
      Audifono: "warning",
      Monitor: "info",
    };
    return variants[atributo] || "secondary";
  };

  const handleAddToCart = (producto) => {
    console.log("Agregar al carrito:", producto.nombre);
    // Aquí irá la lógica del carrito
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark mb-3">Nuestros Productos</h1>
        <p className="lead text-muted">
          Descubre la mejor selección de productos gaming para mejorar tu
          experiencia
        </p>
      </div>

      {/* Contador de productos */}
      <div className="alert alert-info mb-4">
        <strong>{productos.length}</strong> productos encontrados
      </div>

      <Row className="g-4">
        {productos.map((producto) => (
          <Col key={producto.id} xs={12} sm={6} md={4} lg={3}>
            <Card className="h-100 shadow-sm border-0 product-card">
              <div className="position-relative">
                <ProductImage
                  src={producto.imagen}
                  alt={producto.nombre}
                  nombre={producto.nombre}
                />
                <Badge
                  bg={getCategoryVariant(producto.atributo)}
                  className="position-absolute top-0 start-0 m-2"
                >
                  {producto.atributo}
                </Badge>
              </div>

              <Card.Body className="d-flex flex-column">
                <Card.Title className="h6 mb-2">
                  <Link
                    href={`/productos/${producto.id}`}
                    className="text-dark text-decoration-none"
                  >
                    {producto.nombre}
                  </Link>
                </Card.Title>

                <Card.Text className="text-muted small flex-grow-1">
                  {producto.descripcion.substring(0, 100)}...
                </Card.Text>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="h5 text-primary mb-0">
                      ${producto.precio.toLocaleString("es-CL")}
                    </span>
                  </div>

                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-dark btn-sm"
                    >
                      Ver Detalles
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddToCart(producto)}
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Banner promocional */}
      <Row className="mt-5">
        <Col>
          <div className="bg-primary text-white rounded p-4 text-center">
            <h4 className="mb-3">
              🚀 Envío Gratis en Compras Mayores a $50.000
            </h4>
            <p className="mb-0">
              Aprovecha nuestro envío express gratuito en toda la región
              metropolitana
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
