'use client';

import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

// Componente para imagen
const ProductImage = (props) => {
  const [imgSrc, setImgSrc] = useState(props.src);

  const handleError = () => {
    setImgSrc('https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible');
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

export default function ProductosPage() {
  const { addToCart } = useCart();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCategoryVariant = (atributo) => {
    const variants = {
      'Mouse': 'primary',
      'Teclado': 'success',
      'Audifono': 'warning',
      'Monitor': 'info'
    };
    return variants[atributo] || 'secondary';
  };

  const handleAddToCart = (producto) => {
    addToCart(producto, 1);
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  useEffect(() => {
    let mounted = true;
    fetch('/api/productos')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar productos');
        return res.json();
      })
      .then((data) => {
        if (mounted) setProductos(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError(err.message || 'Error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
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

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark mb-3">Nuestros Productos</h1>
        <p className="lead text-muted">
          Descubre la mejor selección de productos gaming para mejorar tu experiencia
        </p>
      </div>

      <Row className="g-4">
        {productos.map(producto => (
          <Col key={producto.id} xs={12} sm={6} md={4} lg={3}>
            <Card className="h-100 shadow-sm border-0 product-card">
              <div className="position-relative">
                <ProductImage
                  src={producto.imagen}
                  alt={producto.nombre}
                  style={{
                    height: '200px',
                    objectFit: 'cover',
                    padding: '15px'
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
                      ${ typeof producto.precio === 'number' ? producto.precio.toLocaleString('es-CL') : producto.precio }
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
    </Container>
  );
}