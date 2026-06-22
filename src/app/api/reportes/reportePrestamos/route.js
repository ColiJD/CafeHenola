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
    const desde = searchParams.get("desde")
      ? new Date(searchParams.get("desde"))
      : new Date("2000-01-01");

    const hasta = searchParams.get("hasta")
      ? new Date(searchParams.get("hasta"))
      : new Date();

    // 4 queries en total en lugar de 4 por cliente
    const [clientes, prestamosSums, anticiposSums, movPrestamo, movAnticipo] =
      await Promise.all([
        prisma.cliente.findMany({
          select: {
            clienteID: true,
            clienteNombre: true,
            clienteApellido: true,
          },
          orderBy: { clienteNombre: "asc" },
        }),

        prisma.prestamos.groupBy({
          by: ["clienteId"],
          _sum: { monto: true },
          where: { estado: { in: ["ACTIVO", "COMPLETADO"] } },
        }),

        prisma.anticipo.groupBy({
          by: ["clienteId"],
          _sum: { monto: true },
          where: { estado: { in: ["ACTIVO", "COMPLETADO"] } },
        }),

        prisma.$queryRaw`
          SELECT p.clienteId, mp.tipo_movimiento, SUM(mp.monto) AS total
          FROM movimientos_prestamo mp
          JOIN prestamos p ON p.prestamoId = mp.prestamo_id
          WHERE mp.fecha >= ${desde} AND mp.fecha <= ${hasta}
            AND mp.tipo_movimiento IN ('Int-Cargo','ABONO','PAGO_INTERES','CARGO_INTERES','ABONO_INTERES')
          GROUP BY p.clienteId, mp.tipo_movimiento
        `,

        prisma.$queryRaw`
          SELECT a.clienteId, ma.tipo_movimiento, SUM(ma.monto) AS total
          FROM movimientos_anticipos ma
          JOIN anticipo a ON a.anticipoId = ma.anticipoId
          WHERE ma.fecha >= ${desde} AND ma.fecha <= ${hasta}
            AND ma.tipo_movimiento IN ('CARGO_ANTICIPO','INTERES_ANTICIPO','ABONO_ANTICIPO')
          GROUP BY a.clienteId, ma.tipo_movimiento
        `,
      ]);

    // Indexar resultados por clienteId para O(1) lookup
    const prestamosPorCliente = new Map(
      prestamosSums.map((r) => [r.clienteId, Number(r._sum.monto ?? 0)])
    );
    const anticiposPorCliente = new Map(
      anticiposSums.map((r) => [r.clienteId, Number(r._sum.monto ?? 0)])
    );

    const movPrePorCliente = new Map();
    for (const row of movPrestamo) {
      const cid = row.clienteId;
      if (!movPrePorCliente.has(cid)) movPrePorCliente.set(cid, {});
      movPrePorCliente.get(cid)[row.tipo_movimiento] = Number(row.total ?? 0);
    }

    const movAntiPorCliente = new Map();
    for (const row of movAnticipo) {
      const cid = row.clienteId;
      if (!movAntiPorCliente.has(cid)) movAntiPorCliente.set(cid, {});
      movAntiPorCliente.get(cid)[row.tipo_movimiento] = Number(row.total ?? 0);
    }

    const resultados = [];

    for (const cli of clientes) {
      const cid = cli.clienteID;

      const Mpre = movPrePorCliente.get(cid) ?? {};
      const intCargo =
        (Mpre["Int-Cargo"] ?? 0) + (Mpre["CARGO_INTERES"] ?? 0);
      const abonoPre = (Mpre["ABONO"] ?? 0) + (Mpre["ABONO_INTERES"] ?? 0);
      const pagIntPre = Mpre["PAGO_INTERES"] ?? 0;

      const activoPrestamo = (prestamosPorCliente.get(cid) ?? 0) + intCargo;
      const abonoPrestamo = abonoPre + pagIntPre;
      const saldoPrestamo = activoPrestamo - abonoPrestamo;

      const Manti = movAntiPorCliente.get(cid) ?? {};
      const activoAnticipo =
        (anticiposPorCliente.get(cid) ?? 0) + (Manti["CARGO_ANTICIPO"] ?? 0);
      const abonoAnticipo =
        (Manti["ABONO_ANTICIPO"] ?? 0) + (Manti["INTERES_ANTICIPO"] ?? 0);
      const saldoAnticipo = activoAnticipo - abonoAnticipo;

      const totalCliente =
        activoPrestamo +
        abonoPrestamo +
        saldoPrestamo +
        activoAnticipo +
        abonoAnticipo +
        saldoAnticipo;

      if (totalCliente === 0) continue;

      resultados.push({
        clienteID: cid,
        nombre: `${cli.clienteNombre ?? ""} ${cli.clienteApellido ?? ""}`.trim(),
        activoPrestamo,
        abonoPrestamo,
        saldoPrestamo,
        activoAnticipo,
        abonoAnticipo,
        saldoAnticipo,
      });
    }

    return Response.json({ ok: true, clientes: resultados });
  } catch (error) {
    console.error("ERROR REPORTE: ", error);
    return Response.json(
      { ok: false, error: "Error al obtener el reporte" },
      { status: 500 }
    );
  }
}
