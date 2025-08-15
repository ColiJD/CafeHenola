"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import "@/style/cliente.css";

export default function DepositoForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cliente, setCliente] = useState(null);
  const [producto, setProducto] = useState(null);
  const [depositoEn, setDepositoEn] = useState("");
  const [depositoCantidadQQ, setDepositoCantidadQQ] = useState("");
  const [depositoPrecioQQ, setDepositoPrecioQQ] = useState("");
  const [depositoTotalSacos, setDepositoTotalSacos] = useState("");
  const [depositoDescripcion, setDepositoDescripcion] = useState("");
  const [depositoTipoDocumento, setDepositoTipoDocumento] = useState("");
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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

  // Actualiza saldo pendiente cuando cambian cliente o producto
  useEffect(() => {
    async function fetchSaldo() {
      if (!cliente || !producto) {
        setSaldoPendiente(0);
        return;
      }

      try {
        const res = await fetch(
          `/api/liqDeposito?clienteID=${cliente.value}&tipoCafe=${producto.value}`
        );
        const data = await res.json();
        setSaldoPendiente(data.saldoDisponible || 0);
      } catch (error) {
        console.error("Error obteniendo saldo pendiente:", error);
      }
    }

    fetchSaldo();
  }, [cliente, producto]);

  // Calcular total automáticamente
  const totalLiquidacion =
    parseFloat(depositoCantidadQQ || 0) * parseFloat(depositoPrecioQQ || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (
      !cliente ||
      !producto ||
      !depositoCantidadQQ ||
      !depositoEn ||
      !depositoPrecioQQ ||
      !depositoTipoDocumento
    ) {
      setMensaje("Por favor complete todos los campos obligatorios.");
      return;
    }

    if (Number(depositoCantidadQQ) > saldoPendiente) {
      setError("La cantidad supera el saldo pendiente del cliente.");
      return;
    }

    const data = {
      clienteID: cliente.value,
      tipoCafe: producto.value,
      cantidadQQ: parseFloat(depositoCantidadQQ),
      precioQQ: parseFloat(depositoPrecioQQ),
      total: parseFloat(totalLiquidacion),
      sacos: depositoTotalSacos ? parseFloat(depositoTotalSacos) : 0,
      tipoDocumento: depositoTipoDocumento,
      descripcion: depositoDescripcion,
      liqEn: depositoEn,
    };

    try {
      const res = await fetch("/api/liqDeposito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setMensaje(`Liquidación realizada. Saldo restante: ${result.saldoDespues}`);
        // Reset campos
        setCliente(null);
        setProducto(null);
        setDepositoCantidadQQ("");
        setDepositoTotalSacos("");
        setDepositoPrecioQQ("");
        setDepositoTipoDocumento("");
        setDepositoEn("");
        setDepositoDescripcion("");
        setSaldoPendiente(0);
      } else {
        const err = await res.json();
        setError(
          "Error: " + (err.error || "No se pudo registrar la liquidación")
        );
      }
    } catch (error) {
      setError("Error enviando los datos");
      console.error(error);
    }
  };

  return (
    <form className="cliente-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Liquidar Depósito
      </h2>

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

      <label>Saldo pendiente (QQ):</label>
      <input type="number" value={saldoPendiente} disabled />

      <label>Tipo de Documento:</label>
      <input
        type="text"
        placeholder="Tipo de Documento"
        value={depositoTipoDocumento}
        onChange={(e) => setDepositoTipoDocumento(e.target.value)}
        required
      />

      <label>Cantidad a liquidar (QQ):</label>
      <input
        type="number"
        placeholder="Cantidad QQ"
        value={depositoCantidadQQ}
        onChange={(e) => setDepositoCantidadQQ(e.target.value)}
        step="0.01"
        required
      />

      <label>Precio por QQ:</label>
      <input
        type="number"
        placeholder="Precio QQ"
        value={depositoPrecioQQ}
        onChange={(e) => setDepositoPrecioQQ(e.target.value)}
        step="0.01"
        required
      />

      <label>Total a pagar:</label>
      <input type="number" value={totalLiquidacion} disabled />

      <label>Total Sacos:</label>
      <input
        type="number"
        placeholder="Total Sacos"
        value={depositoTotalSacos}
        onChange={(e) => setDepositoTotalSacos(e.target.value)}
        step="0.01"
      />

      <label>Depósito en:</label>
      <input
        type="text"
        placeholder="Depósito en"
        value={depositoEn}
        onChange={(e) => setDepositoEn(e.target.value)}
        required
      />

      <label>Descripción:</label>
      <textarea
        placeholder="Descripción"
        value={depositoDescripcion}
        onChange={(e) => setDepositoDescripcion(e.target.value)}
      />

      <button type="submit">Liquidar</button>

      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
