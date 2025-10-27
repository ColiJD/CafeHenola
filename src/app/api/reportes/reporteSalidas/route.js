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
      // Fechas con UTC incluyendo todo el día
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

    // 🔹 Traer todos los compradores
    const compradores = await prisma.compradores.findMany({
      select: { compradorId: true, compradorNombre: true },
    });

    // 🔹 Para cada comprador, calcular agregados de compra
    const reportePromises = compradores.map(async (c) => {
      const compraAgg = await prisma.compra.aggregate({
        _sum: { compraCantidadQQ: true, compraTotal: true },
        where: {
          compradorID: c.compradorId,
          compraMovimiento: "Salida",
          compraFecha: { gte: desde, lte: hasta },
        },
      });

      const totalQQ = Number(compraAgg._sum.compraCantidadQQ || 0);
      const totalLps = Number(compraAgg._sum.compraTotal || 0);

      if (totalQQ === 0 && totalLps === 0) return null;

      return {
        compradorId: c.compradorId,
        nombre: c.compradorNombre.trim(),
        compraCantidadQQ: totalQQ,
        compraTotalLps: totalLps,
      };
    });

    let reporte = await Promise.all(reportePromises);

    // 🔹 Filtrar compradores sin movimientos
    reporte = reporte.filter((r) => r !== null);

    return new Response(JSON.stringify(reporte), { status: 200 });
  } catch (error) {
    console.error("❌ Error en API:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
