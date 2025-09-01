"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas";
import {
  limpiarFormulario,
  validarEnteroPositivo,
  validarEnteroNoNegativo,
  validarFloatPositivo,
} from "@/config/validacionesForm";
import { calcularCafeDesdeProducto } from "@/lib/calculoCafe";

export default function FormDeposito() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [depositoCantidadQQ, setDepositoCantidadQQ] = useState("");
  const [depositoTotalSacos, setDepositoTotalSacos] = useState("");
  const [depositoEn, setDepositoEn] = useState("");
  const [depositoDescripcion, setDepositoDescripcion] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");

  const [errors, setErrors] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // Carga clientes y productos
  useEffect(() => {
    async function cargarDatos() {
      try {
        const clientesData = await obtenerClientesSelect(messageApi);
        const productosData = await obtenerProductosSelect(messageApi);
        setClientes(clientesData);
        setProductos(productosData);
      } catch (err) {
        console.error(err);
        messageApi.error("Error cargando clientes o productos");
      }
    }
    cargarDatos();
  }, [messageApi]);

  useEffect(() => {
    if (!producto) return;

    const resultado = calcularCafeDesdeProducto(
      pesoBruto,
      depositoTotalSacos,
      producto // objeto con value, label y data
    );
    setDepositoCantidadQQ(resultado.oro);
  }, [pesoBruto, depositoTotalSacos, producto]);

  // Validación
  const validarDatos = () => {
    const newErrors = {}; // en JS no hace falta tipar nada

    fields.forEach((f) => {
      if (typeof f.validator === "function") {
        const error = f.validator(f.value);
        if (error) newErrors[f.label] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      messageApi.warning("Complete los campos obligatorios correctamente");
      return false;
    }
    return true;
  };

  const handleRegistrarClick = () => {
    if (validarDatos()) setPreviewVisible(true);
  };

  const handleConfirmar = async () => {
    setSubmitting(true);
    const data = {
      clienteID: cliente.value,
      depositoTipoCafe: producto.value,
      depositoCantidadQQ: parseFloat(depositoCantidadQQ),
      depositoTotalSacos: depositoTotalSacos
        ? parseInt(depositoTotalSacos, 10)
        : 0,
      depositoEn: depositoEn || "Depósito",
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
        limpiarFormulario({
          setCliente,
          setProducto,
          setPesoBruto,
          setDepositoCantidadQQ,
          setDepositoTotalSacos,
          setDepositoEn,
          setDepositoDescripcion,
          setErrors,
        });
      } else {
        const err = await res.json();
        messageApi.error(err.error || "Error al registrar depósito");
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Error enviando datos al servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    {
      label: "Cliente",
      value: cliente,
      setter: setCliente,
      type: "select",
      options: clientes,
      required: true,
      error: errors["Cliente"],
      validator: (v) => (v ? null : "Seleccione un cliente"),
    },
    {
      label: "Tipo de Café",
      value: producto,
      setter: setProducto,
      type: "select",
      options: productos,
      required: true,
      error: errors["Tipo de Café"],
      validator: (v) => (v ? null : "Seleccione un café"),
    },
    {
      label: "Peso Bruto",
      value: pesoBruto,
      setter: setPesoBruto,
      type: "Float",
      required: true,
      error: errors["Peso Bruto"],
      validator: validarFloatPositivo,
    },
    {
      label: "Total Sacos",
      value: depositoTotalSacos,
      setter: setDepositoTotalSacos,
      type: "integer",
      required: true,
      error: errors["Total Sacos"],
      validator: (v) =>
        v === "" || v === null || v === undefined
          ? "Ingrese total de sacos"
          : validarEnteroNoNegativo(v)
          ? null
          : "Total sacos debe ser >= 0",
    },
    {
      label: "Quintales Oro",
      value: depositoCantidadQQ,
      setter: setDepositoCantidadQQ,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Quintales Oro"],
    },
    {
      label: "Descripción",
      value: depositoDescripcion,
      setter: setDepositoDescripcion,
      type: "textarea",
    },
  ];

  return (
    <>
      {contextHolder}
      <Formulario
        title="Registrar Depósito"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Depósito",
          onClick: handleRegistrarClick,
          type: "primary",
        }}
      />
      <PreviewModal
        open={previewVisible}
        title="Previsualización del Depósito"
        onCancel={() => setPreviewVisible(false)}
        onConfirm={handleConfirmar}
        confirmLoading={submitting}
        fields={fields.map((f) => ({
          label: f.label,
          value:
            f.type === "select"
              ? f.options?.find((o) => o.value === f.value?.value)?.label
              : f.value ||
                (f.label === "Total Sacos"
                  ? 0
                  : f.label === "Depósito en"
                  ? "Depósito"
                  : "-"),
        }))}
      />
    </>
  );
}
