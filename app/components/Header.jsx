// app/components/Header.jsx
'use client';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    alert('Sesión cerrada correctamente');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="custom-navbar">
      <Container>
        <Navbar.Brand href="/" className="fw-bold brand-logo">
          🎮 GameTech
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="custom-toggler" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/" className={`nav-link-custom ${pathname === '/' ? 'active' : ''}`}>
              Home
            </Nav.Link>
            <Nav.Link href="/productos" className={`nav-link-custom ${pathname === '/productos' ? 'active' : ''}`}>
              Productos
            </Nav.Link>
            <Nav.Link href="/categoria" className={`nav-link-custom ${pathname === '/categoria' || pathname?.includes('/categoria/') ? 'active' : ''}`}>
              Categorías
            </Nav.Link>
            <Nav.Link href="/ofertas" className={`nav-link-custom ${pathname === '/ofertas' ? 'active' : ''}`}>
              Ofertas
            </Nav.Link>
            <Nav.Link href="/nosotros" className={`nav-link-custom ${pathname === '/nosotros' ? 'active' : ''}`}>
              Nosotros
            </Nav.Link>
            <Nav.Link href="/blog" className={`nav-link-custom ${pathname === '/blog' ? 'active' : ''}`}>
              Blog
            </Nav.Link>
            <Nav.Link href="/contacto" className={`nav-link-custom ${pathname === '/contacto' ? 'active' : ''}`}>
              Contacto
            </Nav.Link>
          </Nav>
          
          <Nav className="ms-auto d-flex align-items-center header-actions">
            {user ? (
              <Dropdown>
                <Dropdown.Toggle variant="outline-light" id="dropdown-user" className="d-flex align-items-center">
                  👤 {user.nombre}
                  {user.isAdmin && <Badge bg="warning" text="dark" className="ms-1">Admin</Badge>}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.ItemText>
                    <small>Conectado como <strong>{user.nombre}</strong></small>
                  </Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    🚪 Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline-light btn-sm me-2 login-btn">
                  Login
                </Link>
                <Link href="/registro" className="btn btn-primary btn-sm me-2 register-btn">
                  Registro
                </Link>
              </>
            )}
            <Link href="/carrito" className="btn btn-outline-warning btn-sm cart-btn position-relative">
              🛒 Carrito 
              {getTotalItems() > 0 && (
                <Badge bg="light" text="dark" className="cart-badge position-absolute top-0 start-100 translate-middle">
                  {getTotalItems()}
                </Badge>
              )}
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}