"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas";
import { calcularCafeDesdeProducto } from "@/lib/calculoCafe";
import { exportCompraDirecta } from "@/Doc/Documentos/compra";
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
  const [compraOro, setCompraOro] = useState("0.00");

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
    setCompraOro(resultado.oro); // ✅ lo guardas aparte
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
      compraCantidadQQ: parseFloat(compraOro),
      compraTotalSacos:
        producto?.label === "Cafe Lata"
          ? 1
          : compraTotalSacos
          ? parseInt(compraTotalSacos, 10)
          : 0,
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

      const result = await res.json();

      if (!res.ok || !result.compraId) {
        throw new Error(result.error || "No se pudo registrar la compra");
      }

      messageApi.success("Compra Directa registrada exitosamente");
      setPreviewVisible(false);

      // 🔹 Loading mientras se genera PDF
      messageApi.open({
        type: "loading",
        content: "Generando comprobante de compra, por favor espere...",
        duration: 0,
        key: "generandoComprobante",
      });

      try {
        await exportCompraDirecta({
          cliente,
          productos: [
            {
              nombre: producto.label,
              cantidad: parseFloat(compraOro),
              precio: compraPrecioQQ,
              total: compraTotal,
            },
          ],
          total: compraTotal,
          observaciones: compraDescripcion,
          comprobanteID: result.compraId,
        });

        messageApi.destroy("generandoComprobante");
        messageApi.success("Comprobante generado correctamente");
      } catch (err) {
        console.error("Error generando PDF:", err);
        messageApi.destroy("generandoComprobante");
        messageApi.error("Error generando comprobante PDF");
      }

      // 🔹 Limpiar formulario
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
        setCompraOro,
        setErrors,
      });
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
      label:
        producto?.label === "Cafe Lata"
          ? "Cantidad de Latas"
          : "Peso Bruto (lbs)",
      value: compraCantidadQQ,
      setter: setCompraCantidadQQ,
      type: "Float",
      required: true,
      error: errors["Peso Bruto (lbs)"],
      validator: validarFloatPositivo,
    },
    {
      label: "Total Sacos",
      value: producto?.label === "Cafe Lata" ? 0 : compraTotalSacos,
      setter: producto?.label === "Cafe Lata" ? () => {} : setCompraTotalSacos,
      type: "integer",
      required: producto?.label === "Cafe Lata" ? false : true,
      error: errors["Total Sacos"],
      readOnly: producto?.label === "Cafe Lata",
      validator: (v) => {
        if (producto?.label === "Cafe Lata") return null;
        if (v === "" || v === null || v === undefined)
          return "Ingrese total de sacos";
        return validarEnteroNoNegativo(v) ? null : "Total sacos debe ser >= 0";
      },
    },
    {
      label: "Precio (Lps)",
      value: compraPrecioQQ,
      setter: setCompraPrecioQQ,
      type: "Float",
      required: true,
      error: errors["Precio (Lps)"],
      validator: validarFloatPositivo,
    },

    {
      label: "Total (Lps)",
      value: compraTotal,
      setter: setCompraTotal,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Total"],
    },

    {
      label: "Quintales Oro",
      value: compraOro,
      setter: setCompraOro,
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
            f.label === "Total Sacos" && producto?.label === "Cafe Lata"
              ? 0
              : f.type === "select"
              ? f.options?.find((o) => o.value === f.value?.value)?.label
              : f.value || (f.label === "Compra en" ? "Compra Directa" : "-"),
        }))}
      />
    </>
  );
}
