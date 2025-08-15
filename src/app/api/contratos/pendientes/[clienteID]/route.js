import prisma from "@/lib/prisma";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { clienteID } = params;

    if (!clienteID) {
      return new Response(
        JSON.stringify({ error: "Falta el ID del cliente" }),
        { status: 400 }
      );
    }

    const contratos = await prisma.$queryRaw`
      SELECT *
      FROM vw_ContratosPendientesPorCliente
      WHERE clienteID = ${Number(clienteID)}
    `;

    return new Response(JSON.stringify(contratos), { status: 200 });
  } catch (error) {
    console.error("Error al obtener contratos pendientes:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener contratos pendientes" }),
      { status: 500 }
    );
  }
}
