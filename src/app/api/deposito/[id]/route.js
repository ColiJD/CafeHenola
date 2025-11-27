import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function DELETE(req, { params }) {
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const depositoID = Number(params.id);
    if (!depositoID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // 🔹 Buscar el depósito
    const registro = await prisma.deposito.findUnique({
      where: { depositoID },
    });
    if (!registro) {
      return new Response(JSON.stringify({ error: "Depósito no encontrado" }), {
        status: 404,
      });
    }

    // 🔹 Buscar liquidaciones activas (para obtener IDs)
    // 🔹 Buscar liquidaciones activas del depósito
    const liquidacionesActivas = await prisma.detalleliqdeposito.findMany({
      where: {
        depositoID,
        movimiento: { not: "Anulado" }, // activas
      },
      select: {
        id: true, // id del detalle
        liqID: true, // id de la liquidación
      },
    });

    if (liquidacionesActivas.length > 0) {
      const listaLiquidaciones = liquidacionesActivas
        .map((l) => `#${l.liqID}`)
        .join(", ");

      return new Response(
        JSON.stringify({
          error: `No se puede eliminar el depósito porque está asociado a la liquidación ${listaLiquidaciones}.`,
          detalles: liquidacionesActivas,
        }),
        { status: 400 }
      );
    }

    // 🔹 Buscar el movimiento asociado
    const movimiento = await prisma.movimientoinventario.findFirst({
      where: {
        referenciaTipo: { contains: `Deposito #${depositoID}` },
        tipoMovimiento: "Entrada",
        NOT: { tipoMovimiento: "Anulado" },
      },
    });

    if (!movimiento) {
      return new Response(
        JSON.stringify({ error: "Movimiento de inventario no encontrado" }),
        { status: 404 }
      );
    }

    const esEntrada = movimiento.tipoMovimiento === "Entrada";

    // 🔹 Ejecutar la transacción
    await prisma.$transaction([
      prisma.movimientoinventario.update({
        where: { movimientoID: movimiento.movimientoID },
        data: {
          tipoMovimiento: "Anulado",
          nota: `Depósito anulado #${depositoID}`,
        },
      }),

      prisma.inventariocliente.update({
        where: { inventarioClienteID: movimiento.inventarioClienteID },
        data: esEntrada
          ? {
              cantidadQQ: { decrement: movimiento.cantidadQQ },
              cantidadSacos: { decrement: movimiento.cantidadSacos },
            }
          : {
              cantidadQQ: { increment: movimiento.cantidadQQ },
              cantidadSacos: { increment: movimiento.cantidadSacos },
            },
      }),

      prisma.deposito.update({
        where: { depositoID },
        data: { depositoMovimiento: "Anulado", estado: "Anulado" },
      }),
    ]);

    return new Response(
      JSON.stringify({
        message: `${esEntrada ? "Compra" : "Venta"} anulada correctamente`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular depósito:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el depósito" }),
      { status: 500 }
    );
  }
}
