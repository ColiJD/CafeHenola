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

    const desde = desdeParam ? new Date(desdeParam) : new Date("2000-01-01");
    const hasta = hastaParam ? new Date(hastaParam) : new Date();

    // ----------------------------------------------------------
    // 1️⃣ Obtener todos los clientes
    // ----------------------------------------------------------
    const clientes = await prisma.cliente.findMany({
      select: {
        clienteID: true,
        clienteNombre: true,
        clienteApellido: true,
      },
      orderBy: { clienteNombre: "asc" },
    });

    const resultadosClientes = [];

    // ----------------------------------------------------------
    // 2️⃣ Recorrer cada cliente y calcular préstamos y anticipos
    // ----------------------------------------------------------
    for (const cli of clientes) {
      // Préstamos
      const prestamosActivos = await prisma.prestamos.aggregate({
        _sum: { monto: true },
        where: { clienteId: cli.clienteID, estado: "ACTIVO" },
      });

      const movimientosPrestamo = await prisma.movimientos_prestamo.groupBy({
        by: ["tipo_movimiento"],
        _sum: { monto: true },
        where: {
          prestamos: { clienteId: cli.clienteID },
          tipo_movimiento: { in: ["ABONO", "PAGO_INTERES", "Int-Cargo"] },
          fecha: { gte: desde, lte: hasta },
        },
      });

      const resumenPrestamos = {
        ABONO: 0,
        PAGO_INTERES: 0,
        "Int-Cargo": 0,
      };
      movimientosPrestamo.forEach((mov) => {
        if (resumenPrestamos[mov.tipo_movimiento] !== undefined) {
          resumenPrestamos[mov.tipo_movimiento] = Number(mov._sum.monto ?? 0);
        }
      });

      // Anticipos
      const anticiposActivos = await prisma.anticipo.aggregate({
        _sum: { monto: true },
        where: { clienteId: cli.clienteID, estado: "ACTIVO" },
      });

      const movimientosAnticipos = await prisma.movimientos_anticipos.groupBy({
        by: ["tipo_movimiento"],
        _sum: { monto: true },
        where: {
          anticipo: { clienteId: cli.clienteID },
          tipo_movimiento: {
            in: ["CARGO_ANTICIPO", "INTERES_ANTICIPO", "ABONO_ANTICIPO"],
          },
          fecha: { gte: desde, lte: hasta },
        },
      });

      const resumenAnticipos = {
        CARGO_ANTICIPO: 0,
        INTERES_ANTICIPO: 0,
        ABONO_ANTICIPO: 0,
      };
      movimientosAnticipos.forEach((mov) => {
        if (resumenAnticipos[mov.tipo_movimiento] !== undefined) {
          resumenAnticipos[mov.tipo_movimiento] = Number(mov._sum.monto ?? 0);
        }
      });

      resultadosClientes.push({
        clienteID: cli.clienteID,
        nombre: `${cli.clienteNombre ?? ""} ${cli.clienteApellido ?? ""}`.trim(),
        prestamos: {
          totalPrestamosActivos: Number(prestamosActivos._sum.monto ?? 0),
          movimientos: resumenPrestamos,
        },
        anticipos: {
          totalAnticiposActivos: Number(anticiposActivos._sum.monto ?? 0),
          movimientos: resumenAnticipos,
        },
      });
    }

    // ----------------------------------------------------------
    // 3️⃣ Retornar array de clientes
    // ----------------------------------------------------------
    return Response.json({ ok: true, clientes: resultadosClientes });
  } catch (error) {
    console.error("Error en API:", error);
    return Response.json(
      { ok: false, error: "Error al obtener el reporte de clientes" },
      { status: 500 }
    );
  }
}
