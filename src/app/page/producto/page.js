"use client";
import "@/style/cliente.css";
import { useState } from "react";

export default function ProductoForm() {
  const [productName, setProductName] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    const nombreLimpio = productName.trim(); // limpiar espacios

    if (!nombreLimpio) {
      setMensaje("El nombre del producto no puede estar vacío");
      return;
    }

    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: nombreLimpio }),
      });

      if (res.ok) {
        setMensaje("Producto agregado correctamente");
        setProductName("");

        // limpiar mensaje después de 3 segundos
        setTimeout(() => setMensaje(""), 3000);
      } else {
        const data = await res.json();
        setMensaje(data.error || "Error al agregar el producto");
        setError("Error: " + (data.error || "No se pudo crear el producto"));
      }
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cliente-form">
      <h2>Agregar Producto</h2>
      <label>Nombre del Producto</label>
      <input
        type="text"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        required
      />

      <button type="submit">Guardar</button>

      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
