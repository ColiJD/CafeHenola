"use client";
import { Form, Input, Button, Modal, Row, Col, message } from "antd";
import { useState, useEffect } from "react";
import Select from "react-select";
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas";

export default function DepositoForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [depositoCantidadQQ, setDepositoCantidadQQ] = useState("");
  const [depositoTotalSacos, setDepositoTotalSacos] = useState("");
  const [depositoEn, setDepositoEn] = useState("");
  const [depositoDescripcion, setDepositoDescripcion] = useState("");

  const [previewVisible, setPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Hook para mensajes
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resClientes, resProductos] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/productos"),
        ]);
        const clientesData = await resClientes.json();
        const productosData = await resProductos.json();

        setClientes(
          clientesData.map((c) => ({
            value: c.clienteID,
            label: `${c.clienteNombre} ${c.clienteApellido}`,
          }))
        );
        setProductos(
          productosData.map((p) => ({
            value: p.productID,
            label: p.productName,
          }))
        );
      } catch (error) {
        console.error("Error cargando datos:", error);
        messageApi.error("Error cargando clientes o productos");
      }
    }
    cargarDatos();
  }, [messageApi]);

  const validarDatos = () => {
    const newErrors = {};
    if (!cliente) newErrors.cliente = "Seleccione un cliente";
    if (!producto) newErrors.producto = "Seleccione un tipo de café";
    if (!depositoCantidadQQ)
      newErrors.depositoCantidadQQ = "Ingrese cantidad QQ";
    else if (
      !/^\d+$/.test(depositoCantidadQQ) ||
      parseInt(depositoCantidadQQ, 10) <= 0
    )
      newErrors.depositoCantidadQQ = "Cantidad QQ debe ser entero mayor a 0";
    if (
      depositoTotalSacos &&
      (!/^\d+$/.test(depositoTotalSacos) ||
        parseInt(depositoTotalSacos, 10) < 0)
    )
      newErrors.depositoTotalSacos = "Total sacos debe ser entero positivo";
    if (!depositoEn) newErrors.depositoEn = "Ingrese depósito en";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      messageApi.warning("Complete los campos obligatorios correctamente");
      return false;
    }
    return true;
  };

  const handleRegistrarClick = (e) => {
    e.preventDefault();
    if (validarDatos()) {
      messageApi.info("Revisa la previsualización antes de confirmar");
      setPreviewVisible(true);
    }
  };

  const handleConfirmar = async () => {
    setSubmitting(true);
    const data = {
      clienteID: cliente.value,
      depositoTipoCafe: producto.value,
      depositoCantidadQQ: parseInt(depositoCantidadQQ, 10),
      depositoTotalSacos: depositoTotalSacos
        ? parseInt(depositoTotalSacos, 10)
        : 0,
      depositoEn,
      depositoDescripcion,
    };

    try {
      const res = await fetch("/api/deposito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        messageApi.success("Depósito registrado exitosamente");
        setPreviewVisible(false);
        setCliente(null);
        setProducto(null);
        setDepositoCantidadQQ("");
        setDepositoTotalSacos("");
        setDepositoEn("");
        setDepositoDescripcion("");
        setErrors({});
      } else {
        const err = await res.json();
        messageApi.error(err.error || "Error al registrar depósito");
      }
    } catch (error) {
      console.error(error);
      messageApi.error("Error enviando los datos al servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnteroInput = (setter) => (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setter(value);
  };

  return (
    <>
      {contextHolder}
      <Form layout="vertical" onSubmitCapture={handleRegistrarClick}>
        <h2 style={{ textAlign: "left", marginBottom: "1rem" }}>Deposito</h2>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Cliente"
              required
              validateStatus={errors.cliente ? "error" : ""}
              help={errors.cliente}
            >
              <Select
                options={clientes}
                value={cliente}
                onChange={setCliente}
                placeholder="Seleccione un cliente"
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: errors.cliente ? "red" : base.borderColor,
                  }),
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Tipo de Café"
              required
              validateStatus={errors.producto ? "error" : ""}
              help={errors.producto}
            >
              <Select
                options={productos}
                value={producto}
                onChange={setProducto}
                placeholder="Seleccione café"
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: errors.producto ? "red" : base.borderColor,
                  }),
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Cantidad QQ"
              required
              validateStatus={errors.depositoCantidadQQ ? "error" : ""}
              help={errors.depositoCantidadQQ}
            >
              <Input
                type="text"
                value={depositoCantidadQQ}
                onChange={handleEnteroInput(setDepositoCantidadQQ)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Total Sacos"
              validateStatus={errors.depositoTotalSacos ? "error" : ""}
              help={errors.depositoTotalSacos}
            >
              <Input
                type="text"
                value={depositoTotalSacos}
                onChange={handleEnteroInput(setDepositoTotalSacos)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Depósito en"
              required
              validateStatus={errors.depositoEn ? "error" : ""}
              help={errors.depositoEn}
            >
              <Input
                value={depositoEn}
                onChange={(e) => setDepositoEn(e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Descripción">
              <Input.TextArea
                value={depositoDescripcion}
                onChange={(e) => setDepositoDescripcion(e.target.value)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          onClick={handleRegistrarClick}
          disabled={submitting}
        >
          Registrar Depósito
        </Button>

        <Modal
          open={previewVisible}
          title="Previsualización del Depósito"
          onCancel={() => setPreviewVisible(false)}
          onOk={handleConfirmar}
          confirmLoading={submitting}
          okText="Confirmar"
          cancelText="Cancelar"
        >
          <p>
            <strong>Cliente:</strong> {cliente?.label}
          </p>
          <p>
            <strong>Café:</strong> {producto?.label}
          </p>
          <p>
            <strong>Cantidad QQ:</strong> {depositoCantidadQQ}
          </p>
          <p>
            <strong>Total Sacos:</strong> {depositoTotalSacos || 0}
          </p>
          <p>
            <strong>Depósito en:</strong> {depositoEn}
          </p>
          <p>
            <strong>Descripción:</strong> {depositoDescripcion || "-"}
          </p>
        </Modal>
      </Form>
    </>
  );
}
