"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas";
import { calcularCafeDesdeProducto } from "@/lib/calculoCafe";
import {
  limpiarFormulario,
  validarEnteroNoNegativo,
  validarEnteroPositivo,
  validarFloatPositivo,
} from "@/config/validacionesForm";

export default function CompraForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [compraTipoDocumento, setCompraTipoDocumento] = useState("");
  const [compraEn, setCompraEn] = useState("");
  const [compraPrecioQQ, setCompraPrecioQQ] = useState("");
  const [compraCantidadQQ, setCompraCantidadQQ] = useState("");
  const [compraTotal, setCompraTotal] = useState(0);
  const [compraRetencio, setCompraRetencio] = useState(0);
  const [compraTotalSacos, setCompraTotalSacos] = useState("");
  const [compraDescripcion, setCompraDescripcion] = useState("");

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

  const handleRegistrarClick = () => {
    if (validarDatos()) setPreviewVisible(true);
  };

  useEffect(() => {
    if (!producto) return;

    const resultado = calcularCafeDesdeProducto(
      compraCantidadQQ,
      compraTotalSacos,
      producto, // objeto con value, label y data
      compraPrecioQQ
    );

    setCompraTotal(resultado.total);
    setCompraRetencio(resultado.retencion);
    setProducto((prev) => ({ ...prev, oro: resultado.oro })); // actualizar oro
  }, [compraCantidadQQ, compraTotalSacos, compraPrecioQQ, producto]);

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

  const handleConfirmar = async () => {
    setSubmitting(true);
    const data = {
      clienteID: cliente.value,
      compraTipoCafe: producto.value,
      compraTipoDocumento,
      compraCantidadQQ: parseFloat(producto?.oro),
      compraTotalSacos: compraTotalSacos ? parseInt(compraTotalSacos, 10) : 0,
      compraPrecioQQ: parseFloat(compraPrecioQQ),
      compraRetencio: parseFloat(compraRetencio),
      compraTotal: parseFloat(compraTotal),
      compraEn: compraEn || "Compra Directa",
      compraMovimiento: "Entrada",
      compraDescripcion,
    };

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        messageApi.success("Compra Directa registrada exitosamente");
        setPreviewVisible(false);
        limpiarFormulario({
          setCliente,
          setProducto,
          setCompraCantidadQQ,
          setCompraTotalSacos,
          setCompraEn,
          setCompraDescripcion,
          setCompraTipoDocumento,
          setCompraRetencio,
          setCompraTotal,
          setCompraPrecioQQ,
          setErrors,
        });
      } else {
        const err = await res.json();
        messageApi.error(err.error || "Error al registrar compra directa");
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
      validator: (v) => (!!v ? null : "Seleccione un cliente"),
    },
    {
      label: "Tipo de Café",
      value: producto,
      setter: setProducto,
      type: "select",
      options: productos,
      required: true,
      error: errors["Tipo de Café"],
      validator: (v) => (!!v ? null : "Seleccione un café"),
    },

    {
      label: "Peso Bruto",
      value: compraCantidadQQ,
      setter: setCompraCantidadQQ,
      type: "Float",
      required: true,
      error: errors["Peso Bruto"],
      validator: validarFloatPositivo,
    },
    {
      label: "Total Sacos",
      value: compraTotalSacos,
      setter: setCompraTotalSacos,
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
      label: "Precio",
      value: compraPrecioQQ,
      setter: setCompraPrecioQQ,
      type: "Float",
      required: true,
      error: errors["Precio"],
      validator: validarFloatPositivo,
    },

    {
      label: "Total",
      value: compraTotal,
      setter: setCompraTotal,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Total"],
    },

    {
      label: "Quintales Oro",
      value: producto?.oro || 0,
      setter: setProducto,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Quintales Oro"],
    },

    {
      label: "Retencion",
      value: compraRetencio,
      setter: setCompraRetencio,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Retencion"],
    },
    {
      label: "Descripción",
      value: compraDescripcion,
      setter: setCompraDescripcion,
      type: "textarea",
    },
  ];
  return (
    <>
      {contextHolder}
      <Formulario
        title="Registrar Compra Directa"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Compra",
          onClick: handleRegistrarClick,
          type: "primary",
        }}
      />
      <PreviewModal
        open={previewVisible}
        title="Previsualización de la compra "
        onCancel={() => setPreviewVisible(false)}
        onConfirm={handleConfirmar}
        confirmLoading={submitting}
        fields={fields.map((f) => ({
          label: f.label,
          value:
            f.type === "select"
              ? f.options?.find((o) => o.value === f.value?.value)?.label
              : f.value || (f.label === "Compra en" ? "Compra Directa" : "-"),
        }))}
      />
    </>
  );
}
