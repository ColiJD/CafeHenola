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

    // 🔹 Buscar el registro (puede ser compra o venta)
    const registro = await prisma.contrato.findUnique({
      where: { contratoID },
    });
    if (!registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
    }

    // 🔹 Ejecutar la lógica correspondiente en una transacción
    await prisma.$transaction([
      // 1️⃣ Anular contrato
      prisma.contrato.update({
        where: { contratoID },
        data: { estado: "Anulado", contratoMovimiento: "Anulado" },
      }),

      // 2️⃣ Anular detalles
      prisma.detallecontrato.updateMany({
        where: { contratoID },
        data: { tipoMovimiento: "Anulado" }, // o estado: "Anulado"
      }),
    ]);

    return new Response(
      JSON.stringify({
        message: "Contrato anulado correctamente",
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
