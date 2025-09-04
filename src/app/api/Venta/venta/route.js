import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clienteID,
      compraTipoCafe,
      compraCantidadQQ, // ⚡ debe ser oro
      compraTotalSacos,
      compraPrecioQQ,
      compraTotal,
      compraDescripcion,
    } = body;

    console.log("📥 Datos recibidos:", body);

    const cantidadQQ = parseFloat(compraCantidadQQ);
    const cantidadSacos = compraTotalSacos ? parseFloat(compraTotalSacos) : 0;

    if (!clienteID || !compraTipoCafe || !cantidadQQ || !compraPrecioQQ) {
      console.log("⚠️ Faltan datos obligatorios");
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    // 1️⃣ Obtener inventario total por producto
    const totalInventario = await prisma.inventariocliente.aggregate({
      where: { productoID: Number(compraTipoCafe) },
      _sum: { cantidadQQ: true, cantidadSacos: true },
    });

    console.log("📊 Inventario total:", totalInventario._sum);

    if (
      !totalInventario._sum.cantidadQQ ||
      totalInventario._sum.cantidadQQ < cantidadQQ
    ) {
      console.log("❌ Inventario total insuficiente");
      return new Response(
        JSON.stringify({ error: "Inventario total insuficiente" }),
        { status: 400 }
      );
    }

    if (
      !totalInventario._sum.cantidadSacos ||
      totalInventario._sum.cantidadSacos < cantidadSacos
    ) {
      console.log("❌ No hay suficientes sacos en inventario");
      return new Response(
        JSON.stringify({ error: "No hay suficientes sacos en inventario" }),
        { status: 400 }
      );
    }

    // 2️⃣ Registrar la venta
    const registro = await prisma.compra.create({
      data: {
        clienteID: Number(clienteID),
        compraFecha: new Date(),
        compraTipoCafe: Number(compraTipoCafe),
        compraCantidadQQ: cantidadQQ,
        compraTotalSacos: cantidadSacos,
        compraPrecioQQ: parseFloat(compraPrecioQQ),
        compraTotal: parseFloat(compraTotal),
        compraDescripcion: compraDescripcion || "",
        compraEn: "Venta Directa",
        compraMovimiento: "Salida",
      },
    });

    console.log("✅ Venta registrada:", registro);

    // 3️⃣ Distribuir la venta entre inventarios existentes
    const inventarios = await prisma.inventariocliente.findMany({
      where: { productoID: Number(compraTipoCafe) },
      orderBy: { inventarioClienteID: "asc" },
    });

    console.log("🔄 Inventarios a procesar:", inventarios);

    let restanteQQ = cantidadQQ;
    let restanteSacos = cantidadSacos;

    for (const inv of inventarios) {
      if (restanteQQ <= 0 && restanteSacos <= 0) break;

      const descontarQQ = Math.min(restanteQQ, inv.cantidadQQ);
      const descontarSacos = Math.min(restanteSacos, inv.cantidadSacos);

      console.log(
        `➡️ Descontando del inventario ${inv.inventarioClienteID}: QQ=${descontarQQ}, Sacos=${descontarSacos}`
      );

      await prisma.inventariocliente.update({
        where: { inventarioClienteID: inv.inventarioClienteID },
        data: {
          cantidadQQ: { decrement: descontarQQ },
          cantidadSacos: { decrement: descontarSacos },
        },
      });

      await prisma.movimientoinventario.create({
        data: {
          inventarioClienteID: inv.inventarioClienteID,
          tipoMovimiento: "Salida",
          referenciaTipo: `Venta directa #${registro.compraId}`,
          referenciaID: registro.compraId,
          cantidadQQ: descontarQQ,
          cantidadSacos: descontarSacos,
          nota: "Salida de café por venta distribuida",
        },
      });

      restanteQQ -= descontarQQ;
      restanteSacos -= descontarSacos;

      console.log(
        `🔹 Restante por distribuir: QQ=${restanteQQ}, Sacos=${restanteSacos}`
      );
    }

    console.log("✅ Distribución de inventario completada");
    console.log("📊 Inventario total:", totalInventario._sum);
    return new Response(JSON.stringify(registro), { status: 201 });
  } catch (error) {
    console.error("🔥 Error al registrar la venta:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar la venta" }),
      { status: 500 }
    );
  }
}
