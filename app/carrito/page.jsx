// app/carrito/page.jsx
'use client';

import { Container, Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function CarritoPage() {
    const { cart, removeFromCart, updateQuantity, clearCart, getTotal, getTotalItems } = useCart();

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }
        alert('¡Redirigiendo al checkout!');
        // Aquí irá la navegación al checkout
    };

    if (cart.length === 0) {
        return (
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col md={8} className="text-center">
                        <div className="mb-4">
                            <h1 className="display-4">🛒</h1>
                            <h2>Tu carrito está vacío</h2>
                            <p className="text-muted">Agrega algunos productos increíbles a tu carrito</p>
                        </div>
                        <Link href="/productos" className="btn btn-primary btn-lg">
                            Descubrir Productos
                        </Link>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row>
                <Col>
                    <h1 className="h2 mb-4">Carrito de Compras</h1>
                </Col>
            </Row>

            <Row>
                {/* Lista de productos */}
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Productos en el carrito</h5>
                                <Badge bg="primary">{getTotalItems()} items</Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Producto</th>
                                        <th>Precio</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img 
                                                        src={item.imagen} 
                                                        alt={item.nombre}
                                                        className="img-thumbnail me-3"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/60x60/cccccc/969696?text=Imagen';
                                                        }}
                                                    />
                                                    <div>
                                                        <h6 className="mb-1">{item.nombre}</h6>
                                                        <Badge bg="secondary" className="small">{item.atributo}</Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <strong>${item.precio.toLocaleString('es-CL')}</strong>
                                            </td>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center">
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="mx-3">{item.cantidad}</span>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <strong className="text-primary">
                                                    ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                                                </strong>
                                            </td>
                                            <td className="align-middle">
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    🗑️
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Acciones del carrito */}
                    <div className="d-flex justify-content-between mt-3">
                        <Link href="/productos" className="btn btn-outline-primary">
                            ← Continuar Comprando
                        </Link>
                        <Button variant="outline-danger" onClick={clearCart}>
                            🗑️ Vaciar Carrito
                        </Button>
                    </div>
                </Col>

                {/* Resumen del pedido */}
                <Col lg={4}>
                    <Card className="shadow-sm sticky-top" style={{ top: '100px' }}>
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Resumen del Pedido</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Productos ({getTotalItems()}):</span>
                                <span>${getTotal().toLocaleString('es-CL')}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Envío:</span>
                                <span className={getTotal() > 50000 ? 'text-success' : ''}>
                                    {getTotal() > 50000 ? 'GRATIS' : '$5.000'}
                                </span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between mb-3">
                                <strong>Total:</strong>
                                <strong className="h5 text-primary">
                                    ${(getTotal() + (getTotal() > 50000 ? 0 : 5000)).toLocaleString('es-CL')}
                                </strong>
                            </div>

                            <Alert variant="info" className="small">
                                {getTotal() < 50000 ? (
                                    <>🎯 ¡Faltan <strong>${(50000 - getTotal()).toLocaleString('es-CL')}</strong> para envío gratis!</>
                                ) : (
                                    <>🚚 ¡Tienes envío gratis!</>
                                )}
                            </Alert>

                            <Button 
                                variant="success" 
                                size="lg" 
                                className="w-100"
                                onClick={handleCheckout}
                            >
                                Proceder al Pago
                            </Button>

                            <div className="mt-3 text-center">
                                <small className="text-muted">
                                    💳 Pagos seguros con Webpay
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}