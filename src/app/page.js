'use client';

import { useState, useEffect } from 'react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Obtener usuarios desde la API
  const cargarUsuarios = async () => {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsuarios(data);
  };

  // Se ejecuta al cargar la página
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email }),
    });

    if (res.ok) {
      setMensaje('✅ Usuario creado correctamente');
      setNombre('');
      setEmail('');
      cargarUsuarios(); // recarga lista
    } else {
      setMensaje('❌ Error al crear usuario');
    }
  };

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Gestión de Usuarios</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ marginRight: '10px' }}
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginRight: '10px' }}
        />
        <button type="submit">Agregar Usuario</button>
      </form>

      {mensaje && <p>{mensaje}</p>}

      <h2>Usuarios Registrados</h2>
      <ul>
        {usuarios.map((u) => (
          <li key={u.id}>
            {u.nombre} - {u.email}
          </li>
        ))}
      </ul>
    </main>
  );
}
