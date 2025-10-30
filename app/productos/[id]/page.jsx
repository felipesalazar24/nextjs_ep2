'use client';

import { Container, Row, Col, Card, Button, Breadcrumb, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';

export default function ProductoDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id, 10);
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;
    if (isNaN(productId)) {
      setError('ID inválido');
      setLoading(false);
      return;
    }
    fetch(`/api/productos/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Producto no encontrado');
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setProducto(data);
          setImagenPrincipal(data?.imagen ?? null);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError(err.message || 'Error al cargar producto');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [productId]);

  useEffect(() => {
    // si producto cambia, asegurar imagenPrincipal correcta
    if (producto && producto.imagen) setImagenPrincipal(producto.imagen);
  }, [producto]);

  const handleAddToCart = () => {
    addToCart(producto, cantidad);
    alert(`¡${cantidad} x ${producto.nombre} agregado al carrito!`);
  };

  const cambiarImagen = (nuevaImagen) => {
    setImagenPrincipal(nuevaImagen);
  };

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
        <h2>Error</h2>
        <p className="text-muted">{error}</p>
        <Link href="/productos" className="btn btn-primary">Volver a Productos</Link>
      </Container>
    );
  }

  if (!producto) {
    return (
      <Container className="py-4 text-center">
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no existe.</p>
        <Link href="/productos" className="btn btn-primary">Volver a Productos</Link>
      </Container>
    );
  }

  const todasLasImagenes = [producto.imagen, ...(producto.miniaturas || [])];

  return (
    <Container className="py-4">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} href="/productos">Productos</Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col md={6}>
          <div className="mb-4">
            {imagenPrincipal ? (
              <img
                src={imagenPrincipal}
                alt={producto.nombre}
                className="img-fluid rounded border"
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x400/cccccc/969696?text=Imagen+No+Disponible';
                }}
              />
            ) : (
              <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '100%', height: '400px' }}>
                <span className="text-muted">Imagen no disponible</span>
              </div>
            )}
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-2">
            {todasLasImagenes.map((imagen, index) => (
              <div key={index} className="text-center">
                <img
                  src={imagen}
                  alt={`${producto.nombre} vista ${index + 1}`}
                  className={`img-thumbnail ${imagenPrincipal === imagen ? 'border-primary border-3' : 'border-secondary'}`}
                  style={{
                    width: '70px',
                    height: '70px',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => cambiarImagen(imagen)}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/70x70/cccccc/969696?text=X';
                  }}
                />
              </div>
            ))}
          </div>
        </Col>

        <Col md={6}>
          <div className="mb-3">
            <Badge bg="primary" className="mb-2">{producto.atributo}</Badge>
            <h1 className="h2">{producto.nombre}</h1>
            <h2 className="h3 text-primary mb-3">${ typeof producto.precio === 'number' ? producto.precio.toLocaleString('es-CL') : producto.precio }</h2>
          </div>

          <div className="mb-4">
            <h4 className="h5">Descripción</h4>
            <p className="text-muted">{producto.descripcion}</p>
          </div>

          {producto.especificaciones && (
            <div className="mb-4">
              <h4 className="h5">Especificaciones</h4>
              <Card>
                <Card.Body>
                  {Object.entries(producto.especificaciones).map(([key, value]) => (
                    <div key={key} className="row border-bottom py-2">
                      <div className="col-4 fw-bold">{key}</div>
                      <div className="col-8">{value}</div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </div>
          )}

          <div className="mb-4">
            <Row className="align-items-center">
              <Col xs="auto">
                <label className="form-label fw-bold">Cantidad:</label>
              </Col>
              <Col xs="auto">
                <input
                  type="number"
                  className="form-control"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  style={{ width: '80px' }}
                />
              </Col>
              <Col className="mt-3 mt-sm-0">
                <Button variant="primary" onClick={handleAddToCart}>Agregar al carrito</Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Container>
  );
}