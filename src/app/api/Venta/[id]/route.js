import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import { Prisma } from "@prisma/client";

export async function PUT(request, { params }) {
  const sessionOrResponse = await checkRole(request, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const ventaId = Number(params.id);
    if (!ventaId)
      return new Response(JSON.stringify({ error: "ID inválido" }), { status: 400 });

    const body = await request.json();
    const {
      compradorID,
      compraTipoCafe,
      compraCantidadQQ,
      compraTotalSacos,
      compraPrecioQQ,
      compraTotal,
      compraDescripcion,
    } = body;

    const cantidadQQNueva = parseFloat(compraCantidadQQ);
    const cantidadSacosNueva = parseFloat(compraTotalSacos);
    const precioQQ = parseFloat(compraPrecioQQ);
    const totalCompra = parseFloat(compraTotal);

    if (
      !compradorID ||
      !compraTipoCafe ||
      Number.isNaN(cantidadQQNueva) ||
      Number.isNaN(precioQQ)
    ) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios o son inválidos" }),
        { status: 400 }
      );
    }

    const ventaExistente = await prisma.compra.findUnique({
      where: { compraId: ventaId },
    });

    if (!ventaExistente)
      return new Response(JSON.stringify({ error: "Venta no encontrada" }), { status: 404 });

    const cantidadQQAnterior = parseFloat(ventaExistente.compraCantidadQQ);
    const diffQQ = cantidadQQNueva - cantidadQQAnterior;

    // Verificar inventario solo si la venta aumenta
    if (diffQQ > 0) {
      const totalInventario = await prisma.inventariocliente.aggregate({
        where: { productoID: Number(compraTipoCafe) },
        _sum: { cantidadQQ: true },
      });
      const totalQQ = totalInventario._sum?.cantidadQQ || 0;
      if (totalQQ < diffQQ) {
        return new Response(
          JSON.stringify({ error: "Inventario insuficiente para actualizar la venta" }),
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1️⃣ Actualizar venta
      const ventaActualizada = await tx.compra.update({
        where: { compraId: ventaId },
        data: {
          compradorID: Number(compradorID),
          compraTipoCafe: Number(compraTipoCafe),
          compraCantidadQQ: new Prisma.Decimal(cantidadQQNueva),
          compraTotalSacos: new Prisma.Decimal(cantidadSacosNueva),
          compraPrecioQQ: new Prisma.Decimal(precioQQ),
          compraTotal: new Prisma.Decimal(totalCompra),
          compraDescripcion: compraDescripcion || "",
        },
      });

      // 2️⃣ Ajustar inventario y movimiento
      if (diffQQ !== 0) {
        const inventarios = await tx.inventariocliente.findMany({
          where: { productoID: Number(compraTipoCafe) },
          orderBy: { inventarioClienteID: "asc" },
        });

        // Tomamos el primer inventario disponible para simplificar
        if (inventarios.length === 0) {
          throw new Error("No hay inventario para este tipo de café.");
        }

        const inv = inventarios[0];

        if (diffQQ > 0) {
          // Venta aumentó → decrementar inventario
          await tx.inventariocliente.update({
            where: { inventarioClienteID: inv.inventarioClienteID },
            data: { cantidadQQ: { decrement: new Prisma.Decimal(diffQQ) } },
          });
        } else {
          // Venta disminuyó → devolver inventario
          await tx.inventariocliente.update({
            where: { inventarioClienteID: inv.inventarioClienteID },
            data: { cantidadQQ: { increment: new Prisma.Decimal(Math.abs(diffQQ)) } },
          });
        }

        // Actualizar movimiento existente
        const movimientoExistente = await tx.movimientoinventario.findFirst({
          where: { referenciaID: ventaId, tipoMovimiento: "Salida" },
        });

        if (movimientoExistente) {
          let nuevaCantidad =
            diffQQ > 0
              ? movimientoExistente.cantidadQQ.add(new Prisma.Decimal(diffQQ))
              : movimientoExistente.cantidadQQ.sub(new Prisma.Decimal(Math.abs(diffQQ)));

          await tx.movimientoinventario.update({
            where: { movimientoID: movimientoExistente.movimientoID },
            data: {
              cantidadQQ: nuevaCantidad,
              nota:
                diffQQ > 0
                  ? `Ajuste por aumento de venta a comprador ${compradorID}`
                  : `Ajuste por disminución de venta a comprador ${compradorID}`,
            },
          });
        }
      }

      return ventaActualizada;
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("❌ Error al actualizar venta:", error);
    return new Response(
      JSON.stringify({ error: "Error al actualizar venta" }),
      { status: 500 }
    );
  }
}
