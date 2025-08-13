"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import "@/style/compra.css";

export default function DepositoForm() {
  // Estados para datos cargados
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Estados para los campos del formulario
  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [depositoEn, setDepositoEn] = useState("");
  const [depositoCantidadQQ, setDepositoCantidadQQ] = useState("");
  const [depositoTotalSacos, setDepositoTotalSacos] = useState("");
  const [depositoDescripcion, setDepositoDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Carga clientes y productos al montar componente
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

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cliente || !producto || !depositoCantidadQQ || !depositoEn) {
      setMensaje("Por favor complete todos los campos obligatorios.");
      return;
    }

    const data = {
      clienteID: cliente.value,
      depositoTipoCafe: producto.value,
      depositoCantidadQQ: parseFloat(depositoCantidadQQ),
      depositoTotalSacos: depositoTotalSacos
        ? parseFloat(depositoTotalSacos)
        : 0,
      depositoEn,
      depositoDescripcion,
    };

    try {
      const res = await fetch("/api/deposito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje("Depósito registrado exitosamente");
        // Reset campos
        setCliente(null);
        setProducto(null);
        setDepositoCantidadQQ("");
        setDepositoTotalSacos("");
        setDepositoEn("");
        setDepositoDescripcion("");
      } else {
        const err = await res.json();
        setMensaje("Error: " + (err.error || "Error desconocido"));
      }
    } catch (error) {
      setMensaje("Error enviando los datos");
      console.error(error);
    }
  };

  return (
    <form className="compra-form" onSubmit={handleSubmit}>
      <h2>Depósito</h2>
      <div className="form-container">
        <div className="form-grid">
          <label htmlFor="cliente">Cliente:</label>
          <Select
            options={clientes}
            value={cliente}
            onChange={setCliente}
            placeholder="Seleccione un cliente"
            isClearable
          />

          <label htmlFor="producto">Tipo de Café:</label>
          <Select
            options={productos}
            value={producto}
            onChange={setProducto}
            placeholder="Seleccione café"
            isClearable
          />

          <label htmlFor="depositoCantidadQQ">Cantidad QQ:</label>
          <input
            type="number"
            placeholder="Cantidad QQ"
            value={depositoCantidadQQ}
            onChange={(e) => setDepositoCantidadQQ(e.target.value)}
            step="0.01"
            required
          />

          <label htmlFor="depositoTotalSacos">Total Sacos:</label>
          <input
            type="number"
            placeholder="Total Sacos"
            value={depositoTotalSacos}
            onChange={(e) => setDepositoTotalSacos(e.target.value)}
            step="0.01"
          />
          <label htmlFor="depositoEn">Depósito en:</label>
          <input
            type="text"
            placeholder="Depósito en"
            value={depositoEn}
            onChange={(e) => setDepositoEn(e.target.value)}
            required
          />

          <label htmlFor="depositoDescripcion">Descripción:</label>
          <textarea
            placeholder="Descripción"
            value={depositoDescripcion}
            onChange={(e) => setDepositoDescripcion(e.target.value)}
          />
        </div>
      </div>
      <button type="submit">Registrar Depósito</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}
