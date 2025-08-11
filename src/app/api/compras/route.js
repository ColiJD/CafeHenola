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
      compraTipoDocumento,
      compraTipoCafe,
      compraPrecioQQ,
      compraCatidadQQ,
      compraTotal,
      comprarTotalSacos,
      compraRetencio,
      compraDescripcion,
      compraEn
    } = body;

    // Validaciones
    if (
      !clienteID ||
      !compraTipoCafe ||
      !compraPrecioQQ ||
      !compraCatidadQQ ||
      !compraTipoDocumento ||
      !compraEn
    ) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    const nuevaCompra = await prisma.compra.create({
      data: {
        clienteID: Number(clienteID),
        compraFecha: new Date(), // Fecha automática
        compraTipoDocumento,
        compraMovimiento: "Entrada",
        compraTipoCafe: Number(compraTipoCafe),
        compraPrecioQQ: parseFloat(compraPrecioQQ),
        compraCatidadQQ: parseFloat(compraCatidadQQ),
        compraTotal: parseFloat(compraTotal),
        comprarTotalSacos: comprarTotalSacos ? parseFloat(comprarTotalSacos) : 0,
        compraRetencio: parseFloat(compraRetencio),
        compraEn,
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
