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

    // 🔹 Traer todos los clientes
    const clientes = await prisma.cliente.findMany({
      select: { clienteID: true, clienteNombre: true, clienteApellido: true },
    });

    // 🔹 Para cada cliente, calcular agregados de entrada
    const reportePromises = clientes.map(async (c) => {
      // Compras entrada
      const compraAgg = await prisma.compra.aggregate({
        _sum: { compraCantidadQQ: true, compraTotal: true },
        where: {
          clienteID: c.clienteID,
          compraMovimiento: "Entrada",
          compraFecha: { gte: desde, lte: hasta },
        },
      });

      // Contratos entrada
      // Contratos entrada
      const contratos = await prisma.detallecontrato.findMany({
        where: {
          contrato: { contratoclienteID: c.clienteID },
          tipoMovimiento: "Entrada",
          fecha: { gte: desde, lte: hasta },
        },
        select: { cantidadQQ: true, precioQQ: true },
      });

      const contratoCantidadQQ = contratos.reduce(
        (sum, r) => sum + Number(r.cantidadQQ || 0),
        0
      );

      const contratoTotalLps = contratos.reduce(
        (sum, r) => sum + Number(r.cantidadQQ || 0) * Number(r.precioQQ || 0),
        0
      );

      // Depósitos entrada usando detalleliqdeposito y liqdeposito
      const depositoAgg = await prisma.detalleliqdeposito.aggregate({
        _sum: { cantidadQQ: true, totalLps: true },
        where: {
          liqdeposito: {
            liqclienteID: c.clienteID,
            liqMovimiento: "Salida",
            liqFecha: { gte: desde, lte: hasta },
          },
        },
      });

      // 🔹 Depósitos Totales (Reales)
      const totalDepositosRaw = await prisma.deposito.aggregate({
        _sum: { depositoCantidadQQ: true },
        where: {
          clienteID: c.clienteID,
          depositoMovimiento: "Deposito",

          depositoFecha: { gte: desde, lte: hasta },
        },
      });
      const totalDepositosQQ = Number(
        totalDepositosRaw._sum.depositoCantidadQQ ?? 0
      );

      // 🔹 Si no hay movimientos, retornamos null
      const hasMovimientos =
        (compraAgg._sum.compraCantidadQQ ?? 0) > 0 ||
        contratoCantidadQQ > 0 ||
        (depositoAgg._sum.cantidadQQ ?? 0) > 0 ||
        totalDepositosQQ > 0;

      if (!hasMovimientos) return null;

      return {
        clienteID: c.clienteID,
        nombre: `${c.clienteNombre || ""} ${c.clienteApellido || ""}`.trim(),
        compraCantidadQQ: Number(compraAgg._sum.compraCantidadQQ || 0),
        compraTotalLps: Number(compraAgg._sum.compraTotal || 0),
        contratoCantidadQQ,
        contratoTotalLps,
        depositoCantidadQQ: Number(depositoAgg._sum.cantidadQQ || 0),
        depositoTotalLps: Number(depositoAgg._sum.totalLps || 0),
        totalDepositosQQ,
      };
    });

    let reporte = await Promise.all(reportePromises);

    // 🔹 Filtrar clientes sin movimientos
    reporte = reporte.filter((r) => r !== null);

    return new Response(JSON.stringify(reporte), { status: 200 });
  } catch (error) {
    console.error("❌ Error en API:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
