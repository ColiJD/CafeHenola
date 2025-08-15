import prisma from "@/lib/prisma";

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
      compraEn,
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
        comprarTotalSacos: comprarTotalSacos
          ? parseFloat(comprarTotalSacos)
          : 0,
        compraRetencio: parseFloat(compraRetencio),
        compraEn,
        compraDescripcion: compraDescripcion || "",
      },
    });
    // 2️⃣ Actualizar o crear inventario
    const productoID = Number(compraTipoCafe);
    const cantidadQQ = parseFloat(compraCatidadQQ);
    const cantidadSacos = parseFloat(comprarTotalSacos);

    // 2️⃣ Actualizar o crear inventario empresa
    await prisma.inventarioempresa.upsert({
      where: { productoID },
      update: { cantidadQQ: { increment: cantidadQQ }, cantidadSacos: { increment: cantidadSacos } },
      create: { productoID, cantidadQQ, cantidadSacos },
    });

    // 3️⃣ Registrar movimiento
    await prisma.movimientoinventario.create({
      data: {
        tipoInventario: "Empresa",
        inventarioID: productoID, // referencia al producto
        tipoMovimiento: "Entrada",
        referenciaTipo: `Compra directa #${nuevaCompra.compraId}`,
        referenciaID: nuevaCompra.compraId,
        cantidadQQ,
        cantidadSacos: comprarTotalSacos ? parseFloat(comprarTotalSacos) : 0,
        nota: "Entrada de café por compra directa",
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
