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

    // 1️⃣ Validaciones básicas
    if (!clienteID || !tipo_movimiento || monto == null || isNaN(monto)) {
      return NextResponse.json(
        { error: "Datos incompletos o monto inválido" },
        { status: 400 }
      );
    }

    const montoIngresado = parseFloat(monto);

    // 2️⃣ Buscar préstamos activos del cliente
    const prestamosActivos = await prisma.prestamos.findMany({
      where: { clienteId: clienteID, estado: { in: ["ACTIVO", "INICIAL"] } },
      include: { movimientos_prestamo: true },
      orderBy: { fecha: "asc" },
    });

    // Si no hay préstamo activo, crear temporal
    let prestamoActivo =
      prestamosActivos.find((p) => p.estado === "ACTIVO") ||
      prestamosActivos.find((p) => p.estado === "INICIAL");

    if (!prestamoActivo) {
      prestamoActivo = await prisma.prestamos.create({
        data: {
          clienteId: clienteID,
          monto: 0,
          estado: "INICIAL",
          fecha: new Date(),
          observacion: "Préstamo temporal para movimientos sueltos",
        },
      });
    }

    const prestamoId = prestamoActivo.prestamoId;

    // 3️⃣ Calcular deuda total e intereses pendientes
    const deudaTotal = prestamosActivos.reduce((acc, p) => {
      const cargos = p.movimientos_prestamo
        .filter((m) => m.tipo_movimiento === "Int-Cargo")
        .reduce((a, m) => a + Number(m.monto), 0);

      const pagos = p.movimientos_prestamo
        .filter((m) =>
          ["ABONO", "ANTICIPO", "PAGO_INTERES"].includes(m.tipo_movimiento)
        )
        .reduce((a, m) => a + Number(m.monto), 0);

      return acc + (Number(p.monto) + cargos - pagos);
    }, 0);

    const interesesPendientes = prestamosActivos.reduce((acc, p) => {
      const cargos = p.movimientos_prestamo
        .filter((m) => m.tipo_movimiento === "Int-Cargo")
        .reduce((a, m) => a + Number(m.monto), 0);

      const pagos = p.movimientos_prestamo
        .filter((m) => m.tipo_movimiento === "PAGO_INTERES")
        .reduce((a, m) => a + Number(m.monto), 0);

      return acc + (cargos - pagos);
    }, 0);

    // 4️⃣ Validaciones según tipo de movimiento
    if (tipo_movimiento === "ABONO") {
      if (montoIngresado > deudaTotal) {
        return NextResponse.json(
          {
            error: `El abono (L. ${montoIngresado.toFixed(
              2
            )}) excede la deuda pendiente (L. ${deudaTotal.toFixed(2)}).`,
          },
          { status: 400 }
        );
      }
    }

    if (tipo_movimiento === "ANTICIPO") {
      // ✅ Permitido aunque deje saldo negativo
    }

    if (tipo_movimiento === "PAGO_INTERES") {
      if (interesesPendientes <= 0) {
        return NextResponse.json(
          { error: "No existen intereses pendientes para este cliente." },
          { status: 400 }
        );
      }
      if (montoIngresado > interesesPendientes) {
        return NextResponse.json(
          {
            error: `El pago de intereses (L. ${montoIngresado.toFixed(
              2
            )}) excede los intereses pendientes (L. ${interesesPendientes.toFixed(
              2
            )}).`,
          },
          { status: 400 }
        );
      }
    }

    // 🔸 Int-Cargo siempre permitido

    // 5️⃣ Registrar movimiento
    await prisma.movimientos_prestamo.create({
      data: {
        prestamo_id: prestamoId,
        fecha: fecha ? new Date(fecha) : new Date(),
        tipo_movimiento,
        monto: montoIngresado,
        interes: interes ? parseFloat(interes) : null,
        dias: dias ? parseInt(dias) : null,
        descripcion: observacion || tipo_movimiento,
      },
    });

    // 6️⃣ Si es un ABONO, distribuir FIFO y marcar préstamos completados
    if (tipo_movimiento === "ABONO") {
      let totalAbono = montoIngresado;

      for (const prestamo of prestamosActivos) {
        const totalCapital = Number(prestamo.monto || 0);
        const totalIntereses = prestamo.movimientos_prestamo
          .filter((m) => m.tipo_movimiento === "Int-Cargo")
          .reduce((acc, m) => acc + Number(m.monto), 0);

        const totalPagos = prestamo.movimientos_prestamo
          .filter((m) =>
            ["ABONO", "ANTICIPO", "PAGO_INTERES"].includes(m.tipo_movimiento)
          )
          .reduce((acc, m) => acc + Number(m.monto), 0);

        const deudaPendiente = totalCapital + totalIntereses - totalPagos;

        if (deudaPendiente <= 0) continue;

        if (totalAbono >= deudaPendiente) {
          await prisma.prestamos.update({
            where: { prestamoId: prestamo.prestamoId },
            data: { estado: "COMPLETADO" },
          });
          totalAbono -= deudaPendiente;
        } else {
          totalAbono = 0;
          break;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Movimiento registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return NextResponse.json(
      { error: "Error interno al registrar movimiento." },
      { status: 500 }
    );
  }
}
