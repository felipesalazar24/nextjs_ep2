"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getProductoById } from "../../../lib/products"; // wrapper

export default function ProductoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id, 10);
  const [producto, setProducto] = useState(null);
  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const p = getProductoById(productId);
    setProducto(p);
    if (p) setImagenPrincipal(p.imagen);
  }, [productId]);

  if (!producto) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe.</p>
          <Link href="/productos" className="btn btn-primary">
            Volver a Productos
          </Link>
        </div>
      </Container>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    addToCart({ ...producto }, Number(cantidad));
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/productos">Productos</Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col md={6}>
          <Card className="p-3">
            <img
              src={imagenPrincipal}
              alt={producto.nombre}
              style={{ width: "100%", objectFit: "contain" }}
            />
            <div className="d-flex gap-2 mt-2">
              {producto.miniaturas?.map((m, i) => (
                <img
                  key={i}
                  src={m}
                  alt={`${producto.nombre}-${i}`}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() => setImagenPrincipal(m)}
                />
              ))}
            </div>
          </Card>
        </Col>

        <Col md={6}>
          <h2>{producto.nombre}</h2>
          <Badge bg="secondary" className="mb-2">
            {producto.atributo}
          </Badge>
          <h3 className="text-primary">
            ${Number(producto.precio).toLocaleString("es-CL")}
          </h3>
          <p>{producto.descripcion}</p>

          <div className="d-flex align-items-center gap-2 mb-3">
            <Form.Control
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              style={{ width: 100 }}
            />
            <Button variant="primary" onClick={handleAddToCart}>
              Agregar al Carrito
            </Button>
            <Link href="/carrito" className="btn btn-outline-secondary">
              Ver Carrito
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
