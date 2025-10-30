"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";

const categoriasInfo = {
  mouse: {
    nombre: "Mouse Gaming",
    descripcion: "Precisión y velocidad para gamers profesionales",
    icon: "🖱️",
  },
  teclado: {
    nombre: "Teclados Mecánicos",
    descripcion: "Respuesta táctil y durabilidad excepcional",
    icon: "⌨️",
  },
  audifono: {
    nombre: "Audífonos Gaming",
    descripcion: "Sonido envolvente y comodidad para largas sesiones",
    icon: "🎧",
  },
  monitor: {
    nombre: "Monitores Gaming",
    descripcion: "Alta tasa de refresco y calidad de imagen",
    icon: "🖥️",
  },
};

export default function CategoriaPage() {
  const params = useParams();
  const tipoCategoria = params.tipo;
  const { addToCart } = useCart();

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

  const categoriaInfo = categoriasInfo[tipoCategoria];

  if (!categoriaInfo) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Categoría no encontrada</h2>
          <p>La categoría que buscas no existe.</p>
          <Link href="/categoria" className="btn btn-primary">
            Volver a Categorías
          </Link>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4 text-center">
        <h2>Error al cargar categoría</h2>
        <p className="text-muted">{error}</p>
      </Container>
    );
  }

  const productosCategoria = productos.filter(
    (producto) =>
      (producto.atributo ?? "").toLowerCase() === tipoCategoria.toLowerCase()
  );

  const getCategoryVariant = (atributo) => {
    const variants = {
      mouse: "primary",
      teclado: "success",
      audifono: "warning",
      monitor: "info",
    };
    return variants[atributo.toLowerCase()] || "secondary";
  };

  const handleAddToCart = (producto) => {
    addToCart(producto, 1);
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  return (
    <Container className="py-4">
      <Row className="align-items-center mb-4">
        <Col md={8}>
          <h1 className="h2 mb-0">
            {categoriaInfo.icon} {categoriaInfo.nombre}
          </h1>
          <p className="text-muted mb-0">{categoriaInfo.descripcion}</p>
        </Col>
        <Col md={4} className="text-md-end mt-3 mt-md-0">
          <Alert variant="info" className="d-inline-block">
            <strong>{productosCategoria.length}</strong> productos encontrados
            en esta categoría
          </Alert>
        </Col>
      </Row>

      {productosCategoria.length > 0 ? (
        <Row className="g-4">
          {productosCategoria.map((producto) => (
            <Col key={producto.id} xs={12} sm={6} md={4} lg={3}>
              <Card className="h-100 shadow-sm border-0 product-card">
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={producto.imagen}
                    alt={producto.nombre}
                    style={{
                      height: "200px",
                      objectFit: "cover",
                      padding: "15px",
                    }}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible";
                    }}
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
                    {(producto.descripcion ?? "").substring(0, 100)}...
                  </Card.Text>

                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="h5 text-primary mb-0">
                        $
                        {typeof producto.precio === "number"
                          ? producto.precio.toLocaleString("es-CL")
                          : producto.precio}
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
      ) : (
        <Row>
          <Col className="text-center">
            <div className="py-5">
              <h3 className="h4 text-muted">
                No hay productos en esta categoría
              </h3>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
}
