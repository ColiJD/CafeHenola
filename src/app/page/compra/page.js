"use client";
import { useEffect, useState } from "react";
import Select from "react-select"; // Componente para select con búsqueda
import "@/style/compra.css";

export default function CompraForm() {
  // Estados para datos cargados
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Estados para los campos del formulario
  const [cliente, setCliente] = useState(null); // objeto cliente seleccionado
  const [producto, setProducto] = useState(null); // objeto producto seleccionado
  const [compraTipoDocumento, setCompraTipoDocumento] = useState("");
  const [compraEn, setCompraEn] = useState("");
  const [compraPrecioQQ, setCompraPrecioQQ] = useState("");
  const [compraCatidadQQ, setCompraCatidadQQ] = useState("");
  const [compraTotal, setCompraTotal] = useState(0);
  const [compraRetencio, setCompraRetencio] = useState(0);
  const [comprarTotalSacos, setComprarTotalSacos] = useState("");
  const [compraDescripcion, setCompraDescripcion] = useState("");
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

        // Adaptamos los datos para react-select (value y label)
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

  // Calcula total y retención cuando precio o cantidad cambian
  useEffect(() => {
    const precio = parseFloat(compraPrecioQQ) || 0;
    const cantidad = parseFloat(compraCatidadQQ) || 0;
    const total = precio * cantidad;
    const retencion = cantidad - cantidad * 0.04;
    setCompraTotal(total.toFixed(2));
    setCompraRetencio(retencion.toFixed(2));
  }, [compraPrecioQQ, compraCatidadQQ]);

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que todos los campos obligatorios estén llenos
    if (
      !cliente ||
      !producto ||
      !compraTipoDocumento ||
      !compraEn ||
      !compraPrecioQQ ||
      !compraCatidadQQ
    ) {
      setMensaje("Por favor complete todos los campos obligatorios.");
      return;
    }

    // Preparar datos para backend
    const data = {
      clienteID: cliente.value, // id real
      compraTipoDocumento,
      compraTipoCafe: producto.value, // id real producto
      compraPrecioQQ: parseFloat(compraPrecioQQ),
      compraCatidadQQ: parseFloat(compraCatidadQQ),
      compraTotal: parseFloat(compraTotal),
      comprarTotalSacos: comprarTotalSacos ? parseFloat(comprarTotalSacos) : 0,
      compraRetencio: parseFloat(compraRetencio),
      compraDescripcion,
      compraMovimiento: "Entrada",
      compraEn,
    };

    try {
      // Enviar datos al backend
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje("Compra registrada exitosamente");

        // Reset campos
        setCliente(null);
        setProducto(null);
        setCompraTipoDocumento("");
        setCompraEn("");
        setCompraPrecioQQ("");
        setCompraCatidadQQ("");
        setComprarTotalSacos("");
        setCompraDescripcion("");
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
      <h2>Compra</h2>
      <div className="form-container">
        <div className="form-grid">
          {/* Select con búsqueda para cliente */}
          <label htmlFor="cliente">Cliente:</label>
          <Select
            options={clientes}
            value={cliente}
            onChange={setCliente}
            placeholder="Seleccione un cliente"
            isClearable
          />

          {/* Campos de texto normales */}
          <label htmlFor="tipoDocumento">Documento:</label>
          <input
            type="text"
            placeholder="Tipo de Documento"
            value={compraTipoDocumento}
            onChange={(e) => setCompraTipoDocumento(e.target.value)}
            required
          />
          <label htmlFor="compraEn">Compra en:</label>
          <input
            type="text"
            placeholder="Compra en"
            value={compraEn}
            onChange={(e) => setCompraEn(e.target.value)}
            required
          />
          <label htmlFor="compraRetencio">Retención (Lps):</label>
          <input
            type="text"
            value={`L. ${compraRetencio}`}
            readOnly
            placeholder="Retención (Lps)"
          />
          <label htmlFor="compraDescripcion">Descripción:</label>
          <textarea
            id="compraDescripcion"
            placeholder="Descripción"
            value={compraDescripcion}
            onChange={(e) => setCompraDescripcion(e.target.value)}
          />
        </div>
        <div className="form-grid">
          {/* Select con búsqueda para tipo de café/producto */}
          <label htmlFor="producto">Tipo de Café:</label>
          <Select
            options={productos}
            value={producto}
            onChange={setProducto}
            placeholder="Seleccione café"
            isClearable
          />
          <label htmlFor="compraPrecioQQ">Precio por QQ:</label>
          <input
            type="number"
            placeholder="Precio por QQ"
            value={compraPrecioQQ}
            onChange={(e) => setCompraPrecioQQ(e.target.value)}
            step="0.01"
            required
          />
          <label htmlFor="compraCatidadQQ">Cantidad QQ:</label>
          <input
            type="number"
            placeholder="Cantidad QQ"
            value={compraCatidadQQ}
            onChange={(e) => setCompraCatidadQQ(e.target.value)}
            step="0.01"
            required
          />

          <label htmlFor="compraTotal">Total (Lps):</label>
          <input
            type="text"
            value={`L. ${compraTotal}`}
            readOnly
            placeholder="Total (Lps)"
          />

          <label htmlFor="comprarTotalSacos">Total Sacos:</label>
          <input
            type="number"
            placeholder="Total Sacos"
            value={comprarTotalSacos}
            onChange={(e) => setComprarTotalSacos(e.target.value)}
            step="0.01"
          />
        </div>
      </div>
      <button type="submit">Registrar Compra</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}
