import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 🔹 Obtenemos el inventario actual desde la vista vw_inventario_actual
    const inventario = await prisma.$queryRaw`
      SELECT productoID, tipoCafe, totalEntradasQQ, totalSalidasQQ, saldoQQ
      FROM vw_inventario_actual
      ORDER BY tipoCafe
    `;

    // 🔹 Convertimos valores numéricos y fechas (si hubiera)
    const data = inventario.map((item) => ({
      ...item,
      totalEntradasQQ: parseFloat(item.totalEntradasQQ),
      totalSalidasQQ: parseFloat(item.totalSalidasQQ),
      saldoQQ: parseFloat(item.saldoQQ),
    }));

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
