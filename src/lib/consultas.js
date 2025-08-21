// utils/clientes.js
export async function obtenerClientesSelect(messageApi) {
  try {
    const res = await fetch("/api/clientes");
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const clientesData = await res.json();
    return clientesData.map((c) => ({
      value: c.clienteID,
      label: `${c.clienteNombre} ${c.clienteApellido}`,
      data: c,
    }));
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    messageApi.error("⚠️ No se pudieron cargar los clientes.");
    return [];
  }
}

// lib/consultasProductos.js
export async function obtenerProductosSelect(messageApi) {
  try {
    const res = await fetch("/api/productos");
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const productosData = await res.json();
    return productosData.map((p) => ({
      value: p.productID,
      label: p.productName,
      data: p,
    }));
  } catch (err) {
    console.error("Error al cargar productos:", err);
    messageApi.error("⚠️ No se pudieron cargar los productos.");
    return [];
  }
}

export async function obtenerDepositos() {
  try {
    const res = await fetch("/api/deposito");
    const depositosData = await res.json();

    return depositosData.map((d) => ({
      value: d.depositoID,
      label: `Depósito ${d.depositoID}`,
      data: d,
    }));
  } catch (err) {
    console.error("Error al cargar depósitos:", err);
    return [];
  }
}
