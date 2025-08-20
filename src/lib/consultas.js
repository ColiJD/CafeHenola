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


// lib/consultasProductos.js
export async function obtenerProductosSelect() {
  try {
    const res = await fetch("/api/productos");
    const productosData = await res.json();

    return productosData.map((p) => ({
      value: p.id,           // id del producto
      label: p.productName,  // nombre que se muestra en el select
      data: p,               // guardamos todo el objeto para edición
    }));
  } catch (err) {
    console.error("Error al cargar productos:", err);
    return []; // retornamos array vacío si falla
  }
}
