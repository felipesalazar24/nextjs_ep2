"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validaciones básicas
    if (!formData.email.trim()) {
      setErrors({ email: "Por favor ingresa tu correo electrónico." });
      setIsLoading(false);
      return;
    }

    if (!formData.password) {
      setErrors({ password: "Por favor ingresa tu contraseña." });
      setIsLoading(false);
      return;
    }

    // Intentar login (ahora await para usar el endpoint JSON)
    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (result.isAdmin) {
        alert(`¡Bienvenido administrador ${formData.email}!`);
      } else {
        alert("¡Inicio de sesión exitoso!");
      }
      router.push("/");
    } else {
      setErrors({ general: result.message });
    }

    setIsLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h2 text-primary">Iniciar Sesión</h1>
                <p className="text-muted">Ingresa a tu cuenta</p>
              </div>

              {errors.general && (
                <Alert variant="danger" className="text-center">
                  {errors.general}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!errors.email}
                    placeholder="tu@email.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Contraseña */}
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    isInvalid={!!errors.password}
                    placeholder="Tu contraseña"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted">
                  ¿No tienes una cuenta?{" "}
                  <Link
                    href="/registro"
                    className="text-primary text-decoration-none"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>

              {/* Información de administradores (solo para desarrollo) */}
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="small fw-bold mb-2">
                  👨‍💻 Accesos de Administrador:
                </h6>
                <div className="small text-muted">
                  <div>mati.vegaa@duocuc.cl / adminmatias</div>
                  <div>fe.salazarv@duocuc.cl / adminfelipe</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
