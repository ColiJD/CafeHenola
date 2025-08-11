'use client';
import "@/style/producto.css"
import { useState } from 'react';

export default function ProductoForm() {
  const [productName, setProductName] = useState('');
  const [productDescripcion, setProductDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, productDescripcion }),
    });

    if (res.ok) {
      setMensaje('Producto agregado correctamente');
      setProductName('');
      setProductDescripcion('');
    } else {
      setMensaje('Error al agregar el producto');
    }
  };

  return (
    <div className="form-container">
      <h2>Agregar Producto</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            value={productDescripcion}
            onChange={(e) => setProductDescripcion(e.target.value)}
            rows="3"
          ></textarea>
        </div>

        <button type="submit">Guardar</button>

        {mensaje && <p className="form-message">{mensaje}</p>}
      </form>
    </div>
  );
}
