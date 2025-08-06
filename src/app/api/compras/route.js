// app/api/compras/route.js
import prisma from "@/lib/prisma";

export async function GET() {
  const compras = await prisma.compra.findMany({
    include: {
      cliente: true,
      producto: true,
    },
  });

  return new Response(JSON.stringify(compras), { status: 200 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clienteID,
      compraFecha,
      compraTipoCafe,
      compraPrecioQQ,
      compraCatidadQQ,
      compraTotal,
      comprarTotalSacos,
      compraRetencio,
      compraDescripcion,
    } = body;

    // Validaciones básicas (opcional)
    if (
      !clienteID ||
      !compraFecha ||
      !compraTipoCafe ||
      !compraPrecioQQ ||
      !compraCatidadQQ
    ) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    const nuevaCompra = await prisma.compra.create({
      data: {
        clienteID: Number(clienteID),
        compraFecha: new Date(compraFecha),
        compraTipoDocumento: "Compra directa",
        compraMovimiento: "Entrada",
        compraTipoCafe: Number(compraTipoCafe),
        compraPrecioQQ: parseFloat(compraPrecioQQ),
        compraCatidadQQ: parseFloat(compraCatidadQQ),
        compraTotal: parseFloat(compraTotal),
        comprarTotalSacos: comprarTotalSacos ? parseFloat(comprarTotalSacos) : 0,
        compraRetencio: parseFloat(compraRetencio),
        compraEn: "Compra Directa",
        compraDescripcion: compraDescripcion || "",
      },
    });

    return new Response(JSON.stringify(nuevaCompra), { status: 201 });
  } catch (error) {
    console.error("Error al registrar compra:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar compra" }),
      { status: 500 }
    );
  }
}
