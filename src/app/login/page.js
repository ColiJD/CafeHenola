"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Form, Input, Button, message, Card } from "antd";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    setLoading(false);
    console.log("RES LOGIN:", res);

    if (res.error) {
      message.error(res.error);
    } else {
      message.success("Bienvenido 👋");
      router.push("/"); // raíz protegida
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card title="Iniciar Sesión" className="w-96 shadow-lg rounded-xl">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Correo"
            name="email"
            rules={[{ required: true, message: "Ingrese su correo" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Ingrese su contraseña" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
