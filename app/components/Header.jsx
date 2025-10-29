// app/components/Header.jsx
'use client';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';

export default function Header() {
  const pathname = usePathname();
  const { getTotalItems } = useCart();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="/" className="fw-bold">
          🎮 GameTech
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/" active={pathname === '/'}>Home</Nav.Link>
            <Nav.Link href="/productos" active={pathname === '/productos'}>Productos</Nav.Link>
            <Nav.Link href="/categoria/mouse" active={pathname?.includes('/categoria')}>Categorías</Nav.Link>
            <Nav.Link href="/ofertas" active={pathname === '/ofertas'}>Ofertas</Nav.Link>
            <Nav.Link href="/nosotros" active={pathname === '/nosotros'}>Nosotros</Nav.Link>
            <Nav.Link href="/blog" active={pathname === '/blog'}>Blog</Nav.Link>
            <Nav.Link href="/contacto" active={pathname === '/contacto'}>Contacto</Nav.Link>
          </Nav>
          
          <Nav className="ms-auto d-flex align-items-center">
            <Link href="/login" className="btn btn-outline-light btn-sm me-2">Login</Link>
            <Link href="/registro" className="btn btn-primary btn-sm me-2">Registro</Link>
            <Link href="/carrito" className="btn btn-outline-warning btn-sm position-relative">
              🛒 Carrito 
              {getTotalItems() > 0 && (
                <Badge bg="light" text="dark" className="position-absolute top-0 start-100 translate-middle">
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