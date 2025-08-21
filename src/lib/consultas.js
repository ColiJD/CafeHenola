export async function obtenerClientesSelect(messageApi) {
  try {
    const res = await fetch("/api/clientes");
    if (!res.ok) throw new Error("Error al obtener clientes");
    const clientesData = await res.json();

    return clientesData.map((c) => ({
      value: c.clienteID,
      label: c.clienteNombre + " " + c.clienteApellido,
      data: c,
    }));
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    if (messageApi) messageApi.error("Error al cargar clientes");
    return [];
  }
}

export async function obtenerProductosSelect(messageApi) {
  try {
    const res = await fetch("/api/productos");
    if (!res.ok) throw new Error("Error al obtener productos");
    const productosData = await res.json();

    return productosData.map((p) => ({
      value: p.productoID, // ID correcto
      label: p.productoNombre, // nombre correcto
      data: p, // guardamos todo el objeto
    }));
  } catch (err) {
    console.error("Error al cargar productos:", err);
    if (messageApi) messageApi.error("Error al cargar productos");
    return [];
  }
}

export async function obtenerDepositos(messageApi) {
  try {
    const res = await fetch("/api/deposito");
    if (!res.ok) throw new Error("Error al obtener depósitos");
    const depositosData = await res.json();

    return depositosData.map((d) => ({
      value: d.depositoID,
      label: `Depósito ${d.depositoID}`,
      data: d,
    }));
  } catch (err) {
    console.error("Error al cargar depósitos:", err);
    if (messageApi) messageApi.error("Error al cargar depósitos");
    return [];
  }
}
