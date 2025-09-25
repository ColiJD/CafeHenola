"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Form, Input, Button, message, Card, Spin } from "antd";
import Image from "next/image";
import frijolesImg from "@/img/frijoles.png";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [validToken, setValidToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // 👉 Manejar el token de forma segura
  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) {
      setValidToken(false);
      return;
    }
    setToken(t);

    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/validate-token?token=${t}`);
        const data = await res.json();
        setValidToken(data.valid);
      } catch {
        setValidToken(false);
      }
    }
    checkToken();
  }, [searchParams]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const data = await res.json();
      if (data.success) {
        messageApi.success("Contraseña actualizada correctamente");
        router.push("/login");
      } else {
        messageApi.error(data.message || "Error al actualizar la contraseña");
      }
    } catch {
      messageApi.error("Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <Spin spinning={true} tip="Verificando enlace..." size="large">
          <Card
            style={{
              width: 350,
              padding: 24,
              textAlign: "center",
              borderRadius: 16,
              boxShadow: "0px 6px 18px rgba(0,0,0,0.1)",
            }}
          ></Card>
        </Spin>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          padding: 16,
        }}
      >
        {contextHolder}
        <Card
          style={{
            padding: 24,
            textAlign: "center",
            borderRadius: 16,
            boxShadow: "0px 6px 18px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Enlace inválido o expirado</h2>
          <p>Por favor solicita un nuevo enlace de recuperación.</p>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
      }}
    >
      {contextHolder}
      <Row justify="center" style={{ width: "100%" }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card
            style={{
              width: "100%",
              padding: 24,
              textAlign: "center",
              borderRadius: 16,
              boxShadow: "0px 6px 18px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Image
                src={frijolesImg}
                alt="Logo Frijoles"
                width={120}
                height={120}
                style={{
                  borderRadius: "50%",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                  objectFit: "cover",
                }}
              />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
              Restablecer contraseña
            </h2>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 280 }}>
                <Form layout="vertical" onFinish={onFinish}>
                  <Form.Item
                    label="Nueva contraseña"
                    name="password"
                    rules={[
                      { required: true, message: "Ingrese nueva contraseña" },
                    ]}
                  >
                    <Input.Password placeholder="********" />
                  </Form.Item>
                  <Form.Item
                    label="Confirmar contraseña"
                    name="confirm"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Confirme su contraseña" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value)
                            return Promise.resolve();
                          return Promise.reject(
                            new Error("Las contraseñas no coinciden")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="********" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{ borderRadius: 8 }}
                    >
                      Actualizar contraseña
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
