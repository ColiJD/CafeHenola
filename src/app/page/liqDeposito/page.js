"use client";
import { useEffect, useState } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas";
import {
  limpiarFormulario,
  validarEnteroPositivo,
  validarFloatPositivo,
} from "@/config/validacionesForm";
import { validarDatos } from "@/lib/validacionesForm";

export default function DepositoForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [formState, setFormState] = useState({
    cliente: null,
    producto: null,
    depositoEn: "",
    depositoCantidadQQ: "",
    depositoPrecioQQ: "",
    depositoTipoDocumento: "",
    depositoDescripcion: "",
    saldoPendiente: 0,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleChange = (key, value) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const totalLiquidacion = (
    parseFloat(formState.depositoCantidadQQ || 0) *
    parseFloat(formState.depositoPrecioQQ || 0)
  ).toFixed(2);

  // ------------------------------
  // Cargar clientes y productos
  // ------------------------------
  useEffect(() => {
    async function cargarDatos() {
      try {
        setClientes(await obtenerClientesSelect(messageApi));
        setProductos(await obtenerProductosSelect(messageApi));
      } catch {
        messageApi.error("Error cargando clientes o productos");
      }
    }
    cargarDatos();
  }, [messageApi]);

  // ------------------------------
  // Actualiza saldo pendiente
  // ------------------------------
  const { cliente, producto } = formState;

  useEffect(() => {
    async function fetchSaldo() {
      if (!cliente || !producto) return handleChange("saldoPendiente", 0);
      try {
        const res = await fetch(
          `/api/liqDeposito?clienteID=${cliente.value}&tipoCafe=${producto.value}`
        );
        const data = await res.json();
        handleChange("saldoPendiente", data.saldoDisponible || 0);

        // Limpiar campos si saldo es 0
        if (!data.saldoDisponible || data.saldoDisponible <= 0) {
          handleChange("depositoCantidadQQ", "");
          handleChange("depositoPrecioQQ", "");
        }
      } catch {
        handleChange("saldoPendiente", 0);
      }
    }
    fetchSaldo();
  }, [cliente, producto]); // solo dependencias necesarias

  // ------------------------------
  // Mostrar modal de previsualización
  // ------------------------------
  const handleRegistrarClick = () => {
    if (validarDatos(fields, messageApi, setErrors)) setPreviewVisible(true);
  };

  // ------------------------------
  // Confirmar registro de la liquidación
  // ------------------------------
  const handleConfirmar = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validación: cantidad no puede superar saldo
    if (Number(formState.depositoCantidadQQ) > formState.saldoPendiente) {
      messageApi.error("La cantidad supera el saldo disponible del cliente.");
      setSubmitting(false);
      return;
    }

    const data = {
      clienteID: formState.cliente.value,
      tipoCafe: formState.producto.value,
      cantidadQQ: parseFloat(formState.depositoCantidadQQ),
      precioQQ: parseFloat(formState.depositoPrecioQQ),
      total: parseFloat(totalLiquidacion),
      tipoDocumento: formState.depositoTipoDocumento || "N/A",
      descripcion: formState.depositoDescripcion || "N/A",
      liqEn: formState.depositoEn || "Liquidación Depósito",
    };

    try {
      const res = await fetch("/api/liqDeposito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        messageApi.success(
          `Liquidación registrada. Saldo restante: ${result.saldoDespues}`
        );
        setPreviewVisible(false);
        limpiarFormulario({
          ...Object.fromEntries(
            Object.keys(formState).map((k) => [
              `set${k[0].toUpperCase() + k.slice(1)}`,
              (v) => handleChange(k, v),
            ])
          ),
        });
      } else {
        const err = await res.json();
        messageApi.error(err.error || "No se pudo registrar la liquidación");
      }
    } catch {
      messageApi.error("Error enviando los datos");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------
  // Configuración dinámica de campos
  // ------------------------------
  const fieldsConfig = [
    {
      key: "cliente",
      label: "Cliente",
      type: "select",
      options: clientes,
      required: true,
      validator: (v) => (!!v ? null : "Seleccione un cliente"),
    },
    {
      key: "producto",
      label: "Tipo de Café",
      type: "select",
      options: productos,
      required: true,
      validator: (v) => (!!v ? null : "Seleccione un café"),
    },
    {
      key: "saldoPendiente",
      label: "Saldo Disponible (QQ)",
      type: "Float",
      readOnly: true,
    },
    {
      key: "depositoPrecioQQ",
      label: "Precio por (QQ)",
      type: "Float",
      required: true,
      validator: validarFloatPositivo,
      // Deshabilitar si saldo es 0
      disabled: formState.saldoPendiente <= 0,
    },
    {
      key: "depositoCantidadQQ",
      label: "Cantidad a liquidar (QQ)",
      type: "integer",
      required: true,
      validator: (v) => {
        if (!validarEnteroPositivo(v)) return "Debe ser un entero > 0";
        if (Number(v) > formState.saldoPendiente)
          return "No puede ser mayor al saldo disponible";
        return null;
      },
      // Deshabilitar si saldo es 0
      disabled: formState.saldoPendiente <= 0,
    },
    {
      key: "totalLiquidacion",
      label: "Total a pagar",
      type: "Float",
      readOnly: true,
      value: totalLiquidacion,
    },
    { key: "depositoTipoDocumento", label: "Tipo de Documento" },
    { key: "depositoEn", label: "Liquidado en" },
    { key: "depositoDescripcion", label: "Descripción", type: "textarea" },
  ];

  // Mapear configuración a campos con estado y errores
  const fields = fieldsConfig.map((f) => ({
    ...f,
    value: f.key === "totalLiquidacion" ? totalLiquidacion : formState[f.key],
    setter:
      f.key !== "totalLiquidacion" ? (v) => handleChange(f.key, v) : () => {},
    error: errors[f.label] || null,
  }));

  // ------------------------------
  // Renderizado del formulario y modal de previsualización
  // ------------------------------
  return (
    <>
      {contextHolder}
      <Formulario
        title="Liquidar Depósito"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Liquidación",
          onClick: handleRegistrarClick,
          type: "primary",
          disabled: formState.saldoPendiente <= 0 || submitting,
        }}
      />
      <PreviewModal
        open={previewVisible}
        title="Previsualización de la liquidación"
        onCancel={() => setPreviewVisible(false)}
        onConfirm={handleConfirmar}
        confirmLoading={submitting}
        fields={fields.map((f) => ({
          label: f.label,
          value:
            f.type === "select"
              ? f.options?.find((o) => o.value === f.value?.value)?.label
              : f.value || "-",
        }))}
      />
    </>
  );
}
