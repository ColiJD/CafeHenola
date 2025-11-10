import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function DELETE(req, { params }) {
  // Verificar permisos
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const salidaID = Number(params.salidaID);
    if (!salidaID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // Buscar el registro en la tabla salida
    const registro = await prisma.salida.findUnique({
      where: { salidaID },
    });

    if (!registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
    }

    // Actualizar el registro como "Anulado"
    await prisma.salida.update({
      where: { salidaID },
      data: {
        salidaMovimiento: "Anulado",
        // si quieres agregar un campo estado, podrías hacerlo aquí
        // estado: "Anulado"
      },
    });

    return new Response(
      JSON.stringify({ message: "Registro de salida anulado correctamente" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular registro de salida:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el registro" }),
      { status: 500 }
    );
  }
}
