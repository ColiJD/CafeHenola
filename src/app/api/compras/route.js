import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clienteID,
      compraTipoDocumento,
      compraTipoCafe,
      compraPrecioQQ,
      compraCantidadQQ,
      compraTotal,
      compraTotalSacos,
      compraRetencio,
      compraDescripcion,
      compraEn,
    } = body;

    // ✅ Validaciones
    if (
      !clienteID ||
      !compraTipoCafe ||
      !compraPrecioQQ ||
      !compraCantidadQQ ||
      !compraTipoDocumento ||
      !compraEn
    ) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    // ✅ Crear la compra
    const nuevaCompra = await prisma.compra.create({
      data: {
        clienteID: Number(clienteID),
        compraFecha: new Date(), // Fecha automática
        compraTipoDocumento,
        compraMovimiento: "Entrada",
        compraTipoCafe: Number(compraTipoCafe),
        compraPrecioQQ: parseFloat(compraPrecioQQ),
        compraCantidadQQ: parseFloat(compraCantidadQQ),
        compraTotal: parseFloat(compraTotal),
        compraTotalSacos: compraTotalSacos
          ? parseFloat(compraTotalSacos)
          : 0,
        compraRetencio: compraRetencio ? parseFloat(compraRetencio) : 0,
        compraEn,
        compraDescripcion: compraDescripcion || "",
      },
    });

    // ✅ 2️⃣ Actualizar o crear inventario del cliente
    const productoID = Number(compraTipoCafe);
    const cantidadQQ = parseFloat(compraCantidadQQ);
    const cantidadSacos = compraTotalSacos
      ? parseFloat(compraTotalSacos)
      : 0;
    const clienteIDNum = Number(clienteID);

    await prisma.inventariocliente.upsert({
      where: {
        clienteID_productoID: {
          clienteID: clienteIDNum,
          productoID,
        },
      },
      update: {
        cantidadQQ: { increment: cantidadQQ },
        cantidadSacos: { increment: cantidadSacos },
      },
      create: {
        clienteID: clienteIDNum,
        productoID,
        cantidadQQ,
        cantidadSacos,
      },
    });

    // ✅ 3️⃣ Registrar movimiento
    await prisma.movimientoinventario.create({
      data: {
        tipoInventario: "Cliente",
        inventarioID: productoID, // referencia al producto
        tipoMovimiento: "Entrada",
        referenciaTipo: `Compra directa #${nuevaCompra.compraId}`,
        referenciaID: nuevaCompra.compraId,
        cantidadQQ,
        cantidadSacos,
        nota: "Entrada de café por compra directa",
      },
    });

    return new Response(JSON.stringify(nuevaCompra), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Error al registrar compra" }), {
      status: 500,
    });
  }
}
