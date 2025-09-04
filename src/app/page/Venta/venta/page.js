"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas";
import { calcularCafeDesdeProducto } from "@/lib/calculoCafe";
import {
  limpiarFormulario,
  validarFloatPositivo,
  validarEnteroNoNegativo,
} from "@/config/validacionesForm";

export default function VentaForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [ventaCantidadQQ, setVentaCantidadQQ] = useState(""); // peso bruto
  const [ventaTotalSacos, setVentaTotalSacos] = useState("");
  const [ventaPrecioQQ, setVentaPrecioQQ] = useState("");
  const [ventaTotal, setVentaTotal] = useState(0);
  const [ventaOro, setVentaOro] = useState("0.00"); // ⚡ cantidad de venta real
  const [ventaDescripcion, setVentaDescripcion] = useState("");

  const [errors, setErrors] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

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

  // Calcular total y oro
  useEffect(() => {
    if (!producto) return;

    const resultado = calcularCafeDesdeProducto(
      ventaCantidadQQ,
      ventaTotalSacos,
      producto,
      ventaPrecioQQ
    );

    setVentaTotal(resultado.total);
    setVentaOro(resultado.oro); // ⚡ usar oro para ventas
    console.log("🔹 Cálculo actualizado:", resultado);
  }, [ventaCantidadQQ, ventaTotalSacos, ventaPrecioQQ, producto]);

  const validarDatos = () => {
    const newErrors = {};
    if (!cliente) newErrors["Cliente"] = "Seleccione un cliente";
    if (!producto) newErrors["Tipo de Café"] = "Seleccione un café";
    if (!ventaCantidadQQ || parseFloat(ventaCantidadQQ) <= 0)
      newErrors["Peso Bruto"] = "Ingrese un valor mayor a 0";
    if (!ventaPrecioQQ || parseFloat(ventaPrecioQQ) <= 0)
      newErrors["Precio"] = "Ingrese un precio válido";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      messageApi.warning("Complete los campos correctamente");
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
      compraTipoCafe: producto.value,
      compraCantidadQQ: parseFloat(ventaOro), // ⚡ enviar oro
      compraTotalSacos: parseInt(ventaTotalSacos || 0, 10),
      compraPrecioQQ: parseFloat(ventaPrecioQQ),
      compraTotal: parseFloat(ventaTotal),
      compraDescripcion: ventaDescripcion,
      compraMovimiento: "Salida",
    };

    console.log("📤 Datos enviados a backend:", data);

    try {
      const res = await fetch("/api/Venta/venta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        console.log("✅ Venta registrada con éxito:", json);
        messageApi.success("Venta registrada exitosamente");
        setPreviewVisible(false);
        limpiarFormulario({
          setCliente,
          setProducto,
          setVentaCantidadQQ,
          setVentaTotalSacos,
          setVentaPrecioQQ,
          setVentaTotal,
          setVentaOro,
          setVentaDescripcion,
          setErrors,
        });
      } else {
        const err = await res.json();
        console.error("❌ Error backend:", err);
        messageApi.error(err.error || "Error al registrar la venta");
      }
    } catch (err) {
      console.error("🔥 Error enviando datos al servidor:", err);
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
      label: "Peso Bruto",
      value: ventaCantidadQQ,
      setter: setVentaCantidadQQ,
      type: "Float",
      required: true,
      error: errors["Peso Bruto"],
    },
    {
      label: "Total Sacos",
      value: ventaTotalSacos,
      setter: setVentaTotalSacos,
      type: "integer",
      required: true,
      error: errors["Total Sacos"],
    },
    {
      label: "Precio",
      value: ventaPrecioQQ,
      setter: setVentaPrecioQQ,
      type: "Float",
      required: true,
      error: errors["Precio"],
    },
    {
      label: "Total",
      value: ventaTotal,
      setter: setVentaTotal,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Total"],
    },
    {
      label: "Quintales Oro",
      value: ventaOro,
      setter: setVentaOro,
      type: "Float",
      required: true,
      readOnly: true,
      error: errors["Quintales Oro"],
    },
    {
      label: "Descripción",
      value: ventaDescripcion,
      setter: setVentaDescripcion,
      type: "textarea",
    },
  ];

  return (
    <>
      {contextHolder}
      <Formulario
        title="Registrar Venta Directa"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Venta",
          onClick: handleRegistrarClick,
          type: "primary",
        }}
      />
      <PreviewModal
        open={previewVisible}
        title="Previsualización de la venta"
        onCancel={() => setPreviewVisible(false)}
        onConfirm={handleConfirmar}
        confirmLoading={submitting}
        fields={fields.map((f) => ({
          label: f.label,
          value:
            f.type === "select"
              ? f.options.find((o) => o.value === f.value?.value)?.label
              : f.value || "-",
        }))}
      />
    </>
  );
}
