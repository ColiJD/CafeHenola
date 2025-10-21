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

    // 2️⃣ Buscar el préstamo activo más antiguo
    let prestamoActivo = await prisma.prestamos.findFirst({
      where: { clienteId: clienteID, estado: "ACTIVO" },
      include: { movimientos_prestamo: true },
      orderBy: { fecha: "asc" },
    });

    // 3️⃣ Si no hay préstamos activos, crear temporal
    let prestamoId;
    if (!prestamoActivo) {
      prestamoActivo = await prisma.prestamos.findFirst({
        where: { clienteId: clienteID, estado: "INICIAL" },
      });

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

      prestamoId = prestamoActivo.prestamoId;

      // Registrar movimiento en el temporal
      await prisma.movimientos_prestamo.create({
        data: {
          prestamo_id: prestamoId,
          fecha: fecha ? new Date(fecha) : new Date(),
          tipo_movimiento,
          monto: parseFloat(monto),
          interes: parseFloat(interes),
          dias: parseInt(dias),
          descripcion: observacion || tipo_movimiento,
        },
      });

      // No hay préstamos reales, no hacer FIFO
      return NextResponse.json({
        ok: true,
        message: "Movimiento registrado en préstamo temporal",
      });
    }

    prestamoId = prestamoActivo.prestamoId;

    // 4️⃣ Registrar el movimiento en el préstamo activo
    await prisma.movimientos_prestamo.create({
      data: {
        prestamo_id: prestamoId,
        fecha: fecha ? new Date(fecha) : new Date(),
        tipo_movimiento,
        monto: parseFloat(monto),
        interes: parseFloat(interes),
          dias: parseInt(dias),
        descripcion: observacion || tipo_movimiento,
      },
    });

    // 5️⃣ Distribuir abono entre todos los préstamos activos (FIFO)
    const prestamosActivos = await prisma.prestamos.findMany({
      where: { clienteId: clienteID, estado: "ACTIVO" },
      include: { movimientos_prestamo: true },
      orderBy: { fecha: "asc" },
    });

    let totalAbono = parseFloat(monto);

    for (const prestamo of prestamosActivos) {
      const totalCapital = Number(prestamo.monto || 0);
      const totalIntereses = prestamo.movimientos_prestamo
        .filter((m) => m.tipo_movimiento === "CARGO_INTERES")
        .reduce((acc, m) => acc + Number(m.monto), 0);

      const totalDeuda = totalCapital + totalIntereses;

      // Total abonado previo
      const abonadoPrevio = prestamo.movimientos_prestamo
        .filter((m) =>
          ["ABONO", "ABONO_INTERES", "PAGO_INTERES", "ANTICIPO"].includes(
            m.tipo_movimiento
          )
        )
        .reduce((acc, m) => acc + Number(m.monto), 0);

      const deudaPendiente = totalDeuda - abonadoPrevio;

      if (totalAbono >= deudaPendiente) {
        // Marcar como completado
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return NextResponse.json(
      { error: "Error al registrar movimiento" },
      { status: 500 }
    );
  }
}
