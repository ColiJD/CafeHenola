"use client";
import { useEffect, useState } from "react";
import { message, Tooltip } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import {
  limpiarFormulario,
  validarEnteroPositivo,
} from "@/config/validacionesForm";
import { validarDatos } from "@/lib/validacionesForm";
import {
  obtenerClientesSelect,
  obtenerProductosSelect,
  obtenerSaldoContrato,
  obtenerContratosPendientes,
} from "@/lib/consultas";
import { calcularCafeDesdeProducto } from "@/lib/calculoCafe";

export default function LiquidacionContratoForm() {
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [formState, setFormState] = useState({
    cliente: null,
    contrato: null,
    tipoCafeID: "",
    tipoCafeNombre: "",
    saldoDisponibleQQ: "",
    saldoDisponibleLps: "",
    precioQQ: "",
    cantidadLiquidar: "",
    totalSacos: "",
    totalLiquidacion: "0.00",
    oro: "0.00",
    retencion: "0.00",
    producto: null,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleChange = (key, value) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const { cantidadLiquidar, contrato, cliente } = formState;

  // ------------------------------
  // Cargar clientes y productos
  // ------------------------------
  useEffect(() => {
    async function cargarDatos() {
      try {
        const clientesData = await obtenerClientesSelect(messageApi);
        const productosData = await obtenerProductosSelect(messageApi);
        setClientes(clientesData);
        setProductos(productosData);
      } catch (err) {
        console.error(err);
        messageApi.error("⚠️ Error cargando clientes o productos.");
      }
    }
    cargarDatos();
  }, [messageApi]);

  // ------------------------------
  // Cargar contratos pendientes al cambiar cliente
  // ------------------------------
  useEffect(() => {
    async function cargar() {
      if (cliente) {
        const contratosData = await obtenerContratosPendientes(cliente.value);
        setContratos(contratosData);
        setFormState((prev) => ({ ...prev, contrato: null }));
      } else {
        setContratos([]);
        setFormState((prev) => ({ ...prev, contrato: null }));
      }
    }

    cargar();
  }, [cliente]);

  // ------------------------------
  // Cargar saldo al cambiar contrato
  // ------------------------------
  useEffect(() => {
    async function cargar() {
      if (!contrato) {
        setFormState((prev) => ({
          ...prev,
          saldoDisponibleQQ: 0,
          saldoDisponibleLps: 0,
          tipoCafeID: 0,
          tipoCafeNombre: "",
          precioQQ: 0,
          totalLiquidacion: "0.00",
          totalSacos: "",
          oro: "0.00",
          retencion: "0.00",
          producto: null,
        }));
        return;
      }

      const saldoData = await obtenerSaldoContrato(contrato.value);

      if (!saldoData) {
        messageApi.error("No se encontró saldo disponible para este contrato");
        return;
      }

      // buscar el producto asociado al tipo de café
      const productoSeleccionado = productos.find(
        (p) => p.value === saldoData.tipoCafeID
      );

      setFormState((prev) => ({
        ...prev,
        ...saldoData,
        producto: productoSeleccionado || null,
      }));
    }

    cargar();
  }, [contrato, messageApi, productos]);

  // ------------------------------
  // Recalcular valores cuando cambia cantidad/precio
  // ------------------------------
  useEffect(() => {
    if (!formState.producto) return;

    const resultado = calcularCafeDesdeProducto(
      formState.cantidadLiquidar,
      formState.totalSacos,
      formState.producto,
      formState.precioQQ
    );

    setFormState((prev) => ({
      ...prev,
      oro: resultado.oro,
      retencion: resultado.retencion,
      totalLiquidacion: resultado.total,
    }));
  }, [
    formState.cantidadLiquidar,
    formState.precioQQ,
    formState.totalSacos,
    formState.producto,
  ]);

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


    if (formState.oro > formState.saldoDisponibleQQ) {
      messageApi.error(
        `La cantidad (${formState.oro}) supera el saldo disponible (${formState.saldoDisponibleQQ})`
      );
      setSubmitting(false);
      return;
    }

    const data = {
      contratoID: contrato.value,
      clienteID: cliente.value,
      tipoCafe: formState.tipoCafeID,
      cantidadQQ: formState.oro ? parseFloat(formState.oro) : 0,
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
      label: "Peso Bruto (Kg)",
      type: "Float",
      required: true,
      error: errors["Peso Bruto"],
      validator: (v) => (v > 0 ? null : "Ingrese un peso válido"),
    },
    {
      key: "totalSacos",
      label: "Total de Sacos",
      type: "integer",
      value: formState.totalSacos,
      error: errors["Total de Sacos"],
      validator: (v) => (v > 0 ? null : "Ingrese un total de sacos válido"),
    },
    {
      key: "oro",
      label: "Quintales Oro",
      type: "Float",
      readOnly: true,
      value: formState.oro,
    },
    {
      key: "retencion",
      label: "Retención (QQ)",
      type: "Float",
      readOnly: true,
      value: formState.retencion,
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
    value: formState[f.key],
    setter: f.readOnly ? () => {} : (v) => handleChange(f.key, v),
    error: errors[f.label] || null,
  }));

  return (
    <>
      {contextHolder}
      <Formulario
        title="Entrega de Contrato"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Entrega",
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
