import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

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

    // ✅ Transacción para anular todo
    await prisma.$transaction(async (tx) => {
      await tx.liqsalida.update({
        where: { liqSalidaID },
        data: { liqMovimiento: "Anulado" },
      });

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
