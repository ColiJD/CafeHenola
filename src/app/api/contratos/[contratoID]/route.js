import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function DELETE(req, { params }) {
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const contratoID = Number(params.contratoID);
    if (!contratoID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // 🔹 Buscar el contrato
    const contrato = await prisma.contrato.findUnique({
      where: { contratoID },
    });
    if (!contrato) {
      return new Response(JSON.stringify({ error: "Contrato no encontrado" }), {
        status: 404,
      });
    }

    // 🔹 Buscar detalles activos (NO anulados)
    const detallesActivos = await prisma.detallecontrato.findMany({
      where: {
        contratoID,
        tipoMovimiento: { not: "Anulado" }, // ← ignorar anulados
      },
      select: {
        detalleID: true,
      },
    });

    if (detallesActivos.length > 0) {
      const lista = detallesActivos.map((d) => `#${d.detalleID}`).join(", ");

      return new Response(
        JSON.stringify({
          error: `No se puede eliminar el contrato porque tiene entregas activas: ${lista}.`,
          detalles: detallesActivos,
        }),
        { status: 400 }
      );
    }
    // 🔹 Anular el contrato si no hay detalles tipo Entrada activos
    await prisma.contrato.update({
      where: { contratoID },
      data: { estado: "Anulado", contratoMovimiento: "Anulado" },
    });

    return new Response(
      JSON.stringify({
        message: "Contrato anulado correctamente",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular contrato:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el contrato" }),
      { status: 500 }
    );
  }
}
