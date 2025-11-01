"use client";

import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { getProductos } from "../../lib/products"; // usa el wrapper

// Componente para imagen (igual que antes)
const ProductImage = (props) => {
  const [imgSrc, setImgSrc] = useState(props.src);
  const handleError = () =>
    setImgSrc(
      "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible"
    );
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

export default function ProductosPage() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    setProductos(getProductos());
  }, []);

  const handleAddToCart = (producto) => {
    if (!user) {
      router.push("/login");
      return;
    }
    addToCart(producto, 1);
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark mb-3">Nuestros Productos</h1>
        <p className="lead text-muted">
          Descubre la mejor selección de productos gaming
        </p>
      </div>

      <Row className="g-4">
        {productos.map((producto) => (
          <Col key={producto.id} sm={6} md={4} lg={3}>
            <Card className="h-100 shadow-sm">
              <ProductImage
                src={producto.imagen}
                alt={producto.nombre}
                style={{ height: 180, objectFit: "contain", padding: 12 }}
              />
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{producto.nombre}</h5>
                  <Badge bg="secondary">{producto.atributo}</Badge>
                </div>
                <p className="text-primary fw-bold mb-3">
                  ${Number(producto.precio).toLocaleString("es-CL")}
                </p>
                <div className="mt-auto d-grid gap-2">
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
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
