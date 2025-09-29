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
      const contratoAgg = await prisma.detallecontrato.aggregate({
        _sum: { cantidadQQ: true, precioQQ: true },
        where: {
          contrato: { contratoclienteID: c.clienteID },
          tipoMovimiento: "Entrada",
          fecha: { gte: desde, lte: hasta },
        },
      });

      // Depósitos entrada usando detalleliqdeposito y liqdeposito
      const depositoAgg = await prisma.detalleliqdeposito.aggregate({
        _sum: { cantidadQQ: true, totalLps: true },
        where: {
          liqdeposito: {
            liqclienteID: c.clienteID,
            liqMovimiento: "Entrada",
            liqFecha: { gte: desde, lte: hasta },
          },
        },
      });

      // 🔹 Si no hay movimientos, retornamos null
      const hasMovimientos =
        (compraAgg._sum.compraCantidadQQ ?? 0) > 0 ||
        (contratoAgg._sum.cantidadQQ ?? 0) > 0 ||
        (depositoAgg._sum.cantidadQQ ?? 0) > 0;

      if (!hasMovimientos) return null;

      return {
        clienteID: c.clienteID,
        nombre: `${c.clienteNombre || ""} ${c.clienteApellido || ""}`.trim(),
        compraCantidadQQ: Number(compraAgg._sum.compraCantidadQQ || 0),
        compraTotalLps: Number(compraAgg._sum.compraTotal || 0),
        contratoCantidadQQ: Number(contratoAgg._sum.cantidadQQ || 0),
        contratoTotalLps: Number(contratoAgg._sum.precioQQ || 0),
        depositoCantidadQQ: Number(depositoAgg._sum.cantidadQQ || 0),
        depositoTotalLps: Number(depositoAgg._sum.totalLps || 0),
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
