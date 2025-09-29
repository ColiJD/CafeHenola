"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import Formulario from "@/components/Formulario";
import PreviewModal from "@/components/Modal";

import { calcularCafeDesdeProducto } from "@/lib/calculoCafe";
import { obtenerProductosSelect, obtenerSelectData } from "@/lib/consultas";
import ProtectedPage from "@/components/ProtectedPage";

import { limpiarFormulario } from "@/config/validacionesForm";

export default function VentaForm() {
  const [compradores, setCompradores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [comprador, setComprador] = useState(null);
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
        const compradoresData = await obtenerSelectData({
          url: "/api/compradores", // 👈 endpoint de tu API
          messageApi,
          valueField: "compradorId",
          labelField: "compradorNombre",
        });

        const productosData = await obtenerProductosSelect(messageApi);

        setCompradores(compradoresData);
        setProductos(productosData);
      } catch (err) {
        console.error(err);
        messageApi.error("Error cargando compradores o productos");
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
    if (!comprador) newErrors["Comprador"] = "Seleccione un comprador";
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
      compradorID: comprador.value, // 👈 ahora comprador
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
          setCliente: setComprador, // 👈 limpieza comprador
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
      label: "Comprador",
      value: comprador,
      setter: setComprador,
      type: "select",
      options: compradores,
      required: true,
      error: errors["Comprador"],
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
    <ProtectedPage allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS"]}>
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
    </ProtectedPage>
  );
}
