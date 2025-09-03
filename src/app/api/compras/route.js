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
      !compraTotalSacos
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
        compraTotalSacos: compraTotalSacos ? parseFloat(compraTotalSacos) : 0,
        compraRetencio: compraRetencio ? parseFloat(compraRetencio) : 0,
        compraEn,
        compraDescripcion: compraDescripcion || "",
      },
    });

    // ✅ 2️⃣ Actualizar o crear inventario del cliente
    const productoID = Number(compraTipoCafe);
    const cantidadQQ = parseFloat(compraCantidadQQ);
    const cantidadSacos = compraTotalSacos ? parseFloat(compraTotalSacos) : 0;
    const clienteIDNum = Number(clienteID);

    const inventarioCliente = await prisma.inventariocliente.upsert({
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

    // ✅ Registrar movimiento usando inventarioClienteID
    await prisma.movimientoinventario.create({
      data: {
        inventarioClienteID: inventarioCliente.inventarioClienteID,
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
    return new Response(
      JSON.stringify({ error: "Error al registrar compra" }),
      {
        status: 500,
      }
    );
  }
}

/**
 * Handles GET requests to fetch all compras from the database
 * @returns {Response} - A Response object containing either the list of compras or an error message
 */
export async function GET() {
  try {
    // Usamos query raw para traer todo de la vista
    const depositos = await prisma.$queryRawUnsafe(`
      SELECT * FROM vw_comprascondetalle
    `);

    return new Response(JSON.stringify(depositos), { status: 200 });
  } catch (error) {
    console.error("Error al obtener vista vw_comprascondetalle:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }
}
