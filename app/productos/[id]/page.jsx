"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getProductoById } from "../../../lib/products"; // wrapper

export default function ProductoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id, 10);
  const [producto, setProducto] = useState(null);
  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // ofertas local state (server + localStorage fallback)
  const [offers, setOffers] = useState([]);

  // helper normalize id
  const pid = (v) => String(v ?? "").trim();

  useEffect(() => {
    const p = getProductoById(productId);
    setProducto(p);
    if (p) {
      const main = p.imagen || (Array.isArray(p.miniaturas) && p.miniaturas.length ? p.miniaturas[0] : "");
      setImagenPrincipal(main || "");
    }
  }, [productId]);

  // load offers (server + localStorage)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/offers").catch(() => null);
        let serverOffers = [];
        if (res && res.ok) {
          serverOffers = await res.json().catch(() => []);
        }
        const stored = typeof window !== "undefined" ? localStorage.getItem("createdOffers") : null;
        const parsed = stored ? JSON.parse(stored) : [];
        if (!mounted) return;
        // merge: admin created offers (local) override server offers for same productId
        const map = new Map();
        for (const o of serverOffers || []) map.set(pid(o.productId ?? o.id), { ...o, source: "server" });
        for (const o of parsed || []) map.set(pid(o.productId), { ...o, source: "admin" });
        const merged = Array.from(map.values());
        setOffers(merged);
      } catch (err) {
        console.warn("Error loading offers:", err);
        if (mounted) setOffers([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  // find offer for this product (merged offers)
  const offerForProduct = offers.find((o) => pid(o.productId) === pid(producto.id ?? producto._id ?? producto.sku));

  // compute effective price to display and to add to cart
  const originalPrice = Number( (producto.precio ?? producto.price) || 0 );
  const hasOffer = !!(offerForProduct && (offerForProduct.newPrice || offerForProduct.percent));
  const effectivePrice = hasOffer ? Number(offerForProduct.newPrice ?? Math.round(originalPrice * (1 - (Number(offerForProduct.percent) || 0) / 100))) : originalPrice;
  const percentLabel = hasOffer ? (offerForProduct.percent ?? Math.round(((offerForProduct.oldPrice || originalPrice) - effectivePrice) / (offerForProduct.oldPrice || originalPrice) * 100)) : 0;

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    // add with effective price override (so cart uses offer price)
    const item = { ...producto, precio: effectivePrice };
    addToCart(item, Number(cantidad));
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  // safe src helper
  const safeSrc = (s) => {
    if (!s) return "/assets/productos/placeholder.png";
    try {
      if (String(s).startsWith("data:")) return s;
      if (!String(s).match(/^https?:\/\//i) && typeof window !== "undefined") return new URL(s, window.location.origin).href;
      return String(s);
    } catch {
      return String(s);
    }
  };

  // build thumbnails including main image first
  const buildThumbs = () => {
    const seen = new Set();
    const out = [];
    const push = (v) => {
      if (!v) return;
      const key = String(v);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    };
    push(producto.imagen);
    if (Array.isArray(producto.miniaturas)) for (const m of producto.miniaturas) push(m);
    return out;
  };

  const thumbs = buildThumbs();

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/productos">Productos</Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col md={6}>
          <Card className="p-3">
            <div style={{ width: "100%", minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
              <img src={safeSrc(imagenPrincipal)} alt={producto.nombre} style={{ width: "100%", objectFit: "contain", maxHeight: 520 }} />
            </div>

            <div className="d-flex gap-2 mt-2 flex-wrap">
              {thumbs.length > 0 ? thumbs.map((m, i) => {
                const active = String(m) === String(imagenPrincipal);
                return (
                  <button key={i} type="button" onClick={() => setImagenPrincipal(m)} style={{ border: active ? "2px solid #0d6efd" : "1px solid #ddd", padding: 4, borderRadius: 6, background: "#fff", cursor: "pointer", width: 64, height: 64, display: "inline-flex", alignItems: "center", justifyContent: "center" }} aria-pressed={active}>
                    <img src={safeSrc(m)} alt={`${producto.nombre}-${i}`} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4 }} />
                  </button>
                );
              }) : <div className="text-muted small">No hay miniaturas</div>}
            </div>
          </Card>
        </Col>

        <Col md={6}>
          <h2>{producto.nombre} {hasOffer && <Badge bg="danger" className="ms-2">-{percentLabel}%</Badge>}</h2>
          <Badge bg="secondary" className="mb-2">{producto.atributo}</Badge>

          <div className="mb-3">
            {hasOffer ? (
              <div>
                <div style={{ fontSize: 20 }}>
                  <span className="text-decoration-line-through text-muted me-2">${originalPrice.toLocaleString("es-CL")}</span>
                  <span className="text-primary fw-bold">${Number(effectivePrice).toLocaleString("es-CL")}</span>
                </div>
                <div className="small text-muted">Oferta {offerForProduct.source === "admin" ? "(admin)" : ""}</div>
              </div>
            ) : (
              <h3 className="text-primary">${originalPrice.toLocaleString("es-CL")}</h3>
            )}
          </div>

          <p>{producto.descripcion}</p>

          <div className="d-flex align-items-center gap-2 mb-3">
            <Form.Control type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} style={{ width: 100 }} />
            <Button variant="primary" onClick={handleAddToCart}>Agregar al Carrito</Button>
            <Link href="/carrito" className="btn btn-outline-secondary">Ver Carrito</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}