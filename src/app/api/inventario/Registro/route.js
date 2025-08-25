import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const inventario = await prisma.$queryRaw`
      SELECT * FROM vw_movimientos_inventario
    `;

    const data = inventario.map((item) => ({
      ...item,
      cantidadQQ: parseFloat(item.cantidadQQ),
      cantidadSacos: parseFloat(item.cantidadSacos),
      fecha: item.fecha instanceof Date ? item.fecha.toISOString() : item.fecha,
    }));

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
