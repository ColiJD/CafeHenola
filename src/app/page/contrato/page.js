"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import "@/style/cliente.css";

export default function ContratoForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [contratoPrecio, setContratoPrecio] = useState("");
  const [contratoCantidadQQ, setContratoCantidadQQ] = useState("");
  const [contratoTotalLps, setContratoTotalLps] = useState(0); // calculado
  const [contratoEn, setContratoEn] = useState("");
  const [contratoDescripcion, setContratoDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // 🔹 Calcular total cada vez que cambien precio o cantidad
  useEffect(() => {
    if (contratoPrecio && contratoCantidadQQ) {
      setContratoTotalLps(
        (parseFloat(contratoPrecio) * parseFloat(contratoCantidadQQ)).toFixed(2)
      );
    } else {
      setContratoTotalLps(0);
    }
  }, [contratoPrecio, contratoCantidadQQ]);

  // Cargar clientes y productos
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resClientes, resProductos] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/productos"),
        ]);
        const clientesData = await resClientes.json();
        const productosData = await resProductos.json();

        setClientes(
          clientesData.map((c) => ({
            value: c.clienteID,
            label: `${c.clienteNombre} ${c.clienteApellido}`,
          }))
        );
        setProductos(
          productosData.map((p) => ({
            value: p.productID,
            label: p.productName,
          }))
        );
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    }
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (
      !cliente ||
      !producto ||
      !contratoPrecio ||
      !contratoCantidadQQ
    ) {
      setMensaje("Por favor complete todos los campos obligatorios.");
      return;
    }

    const data = {
      contratoclienteID: cliente.value,
      contratoTipoCafe: producto.value,
      contratoPrecio: parseFloat(contratoPrecio),
      contratoCatidadQQ: parseFloat(contratoCantidadQQ),
      contratoTotalLps: parseFloat(contratoTotalLps), // auto calculado
      contratoEn,
      contratoDescripcion,
    };

    try {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje("Contrato registrado exitosamente ✅");
        // Resetear campos
        setCliente(null);
        setProducto(null);
        setContratoPrecio("");
        setContratoCantidadQQ("");
        setContratoTotalLps(0);
        setContratoEn("");
        setContratoDescripcion("");
      } else {
        const err = await res.json();
        setError("Error: " + (err.error || "No se pudo registrar el contrato"));
      }
    } catch (error) {
      setError("Error enviando los datos");
      console.error(error);
    }
  };

  return (
    <form className="cliente-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Contrato</h2>

      <label>Cliente:</label>
      <Select
        options={clientes}
        value={cliente}
        onChange={setCliente}
        placeholder="Seleccione un cliente"
        isClearable
      />

      <label>Tipo de Café:</label>
      <Select
        options={productos}
        value={producto}
        onChange={setProducto}
        placeholder="Seleccione café"
        isClearable
      />

      <label>Precio QQ:</label>
      <input
        type="number"
        placeholder="Precio por QQ"
        value={contratoPrecio}
        onChange={(e) => setContratoPrecio(e.target.value)}
        step="0.01"
        required
      />

      <label>Cantidad QQ:</label>
      <input
        type="number"
        placeholder="Cantidad QQ"
        value={contratoCantidadQQ}
        onChange={(e) => setContratoCantidadQQ(e.target.value)}
        step="0.01"
        required
      />

      <label>Total Lps:</label>
      <input
        type="number"
        placeholder="Total Lempiras"
        value={contratoTotalLps}
        disabled // 🔹 no editable
      />

      <label>Contrato en:</label>
      <input
        type="text"
        placeholder="Ej: Almacén Central"
        value={contratoEn}
        onChange={(e) => setContratoEn(e.target.value)}
      />

      <label>Descripción:</label>
      <textarea
        placeholder="Descripción"
        value={contratoDescripcion}
        onChange={(e) => setContratoDescripcion(e.target.value)}
      />

      <button type="submit">Registrar Contrato</button>
      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
