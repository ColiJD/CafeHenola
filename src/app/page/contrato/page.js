"use client"; // Indica que este archivo se ejecuta en el cliente (Next.js)

import { useEffect, useState } from "react"; // Hooks de React
import { message } from "antd"; // Componente de mensajes de Ant Design
import Formulario from "@/components/Formulario"; // Componente genérico de formulario
import PreviewModal from "@/components/Modal"; // Modal para previsualización
import { obtenerClientesSelect, obtenerProductosSelect } from "@/lib/consultas"; // Funciones para traer clientes/productos
import {
  limpiarFormulario,
  validarFloatPositivo,
  validarEnteroPositivo,
} from "@/config/validacionesForm"; // Utilidades de validación
import { validarDatos } from "@/lib/validacionesForm"; // Validación general del formulario

export default function ContratoForm() {
  // 🔹 Estados de datos seleccionables
  const [clientes, setClientes] = useState([]); // Lista de clientes para el select
  const [productos, setProductos] = useState([]); // Lista de productos para el select

  // 🔹 Estado centralizado del formulario
  const [formState, setFormState] = useState({
    cliente: null,
    producto: null,
    contratoPrecio: "",
    contratoCantidadQQ: "",
    contratoTotalLps: 0,
    contratoEn: "",
    contratoDescripcion: "",
  });

  // 🔹 Estado para errores de validación
  const [errors, setErrors] = useState({});

  // 🔹 Estado para mostrar modal de previsualización
  const [previewVisible, setPreviewVisible] = useState(false);

  // 🔹 Estado para mostrar carga durante envío
  const [submitting, setSubmitting] = useState(false);

  // 🔹 API de mensajes de Ant Design
  const [messageApi, contextHolder] = message.useMessage();

  // 🔹 useEffect para calcular automáticamente el total (precio x cantidad)
  useEffect(() => {
    const precio = parseFloat(formState.contratoPrecio);
    const cantidad = parseFloat(formState.contratoCantidadQQ);

    setFormState((prev) => ({
      ...prev,
      // Si los valores no son números, el total será 0
      contratoTotalLps:
        !isNaN(precio) && !isNaN(cantidad) ? (precio * cantidad).toFixed(2) : 0,
    }));
  }, [formState.contratoPrecio, formState.contratoCantidadQQ]); // Se ejecuta cuando cambian precio o cantidad

  // 🔹 useEffect para cargar clientes y productos desde la API
  useEffect(() => {
    async function cargarDatos() {
      try {
        setClientes(await obtenerClientesSelect(messageApi)); // Trae clientes
        setProductos(await obtenerProductosSelect(messageApi)); // Trae productos
      } catch (err) {
        console.error(err);
        messageApi.error("Error cargando clientes o productos"); // Mensaje de error
      }
    }
    cargarDatos();
  }, [messageApi]); // Solo se ejecuta una vez al montar

  // 🔹 Configuración dinámica de campos del formulario
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
      key: "contratoPrecio",
      label: "Precio",
      type: "Float",
      required: true,
      validator: validarFloatPositivo,
    },
    {
      key: "contratoCantidadQQ",
      label: "Cantidad QQ",
      type: "integer",
      required: true,
      validator: (v) =>
        !validarEnteroPositivo(v) ? "Cantidad QQ debe ser un entero > 0" : null,
    },
    {
      key: "contratoTotalLps",
      label: "Total",
      type: "Float",
      required: true,
      readOnly: true,
    },
    { key: "contratoEn", label: "Contrato en", required: false },
    {
      key: "contratoDescripcion",
      label: "Descripción",
      type: "textarea",
      required: false,
    },
  ];

  // 🔹 Mapear configuración a campos completos con setters y errores
  const fields = fieldsConfig.map((f) => ({
    ...f,
    value: formState[f.key], // Valor actual del estado
    setter: (val) => setFormState((prev) => ({ ...prev, [f.key]: val })), // Setter dinámico
    error: errors[f.label], // Error correspondiente al campo
  }));

  // 🔹 Función para manejar clic en "Registrar Contrato"
  const handleRegistrarClick = () => {
    // Valida datos antes de abrir previsualización
    if (validarDatos(fields, messageApi, setErrors)) setPreviewVisible(true);
  };

  // 🔹 Función para confirmar registro de contrato
  const handleConfirmar = async (e) => {
    e.preventDefault(); // Evita reload del formulario
    setSubmitting(true); // Muestra estado de envío

    // 🔹 Construcción de objeto a enviar
    const data = {
      contratoclienteID: formState.cliente?.value,
      contratoTipoCafe: formState.producto?.value,
      contratoPrecio: parseFloat(formState.contratoPrecio),
      contratoCantidadQQ: parseFloat(formState.contratoCantidadQQ),
      contratoTotalLps: parseFloat(formState.contratoTotalLps),
      contratoEn: formState.contratoEn || "Contrato Directo",
      contratoDescripcion: formState.contratoDescripcion || "N/A",
    };

    try {
      // 🔹 Petición POST al endpoint
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        messageApi.success("Contrato registrado exitosamente ✅"); // Mensaje de éxito
        setPreviewVisible(false); // Cierra modal
        // 🔹 Limpieza del formulario
        limpiarFormulario(
          Object.fromEntries(fieldsConfig.map((f) => [f.key, formState[f.key]]))
        );
        setFormState({
          cliente: null,
          producto: null,
          contratoPrecio: "",
          contratoCantidadQQ: "",
          contratoTotalLps: 0,
          contratoEn: "",
          contratoDescripcion: "",
        });
      } else {
        const err = await res.json();
        messageApi.error(
          "Error: " + (err.error || "No se pudo registrar el contrato")
        ); // Mensaje de error del servidor
      }
    } catch (error) {
      console.error(error);
      messageApi.error("Error enviando los datos"); // Mensaje de error de red
    } finally {
      setSubmitting(false); // Finaliza estado de envío
    }
  };

  return (
    <>
      {contextHolder} {/* Contenedor de mensajes Ant Design */}
      {/* Componente de formulario principal */}
      <Formulario
        title="Registrar Contrato"
        fields={fields}
        onSubmit={handleRegistrarClick}
        submitting={submitting}
        button={{
          text: "Registrar Contrato",
          onClick: handleRegistrarClick,
          type: "primary",
        }}
      />
      {/* Modal de previsualización antes de confirmar */}
      <PreviewModal
        open={previewVisible}
        title="Previsualización del contrato"
        onCancel={() => setPreviewVisible(false)}
        onConfirm={handleConfirmar}
        confirmLoading={submitting}
        fields={fields.map((f) => ({
          label: f.label,
          value:
            f.type === "select"
              ? f.options?.find((o) => o.value === f.value?.value)?.label
              : f.value ||
                (f.label === "Contrato en" ? "Contrato Directo" : "-"),
        }))}
      />
    </>
  );
}
