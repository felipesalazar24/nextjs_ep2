// app/categoria/page.jsx
'use client';

import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Link from 'next/link';

const categorias = [
    {
        id: 'mouse',
        nombre: 'Mouse Gaming',
        descripcion: 'Precisión y velocidad para gamers profesionales',
        imagen: '/assets/productos/M1.jpg',
        cantidadProductos: 3,
        color: 'primary'
    },
    {
        id: 'teclado',
        nombre: 'Teclados Mecánicos',
        descripcion: 'Respuesta táctil y durabilidad excepcional',
        imagen: '/assets/productos/T1.jpg',
        cantidadProductos: 3,
        color: 'success'
    },
    {
        id: 'audifono',
        nombre: 'Audífonos Gaming',
        descripcion: 'Sonido envolvente y comodidad para largas sesiones',
        imagen: '/assets/productos/A1.jpg',
        cantidadProductos: 3,
        color: 'warning'
    },
    {
        id: 'monitor',
        nombre: 'Monitores Gaming',
        descripcion: 'Alta tasa de refresco y colores vibrantes',
        imagen: '/assets/productos/MO1.jpg',
        cantidadProductos: 3,
        color: 'info'
    }
];

export default function CategoriasPage() {
    return (
        <Container className="py-4">
            {/* Header */}
            <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-dark mb-3">Categorías de Productos</h1>
                <p className="lead text-muted">
                    Explora nuestra selección organizada por tipo de producto
                </p>
            </div>

            {/* Grid de categorías */}
            <Row className="g-4">
                {categorias.map(categoria => (
                    <Col key={categoria.id} xs={12} sm={6} lg={3}>
                        <Card className="h-100 shadow-sm border-0 category-card">
                            <div className="position-relative">
                                <Card.Img 
                                    variant="top" 
                                    src={categoria.imagen}
                                    alt={categoria.nombre}
                                    style={{ 
                                        height: '200px', 
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200/cccccc/969696?text=Categoría';
                                    }}
                                />
                                <div className={`position-absolute top-0 start-0 m-2 badge bg-${categoria.color}`}>
                                    {categoria.cantidadProductos} productos
                                </div>
                            </div>
                            
                            <Card.Body className="d-flex flex-column">
                                <Card.Title className="h5 text-center">
                                    {categoria.nombre}
                                </Card.Title>
                                
                                <Card.Text className="text-muted text-center flex-grow-1">
                                    {categoria.descripcion}
                                </Card.Text>
                                
                                <div className="mt-auto">
                                    <div className="d-grid">
                                        <Link 
                                            href={`/categoria/${categoria.id}`}
                                            className={`btn btn-${categoria.color} btn-sm`}
                                        >
                                            Explorar Categoría
                                        </Link>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Información adicional */}
            <Row className="mt-5">
                <Col className="text-center">
                    <div className="bg-light rounded p-4">
                        <h3 className="h4 mb-3">¿No encuentras lo que buscas?</h3>
                        <p className="text-muted mb-3">
                            Explora todos nuestros productos o contáctanos para asistencia personalizada
                        </p>
                        <div className="d-flex gap-3 justify-content-center">
                            <Link href="/productos" className="btn btn-primary">
                                Ver Todos los Productos
                            </Link>
                            <Link href="/contacto" className="btn btn-outline-secondary">
                                Contactar Soporte
                            </Link>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}