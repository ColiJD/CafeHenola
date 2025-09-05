import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id } = params; // productoID dinámico

  try {
    // Obtenemos todos los movimientos del café (entradas y salidas)
    const movimientos = await prisma.$queryRaw`
      SELECT *
      FROM vw_movimientos_inventario
      WHERE productoID = ${id}
      ORDER BY fecha ASC
    `;

    const data = movimientos.map((item) => ({
      ...item,
      cantidadQQ: parseFloat(item.cantidadQQ),
      fecha: item.fecha instanceof Date ? item.fecha.toISOString() : item.fecha,
    }));

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
