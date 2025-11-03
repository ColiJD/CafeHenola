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
    messageApi.error(" No se pudieron cargar los clientes.");
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
    messageApi.error(" No se pudieron cargar los productos.");
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
    messageApi.error("No se pudieron cargar los clientes.");
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
    if (messageApi) messageApi.error(" No se pudieron cargar los datos.");
    return [];
  }
}
// consultas.js
export async function verificarClientesPendientesContratos(clienteID) {
  if (!clienteID) return [];

  try {
    const res = await fetch(
      `/api/contratos/disponibles?clienteID=${clienteID}`
    );
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    // Creamos mensajes por cada contrato
    const mensajes = data.map((c) => {
      const estado = c.completado ? "Completado" : "Pendiente";

      // Formateo de valores
      const monto = c.saldoInicial.toLocaleString("es-HN", {
        style: "currency",
        currency: "HNL",
      });
      const restante = c.faltante.toLocaleString("es-HN", {
        style: "currency",
        currency: "HNL",
      });
      const cantidadInicial = Number(c.cantidadInicial || 0);
      const cantidadEntregada = Number(c.cantidadEntregada || 0);
      const cantidadFaltante = Number(c.cantidadFaltante || 0);

      return `Contrato #${
        c.contratoID
      }: Estado: ${estado}, Monto: ${monto}, Restante: ${restante}, Cantidad Inicial: ${cantidadInicial.toFixed(
        2
      )}, Entregada: ${cantidadEntregada.toFixed(
        2
      )}, Faltante: ${cantidadFaltante.toFixed(2)}`;
    });

    return mensajes;
  } catch (err) {
    console.error(err);
    return ["No se pudieron verificar los contratos pendientes."];
  }
}
export async function verificarDepositosPendientes(clienteID) {
  try {
    const url = `/api/liqDeposito/clienteConDeposito?clienteID=${clienteID}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    // Generamos mensajes detallados por depósito pendiente
    const mensajes = data.map((d) => {
      const cantidadTotal = Number(d.cantidadTotal || 0).toFixed(2);
      const cantidadEntregada = Number(d.cantidadEntregada || 0).toFixed(2);
      const cantidadFaltante = Number(d.cantidadFaltante || 0).toFixed(2);

      return `Depósito #${d.depositoID}:  Cantidad Total: ${cantidadTotal}, Entregada: ${cantidadEntregada}, Faltante: ${cantidadFaltante}`;
    });

    return mensajes;
  } catch (err) {
    console.error(err);
    return ["No se pudieron verificar los depósitos pendientes."];
  }
}

export async function verificarPrestamosPendientes(clienteID) {
  try {
    const url = `/api/prestamos/estadoPrestamo?clienteID=${clienteID}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    // Generamos mensajes detallados por préstamo pendiente
    const mensajes = data.map((p) => {
      const saldoInicial = Number(p.saldoInicial || 0).toLocaleString("es-HN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const totalAbono = Number(p.totalAbono || 0).toLocaleString("es-HN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const totalPagoInteres = Number(p.totalPagoInteres || 0).toLocaleString(
        "es-HN",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      );
      const totalIntCargo = Number(p.totalIntCargo || 0).toLocaleString(
        "es-HN",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      );
      const saldoPendiente = Number(p.saldoPendiente || 0).toLocaleString(
        "es-HN",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      );

      return `Préstamo #${p.prestamoID}: Monto Inicial: ${saldoInicial}, Abonos: ${totalAbono}, Pago Interés: ${totalPagoInteres}, Interés Cargado: ${totalIntCargo}, Saldo Pendiente: ${saldoPendiente}`;
    });

    return mensajes;
  } catch (err) {
    console.error(err);
    return ["No se pudieron verificar los préstamos pendientes."];
  }
}
