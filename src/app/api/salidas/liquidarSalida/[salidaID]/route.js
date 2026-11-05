import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export async function DELETE(req, context) {
  // ✅ Verificar permisos
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    // ✅ Extraer params de forma asíncrona
    const { params } = await context;
    const liqSalidaID = Number(params.salidaID);

    if (!liqSalidaID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // ✅ Buscar el registro principal
    const registro = await prisma.liqsalida.findUnique({
      where: { liqSalidaID },
    });

    if (!registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
    }

    // Evita devolver el inventario dos veces (doble clic o reintento)
    if (registro.liqMovimiento === "Anulado") {
      return new Response(
        JSON.stringify({ error: "La liquidación ya está anulada" }),
        { status: 400 },
      );
    }

    // ✅ Transacción para anular todo y devolver inventario
    await prisma.$transaction(async (tx) => {
      // 1. Movimientos de la liquidación: la salida original, las salidas por
      //    aumento y las entradas por disminución (todas "…Liquidación Salida")
      const movimientos = await tx.movimientoinventario.findMany({
        where: {
          referenciaTipo: {
            in: ["Liquidación Salida", "Modificación Liquidación Salida"],
          },
          referenciaID: liqSalidaID,
        },
      });

      // 2. Devolver solo lo que realmente sigue fuera del inventario (neto)
      const netoPorInventario = new Map();
      for (const mov of movimientos) {
        const signo = mov.tipoMovimiento === "Salida" ? 1 : -1;
        netoPorInventario.set(
          mov.inventarioClienteID,
          (netoPorInventario.get(mov.inventarioClienteID) ?? 0) +
            signo * Number(mov.cantidadQQ),
        );
      }

      for (const [inventarioClienteID, neto] of netoPorInventario) {
        const devolver = Math.round((neto + Number.EPSILON) * 100) / 100;
        if (devolver <= 0) continue;

        await tx.inventariocliente.update({
          where: { inventarioClienteID },
          data: { cantidadQQ: { increment: devolver } },
        });

        await tx.movimientoinventario.create({
          data: {
            inventarioClienteID,
            tipoMovimiento: "Entrada",
            referenciaTipo: "Anulación Liquidación Salida",
            referenciaID: liqSalidaID,
            cantidadQQ: devolver,
            nota: `Devolución por anulación de liquidación #${liqSalidaID}`,
          },
        });
      }

      // 3. Anular la liquidación
      await tx.liqsalida.update({
        where: { liqSalidaID },
        data: { liqMovimiento: "Anulado" },
      });

      // 4. Anular los detalles
      await tx.detalleliqsalida.updateMany({
        where: { liqSalidaID },
        data: { movimiento: "Anulado" },
      });
    });

    return new Response(
      JSON.stringify({
        message:
          "Registro de liquidación de salida y detalles anulados correctamente",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular registro de liqSalida:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el registro" }),
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  // ✅ Verificar permisos
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    // ✅ Extraer params y body
    const { params } = await context;
    const liqSalidaID = Number(params.salidaID);
    const body = await req.json();
    const { cantidadLiquidar, descripcion } = body;

    if (!liqSalidaID || !cantidadLiquidar) {
      return new Response(
        JSON.stringify({ error: "Datos inválidos o incompletos" }),
        { status: 400 }
      );
    }

    const nuevaCantidad = Number(cantidadLiquidar);

    // ✅ Buscar el registro actual
    const registroActual = await prisma.liqsalida.findUnique({
      where: { liqSalidaID },
    });

    if (!registroActual) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
    }

    if (registroActual.liqMovimiento === "Anulado") {
      return new Response(
        JSON.stringify({
          error: "No se puede modificar una liquidación anulada",
        }),
        { status: 400 }
      );
    }

    const cantidadActual = Number(registroActual.liqCantidadQQ);
    const diferencia = nuevaCantidad - cantidadActual;

    // ✅ Transacción para actualizar
    await prisma.$transaction(async (tx) => {
      // 1. Si aumenta la cantidad, verificar inventario disponible
      if (diferencia > 0) {
        const totalInventario = await tx.inventariocliente.aggregate({
          where: { productoID: Number(registroActual.productoID) },
          _sum: { cantidadQQ: true },
        });

        const inventarioDisponible = Number(
          totalInventario._sum?.cantidadQQ ?? 0
        );

        if (inventarioDisponible < diferencia) {
          throw new Error(
            `Inventario insuficiente para el aumento. Disponible: ${inventarioDisponible.toFixed(
              2
            )} QQ, Necesario: ${diferencia.toFixed(2)} QQ`
          );
        }

        const inventario = await tx.inventariocliente.findUnique({
          where: { productoID: Number(registroActual.productoID) },
        });
        if (!inventario) {
          throw new Error(
            "No se encontró inventario para el producto de la liquidación."
          );
        }

        // Asignar el aumento (FIFO) a las salidas pendientes del comprador,
        // para que los detalles sigan sumando lo mismo que la liquidación.
        const salidas = await tx.salida.findMany({
          where: {
            compradorID: registroActual.compradorID,
            productoID: Number(registroActual.productoID),
            salidaMovimiento: { notIn: ["ANULADO", "Anulado", "anulado"] },
          },
          orderBy: { salidaFecha: "asc" },
          include: {
            detalleliqsalida: { select: { cantidadQQ: true, movimiento: true } },
          },
        });

        let porAsignar = roundToTwo(diferencia);
        for (const s of salidas) {
          if (porAsignar <= 0) break;
          const liquidado = s.detalleliqsalida
            .filter(
              (d) =>
                d.movimiento === null ||
                !["ANULADO", "Anulado", "anulado"].includes(d.movimiento),
            )
            .reduce((acc, d) => acc + Number(d.cantidadQQ || 0), 0);
          const pendiente = roundToTwo(Number(s.salidaCantidadQQ) - liquidado);
          if (pendiente <= 0) continue;

          const asignar = roundToTwo(Math.min(pendiente, porAsignar));
          await tx.detalleliqsalida.create({
            data: {
              liqSalidaID,
              salidaID: s.salidaID,
              cantidadQQ: asignar,
              movimiento: "Salida",
            },
          });
          porAsignar = roundToTwo(porAsignar - asignar);
        }

        if (porAsignar > 0) {
          throw new Error(
            `CANTIDAD_EXCEDE: el aumento supera lo pendiente por liquidar en ${porAsignar.toFixed(2)} QQ`,
          );
        }

        await tx.inventariocliente.update({
          where: { productoID: Number(registroActual.productoID) },
          data: { cantidadQQ: { decrement: diferencia } },
        });

        await tx.movimientoinventario.create({
          data: {
            inventarioClienteID: inventario.inventarioClienteID,
            tipoMovimiento: "Salida",
            referenciaTipo: "Modificación Liquidación Salida",
            referenciaID: liqSalidaID,
            cantidadQQ: diferencia,
            nota: `Ajuste por modificación de liquidación #${liqSalidaID} (+${diferencia.toFixed(
              2
            )} QQ)`,
          },
        });
      } else if (diferencia < 0) {
        // 2. Si disminuye la cantidad, devolver inventario
        const cantidadDevolver = roundToTwo(Math.abs(diferencia));

        // Reducir los detalles vigentes (los últimos primero) para que sigan
        // sumando lo mismo que la liquidación.
        const detalles = await tx.detalleliqsalida.findMany({
          where: {
            liqSalidaID,
            OR: [
              { movimiento: null },
              { movimiento: { notIn: ["ANULADO", "Anulado", "anulado"] } },
            ],
          },
          orderBy: { id: "desc" },
        });

        let porQuitar = cantidadDevolver;
        for (const d of detalles) {
          if (porQuitar <= 0) break;
          const quitar = roundToTwo(Math.min(porQuitar, Number(d.cantidadQQ)));
          await tx.detalleliqsalida.update({
            where: { id: d.id },
            data: { cantidadQQ: roundToTwo(Number(d.cantidadQQ) - quitar) },
          });
          porQuitar = roundToTwo(porQuitar - quitar);
        }

        const inventario = await tx.inventariocliente.findUnique({
          where: { productoID: Number(registroActual.productoID) },
        });
        if (!inventario) {
          throw new Error(
            "No se encontró inventario para el producto de la liquidación.",
          );
        }

        await tx.inventariocliente.update({
          where: { productoID: Number(registroActual.productoID) },
          data: { cantidadQQ: { increment: cantidadDevolver } },
        });

        await tx.movimientoinventario.create({
          data: {
            inventarioClienteID: inventario.inventarioClienteID,
            tipoMovimiento: "Entrada",
            referenciaTipo: "Modificación Liquidación Salida",
            referenciaID: liqSalidaID,
            cantidadQQ: cantidadDevolver,
            nota: `Ajuste por modificación de liquidación #${liqSalidaID} (${diferencia.toFixed(
              2,
            )} QQ)`,
          },
        });
      }

      // 3. Actualizar el registro de liquidación
      await tx.liqsalida.update({
        where: { liqSalidaID },
        data: {
          liqCantidadQQ: nuevaCantidad,
          liqDescripcion: descripcion || registroActual.liqDescripcion,
        },
      });
    });

    return new Response(
      JSON.stringify({
        message: "Liquidación actualizada correctamente",
        diferencia,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al actualizar liquidación:", error);

    // Manejar error de inventario insuficiente o aumento mayor al pendiente
    if (
      error.message &&
      (error.message.includes("Inventario insuficiente") ||
        error.message.startsWith("CANTIDAD_EXCEDE"))
    ) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({ error: "Error interno al actualizar el registro" }),
      { status: 500 }
    );
  }
}
