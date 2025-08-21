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
} from "@/config/validacionesForm";

export default function FormDeposito() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [depositoCantidadQQ, setDepositoCantidadQQ] = useState("");
  const [depositoTotalSacos, setDepositoTotalSacos] = useState("");
  const [depositoEn, setDepositoEn] = useState("");
  const [depositoDescripcion, setDepositoDescripcion] = useState("");

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

  // Validación
  const validarDatos = () => {
    const newErrors = {};

    if (!cliente) newErrors["Cliente"] = "Seleccione un cliente";
    if (!producto) newErrors["Tipo de Café"] = "Seleccione un café";

    if (!validarEnteroPositivo(depositoCantidadQQ))
      newErrors["Cantidad QQ"] = "Cantidad QQ debe ser un entero > 0";

    if (depositoTotalSacos && !validarEnteroNoNegativo(depositoTotalSacos))
      newErrors["Total Sacos"] = "Total sacos debe ser >= 0";

    if (depositoEn && depositoEn.trim() === "")
      newErrors["Depósito en"] = "Ingrese depósito";

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
      depositoCantidadQQ: parseInt(depositoCantidadQQ, 10),
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
    },
    {
      label: "Tipo de Café",
      value: producto,
      setter: setProducto,
      type: "select",
      options: productos,
      required: true,
      error: errors["Tipo de Café"],
    },
    {
      label: "Cantidad QQ",
      value: depositoCantidadQQ,
      setter: setDepositoCantidadQQ,
      type: "integer",
      required: true,
      error: errors["Cantidad QQ"],
    },
    {
      label: "Total Sacos",
      value: depositoTotalSacos,
      setter: setDepositoTotalSacos,
      type: "integer",
      error: errors["Total Sacos"],
    },
    {
      label: "Depósito en",
      value: depositoEn,
      setter: setDepositoEn,
      required: false,
      error: errors["Depósito en"],
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
