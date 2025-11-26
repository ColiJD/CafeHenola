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

    // 🔹 Buscar el registro (puede ser compra o venta)
    const registro = await prisma.deposito.findUnique({
      where: { depositoID },
    });
    if (!registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
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

    // 🔹 Determinar tipo de movimiento (Entrada o Salida)
    const esEntrada = movimiento.tipoMovimiento === "Entrada";
    const esSalida = movimiento.tipoMovimiento === "Salida";

    if (!esEntrada && !esSalida) {
      return new Response(
        JSON.stringify({
          error:
            "El movimiento no es ni Entrada ni Salida (posiblemente ya fue anulado)",
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
            esEntrada ? "Desposito" : "desposito"
          } anulada #${depositoID}`,
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

      // 3️⃣ Anular detalles de liquidación vinculados (si no hay, no pasa nada)
      prisma.detalleliqdeposito.updateMany({
        where: { depositoID },
        data: { movimiento: "Anulado" },
      }),

      // 4️⃣ Anular depósito
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
    console.error("❌ Error al anular registro:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el registro" }),
      { status: 500 }
    );
  }
}
