import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { clienteID, tipo_movimiento, monto, fecha, observacion, interes, dias } = body;

    // Validación básica
    if (!clienteID || !tipo_movimiento || monto == null || isNaN(monto)) {
      return NextResponse.json(
        { error: "Datos incompletos o monto inválido." },
        { status: 400 }
      );
    }

    const montoIngresado = parseFloat(monto);

    await prisma.$transaction(async (tx) => {
      // 1️⃣ Obtener todos los anticipos del cliente
      const anticipos = await tx.anticipo.findMany({
        where: { clienteId: clienteID },
        include: { movimientos_anticipos: true },
        orderBy: { fecha: "asc" },
      });

      if (!anticipos.length) {
        throw new Error("No existen anticipos registrados para este cliente.");
      }

      // 2️⃣ Seleccionar el primer anticipo válido con deuda pendiente
      const anticipoAsignado = anticipos.find((anticipo) => {
        if (anticipo.estado === "ANULADO") return false;

        const totalCargos = anticipo.movimientos_anticipos
          .filter(m => m.tipo_movimiento === "CARGO_ANTICIPO")
          .reduce((sum, m) => sum + Number(m.monto || 0), 0);

        const totalPagos = anticipo.movimientos_anticipos
          .filter(m => ["ABONO_ANTICIPO", "INTERES_ANTICIPO"].includes(m.tipo_movimiento))
          .reduce((sum, m) => sum + Number(m.monto || 0), 0);

        return Number(anticipo.monto || 0) + totalCargos - totalPagos > 0;
      });

      if (!anticipoAsignado) {
        throw new Error("No se puede registrar el movimiento: todos los anticipos están anulados o sin deuda pendiente.");
      }

      // 3️⃣ Calcular deuda e intereses pendientes
      const cargosPendientes = anticipoAsignado.movimientos_anticipos
        .filter(m => m.tipo_movimiento === "CARGO_ANTICIPO")
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const pagosRealizados = anticipoAsignado.movimientos_anticipos
        .filter(m => ["ABONO_ANTICIPO", "INTERES_ANTICIPO"].includes(m.tipo_movimiento))
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const deudaPendiente = Number(anticipoAsignado.monto || 0) + cargosPendientes - pagosRealizados;

      const interesesPendientes = cargosPendientes - anticipoAsignado.movimientos_anticipos
        .filter(m => m.tipo_movimiento === "INTERES_ANTICIPO")
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      // 4️⃣ Validaciones según tipo de movimiento
      if (["ABONO_ANTICIPO", "INTERES_ANTICIPO"].includes(tipo_movimiento) && deudaPendiente <= 0) {
        throw new Error("No hay deuda pendiente en este anticipo.");
      }

      if (tipo_movimiento === "ABONO_ANTICIPO" && montoIngresado > deudaPendiente) {
        throw new Error(`El abono (L. ${montoIngresado.toFixed(2)}) excede la deuda pendiente (L. ${deudaPendiente.toFixed(2)}).`);
      }

      if (tipo_movimiento === "INTERES_ANTICIPO") {
        if (interesesPendientes <= 0) throw new Error("No existen intereses pendientes en este anticipo.");
        if (montoIngresado > interesesPendientes) {
          throw new Error(`El pago de intereses (L. ${montoIngresado.toFixed(2)}) excede los intereses pendientes (L. ${interesesPendientes.toFixed(2)}).`);
        }
      }

      // 5️⃣ Registrar movimiento
      await tx.movimientos_anticipos.create({
        data: {
          anticipoId: anticipoAsignado.anticipoId,
          fecha: fecha ? new Date(fecha) : new Date(),
          tipo_movimiento,
          monto: montoIngresado,
          interes: interes ? parseFloat(interes) : null,
          dias: dias ? parseInt(dias) : null,
          descripcion: observacion || tipo_movimiento,
        },
      });
    });

    return NextResponse.json({ ok: true, message: "Movimiento registrado correctamente." });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al registrar movimiento." },
      { status: 500 }
    );
  }
}
