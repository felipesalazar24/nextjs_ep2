"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
} from "react-bootstrap";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getProductos } from "../../../lib/products"; // wrapper

export default function CategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const tipoCategoria = params.tipo;
  const { addToCart } = useCart();
  const { user } = useAuth();

  const productos = getProductos();
  const productosCategoria = productos.filter(
    (p) =>
      String(p.atributo).toLowerCase() === String(tipoCategoria).toLowerCase()
  );

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
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/categoria">Categorías</Breadcrumb.Item>
        <Breadcrumb.Item active>{tipoCategoria}</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4">{tipoCategoria}</h2>

      {productosCategoria.length > 0 ? (
        <Row className="g-4">
          {productosCategoria.map((producto) => (
            <Col key={producto.id} md={4} lg={3}>
              <Card className="h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={producto.imagen}
                  style={{ height: 160, objectFit: "contain", padding: 12 }}
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="h5 text-primary mb-0">
                      ${Number(producto.precio).toLocaleString("es-CL")}
                    </span>
                  </div>

                  <div className="d-grid gap-2 mt-auto">
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
    </Container>
  );
}
