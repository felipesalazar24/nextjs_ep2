// app/registro/page.jsx
'use client';

import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

// Diccionario de comunas por región
const comunasPorRegion = {
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban","..."],
    "Metropolitana": ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "..."],
    "O'Higgins": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo"],
    "Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "..."],
    "Ñuble": ["Bulnes", "Chillán", "Chillán Viejo", "Cobquecura", "Coelemu", "Coihueco", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Quillón", "Quirihue", "Ránquil", "San Carlos"],
    "Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete"],
    "Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén"],
    "Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón"],
    "Aysén": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Río Ibáñez", "Chile Chico", "Cochrane", "O'Higgins", "Tortel"],
    "Magallanes": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
};

export default function RegistroPage() {
    const { register } = useAuth();
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        password2: '',
        telefono: '',
        region: '',
        comuna: ''
    });
    
    const [errors, setErrors] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [comunas, setComunas] = useState([]);

    // Validaciones
    const validarEmail = (email) => {
        return /^[a-zA-Z0-9._%+-]+@(gmail\.com|duocuc\.cl|profesor\.duoc\.cl)$/.test(email);
    };

    const validarPassword = (pass) => {
        return pass.length >= 4 && pass.length <= 10;
    };

    const validarTelefono = (tel) => {
        if (tel.trim() === "") return true;
        const sanitized = tel.replace(/\s+/g, "");
        return /^\+569\d{8}$/.test(sanitized);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Actualizar comunas cuando cambia la región
        if (name === 'region') {
            setComunas(comunasPorRegion[value] || []);
            setFormData(prev => ({
                ...prev,
                comuna: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Validar nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = "Por favor ingresa tu nombre completo.";
        }

        // Validar email
        if (!formData.email.trim()) {
            newErrors.email = "Por favor ingresa tu correo electrónico.";
        } else if (!validarEmail(formData.email.trim())) {
            newErrors.email = "Solo se permiten dominios @gmail.com, @duocuc.cl o @profesor.duoc.cl";
        }

        // Validar contraseña
        if (!formData.password) {
            newErrors.password = "Por favor ingresa una contraseña.";
        } else if (!validarPassword(formData.password)) {
            newErrors.password = "La contraseña debe tener entre 4 y 10 caracteres.";
        }

        // Validar confirmación de contraseña
        if (!formData.password2 || formData.password !== formData.password2) {
            newErrors.password2 = "Las contraseñas no coinciden.";
        }

        // Validar teléfono
        if (!validarTelefono(formData.telefono)) {
            newErrors.telefono = "Ingresa un número válido (+569 12345678).";
        }

        // Validar región
        if (!formData.region) {
            newErrors.region = "Por favor selecciona una región.";
        }

        // Validar comuna
        if (!formData.comuna) {
            newErrors.comuna = "Por favor selecciona una comuna.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Intentar registro (ahora await para usar el endpoint JSON)
        const result = await register({
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            telefono: formData.telefono,
            region: formData.region,
            comuna: formData.comuna
        });

        if (result.success) {
            setShowAlert(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } else {
            setErrors({ general: result.message });
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow border-0">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h1 className="h2 text-primary">Crear Cuenta</h1>
                                <p className="text-muted">Regístrate para comenzar a comprar</p>
                            </div>

                            {showAlert && (
                                <Alert variant="success" className="text-center">
                                    ✅ Registro exitoso! Redirigiendo al login...
                                </Alert>
                            )}

                            {errors.general && (
                                <Alert variant="danger" className="text-center">
                                    {errors.general}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                {/* Nombre */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre Completo *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.nombre}
                                        placeholder="Ingresa tu nombre completo"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.nombre}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Email */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Correo Electrónico *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.email}
                                        placeholder="ejemplo@gmail.com"
                                    />
                                    <Form.Text className="text-muted">
                                        Solo se permiten: @gmail.com, @duocuc.cl, @profesor.duoc.cl
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Contraseña */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.password}
                                        placeholder="4-10 caracteres"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Confirmar Contraseña */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirmar Contraseña *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password2"
                                        value={formData.password2}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.password2}
                                        placeholder="Repite tu contraseña"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password2}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Teléfono */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono (Opcional)</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.telefono}
                                        placeholder="+569 12345678"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.telefono}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Región y Comuna */}
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Región *</Form.Label>
                                            <Form.Select
                                                name="region"
                                                value={formData.region}
                                                onChange={handleInputChange}
                                                isInvalid={!!errors.region}
                                            >
                                                <option value="">Selecciona una región</option>
                                                {Object.keys(comunasPorRegion).map(region => (
                                                    <option key={region} value={region}>
                                                        {region}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.region}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Comuna *</Form.Label>
                                            <Form.Select
                                                name="comuna"
                                                value={formData.comuna}
                                                onChange={handleInputChange}
                                                isInvalid={!!errors.comuna}
                                                disabled={!formData.region}
                                            >
                                                <option value="">Selecciona una comuna</option>
                                                {comunas.map(comuna => (
                                                    <option key={comuna} value={comuna}>
                                                        {comuna}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.comuna}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit" size="lg">
                                        Crear Cuenta
                                    </Button>
                                </div>
                            </Form>

                            <div className="text-center mt-4">
                                <p className="text-muted">
                                    ¿Ya tienes una cuenta?{' '}
                                    <Link href="/login" className="text-primary text-decoration-none">
                                        Inicia sesión aquí
                                    </Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}