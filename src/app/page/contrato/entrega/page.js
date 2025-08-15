"use client";
import { useEffect, useState } from "react";
import Select from "react-select";

export default function LiquidacionContratoForm() {
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState(null);

  const [contratos, setContratos] = useState([]);
  const [contrato, setContrato] = useState(null);

  const [saldoDisponibleQQ, setSaldoDisponibleQQ] = useState(0);
  const [saldoDisponibleLps, setSaldoDisponibleLps] = useState(0);
  const [tipoCafe, setTipoCafe] = useState("");
  const [precioQQ, setPrecioQQ] = useState(0);
  const [cantidadLiquidar, setCantidadLiquidar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Cargar clientes al montar
  useEffect(() => {
    async function cargarClientes() {
      try {
        const res = await fetch("/api/clientes");
        const data = await res.json();
        setClientes(
          data.map((c) => ({
            value: c.clienteID,
            label: `${c.clienteNombre} ${c.clienteApellido}`,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    }
    cargarClientes();
  }, []);

  // Cargar contratos pendientes al seleccionar cliente
  useEffect(() => {
    async function cargarContratos() {
      if (!cliente) {
        setContratos([]);
        setContrato(null);
        return;
      }
      try {
        const res = await fetch(`/api/contratos/pendientes/${cliente.value}`);
        const data = await res.json();
        setContratos(
          data.map((c) => ({
            value: c.contratoID,
            label: `Contrato #${c.contratoID} - ${c.contratoCatidadQQ} QQ`,
          }))
        );
        setContrato(null);
      } catch (err) {
        console.error(err);
      }
    }
    cargarContratos();
  }, [cliente]);

  // Cargar saldo disponible al seleccionar contrato
  useEffect(() => {
    async function cargarSaldo() {
      if (!contrato) {
        setSaldoDisponibleQQ(0);
        setSaldoDisponibleLps(0);
        setTipoCafe("");
        setPrecioQQ(0);
        return;
      }
      try {
        const res = await fetch(`/api/contratos/saldoDisponible/${contrato.value}`);
        const data = await res.json();
        setSaldoDisponibleQQ(data.saldoDisponibleQQ || 0);
        setSaldoDisponibleLps(data.saldoDisponibleLps || 0);
        setTipoCafe(data.tipoCafeNombre || "");
        setPrecioQQ(data.precioQQ || 0);
      } catch (err) {
        console.error(err);
      }
    }
    cargarSaldo();
  }, [contrato]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!cliente || !contrato || !cantidadLiquidar) {
      setMensaje("Complete todos los campos obligatorios");
      return;
    }

    if (parseFloat(cantidadLiquidar) > saldoDisponibleQQ) {
      setError("La cantidad a liquidar no puede superar el saldo disponible");
      return;
    }

    const data = {
      contratoID: contrato.value,
      clienteID: cliente.value,
      cantidadQQ: parseFloat(cantidadLiquidar),
    };

    try {
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje("Liquidación registrada correctamente ✅");
        setCantidadLiquidar("");
        setContrato(null);
        setSaldoDisponibleQQ(0);
        setSaldoDisponibleLps(0);
        setTipoCafe("");
        setPrecioQQ(0);
      } else {
        const err = await res.json();
        setError(err.error || "No se pudo registrar la liquidación");
      }
    } catch (err) {
      console.error(err);
      setError("Error enviando los datos");
    }
  };

  return (
    <form className="cliente-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Liquidación de Contrato</h2>

      <label>Cliente:</label>
      <Select
        options={clientes}
        value={cliente}
        onChange={setCliente}
        placeholder="Seleccione un cliente"
        isClearable
      />

      <label>Contrato pendiente:</label>
      <Select
        options={contratos}
        value={contrato}
        onChange={setContrato}
        placeholder="Seleccione un contrato pendiente"
        isClearable
        isDisabled={!cliente || contratos.length === 0}
      />

      <label>Tipo de Café:</label>
      <input type="text" value={tipoCafe} disabled />

      <label>Precio por QQ (Lps):</label>
      <input type="number" value={precioQQ} disabled />

      <label>Saldo disponible (QQ):</label>
      <input type="number" value={saldoDisponibleQQ} disabled />

      <label>Saldo disponible (Lps):</label>
      <input type="number" value={saldoDisponibleLps} disabled />

      <label>Cantidad a liquidar (QQ):</label>
      <input
        type="number"
        placeholder="Cantidad a liquidar"
        value={cantidadLiquidar}
        onChange={(e) => setCantidadLiquidar(e.target.value)}
        step="0.01"
        required
        max={saldoDisponibleQQ}
      />

      <button type="submit">Registrar Liquidación</button>

      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
