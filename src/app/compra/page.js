// components/CompraForm.jsx
'use client';
import { useEffect, useState } from 'react';
import '../../style/compra.css';

export default function CompraForm() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [clienteID, setClienteID] = useState('');
  const [compraFecha, setCompraFecha] = useState('');
  const [compraTipoCafe, setCompraTipoCafe] = useState('');
  const [compraPrecioQQ, setCompraPrecioQQ] = useState('');
  const [compraCatidadQQ, setCompraCatidadQQ] = useState('');
  const [compraTotal, setCompraTotal] = useState(0);
  const [compraRetencio, setCompraRetencio] = useState(0);
  const [comprarTotalSacos, setComprarTotalSacos] = useState('');
  const [compraDescripcion, setCompraDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resClientes, resProductos] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/productos'),
        ]);
        const clientesData = await resClientes.json();
        const productosData = await resProductos.json();
        setClientes(clientesData);
        setProductos(productosData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    const precio = parseFloat(compraPrecioQQ) || 0;
    const cantidad = parseFloat(compraCatidadQQ) || 0;
    const total = precio * cantidad;
    const retencion = (cantidad)-( cantidad * 0.04);
    setCompraTotal(total.toFixed(2));
    setCompraRetencio(retencion.toFixed(2));
  }, [compraPrecioQQ, compraCatidadQQ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación rápida
    if (!clienteID || !compraFecha || !compraTipoCafe || !compraPrecioQQ || !compraCatidadQQ) {
      setMensaje('Por favor complete todos los campos obligatorios.');
      return;
    }

    const data = {
      clienteID: parseInt(clienteID),
      compraFecha,
      compraTipoCafe: parseInt(compraTipoCafe),
      compraPrecioQQ: parseFloat(compraPrecioQQ),
      compraCatidadQQ: parseFloat(compraCatidadQQ),
      compraTotal: parseFloat(compraTotal),
      comprarTotalSacos: comprarTotalSacos ? parseFloat(comprarTotalSacos) : 0,
      compraRetencio: parseFloat(compraRetencio),
      compraDescripcion,
      compraMovimiento: "Entrada",
      compraTipoDocumento: "Compra directa",
      compraEn: "Efectivo",
    };

    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje('Compra registrada exitosamente');
        // Reset campos
        setClienteID('');
        setCompraFecha('');
        setCompraTipoCafe('');
        setCompraPrecioQQ('');
        setCompraCatidadQQ('');
        setComprarTotalSacos('');
        setCompraDescripcion('');
      } else {
        const err = await res.json();
        setMensaje('Error: ' + (err.error || 'Error desconocido'));
      }
    } catch (error) {
      setMensaje('Error enviando los datos');
      console.error(error);
    }
  };

  return (
    <form className="compra-form" onSubmit={handleSubmit}>
      <h2>Compra</h2>

      <select value={clienteID} onChange={(e) => setClienteID(e.target.value)} required>
        <option value="">Seleccione cliente</option>
        {clientes.map((cliente) => (
          <option key={cliente.clienteID} value={cliente.clienteID}>
            {cliente.clienteNombre} {cliente.clienteApellido}
          </option>
        ))}
      </select>

      <select value={compraTipoCafe} onChange={(e) => setCompraTipoCafe(e.target.value)} required>
        <option value="">Seleccione tipo de café</option>
        {productos.map((producto) => (
          <option key={producto.productID} value={producto.productID}>
            {producto.productName}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={compraFecha}
        onChange={(e) => setCompraFecha(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Precio por QQ"
        value={compraPrecioQQ}
        onChange={(e) => setCompraPrecioQQ(e.target.value)}
        step="0.01"
        required
      />

      <input
        type="number"
        placeholder="Cantidad QQ"
        value={compraCatidadQQ}
        onChange={(e) => setCompraCatidadQQ(e.target.value)}
        step="0.01"
        required
      />

      <input type="text" value={`L. ${compraTotal}`} readOnly placeholder="Total (Lps)" />
      <input type="text" value={`L. ${compraRetencio}`} readOnly placeholder="Retención (Lps)" />

      <input
        type="number"
        placeholder="Total Sacos"
        value={comprarTotalSacos}
        onChange={(e) => setComprarTotalSacos(e.target.value)}
        step="0.01"
      />

      <textarea
        placeholder="Descripción"
        value={compraDescripcion}
        onChange={(e) => setCompraDescripcion(e.target.value)}
      />

      <button type="submit">Registrar Compra</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}
