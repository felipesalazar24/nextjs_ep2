// app/categoria/[tipo]/page.jsx
'use client';

import { Container, Row, Col, Card, Button, Breadcrumb, Badge, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';

// Datos de productos (los mismos que en productos/page.jsx)
const productos = [
    { 
        id: 1, 
        nombre: "Logitech G502", 
        precio: 83000, 
        imagen: "/assets/productos/M1.jpg", 
        descripcion: "El Logitech G502 LIGHTSPEED es un mouse inalámbrico diseñado para gamers que buscan un alto rendimiento, precisión y libertad de movimiento sin cables.", 
        atributo: "mouse"
    },
    { 
        id: 2, 
        nombre: "Logitech G305 LightSpeed Wireless", 
        precio: 35000, 
        imagen: "/assets/productos/M2.1.jpg", 
        descripcion: "El Logitech G305 LightSpeed es un mouse inalámbrico diseñado para gamers y usuarios que buscan un rendimiento profesional con tecnología avanzada.", 
        atributo: "mouse"
    },
    { 
        id: 3, 
        nombre: "Logitech G203 Lightsync Blue", 
        precio: 20000, 
        imagen: "/assets/productos/M3.jpg", 
        descripcion: "El Logitech G203 Lightsync Black es un mouse gamer alámbrico diseñado para ofrecer precisión, personalización y rendimiento en juegos.", 
        atributo: "mouse"
    },
    { 
        id: 4, 
        nombre: "Redragon Kumara K552 Rainbow", 
        precio: 26000, 
        imagen: "/assets/productos/T1.jpg", 
        descripcion: "El Redragon Kumara K552 Rainbow es un teclado mecánico, diseñado especialmente para gamers y usuarios que buscan un periférico resistente.", 
        atributo: "teclado"
    },
    { 
        id: 5, 
        nombre: "Logitech G PRO X TKL", 
        precio: 182000, 
        imagen: "/assets/productos/T2.jpg", 
        descripcion: "El Logitech PRO X TKL Lightspeed es un teclado mecánico diseñado para jugadores profesionales y entusiastas del gaming.", 
        atributo: "teclado"
    },
    { 
        id: 6, 
        nombre: "Razer BlackWidow V4 75% - Black", 
        precio: 165000, 
        imagen: "/assets/productos/T3.jpg", 
        descripcion: "El Razer BlackWidow V4 75% es un teclado mecánico compacto diseñado para usuarios y gamers que buscan un equilibrio.", 
        atributo: "teclado"
    },
    { 
        id: 7, 
        nombre: "Logitech G435 - Black/Yellow", 
        precio: 58000, 
        imagen: "/assets/productos/A1.jpg", 
        descripcion: "Los Logitech G435 son audífonos inalámbricos diseñados especialmente para gaming, que combinan la tecnología LIGHTSPEED y Bluetooth.", 
        atributo: "audifono"
    },
    { 
        id: 8, 
        nombre: "Razer BlackShark V2 X", 
        precio: 37000, 
        imagen: "/assets/productos/A2.jpg", 
        descripcion: "Los Razer BlackShark V2 X son audífonos diseñados especialmente para gamers y entusiastas de los esports.", 
        atributo: "audifono"
    },
    { 
        id: 9, 
        nombre: "Logitech G335 - Black", 
        precio: 43000, 
        imagen: "/assets/productos/A3.jpg", 
        descripcion: "Los Logitech G335 son audífonos gamer diseñados para ofrecer una experiencia de sonido clara y envolvente.", 
        atributo: "audifono"
    },
    { 
        id: 10, 
        nombre: "LG UltraGear 24GS60F-B", 
        precio: 119000, 
        imagen: "/assets/productos/MO1.jpg", 
        descripcion: "El LG UltraGear 24GS60F-B es un monitor diseñado para gamers que buscan un rendimiento superior y una experiencia visual inmersiva.", 
        atributo: "monitor"
    },
    { 
        id: 11, 
        nombre: "Xiaomi A27Qi", 
        precio: 124000, 
        imagen: "/assets/productos/MO2.jpg", 
        descripcion: "El Monitor Xiaomi A27Qi es una pantalla de 27 pulgadas que ofrece una experiencia visual de alta calidad.", 
        atributo: "monitor"
    },
    { 
        id: 12, 
        nombre: "Xiaomi G34WQi", 
        precio: 240000, 
        imagen: "/assets/productos/MO3.jpg", 
        descripcion: "El Monitor Gamer Xiaomi G34WQi es una pantalla curva ultrapanorámica de 34 pulgadas diseñada para ofrecer una experiencia visual inmersiva.", 
        atributo: "monitor"
    }
];

// Mapeo de categorías
const categoriasInfo = {
    'mouse': {
        nombre: 'Mouse Gaming',
        descripcion: 'Descubre nuestra selección de mouse gaming de alta precisión, diseñados para ofrecerte el mejor rendimiento en tus partidas.',
        color: 'primary',
        icon: '🖱️'
    },
    'teclado': {
        nombre: 'Teclados Mecánicos', 
        descripcion: 'Teclados mecánicos con respuesta táctil, durabilidad y personalización para gamers y profesionales.',
        color: 'success',
        icon: '⌨️'
    },
    'audifono': {
        nombre: 'Audífonos Gaming',
        descripcion: 'Audífonos con sonido envolvente, micrófonos claros y comodidad para largas sesiones de gaming.',
        color: 'warning',
        icon: '🎧'
    },
    'monitor': {
        nombre: 'Monitores Gaming',
        descripcion: 'Monitores de alta tasa de refresco, baja latencia y colores vibrantes para una experiencia visual inmersiva.',
        color: 'info',
        icon: '🖥️'
    }
};

export default function CategoriaPage() {
    const params = useParams();
    const tipoCategoria = params.tipo;
    const { addToCart } = useCart();

    // Información de la categoría
    const categoriaInfo = categoriasInfo[tipoCategoria];

    // Si la categoría no existe
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

    // Filtrar productos por categoría
    const productosCategoria = productos.filter(
        producto => producto.atributo.toLowerCase() === tipoCategoria.toLowerCase()
    );

    const getCategoryVariant = (atributo) => {
        const variants = {
            'mouse': 'primary',
            'teclado': 'success',
            'audifono': 'warning', 
            'monitor': 'info'
        };
        return variants[atributo] || 'secondary';
    };

    const handleAddToCart = (producto) => {
        addToCart(producto, 1);
        alert(`¡${producto.nombre} agregado al carrito!`);
    };

    return (
        <Container className="py-4">
            {/* Migas de pan */}
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item linkAs={Link} href="/">
                    Home
                </Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} href="/categoria">
                    Categorías
                </Breadcrumb.Item>
                <Breadcrumb.Item active>
                    {categoriaInfo.nombre}
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Header de la categoría */}
            <Row className="mb-5">
                <Col>
                    <div className="text-center">
                        <div className={`bg-${categoriaInfo.color} text-white rounded p-4 mb-4`}>
                            <h1 className="display-4 mb-3">{categoriaInfo.icon}</h1>
                            <h1 className="h2 mb-3">{categoriaInfo.nombre}</h1>
                            <p className="lead mb-0">{categoriaInfo.descripcion}</p>
                        </div>
                        
                        <Alert variant="info" className="d-inline-block">
                            <strong>{productosCategoria.length}</strong> productos encontrados en esta categoría
                        </Alert>
                    </div>
                </Col>
            </Row>

            {/* Grid de productos de la categoría */}
            {productosCategoria.length > 0 ? (
                <Row className="g-4">
                    {productosCategoria.map(producto => (
                        <Col key={producto.id} xs={12} sm={6} md={4} lg={3}>
                            <Card className="h-100 shadow-sm border-0 product-card">
                                <div className="position-relative">
                                    <Card.Img 
                                        variant="top" 
                                        src={producto.imagen}
                                        alt={producto.nombre}
                                        style={{ 
                                            height: '200px', 
                                            objectFit: 'cover',
                                            padding: '15px'
                                        }}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible';
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
                                        {producto.descripcion.substring(0, 100)}...
                                    </Card.Text>
                                    
                                    <div className="mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="h5 text-primary mb-0">
                                                ${producto.precio.toLocaleString('es-CL')}
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
                            <h3 className="h4 text-muted">No hay productos en esta categoría</h3>
                            <p className="text-muted">Prueba con otra categoría o explora todos nuestros productos.</p>
                            <Link href="/productos" className="btn btn-primary">
                                Ver Todos los Productos
                            </Link>
                        </div>
                    </Col>
                </Row>
            )}

            {/* Navegación entre categorías */}
            <Row className="mt-5">
                <Col>
                    <Card className="bg-light">
                        <Card.Body className="text-center">
                            <h5 className="mb-3">Explora Otras Categorías</h5>
                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                {Object.entries(categoriasInfo).map(([id, cat]) => (
                                    id !== tipoCategoria && (
                                        <Link 
                                            key={id}
                                            href={`/categoria/${id}`}
                                            className={`btn btn-outline-${cat.color} btn-sm`}
                                        >
                                            {cat.icon} {cat.nombre}
                                        </Link>
                                    )
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}