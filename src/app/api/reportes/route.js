import prisma from "@/lib/prisma";

export async function GET(req) {
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
    const contratosEntradas = await prisma.cierrecontrato.aggregate({
      _sum: { totalEntregadoQQ: true, totalLps: true },
      where: {
        tipoMovimiento: "Entrada",
        fechaCierre: { gte: desde, lte: hasta },
      },
    });

    const contratosSalidas = await prisma.cierrecontrato.aggregate({
      _sum: { totalEntregadoQQ: true, totalLps: true },
      where: {
        tipoMovimiento: "Salida",
        fechaCierre: { gte: desde, lte: hasta },
      },
    });

    // 🔹 Retenciones = tabla Contrato
    const contratosRetencion = await prisma.contrato.aggregate({
      _sum: { contratoRetencionQQ: true },
      where: { contratoFecha: { gte: desde, lte: hasta } },
    });

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

    const depositosSalidas = await prisma.detalleliqdeposito.aggregate({
      _sum: {
        cantidadQQ: true,
        totalLps: true,
      },
      where: {
        liqdeposito: {
          liqMovimiento: "Salida",
          liqFecha: { gte: desde, lte: hasta },
        },
      },
    });

    // Retenciones si necesitas sumarlas desde deposito
    const depositosRetencion = await prisma.deposito.aggregate({
      _sum: {
        depositoRetencionQQ: true,
      },
      where: {
        depositoFecha: { gte: desde, lte: hasta },
      },
    });

    return new Response(
      JSON.stringify({
        compras: { entradas: comprasEntradas, salidas: comprasSalidas },
        contratos: {
          entradas: contratosEntradas,
          salidas: contratosSalidas,
          retencion: contratosRetencion,
        },
        depositos: {
          entradas: depositosEntradas,
          salidas: depositosSalidas,
          retencion: depositosRetencion,
        },
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

// // 👀 Debug opcional: muestra todos los registros para inspección
// const debugCompras = await prisma.compra.findMany({
//   where: {
//     compraFecha: { gte: desde, lte: hasta },
//   },
//   select: {
//     compraId: true,
//     compraMovimiento: true,
//     compraFecha: true,
//     compraCantidadQQ: true,
//     compraTotal: true,
//     compraRetencio: true,
//   },
//   orderBy: { compraId: "asc" },
// });
// console.log("📌 Registros encontrados:", debugCompras);

// 🔹 Totales agregados, ignorando mayúsculas/minúsculas
