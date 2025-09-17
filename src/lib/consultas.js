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

// archivo lib/consultas.js (o donde prefieras)
export async function obtenerContratosPendientes(clienteID) {
  if (!clienteID) return []; // previene llamadas innecesarias

  try {
    const res = await fetch(`/api/contratos/pendientes/${clienteID}`);
    const data = await res.json();
    return data.map((c) => ({
      value: c.contratoID,
      label: `Contrato #${c.contratoID} - ${c.contratoCantidadQQ} (QOro) - ${c.tipoCafeNombre}`,
      tipoCafeID: c.tipoCafeID,
      tipoCafeNombre: c.tipoCafeNombre,
    }));
  } catch (err) {
    console.error("Error al cargar contratos pendientes:", err);
    return [];
  }
}

// archivo lib/consultas.js (o donde prefieras)
export async function obtenerSaldoContrato(contratoID) {
  if (!contratoID) return null;

  try {
    const res = await fetch(`/api/contratos/saldoDisponible/${contratoID}`);
    const data = await res.json();

    if (!data || data.saldoDisponibleQQ === undefined) {
      return null; // indicamos que no hay saldo
    }

    return {
      saldoDisponibleQQ: data.saldoDisponibleQQ,
      saldoDisponibleLps: data.saldoDisponibleLps,
      tipoCafeID: data.tipoCafeID || 0,
      tipoCafeNombre: data.tipoCafeNombre || "",
      precioQQ: data.precioQQ || 0,
      totalLiquidacion: 0,
      totalSacos: "",
      pesoBrutoContrato: "",
    };
  } catch (err) {
    console.error("Error cargando saldo disponible:", err);
    return null;
  }
}

export async function obtenerClientesPendientesContratos(messageApi) {
  try {
    const res = await fetch("/api/contratos/disponibles");
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const clientesData = await res.json();

    return clientesData.map((c) => ({
      value: c.clienteID,
      label: c.clienteNombreCompleto, // ya viene concatenado desde la vista
      data: c, // solo si necesitas más info del cliente
    }));
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    messageApi.error("⚠️ No se pudieron cargar los clientes.");
    return [];
  }
}

// lib/obtenerSelectData.js
export async function obtenerSelectData({
  url,
  messageApi,
  valueField,
  labelField,
}) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const data = await res.json();

    return data.map((item) => ({
      value: item[valueField],
      label: item[labelField],
      data: item,
    }));
  } catch (err) {
    console.error(`Error al cargar datos desde ${url}:`, err);
    if (messageApi) messageApi.error("⚠️ No se pudieron cargar los datos.");
    return [];
  }
}
