// utils/clientes.js
export async function obtenerClientesSelect() {
  try {
    const res = await fetch("/api/clientes");
    const clientesData = await res.json();
    return clientesData.map((c) => ({
      value: c.clienteID,
      label: `${c.clienteNombre} ${c.clienteApellido}`,
      data: c, // guardamos todo el objeto para autocompletar
    }));
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    return []; // retornamos array vacío si falla
  }
}
