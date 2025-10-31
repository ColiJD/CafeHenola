import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      clienteID,
      tipo_movimiento,
      monto,
      fecha,
      observacion,
      interes,
      dias,
    } = body;

    if (!clienteID || !tipo_movimiento || monto == null || isNaN(monto)) {
      return NextResponse.json(
        { error: "Datos incompletos o monto inválido." },
        { status: 400 }
      );
    }

    let montoIngresado = parseFloat(monto);

    await prisma.$transaction(async (tx) => {
      const anticipos = await tx.anticipo.findMany({
        where: { clienteId: clienteID, estado: { not: "ANULADO" } },
        include: { movimientos_anticipos: true },
        orderBy: { fecha: "asc" },
      });

      if (!anticipos.length) {
        throw new Error("No existen anticipos válidos para este cliente.");
      }

      // Preparar anticipos con deuda e intereses
      const anticiposPendientes = anticipos.map((a) => {
        const cargos = a.movimientos_anticipos
          .filter((m) => m.tipo_movimiento === "CARGO_ANTICIPO")
          .reduce((sum, m) => sum + Number(m.monto || 0), 0);

        const abonos = a.movimientos_anticipos
          .filter((m) => m.tipo_movimiento === "ABONO_ANTICIPO")
          .reduce((sum, m) => sum + Number(m.monto || 0), 0);

        const pagosInteres = a.movimientos_anticipos
          .filter((m) => m.tipo_movimiento === "INTERES_ANTICIPO")
          .reduce((sum, m) => sum + Number(m.monto || 0), 0);

        return {
          anticipo: a,
          deudaCapital: parseFloat((Number(a.monto || 0) - abonos).toFixed(2)),
          interesPendiente: parseFloat((cargos - pagosInteres).toFixed(2)),
          totalCargos: cargos,
        };
      });

      // === ABONO AL CAPITAL ===
      if (tipo_movimiento === "ABONO_ANTICIPO") {
        const totalDeudaCapital = anticiposPendientes.reduce(
          (sum, a) => sum + a.deudaCapital,
          0
        );
        if (montoIngresado > totalDeudaCapital) {
          throw new Error(
            `El abono (L. ${montoIngresado.toFixed(
              2
            )}) excede la deuda de capital pendiente (L. ${totalDeudaCapital.toFixed(
              2
            )}).`
          );
        }

        let restante = montoIngresado;
        for (const a of anticiposPendientes) {
          if (restante <= 0 || a.deudaCapital <= 0) continue;

          const aplicar = Math.min(restante, a.deudaCapital);

          await tx.movimientos_anticipos.create({
            data: {
              anticipoId: a.anticipo.anticipoId,
              fecha: fecha ? new Date(fecha) : new Date(),
              tipo_movimiento,
              monto: aplicar,
              interes: interes ? parseFloat(interes) : null,
              dias: dias ? parseInt(dias) : null,
              descripcion: observacion || tipo_movimiento,
            },
          });

          restante = parseFloat((restante - aplicar).toFixed(2));
        }
      }

      // === PAGO DE INTERESES ===
      if (tipo_movimiento === "INTERES_ANTICIPO") {
        const totalIntereses = anticiposPendientes.reduce(
          (sum, a) => sum + a.interesPendiente,
          0
        );

        if (totalIntereses <= 0) {
          throw new Error("No hay intereses pendientes en los anticipos.");
        }

        if (montoIngresado > totalIntereses) {
          throw new Error(
            `El pago de intereses (L. ${montoIngresado.toFixed(
              2
            )}) excede los intereses pendientes (L. ${totalIntereses.toFixed(
              2
            )}).`
          );
        }

        let restante = montoIngresado;
        for (const a of anticiposPendientes) {
          if (restante <= 0 || a.interesPendiente <= 0) continue;

          const aplicar = Math.min(restante, a.interesPendiente);

          await tx.movimientos_anticipos.create({
            data: {
              anticipoId: a.anticipo.anticipoId,
              fecha: fecha ? new Date(fecha) : new Date(),
              tipo_movimiento,
              monto: aplicar,
              interes: interes ? parseFloat(interes) : null,
              dias: dias ? parseInt(dias) : null,
              descripcion: observacion || tipo_movimiento,
            },
          });

          restante = parseFloat((restante - aplicar).toFixed(2));
        }
      }

      // === CARGO DE INTERESES ===
      if (tipo_movimiento === "CARGO_ANTICIPO") {
        const activos = anticipos
          .filter((a) => !["ANULADO"].includes(a.estado))
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        if (!activos.length) {
          throw new Error("No hay anticipos activos para aplicar el cargo.");
        }

        const a = activos[0]; // Aplicar al primero por FIFO

        await tx.movimientos_anticipos.create({
          data: {
            anticipoId: a.anticipoId,
            fecha: fecha ? new Date(fecha) : new Date(),
            tipo_movimiento: "CARGO_ANTICIPO",
            monto: montoIngresado,
            interes: interes ? parseFloat(interes) : null,
            dias: dias ? parseInt(dias) : null,
            descripcion: observacion || "Cargo de anticipo",
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Movimiento registrado correctamente siguiendo FIFO.",
    });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al registrar movimiento." },
      { status: 500 }
    );
  }
}
