import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Usamos query raw para traer todo de la vista
    const resumen = await prisma.$queryRawUnsafe(`
      SELECT * FROM vw_resumencondetalle
    `);

    return new Response(JSON.stringify(resumen), { status: 200 });
  } catch (error) {
    console.error("Error al obtener vista vw_resumencondetalle:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }
}
