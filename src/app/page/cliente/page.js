"use client";
import { useState, useEffect } from "react";
import "@/style/cliente.css"; // Importa el CSS
import { departamentos, municipiosPorDepartamento } from "./data";


export default function ClienteForm() {
  const [clienteCedula, setClienteCedula] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteApellido, setClienteApellido] = useState("");
  const [clienteDirecion, setClienteDirecion] = useState("");
  const [clienteDepartament, setClienteDepartament] = useState("");
  const [clienteMunicipio, setClienteMunicipio] = useState("");
  const [claveIHCAFE, setClaveIHCAFE] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteRTN, setClienteRTN] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setClienteMunicipio("");
  }, [clienteDepartament]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    const data = {
      clienteCedula,
      clienteNombre,
      clienteApellido,
      clienteDirecion,
      clienteMunicipio,
      clienteDepartament,
      claveIHCAFE,
      clienteTelefono,
      clienteRTN: clienteRTN ? Number(clienteRTN) : null,
    };

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje("Cliente creado con éxito");
        setClienteCedula("");
        setClienteNombre("");
        setClienteApellido("");
        setClienteDirecion("");
        setClienteDepartament("");
        setClienteMunicipio("");
        setClaveIHCAFE("");
        setClienteTelefono("");
        setClienteRTN("");
      } else {
        const err = await res.json();
        setError("Error: " + (err.error || "No se pudo crear el cliente"));
      }
    } catch (err) {
      setError("Error de red o servidor");
    }
  }

  return (
    <form className="cliente-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Cliente</h2>
      <input
        type="text"
        placeholder="Cédula"
        value={clienteCedula}
        onChange={(e) => setClienteCedula(e.target.value)}
        maxLength={13}
        required
      />
      <input
        type="text"
        placeholder="Nombre"
        value={clienteNombre}
        onChange={(e) => setClienteNombre(e.target.value)}
        maxLength={20}
        required
      />
      <input
        type="text"
        placeholder="Apellido"
        value={clienteApellido}
        onChange={(e) => setClienteApellido(e.target.value)}
        maxLength={20}
        required
      />
      <input
        type="text"
        placeholder="Dirección"
        value={clienteDirecion}
        onChange={(e) => setClienteDirecion(e.target.value)}
        maxLength={200}
        required
      />

      <select
        value={clienteDepartament}
        onChange={(e) => setClienteDepartament(e.target.value)}
        required
      >
        <option value="">Seleccione departamento</option>
        {departamentos.map((dep) => (
          <option key={dep} value={dep}>
            {dep}
          </option>
        ))}
      </select>

      <select
        value={clienteMunicipio}
        onChange={(e) => setClienteMunicipio(e.target.value)}
        disabled={!clienteDepartament}
        required
      >
        <option value="">Seleccione municipio</option>
        {(municipiosPorDepartamento[clienteDepartament] || []).map((mun) => (
          <option key={mun} value={mun}>
            {mun}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Clave IHCAFE"
        value={claveIHCAFE}
        onChange={(e) => setClaveIHCAFE(e.target.value)}
      />
      <input
        type="text"
        placeholder="Teléfono"
        value={clienteTelefono}
        onChange={(e) => setClienteTelefono(e.target.value)}
        maxLength={13}
      />
      <input
        type="number"
        placeholder="RTN"
         maxLength={1}
        value={clienteRTN}
        onChange={(e) => setClienteRTN(e.target.value)}
      />

      <button type="submit">Crear Cliente</button>

      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
