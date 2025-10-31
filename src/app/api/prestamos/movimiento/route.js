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
        { error: "Datos incompletos o monto inválido" },
        { status: 400 }
      );
    }

    const montoIngresado = parseFloat(monto);

    await prisma.$transaction(async (tx) => {
      const prestamos = await tx.prestamos.findMany({
        where: { clienteId: clienteID, estado: { not: "ANULADO" } },
        include: { movimientos_prestamo: true },
        orderBy: { fecha: "asc" },
      });

      if (prestamos.length === 0) {
        throw new Error("No existen préstamos registrados para este cliente.");
      }

      // === 🔹 ABONO AL CAPITAL ===
      if (tipo_movimiento === "ABONO") {
        let deudaTotalCapital = 0;

        // Filtrar préstamos con capital pendiente
        const prestamosPendientes = prestamos
          .map((p) => {
            const capitalPagado = p.movimientos_prestamo
              .filter((m) => ["ABONO"].includes(m.tipo_movimiento))
              .reduce((sum, m) => sum + Number(m.monto), 0);
            const deudaCapital = Number(p.monto) - capitalPagado;
            deudaTotalCapital += deudaCapital;
            return { prestamo: p, deudaCapital };
          })
          .filter((p) => p.deudaCapital > 0);

        if (prestamosPendientes.length === 0) {
          throw new Error("No hay capital pendiente para este cliente.");
        }

        if (montoIngresado > deudaTotalCapital) {
          throw new Error(
            `El abono (L. ${montoIngresado.toFixed(
              2
            )}) excede el capital pendiente (L. ${deudaTotalCapital.toFixed(
              2
            )}).`
          );
        }

        // Aplicar ABONO FIFO
        let montoRestante = montoIngresado;
        for (const p of prestamosPendientes) {
          if (montoRestante <= 0) break;

          const montoAplicar = Math.min(montoRestante, p.deudaCapital);

          await tx.movimientos_prestamo.create({
            data: {
              prestamo_id: p.prestamo.prestamoId,
              fecha: fecha ? new Date(fecha) : new Date(),
              tipo_movimiento,
              monto: montoAplicar,
              interes: null,
              dias: dias ? parseInt(dias) : null,
              descripcion: observacion || tipo_movimiento,
            },
          });

          montoRestante -= montoAplicar;
        }
      }

      // === 🔹 PAGO DE INTERESES ===
      if (tipo_movimiento === "PAGO_INTERES") {
        let interesesTotales = 0;

        // Filtrar préstamos con intereses pendientes
        const prestamosConIntereses = prestamos
          .map((p) => {
            const cargos = p.movimientos_prestamo
              .filter((m) => m.tipo_movimiento === "Int-Cargo")
              .reduce((sum, m) => sum + Number(m.monto), 0);
            const pagosInteres = p.movimientos_prestamo
              .filter((m) => m.tipo_movimiento === "PAGO_INTERES")
              .reduce((sum, m) => sum + Number(m.monto), 0);
            const interesPendiente = cargos - pagosInteres;
            interesesTotales += interesPendiente;
            return { prestamo: p, interesPendiente };
          })
          .filter((p) => p.interesPendiente > 0);

        if (prestamosConIntereses.length === 0) {
          throw new Error("No hay intereses pendientes para este cliente.");
        }

        if (montoIngresado > interesesTotales) {
          throw new Error(
            `El pago de intereses (L. ${montoIngresado.toFixed(
              2
            )}) excede los intereses pendientes (L. ${interesesTotales.toFixed(
              2
            )}).`
          );
        }

        // Aplicar PAGO_INTERES FIFO
        let montoRestante = montoIngresado;
        for (const p of prestamosConIntereses) {
          if (montoRestante <= 0) break;

          const montoAplicar = Math.min(montoRestante, p.interesPendiente);

          await tx.movimientos_prestamo.create({
            data: {
              prestamo_id: p.prestamo.prestamoId,
              fecha: fecha ? new Date(fecha) : new Date(),
              tipo_movimiento,
              monto: montoAplicar,
              interes: null,
              dias: dias ? parseInt(dias) : null,
              descripcion: observacion || tipo_movimiento,
            },
          });

          montoRestante -= montoAplicar;
        }
      }

      // === 🔹 INT-CARGO ===
      if (tipo_movimiento === "Int-Cargo") {
        const prestamosActivos = prestamos
          .filter((p) => !["ANULADO"].includes(p.estado))
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        if (prestamosActivos.length === 0) {
          throw new Error(
            "No hay préstamos activos para aplicar el interés cargado."
          );
        }

        // Aplica todo el Int-Cargo al primer préstamo activo
        const p = prestamosActivos[0];

        await tx.movimientos_prestamo.create({
          data: {
            prestamo_id: p.prestamoId,
            fecha: fecha ? new Date(fecha) : new Date(),
            tipo_movimiento: "Int-Cargo",
            monto: montoIngresado,
            interes: interes ? parseFloat(interes) : null,
            dias: dias ? parseInt(dias) : null,
            descripcion: observacion || "Interés cargado",
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
