// app/productos/[id]/page.jsx
'use client';

import { Container, Row, Col, Card, Button, Breadcrumb, Badge } from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Datos de productos con rutas locales
const productos = [
    { 
        id: 1, 
        nombre: "Logitech G502", 
        precio: 83000, 
        imagen: "/assets/productos/M1.jpg", 
        descripcion: "El Logitech G502 LIGHTSPEED es un mouse inalámbrico diseñado para gamers que buscan un alto rendimiento, precisión y libertad de movimiento sin cables.", 
        miniaturas: [
            "/assets/productos/M1.1.jpg",
            "/assets/productos/M1.2.jpg",
            "/assets/productos/M1.3.jpg"
        ],
        atributo: "Mouse",
        especificaciones: {
            "Tipo": "Mouse Gaming Inalámbrico",
            "Sensor": "HERO 25K",
            "DPI": "25,600",
            "Botones": "11 programables",
            "Conectividad": "LIGHTSPEED 2.4GHz"
        }
    },
    { 
        id: 2, 
        nombre: "Logitech G305 LightSpeed Wireless", 
        precio: 35000, 
        imagen: "/assets/productos/M2.1.jpg", 
        descripcion: "El Logitech G305 LightSpeed es un mouse inalámbrico diseñado para gamers y usuarios que buscan un rendimiento profesional con tecnología avanzada.", 
        miniaturas: [
            "/assets/productos/M2.jpg",
            "/assets/productos/M2.2.jpg",
            "/assets/productos/M2.3.jpg"
        ],
        atributo: "Mouse",
        especificaciones: {
            "Tipo": "Mouse Gaming Inalámbrico",
            "Sensor": "HERO",
            "DPI": "12,000", 
            "Botones": "6 programables",
            "Batería": "Hasta 250 horas"
        }
    }
    // ... otros productos
];

const { addToCart } = useCart();

export default function ProductoDetailPage() {
    const params = useParams();
    const productId = parseInt(params.id);
    const producto = productos.find(p => p.id === productId);
    
    const [imagenPrincipal, setImagenPrincipal] = useState('');
    const [cantidad, setCantidad] = useState(1);

    // Inicializar la imagen principal cuando el producto se carga
    useEffect(() => {
        if (producto) {
            setImagenPrincipal(producto.imagen);
            console.log('✅ Producto cargado:', producto.nombre);
            console.log('🖼️ Imagen principal inicial:', producto.imagen);
            console.log('📸 Miniaturas disponibles:', producto.miniaturas);
        }
    }, [producto]);

    // Si no se encuentra el producto
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

    const cambiarImagen = (nuevaImagen) => {
        console.log('🔄 Cambiando imagen de:', imagenPrincipal, 'a:', nuevaImagen);
        setImagenPrincipal(nuevaImagen);
    };

    const handleAddToCart = (producto) => {
        addToCart(producto, 1);
        alert(`¡${producto.nombre} agregado al carrito!`);
    };

    // Todas las imágenes disponibles
    const todasLasImagenes = [producto.imagen, ...(producto.miniaturas || [])];

    console.log('🎯 Estado actual - Imagen principal:', imagenPrincipal);
    console.log('📋 Todas las imágenes:', todasLasImagenes);

    return (
        <Container className="py-4">
            {/* Migas de pan */}
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item linkAs={Link} href="/">
                    Home
                </Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} href="/productos">
                    Productos
                </Breadcrumb.Item>
                <Breadcrumb.Item active>
                    {producto.nombre}
                </Breadcrumb.Item>
            </Breadcrumb>

            <Row>
                {/* Columna de imágenes */}
                <Col md={6}>
                    <div className="mb-4">
                        {/* Imagen principal */}
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
                            onClick={() => console.log('🖼️ Imagen principal clickeada:', imagenPrincipal)}
                        />
                        <div className="text-center mt-2">
                            <small className="text-muted">
                                Imagen actual: {imagenPrincipal.split('/').pop()}
                            </small>
                        </div>
                    </div>
                    
                    {/* Miniaturas */}
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
                                    onClick={() => {
                                        console.log('🖱️ Miniatura clickeada:', imagen);
                                        cambiarImagen(imagen);
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/70x70/cccccc/969696?text=X';
                                    }}
                                />
                                <div>
                                    <small className="text-muted">
                                        {index === 0 ? 'Principal' : `Vista ${index}`}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Debug info */}
                    <div className="mt-3 p-2 bg-light rounded small">
                        <strong>Debug Info:</strong>
                        <div>Imagen principal: {imagenPrincipal}</div>
                        <div>Total miniaturas: {todasLasImagenes.length}</div>
                    </div>
                </Col>

                {/* Columna de información */}
                <Col md={6}>
                    <div className="mb-3">
                        <Badge bg="primary" className="mb-2">
                            {producto.atributo}
                        </Badge>
                        <h1 className="h2">{producto.nombre}</h1>
                        <h2 className="h3 text-primary mb-3">
                            ${producto.precio.toLocaleString('es-CL')}
                        </h2>
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                        <h4 className="h5">Descripción</h4>
                        <p className="text-muted">{producto.descripcion}</p>
                    </div>

                    {/* Especificaciones */}
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

                    {/* Selector de cantidad */}
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
                        </Row>
                    </div>

                    {/* Botones de acción */}
                    <div className="d-grid gap-2 d-md-flex">
                        <Button 
                            variant="primary" 
                            size="lg"
                            onClick={handleAddToCart}
                            className="flex-fill"
                        >
                            🛒 Agregar al Carrito
                        </Button>
                        <Button 
                            variant="outline-dark" 
                            size="lg"
                            className="flex-fill"
                        >
                            💝 Agregar a Favoritos
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}