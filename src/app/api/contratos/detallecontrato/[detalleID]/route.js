import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function DELETE(req, { params }) {
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const detalleID = Number(params.detalleID);
    if (!detalleID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // 🔹 Buscar el registro (puede ser compra o venta)
    const registro = await prisma.detallecontrato.findUnique({
      where: { detalleID },
    });
    if (!registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
    }

    // 🔹 Buscar el movimiento asociado
    const movimiento = await prisma.movimientoinventario.findFirst({
      where: {
        referenciaTipo: { contains: `EntregaContrato #${detalleID}` },
        NOT: { tipoMovimiento: "Anulado" },
      },
    });

    if (!movimiento) {
      return new Response(
        JSON.stringify({ error: "Movimiento de inventario no encontrado" }),
        { status: 404 }
      );
    }

    // 🔹 Determinar tipo de movimiento (Entrada o Salida)
    const esEntrada = movimiento.tipoMovimiento === "Entrada";
    const esSalida = movimiento.tipoMovimiento === "Salida";

    if (!esEntrada && !esSalida) {
      return new Response(
        JSON.stringify({
          error: "El movimiento ya fue anulado)",
        }),
        { status: 400 }
      );
    }

    // 🔹 Ejecutar la lógica correspondiente en una transacción
    await prisma.$transaction([
      // 1️⃣ Actualizar movimiento
      prisma.movimientoinventario.update({
        where: { movimientoID: movimiento.movimientoID },
        data: {
          tipoMovimiento: "Anulado",
          nota: `${
            esEntrada ? "EntregaContrato" : "Contrato"
          } anulada #${detalleID}`,
        },
      }),

      // 2️⃣ Ajustar inventario (según tipo)
      prisma.inventariocliente.update({
        where: { inventarioClienteID: movimiento.inventarioClienteID },
        data: esEntrada
          ? {
              // Si era Entrada, ahora restamos
              cantidadQQ: { decrement: movimiento.cantidadQQ },
              cantidadSacos: { decrement: movimiento.cantidadSacos },
            }
          : {
              // Si era Salida, ahora sumamos
              cantidadQQ: { increment: movimiento.cantidadQQ },
              cantidadSacos: { increment: movimiento.cantidadSacos },
            },
      }),

      // 3️⃣ Actualizar estado del registro (compra/venta)
      prisma.detallecontrato.update({
        where: { detalleID },
        data: { tipoMovimiento: "Anulado" },
      }),
    ]);

    return new Response(
      JSON.stringify({
        message: `${esEntrada ? "Entrega" : "Contrato"} anulada correctamente`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular registro:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el registro" }),
      { status: 500 }
    );
  }
}
