'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no hay usuario o no es admin, redirigir al login (o home)
    if (!user || user.rol !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.rol !== 'admin') {
    return null; // evita render temporal antes de redirección
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4">Panel de Administración</h2>
                <div>
                  <Button variant="outline-primary" href="/admin/usuarios">
                    Gestión de Usuarios
                  </Button>{' '}
                  <Button variant="outline-secondary" href="/admin/productos">
                    Gestión de Productos
                  </Button>
                </div>
              </div>

              <p className="text-muted">
                Aquí puedes agregar links y componentes para administrar la tienda.
                Por ahora es una página placeholder — añade tus herramientas admin cuando estés listo.
              </p>

              {/* Ejemplo de secciones */}
              <Row className="mt-4">
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Usuarios</h5>
                      <p className="small text-muted">Ver, editar o eliminar usuarios registrados.</p>
                      <Button variant="primary" href="/admin/usuarios">Ir a Usuarios</Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Productos</h5>
                      <p className="small text-muted">Administrar catálogo de productos.</p>
                      <Button variant="primary" href="/admin/productos">Ir a Productos</Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}