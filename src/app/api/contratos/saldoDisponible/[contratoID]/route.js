import prisma from "@/lib/prisma";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { contratoID } = params;

    if (!contratoID) {
      return new Response(
        JSON.stringify({ error: "Falta el ID del contrato" }),
        { status: 400 }
      );
    }

    const saldoData = await prisma.$queryRaw`
      SELECT *
      FROM vw_SaldoPorContrato
      WHERE contratoID = ${Number(contratoID)}
      LIMIT 1
    `;

    if (saldoData.length === 0) {
      return new Response(
        JSON.stringify({
          tipoCafeNombre: "",
          precioQQ: 0,
          saldoDisponibleQQ: 0,
          saldoDisponibleLps: 0,
        }),
        { status: 200 }
      );
    }

    const row = saldoData[0];

    return new Response(
      JSON.stringify({
        tipoCafeNombre: row.tipoCafeNombre || "",
        precioQQ: parseFloat(row.precioQQ) || 0,
        saldoDisponibleQQ: parseFloat(row.saldoDisponibleQQ) || 0,
        saldoDisponibleLps: parseFloat(row.saldoDisponibleLps) || 0,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener saldo del contrato:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener saldo del contrato" }),
      { status: 500 }
    );
  }
}
