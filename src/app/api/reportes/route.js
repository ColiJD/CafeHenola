import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function GET(req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  try {
    const { searchParams } = new URL(req.url);
    const desdeParam = searchParams.get("desde");
    const hastaParam = searchParams.get("hasta");

    let desde, hasta;

    if (desdeParam && hastaParam) {
      // Usar UTC y asegurar que incluya todo el día
      desde = new Date(new Date(desdeParam).setUTCHours(0, 0, 0, 0));
      hasta = new Date(new Date(hastaParam).setUTCHours(23, 59, 59, 999));
    } else {
      const ahora = new Date();
      desde = new Date(
        Date.UTC(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0)
      );
      hasta = new Date(
        Date.UTC(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          23,
          59,
          59,
          999
        )
      );
    }

    // 🔹 Compras
    const comprasEntradas = await prisma.compra.aggregate({
      _sum: { compraCantidadQQ: true, compraTotal: true, compraRetencio: true },
      where: {
        compraMovimiento: "Entrada",
        compraFecha: { gte: desde, lte: hasta },
      },
    });

    const comprasSalidas = await prisma.compra.aggregate({
      _sum: { compraCantidadQQ: true, compraTotal: true, compraRetencio: true },
      where: {
        compraMovimiento: "Salida",
        compraFecha: { gte: desde, lte: hasta },
      },
    });

    // 🔹 Contratos (movimientos reales en CierreContrato)
    // Obtener los detalles del contrato dentro del rango
    const contratosDetalles = await prisma.detallecontrato.findMany({
      where: {
        tipoMovimiento: "Entrada",
        fecha: { gte: desde, lte: hasta },
      },
      select: {
        cantidadQQ: true,
        precioQQ: true,
      },
    });

    // Calcular total real multiplicando cantidad * precio
    let totalCantidad = 0;
    let totalMonto = 0;

    contratosDetalles.forEach((item) => {
      totalCantidad += item.cantidadQQ;
      totalMonto += item.cantidadQQ * item.precioQQ;
    });

    const contratosEntradas = {
      cantidadQQ: totalCantidad,
      total: totalMonto,
    };

    // 🔹 RESUMEN DE DEPÓSITOS
    // Movimientos reales = tabla DetalleLiqDeposito pero filtrando por Deposito.depositoMovimiento
    const depositosEntradas = await prisma.detalleliqdeposito.aggregate({
      _sum: {
        cantidadQQ: true,
        totalLps: true,
      },
      where: {
        liqdeposito: {
          liqMovimiento: "Entrada",
          liqFecha: { gte: desde, lte: hasta },
        },
      },
    });

    const salidasDetalles = await prisma.salida.findMany({
      where: {
        salidaMovimiento: "Salida",
        salidaFecha: { gte: desde, lte: hasta },
      },
      select: { salidaCantidadQQ: true, salidaPrecio: true },
    });

    let totalSalidaCantidad = 0;
    let totalSalidaMonto = 0;
    salidasDetalles.forEach((item) => {
      totalSalidaCantidad += Number(item.salidaCantidadQQ || 0);
      totalSalidaMonto +=
        Number(item.salidaCantidadQQ || 0) * Number(item.salidaPrecio || 0);
    });

    const salidas = {
      cantidadQQ: totalSalidaCantidad,
      total: totalSalidaMonto,
    };

    return new Response(
      JSON.stringify({
        compras: { entradas: comprasEntradas, salidas: comprasSalidas },
        contratos: { entradas: contratosEntradas },
        depositos: { entradas: depositosEntradas },
        salidas,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error en API:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
