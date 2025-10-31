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
      // 1️⃣ Buscar todos los préstamos del cliente
      const prestamos = await tx.prestamos.findMany({
        where: { clienteId: clienteID },
        include: { movimientos_prestamo: true },
        orderBy: { fecha: "asc" },
      });

      if (prestamos.length === 0) {
        throw new Error("No existen préstamos registrados para este cliente.");
      }

      // 2️⃣ Asignar movimiento al primer préstamo válido
      const prestamoAsignado = prestamos.find((prestamo) => {
        if (prestamo.estado === "ANULADO") return false; // No usar préstamos anulados

        const totalCargos = prestamo.movimientos_prestamo
          .filter((m) => ["Int-Cargo"].includes(m.tipo_movimiento))
          .reduce((sum, m) => sum + Number(m.monto), 0);

        const totalPagos = prestamo.movimientos_prestamo
          .filter((m) => ["ABONO", "PAGO_INTERES"].includes(m.tipo_movimiento))
          .reduce((sum, m) => sum + Number(m.monto), 0);

        return Number(prestamo.monto) + totalCargos - totalPagos > 0;
      });

      if (!prestamoAsignado) {
        throw new Error(
          "No se puede registrar el movimiento: todos los préstamos están anulados o no tienen deuda pendiente."
        );
      }

      // 3️⃣ Calcular deuda pendiente específica del préstamo
      const cargosPendientes = prestamoAsignado.movimientos_prestamo
        .filter((m) => ["Int-Cargo"].includes(m.tipo_movimiento))
        .reduce((sum, m) => sum + Number(m.monto), 0);

      const pagosRealizados = prestamoAsignado.movimientos_prestamo
        .filter((m) => ["ABONO", "PAGO_INTERES"].includes(m.tipo_movimiento))
        .reduce((sum, m) => sum + Number(m.monto), 0);

      const deudaPendiente =
        Number(prestamoAsignado.monto) + cargosPendientes - pagosRealizados;

      const interesesPendientes =
        cargosPendientes -
        prestamoAsignado.movimientos_prestamo
          .filter((m) => m.tipo_movimiento === "PAGO_INTERES")
          .reduce((sum, m) => sum + Number(m.monto), 0);

      // 4️⃣ Validaciones según tipo de movimiento
      if (
        ["ABONO", "PAGO_INTERES"].includes(tipo_movimiento) &&
        deudaPendiente <= 0
      ) {
        throw new Error("No hay deuda pendiente en este préstamo.");
      }

      if (tipo_movimiento === "ABONO" && montoIngresado > deudaPendiente) {
        throw new Error(
          `El abono (L. ${montoIngresado.toFixed(
            2
          )}) excede la deuda pendiente del préstamo (L. ${deudaPendiente.toFixed(
            2
          )}).`
        );
      }

      if (tipo_movimiento === "PAGO_INTERES") {
        if (interesesPendientes <= 0) {
          throw new Error("No existen intereses pendientes en este préstamo.");
        }
        if (montoIngresado > interesesPendientes) {
          throw new Error(
            `El pago de intereses (L. ${montoIngresado.toFixed(
              2
            )}) excede los intereses pendientes (L. ${interesesPendientes.toFixed(
              2
            )}).`
          );
        }
      }

      // 5️⃣ Registrar movimiento
      await tx.movimientos_prestamo.create({
        data: {
          prestamo_id: prestamoAsignado.prestamoId,
          fecha: fecha ? new Date(fecha) : new Date(),
          tipo_movimiento,
          monto: montoIngresado,
          interes: interes ? parseFloat(interes) : null,
          dias: dias ? parseInt(dias) : null,
          descripcion: observacion || tipo_movimiento,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Movimiento registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al registrar movimiento." },
      { status: 500 }
    );
  }
}
