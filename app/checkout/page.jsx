"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/**
 * Checkout page
 * - Bloquea acceso si el carrito está vacío.
 * - Region / Comuna predefinidas: se muestran como selects y las comunas dependen de la región.
 * - Prefill desde user cuando existe.
 * - Al enviar simula pago (50% éxito / 50% fallo) y redirige a /checkout/success o /checkout/failed.
 *
 * Reemplaza app/checkout/page.jsx en la rama draft/damp-grass
 */

/**
 * Mapa de Regiones de Chile -> Comunas (lista representativa, no exhaustiva).
 * Puedes ampliar o cargar desde un fichero JSON si prefieres.
 */
const REGION_COMUNAS = {
  "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
  Tarapacá: [
    "Iquique",
    "Alto Hospicio",
    "Pozo Almonte",
    "Camiña",
    "Colchane",
    "Huatacondo",
    "Huara",
    "Pica",
  ],
  Antofagasta: [
    "Antofagasta",
    "Mejillones",
    "Sierra Gorda",
    "Taltal",
    "Calama",
    "Ollagüe",
    "San Pedro de Atacama",
    "Tocopilla",
    "María Elena",
  ],
  Atacama: [
    "Copiapó",
    "Caldera",
    "Tierra Amarilla",
    "Chañaral",
    "Diego de Almagro",
    "Vallenar",
    "Alto del Carmen",
    "Freirina",
    "Huasco",
  ],
  Coquimbo: [
    "La Serena",
    "Coquimbo",
    "Andacollo",
    "La Higuera",
    "Paiguano",
    "Vicuña",
    "Illapel",
    "Canela",
    "Los Vilos",
    "Salamanca",
    "Ovalle",
    "Combarbalá",
    "Monte Patria",
    "Punitaqui",
    "Río Hurtado",
  ],
  Valparaíso: [
    "Valparaíso",
    "Casablanca",
    "Concón",
    "Juan Fernández",
    "Puchuncaví",
    "Quintero",
    "Viña del Mar",
    "Isla de Pascua",
    "Los Andes",
    "Calle Larga",
    "Rinconada",
    "San Esteban",
    "La Ligua",
    "Cabildo",
    "Papudo",
    "Petorca",
    "Zapallar",
    "Quillota",
    "Calera",
    "Hijuelas",
    "La Cruz",
    "Nogales",
    "San Antonio",
    "Algarrobo",
    "Cartagena",
    "El Quisco",
    "El Tabo",
    "Santo Domingo",
    "San Felipe",
    "Putaendo",
    "Catemu",
    "Llaillay",
    "Panquehue",
    "Santa María",
  ],
  Metropolitana: [
    "Cerrillos",
    "Cerro Navia",
    "Conchalí",
    "El Bosque",
    "Estación Central",
    "Huechuraba",
    "Independencia",
    "La Cisterna",
    "La Florida",
    "La Granja",
    "La Pintana",
    "La Reina",
    "Las Condes",
    "Lo Barnechea",
    "Lo Espejo",
    "Lo Prado",
    "Macul",
    "Maipú",
    "Ñuñoa",
    "Pedro Aguirre Cerda",
    "Peñalolén",
    "Providencia",
    "Pudahuel",
    "Quilicura",
    "Quinta Normal",
    "Recoleta",
    "Renca",
    "San Joaquín",
    "San Miguel",
    "San Ramón",
    "Santiago",
    "Vitacura",
    "Puente Alto",
    "Pirque",
    "San José de Maipo",
    "Colina",
    "Lampa",
    "Tiltil",
  ],
  "O'Higgins": [
    "Rancagua",
    "Codegua",
    "Coinco",
    "Coltauco",
    "Doñihue",
    "Graneros",
    "Las Cabras",
    "Machalí",
    "Malloa",
    "Mostazal",
    "Olivar",
    "Peumo",
    "Pichidegua",
    "Quinta de Tilcoco",
    "Rengo",
    "San Vicente",
    "Pichilemu",
    "La Estrella",
    "Litueche",
    "Marchihue",
    "Navidad",
    "Paredones",
    "Chimbarongo",
    "San Fernando",
    "Nancagua",
    "Santa Cruz",
    "Palmilla",
    "Placilla",
    "Peralillo",
  ],
  Maule: [
    "Talca",
    "Constitución",
    "Curepto",
    "Empedrado",
    "Maule",
    "Pelarco",
    "Pencahue",
    "Río Claro",
    "San Clemente",
    "San Rafael",
    "Cauquenes",
    "Chanco",
    "Pelluhue",
    "Curicó",
    "Hualañé",
    "Licantén",
    "Molina",
    "Rauco",
    "Romeral",
    "Sagrada Familia",
    "Teno",
    "Vichuquén",
    "Linares",
    "Colbún",
    "Longaví",
    "Parral",
    "Retiro",
    "San Javier",
    "Villa Alegre",
    "Yerbas Buenas",
  ],
  Ñuble: [
    "Bulnes",
    "Chillán",
    "Chillán Viejo",
    "Cobquecura",
    "Coelemu",
    "Coihueco",
    "El Carmen",
    "Ninhue",
    "Ñiquén",
    "Pemuco",
    "Pinto",
    "Quillón",
    "Quirihue",
    "Ránquil",
    "San Carlos",
    "San Fabián",
    "San Ignacio",
    "San Nicolás",
    "Treguaco",
    "Yungay",
  ],
  Biobío: [
    "Concepción",
    "Coronel",
    "Chiguayante",
    "Florida",
    "Hualqui",
    "Lota",
    "Penco",
    "San Pedro de la Paz",
    "Santa Juana",
    "Talcahuano",
    "Tomé",
    "Hualpén",
    "Lebu",
    "Arauco",
    "Cañete",
    "Los Álamos",
    "Cabrero",
    "Laja",
    "Mulchén",
    "Nacimiento",
    "Negrete",
    "Tucapel",
    "Yumbel",
    "Alto Biobío",
    "Antuco",
    "Santa Bárbara",
    "Quilleco",
    "San Rosendo",
    "Quilaco",
  ],
  Araucanía: [
    "Temuco",
    "Carahue",
    "Cunco",
    "Curarrehue",
    "Freire",
    "Galvarino",
    "Gorbea",
    "Lautaro",
    "Loncoche",
    "Melipeuco",
    "Nueva Imperial",
    "Padre Las Casas",
    "Perquenco",
    "Pitrufquén",
    "Pucón",
    "Villarrica",
    "Panguipulli",
    "Cholchol",
    "Angol",
    "Victoria",
    "Lonquimay",
    "Collipulli",
    "Ercilla",
    "Traiguén",
    "Los Sauces",
  ],
  "Los Ríos": [
    "Valdivia",
    "Corral",
    "Lanco",
    "Los Lagos",
    "Máfil",
    "Mariquina",
    "Paillaco",
    "Panguipulli",
    "La Unión",
    "Futrono",
    "Lago Ranco",
    "Río Bueno",
  ],
  "Los Lagos": [
    "Puerto Montt",
    "Calbuco",
    "Cochamó",
    "Fresia",
    "Frutillar",
    "Los Muermos",
    "Llanquihue",
    "Maullín",
    "Puerto Varas",
    "Castro",
    "Chonchi",
    "Curaco de Vélez",
    "Dalcahue",
    "Puqueldón",
    "Queilén",
    "Quellón",
    "Quemchi",
    "Quinchao",
    "Osorno",
    "Purranque",
    "Puerto Octay",
    "Puyehue",
    "Río Negro",
    "San Pablo",
    "Ancud",
    "Chaitén",
  ],
  Aysén: [
    "Coyhaique",
    "Lago Verde",
    "Aysén",
    "Cisnes",
    "Guaitecas",
    "Río Ibáñez",
    "Chile Chico",
    "Cochrane",
    "O'Higgins",
    "Tortel",
    "Puerto Aysén",
  ],
  "Magallanes y de la Antártica Chilena": [
    "Punta Arenas",
    "Laguna Blanca",
    "Río Verde",
    "San Gregorio",
    "Cabo de Hornos",
    "Antártica",
    "Porvenir",
    "Primavera",
    "Timaukel",
    "Natales",
    "Torres del Paine",
    "Puerto Williams",
  ],
};

const REGIONS = Object.keys(REGION_COMUNAS);

export default function CheckoutPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = auth || {};

  const cartContext = useCart();
  // compatibilidad con distintos nombres en el contexto
  const cartItems = cartContext.items ?? cartContext.cart ?? [];
  const getTotal =
    typeof cartContext.getTotal === "function"
      ? cartContext.getTotal
      : () =>
          (cartItems || []).reduce(
            (s, it) =>
              s + (Number(it.precio || 0) * Number(it.cantidad || 0) || 0),
            0
          );
  const clearCart =
    typeof cartContext.clearCart === "function"
      ? cartContext.clearCart
      : () => {};

  const total = useMemo(() => getTotal(), [cartItems, cartContext]);

  // Bloqueo de acceso si carrito vacío
  const [blocked, setBlocked] = useState(null); // null = checking, true = blocked, false = ok

  useEffect(() => {
    const hasItems = Array.isArray(cartItems) && cartItems.length > 0;
    setBlocked(!hasItems);
  }, [cartItems]);

  // Form state with region/comuna select
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    calle: "",
    depto: "",
    region: "", // will be one of REGIONS or ""
    comuna: "", // will be one from REGION_COMUNAS[region]
    instrucciones: "",
  });

  // comunas options based on selected region
  const [comunasOptions, setComunasOptions] = useState([
    "Selecciona una comuna",
  ]);

  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill with user data if available (also prefer user's region/comuna if exists)
  useEffect(() => {
    if (user) {
      const userRegion = user.region || user.región || user.regionName || "";
      const normalizedRegion =
        REGIONS.find(
          (r) => String(r).toLowerCase() === String(userRegion).toLowerCase()
        ) || "";
      const userComuna = user.comuna || user.commune || "";

      setForm((prev) => ({
        ...prev,
        nombre: user.nombre || prev.nombre || "",
        apellidos: user.apellidos || user.apellido || prev.apellidos || "",
        email: user.email || user.mail || prev.email || "",
        telefono: user.telefono || prev.telefono || "",
        calle: user.direccion || user.calle || prev.calle || "",
        depto: user.depto || user.numero || prev.depto || "",
        region: normalizedRegion || prev.region || "",
        comuna: normalizedRegion
          ? REGION_COMUNAS[normalizedRegion].includes(userComuna)
            ? userComuna
            : REGION_COMUNAS[normalizedRegion][0]
          : prev.comuna || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // When region changes, update comunasOptions and reset comuna if needed
  useEffect(() => {
    if (form.region && REGION_COMUNAS[form.region]) {
      setComunasOptions(REGION_COMUNAS[form.region]);
      // if current comuna not in new list, set to first option (placeholder)
      if (!REGION_COMUNAS[form.region].includes(form.comuna)) {
        setForm((prev) => ({
          ...prev,
          comuna: REGION_COMUNAS[form.region][0] || "",
        }));
      }
    } else {
      setComunasOptions(["Selecciona una comuna"]);
      setForm((prev) => ({ ...prev, comuna: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.region]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerMsg(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre || !form.nombre.trim())
      newErrors.nombre = "Nombre requerido";
    if (!form.email || !form.email.trim()) newErrors.email = "Correo requerido";
    if (!form.calle || !form.calle.trim())
      newErrors.calle = "Calle / dirección requerida";
    if (!form.region || !form.region.trim())
      newErrors.region = "Región requerida";
    // ensure comuna is not the placeholder
    if (!form.comuna || form.comuna === "Selecciona una comuna")
      newErrors.comuna = "Comuna requerida";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg(null);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setServerMsg({ type: "danger", text: "El carrito está vacío." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular procesamiento
      await new Promise((r) => setTimeout(r, 900));

      // Generar order id simple y datos de pedido
      const orderId = "ORDER" + String(Date.now()).slice(-8);
      const orderData = {
        id: orderId,
        total: Number(total || 0),
        items: cartItems.map((it) => ({ ...it })), // copia
        customer: { ...form },
        createdAt: new Date().toISOString(),
      };

      const ok = Math.random() < 0.5; // 50% probabilidad

      if (ok) {
        try {
          sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
        } catch (err) {
          // ignore
        }
        try {
          clearCart();
        } catch (err) {
          // ignore
        }
        router.push(`/checkout/success?order=${orderId}`);
      } else {
        try {
          sessionStorage.setItem("lastFailedOrder", JSON.stringify(orderData));
        } catch (err) {
          // ignore
        }
        router.push(`/checkout/failed?order=${orderId}`);
      }
    } catch (err) {
      setServerMsg({
        type: "danger",
        text: err?.message || "Error procesando el pago",
      });
      setIsSubmitting(false);
    }
  };

  // Mientras se determina si está bloqueado, mostrar spinner
  if (blocked === null) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  // Si está bloqueado (carrito vacío) mostramos mensaje y botones para ir a productos o carrito
  if (blocked) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <h4 className="mb-3">Tu carrito está vacío</h4>
                <p className="text-muted">
                  Debes agregar al menos un producto al carrito antes de acceder
                  al checkout.
                </p>

                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/productos")}
                  >
                    Ver Productos
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => router.push("/carrito")}
                  >
                    Ir al Carrito
                  </Button>
                </div>

                <div className="mt-3 text-muted small">
                  Si sigues teniendo problemas, asegúrate de que tu sesión esté
                  activa y que los productos se hayan agregado correctamente.
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Si no está bloqueado: renderizar checkout completo
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-3">Carrito de compra</h4>

              {serverMsg && (
                <Alert
                  variant={serverMsg.type}
                  onClose={() => setServerMsg(null)}
                  dismissible
                >
                  {serverMsg.text}
                </Alert>
              )}

              <Row>
                <Col lg={8}>
                  <Table
                    responsive
                    bordered
                    hover
                    size="sm"
                    className="align-middle"
                  >
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Imagen</th>
                        <th>Nombre</th>
                        <th style={{ width: 110 }}>Precio</th>
                        <th style={{ width: 110 }}>Cantidad</th>
                        <th style={{ width: 140 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems && cartItems.length > 0 ? (
                        cartItems.map((it) => (
                          <tr key={it.id}>
                            <td>
                              {it.imagen ? (
                                <img
                                  src={it.imagen}
                                  alt={it.nombre}
                                  style={{
                                    width: 64,
                                    height: 48,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                  }}
                                  onError={(e) =>
                                    (e.target.src =
                                      "/assets/productos/placeholder.png")
                                  }
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 64,
                                    height: 48,
                                    background: "#f5f5f5",
                                    borderRadius: 4,
                                  }}
                                />
                              )}
                            </td>
                            <td>{it.nombre}</td>
                            <td className="text-end">
                              ${Number(it.precio || 0).toLocaleString("es-CL")}
                            </td>
                            <td className="text-center">
                              {Number(it.cantidad || 0)}
                            </td>
                            <td className="text-end">
                              $
                              {(
                                Number(it.precio || 0) *
                                  Number(it.cantidad || 0) || 0
                              ).toLocaleString("es-CL")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-muted py-4"
                          >
                            Tu carrito está vacío.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>

                <Col lg={4}>
                  <Card className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0">Resumen</h6>
                          <small className="text-muted">
                            Productos: {cartItems.length}
                          </small>
                        </div>
                        <Badge bg="primary" pill>
                          Total a pagar
                        </Badge>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="fw-bold">Total</div>
                        <div className="h5 text-primary">
                          ${Number(total || 0).toLocaleString("es-CL")}
                        </div>
                      </div>

                      <div className="mt-3 text-muted small">
                        Una vez realizado el pago, recibirás un correo con los
                        detalles y despacho.
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Se eliminó la sección "Método de pago" solicitada */}
                </Col>
              </Row>

              <hr className="my-4" />

              <h5>Información del cliente</h5>
              <p className="text-muted">Completa la siguiente información</p>

              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Nombre *</Form.Label>
                      <Form.Control
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        isInvalid={!!errors.nombre}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.nombre}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Apellidos</Form.Label>
                      <Form.Control
                        name="apellidos"
                        value={form.apellidos}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Correo *</Form.Label>
                      <Form.Control
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        isInvalid={!!errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <h5>Dirección de entrega</h5>
                <p className="text-muted">
                  Ingresa la dirección de forma detallada
                </p>

                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Calle / Dirección *</Form.Label>
                      <Form.Control
                        name="calle"
                        value={form.calle}
                        onChange={handleChange}
                        isInvalid={!!errors.calle}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.calle}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Departamento (opcional)</Form.Label>
                      <Form.Control
                        name="depto"
                        value={form.depto}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Región *</Form.Label>
                      <Form.Select
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                        isInvalid={!!errors.region}
                      >
                        <option value="">Selecciona una región</option>
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.region}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Comuna *</Form.Label>
                      <Form.Select
                        name="comuna"
                        value={form.comuna}
                        onChange={handleChange}
                        isInvalid={!!errors.comuna}
                      >
                        {comunasOptions && comunasOptions.length > 0 ? (
                          comunasOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))
                        ) : (
                          <option value="">Selecciona una comuna</option>
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.comuna}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>
                        Indicaciones para la entrega (opcional)
                      </Form.Label>
                      <Form.Control
                        name="instrucciones"
                        as="textarea"
                        rows={3}
                        value={form.instrucciones}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => router.push("/carrito")}
                  >
                    Volver al carrito
                  </Button>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                  >
                    {isSubmitting
                      ? "Procesando..."
                      : `Pagar ahora $ ${Number(total || 0).toLocaleString(
                          "es-CL"
                        )}`}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center text-muted small mt-3">
            Nota: Si el usuario ha iniciado sesión, parte de esta información se
            rellenará automáticamente.
          </div>
        </Col>
      </Row>
    </Container>
  );
}
