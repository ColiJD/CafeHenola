"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import "@/style/liquidacion.css";

export default function LiquidacionContratoForm() {
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState(null);

  const [contratos, setContratos] = useState([]);
  const [contrato, setContrato] = useState(null);

  const [saldoDisponibleQQ, setSaldoDisponibleQQ] = useState(0);
  const [saldoDisponibleLps, setSaldoDisponibleLps] = useState(0);
  const [tipoCafeID, setTipoCafeID] = useState(0); // 🔹 ID para enviar al backend
  const [tipoCafeNombre, setTipoCafeNombre] = useState(""); // 🔹 Nombre para mostrar
  const [precioQQ, setPrecioQQ] = useState(0);
  const [cantidadLiquidar, setCantidadLiquidar] = useState("");
  const [totalLiquidacion, setTotalLiquidacion] = useState(0);
  const [totalSacos, setTotalSacos] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // -----------------------------
  // Función para cargar clientes
  // -----------------------------
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

  // --------------------------------------------
  // Función para cargar contratos pendientes
  // --------------------------------------------
  async function cargarContratos(clienteID) {
    if (!clienteID) {
      setContratos([]);
      setContrato(null);
      return;
    }
    try {
      const res = await fetch(`/api/contratos/pendientes/${clienteID}`);
      const data = await res.json();
      setContratos(
        data.map((c) => ({
          value: c.contratoID,
          label: `Contrato #${c.contratoID} - ${c.contratoCatidadQQ} QQ`,
          tipoCafeID: c.tipoCafeID,
          tipoCafeNombre: c.tipoCafeNombre,
        }))
      );
      setContrato(null);
    } catch (err) {
      console.error(err);
    }
  }
  // --------------------------------------------
  // Cargar contratos cuando cambia el cliente
  // --------------------------------------------
  useEffect(() => {
    if (cliente) {
      cargarContratos(cliente.value);
    } else {
      setContratos([]);
      setContrato(null);
    }
  }, [cliente]);

  // --------------------------------------------
  // Cargar saldo disponible cuando cambia contrato
  // --------------------------------------------
  useEffect(() => {
    async function cargarSaldo() {
      if (!contrato) {
        setSaldoDisponibleQQ(0);
        setSaldoDisponibleLps(0);
        setTipoCafeID(0);
        setTipoCafeNombre("");
        setPrecioQQ(0);
        setTotalLiquidacion(0);
        return;
      }
      try {
        const res = await fetch(
          `/api/contratos/saldoDisponible/${contrato.value}`
        );
        const data = await res.json();

        if (!data || data.saldoDisponibleQQ === undefined) {
          setSaldoDisponibleQQ(0);
          setSaldoDisponibleLps(0);
          setTipoCafeID(0);
          setTipoCafeNombre("");
          setPrecioQQ(0);
          setTotalLiquidacion(0);
          setError("No se encontró saldo disponible para este contrato");
          return;
        }

        setSaldoDisponibleQQ(data.saldoDisponibleQQ);
        setSaldoDisponibleLps(data.saldoDisponibleLps);
        setTipoCafeID(data.tipoCafeID || 0); // 🔹 ID para backend
        setTipoCafeNombre(data.tipoCafeNombre || ""); // 🔹 nombre para mostrar
        setPrecioQQ(data.precioQQ || 0);
        setTotalLiquidacion(0);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Error cargando saldo disponible");
      }
    }
    cargarSaldo();
  }, [contrato]);
  // --------------------------------------------
  // Calcular total de liquidación automáticamente
  // --------------------------------------------
  useEffect(() => {
    if (cantidadLiquidar && precioQQ) {
      setTotalLiquidacion(parseFloat(cantidadLiquidar) * parseFloat(precioQQ));
    } else {
      setTotalLiquidacion(0);
    }
  }, [cantidadLiquidar, precioQQ]);

  // --------------------------------------------
  // Manejar envío del formulario
  // --------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!cliente || !contrato || !cantidadLiquidar || !totalSacos) {
      setError("Complete todos los campos obligatorios");
      return;
    }

    const cantidad = parseFloat(cantidadLiquidar);

    if (cantidad > saldoDisponibleQQ) {
      setError(
        `La cantidad a liquidar (${cantidad}) supera el saldo disponible (${saldoDisponibleQQ})`
      );
      return;
    }

    const data = {
      contratoID: contrato.value,
      clienteID: cliente.value,
      tipoCafe: tipoCafeID, // 🔹 enviamos ID numérico
      cantidadQQ: cantidad,
      precioQQ,
      totalSacos: parseInt(totalSacos),
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

      const respData = await res.json();

      if (res.ok) {
        setMensaje(
          `Liquidación registrada ✅. Saldo disponible: ${respData.saldoDespuesQQ} QQ / ${respData.saldoDespuesLps} Lps`
        );
        setCantidadLiquidar("");
        setTotalSacos("");
        setContrato(null);
        setSaldoDisponibleQQ(0);
        setSaldoDisponibleLps(0);
        setTipoCafeID(0);
        setTipoCafeNombre("");
        setPrecioQQ(0);
        setTotalLiquidacion(0);
      } else {
        setError(respData.error || "No se pudo registrar la liquidación");
      }
    } catch (err) {
      console.error(err);
      setError("Error enviando los datos");
    }
  };

  return (
    <form className="liq-contrato-form" onSubmit={handleSubmit}>
      <h2>Liquidación de Contrato</h2>

      <div className="form-grid">
        {/* Campos de entrada */}
        <div className="col-inputs">
          <label>Cliente:</label>
          <Select
            options={clientes}
            value={cliente}
            onChange={setCliente}
            placeholder="Seleccione un cliente"
            isClearable
            classNamePrefix="liq"
          />

          <label>Contrato pendiente:</label>
          <Select
            options={contratos}
            value={contrato}
            onChange={setContrato}
            placeholder="Seleccione un contrato pendiente"
            isClearable
            isDisabled={!cliente || contratos.length === 0}
            classNamePrefix="liq"
          />

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

          <label>Total de Sacos:</label>
          <input
            type="number"
            placeholder="Total de sacos"
            value={totalSacos}
            onChange={(e) => setTotalSacos(e.target.value)}
            min={1}
            required
          />
        </div>

        {/* Campos display */}
        <div className="col-display">
          <label>Tipo de Café:</label>
          <input type="text" value={tipoCafeNombre} disabled />

          <label>Precio por QQ (Lps):</label>
          <input type="number" value={precioQQ} disabled />

          <label>Saldo disponible (QQ):</label>
          <input type="number" value={saldoDisponibleQQ} disabled />

          <label>Saldo disponible (Lps):</label>
          <input type="number" value={saldoDisponibleLps} disabled />

          <label>Total de la liquidación (Lps):</label>
          <input type="number" value={totalLiquidacion} disabled />
        </div>
      </div>

      <button type="submit">Registrar Liquidación</button>
      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
