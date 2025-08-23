"use client";
import { useEffect, useState } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import {
  limpiarFormulario,
  validarEnteroPositivo,
} from "@/config/validacionesForm";
import { validarDatos } from "@/lib/validacionesForm";
import { obtenerClientesSelect } from "@/lib/consultas";

export default function LiquidacionContratoForm() {
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]);

  const [formState, setFormState] = useState({
    cliente: null,
    contrato: null,
    tipoCafeID: 0,
    tipoCafeNombre: "",
    saldoDisponibleQQ: 0,
    saldoDisponibleLps: 0,
    precioQQ: 0,
    cantidadLiquidar: "",
    totalSacos: "",
    totalLiquidacion: 0,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleChange = (key, value) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  // ------------------------------
  // Calcular total automáticamente
  // ------------------------------
  useEffect(() => {
    const { cantidadLiquidar, precioQQ } = formState;

    // Total en Lps
    if (cantidadLiquidar && precioQQ) {
      handleChange(
        "totalLiquidacion",
        parseFloat(cantidadLiquidar) * parseFloat(precioQQ)
      );
    } else {
      handleChange("totalLiquidacion", 0);
    }

    // Total de sacos (1 QQ = 2 sacos)
    if (cantidadLiquidar) {
      handleChange("totalSacos", parseInt(cantidadLiquidar) * 2);
    } else {
      handleChange("totalSacos", 0);
    }
  }, [formState.cantidadLiquidar, formState.precioQQ]);

  // ------------------------------
  // Cargar clientes
  // ------------------------------
  useEffect(() => {
    async function cargarDatos() {
      try {
        setClientes(await obtenerClientesSelect(messageApi));
      } catch {
        messageApi.error("Error cargando clientes");
      }
    }
    cargarDatos();
  }, [messageApi]);

  // ------------------------------
  // Cargar contratos pendientes al cambiar cliente
  // ------------------------------
  useEffect(() => {
    async function cargarContratos(clienteID) {
      try {
        const res = await fetch(
          `/api/contratos/pendientes/${formState.cliente.value}`
        );
        const data = await res.json();
        setContratos(
          data.map((c) => ({
            value: c.contratoID,
            label: `Contrato #${c.contratoID} - ${c.contratoCantidadQQ} QQ`,
            tipoCafeID: c.tipoCafeID,
            tipoCafeNombre: c.tipoCafeNombre,
          }))
        );
        handleChange("contrato", null);
      } catch {
        messageApi.error("Error cargando contratos pendientes");
      }
    }

    if (formState.cliente) {
      cargarContratos(formState.cliente.value);
    } else {
      setContratos([]);
      handleChange("contrato", null);
    }
  }, [formState.cliente]);

  // ------------------------------
  // Cargar saldo al cambiar contrato
  // ------------------------------
  useEffect(() => {
    async function cargarSaldo() {
      if (!formState.contrato) {
        handleChange("saldoDisponibleQQ", 0);
        handleChange("saldoDisponibleLps", 0);
        handleChange("tipoCafeID", 0);
        handleChange("tipoCafeNombre", "");
        handleChange("precioQQ", 0);
        handleChange("totalLiquidacion", 0);
        return;
      }

      try {
        const res = await fetch(
          `/api/contratos/saldoDisponible/${formState.contrato.value}`
        );
        const data = await res.json();

        if (!data || data.saldoDisponibleQQ === undefined) {
          messageApi.error(
            "No se encontró saldo disponible para este contrato"
          );
          return;
        }

        handleChange("saldoDisponibleQQ", data.saldoDisponibleQQ);
        handleChange("saldoDisponibleLps", data.saldoDisponibleLps);
        handleChange("tipoCafeID", data.tipoCafeID || 0);
        handleChange("tipoCafeNombre", data.tipoCafeNombre || "");
        handleChange("precioQQ", data.precioQQ || 0);
        handleChange("totalLiquidacion", 0);
      } catch {
        messageApi.error("Error cargando saldo disponible");
      }
    }
    cargarSaldo();
  }, [formState.contrato]);

  // ------------------------------
  // Abrir modal de previsualización
  // ------------------------------
  const handleRegistrarClick = () => {
    if (validarDatos(fields, messageApi, setErrors)) setPreviewVisible(true);
  };

  // ------------------------------
  // Confirmar envío
  // ------------------------------
  const handleConfirmar = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const cantidad = parseFloat(formState.cantidadLiquidar);

    if (cantidad > formState.saldoDisponibleQQ) {
      messageApi.error(
        `La cantidad (${cantidad}) supera el saldo disponible (${formState.saldoDisponibleQQ})`
      );
      setSubmitting(false);
      return;
    }

    const data = {
      contratoID: formState.contrato.value,
      clienteID: formState.cliente.value,
      tipoCafe: formState.tipoCafeID,
      cantidadQQ: cantidad,
      precioQQ: formState.precioQQ,
      totalSacos: parseInt(formState.totalSacos),
      tipoDocumento: "EntregaContrato",
      descripcion: "Liquidación de contrato",
      liqEn: "Bodega",
    };

    try {
      const res = await fetch("/api/contratos/entregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        messageApi.success(
          `Liquidación registrada ✅. Saldo disponible: ${result.saldoDespuesQQ} QQ / ${result.saldoDespuesLps} Lps`
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
        messageApi.error(result.error || "No se pudo registrar la liquidación");
      }
    } catch {
      messageApi.error("Error enviando los datos");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------
  // Configuración de campos
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
      key: "contrato",
      label: "Contrato Pendiente",
      type: "select",
      options: contratos,
      required: true,
      validator: (v) => (!!v ? null : "Seleccione un contrato"),
    },
    {
      key: "tipoCafeNombre",
      label: "Tipo de Café",
      type: "text",
      readOnly: true,
    },
    {
      key: "precioQQ",
      label: "Precio por QQ (Lps)",
      type: "Float",
      readOnly: true,
    },
    {
      key: "saldoDisponibleQQ",
      label: "Saldo disponible (QQ)",
      type: "Float",
      readOnly: true,
    },
    {
      key: "saldoDisponibleLps",
      label: "Saldo disponible (Lps)",
      type: "Float",
      readOnly: true,
    },
    {
      key: "cantidadLiquidar",
      label: "Cantidad a liquidar (QQ)",
      type: "integer",
      required: true,
      validator: (v) => {
        if (!validarEnteroPositivo(v)) return "Debe ser un entero > 0";
        if (Number(v) > formState.saldoDisponibleQQ)
          return "No puede ser mayor al saldo disponible";
        return null;
      },
    },
    {
      key: "totalSacos",
      label: "Total de Sacos",
      type: "integer",
      readOnly: true,
      value: formState.totalSacos,
    },

    {
      key: "totalLiquidacion",
      label: "Total a pagar (Lps)",
      type: "Float",
      readOnly: true,
      value: formState.totalLiquidacion,
    },
  ];

  const fields = fieldsConfig.map((f) => ({
    ...f,
    value:
      f.key === "totalLiquidacion"
        ? formState.totalLiquidacion
        : formState[f.key],
    setter:
      f.key !== "totalLiquidacion" ? (v) => handleChange(f.key, v) : () => {},
    error: errors[f.label] || null,
  }));

  return (
    <>
      {contextHolder}
      <Formulario
        title="Liquidación de Contrato"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Liquidación",
          onClick: handleRegistrarClick,
          type: "primary",
          disabled: submitting || formState.saldoDisponibleQQ <= 0,
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
