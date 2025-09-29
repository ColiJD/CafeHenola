import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function POST(request, req) {
  // Verificar roles
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const body = await request.json();
    const {
      compradorID, // ahora usamos compradorID
      compraTipoCafe,
      compraCantidadQQ,
      compraTotalSacos,
      compraPrecioQQ,
      compraTotal,
      compraDescripcion,
    } = body;

    console.log("📥 Datos recibidos:", body);

    const cantidadQQ = parseFloat(compraCantidadQQ);
    const cantidadSacos = compraTotalSacos ? parseFloat(compraTotalSacos) : 0;

    if (!compradorID || !compraTipoCafe || !cantidadQQ || !compraPrecioQQ) {
      console.log("⚠️ Faltan datos obligatorios");
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    // 1️⃣ Obtener inventario total de clientes por producto
    const totalInventario = await prisma.inventariocliente.aggregate({
      where: { productoID: Number(compraTipoCafe) },
      _sum: { cantidadQQ: true, cantidadSacos: true },
    });

    if (
      !totalInventario._sum.cantidadQQ ||
      totalInventario._sum.cantidadQQ < cantidadQQ
    ) {
      return new Response(
        JSON.stringify({ error: "Inventario total insuficiente" }),
        { status: 400 }
      );
    }

    if (
      !totalInventario._sum.cantidadSacos ||
      totalInventario._sum.cantidadSacos < cantidadSacos
    ) {
      return new Response(
        JSON.stringify({ error: "No hay suficientes sacos en inventario" }),
        { status: 400 }
      );
    }

    // 2️⃣ Registrar la venta con compradorID
    const registro = await prisma.compra.create({
      data: {
        compradorID: Number(compradorID),
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

    // 3️⃣ Distribuir la venta entre inventarios de clientes
    const inventarios = await prisma.inventariocliente.findMany({
      where: { productoID: Number(compraTipoCafe) },
      orderBy: { inventarioClienteID: "asc" },
    });

    let restanteQQ = cantidadQQ;
    let restanteSacos = cantidadSacos;

    for (const inv of inventarios) {
      if (restanteQQ <= 0 && restanteSacos <= 0) break;

      const descontarQQ = Math.min(restanteQQ, inv.cantidadQQ);
      const descontarSacos = Math.min(restanteSacos, inv.cantidadSacos);

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
          nota: `Salida de café por venta a comprador ${compradorID}`,
        },
      });

      restanteQQ -= descontarQQ;
      restanteSacos -= descontarSacos;
    }

    console.log("✅ Distribución de inventario completada");
    return new Response(JSON.stringify(registro), { status: 201 });
  } catch (error) {
    console.error("🔥 Error al registrar la venta:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar la venta" }),
      { status: 500 }
    );
  }
}
