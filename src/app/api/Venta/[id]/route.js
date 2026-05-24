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
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });

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
      return new Response(JSON.stringify({ error: "Venta no encontrada" }), {
        status: 404,
      });

    const productoAnteriorID = Number(ventaExistente.compraTipoCafe);
    const productoNuevoID = Number(compraTipoCafe);
    const cantidadQQAnterior = parseFloat(ventaExistente.compraCantidadQQ);
    const diffQQ = cantidadQQNueva - cantidadQQAnterior;

    if (productoAnteriorID === productoNuevoID && diffQQ > 0) {
      const inventarioActual = await prisma.inventariocliente.findUnique({
        where: { productoID: productoNuevoID },
      });
      const totalQQ = Number(inventarioActual?.cantidadQQ ?? 0);
      if (totalQQ < diffQQ) {
        return new Response(
          JSON.stringify({
            error: "Inventario insuficiente para actualizar la venta",
          }),
          { status: 400 }
        );
      }
    } else if (productoAnteriorID !== productoNuevoID) {
      const inventarioNuevo = await prisma.inventariocliente.findUnique({
        where: { productoID: productoNuevoID },
      });
      const totalQQ = Number(inventarioNuevo?.cantidadQQ ?? 0);
      if (totalQQ < cantidadQQNueva) {
        return new Response(
          JSON.stringify({
            error: "Inventario insuficiente para cambiar la venta al nuevo producto",
          }),
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
      if (productoAnteriorID !== productoNuevoID) {
        const inventarioAnterior = await tx.inventariocliente.findUnique({
          where: { productoID: productoAnteriorID },
        });
        const inventarioNuevo = await tx.inventariocliente.findUnique({
          where: { productoID: productoNuevoID },
        });

        if (!inventarioNuevo) {
          throw new Error("No hay inventario para el nuevo tipo de café.");
        }

        if (inventarioAnterior) {
          await tx.inventariocliente.update({
            where: { productoID: productoAnteriorID },
            data: {
              cantidadQQ: { increment: new Prisma.Decimal(cantidadQQAnterior) },
            },
          });

          await tx.movimientoinventario.create({
            data: {
              inventarioClienteID: inventarioAnterior.inventarioClienteID,
              tipoMovimiento: "Entrada",
              referenciaTipo: `Ajuste cambio venta #${ventaId}`,
              referenciaID: ventaId,
              cantidadQQ: new Prisma.Decimal(cantidadQQAnterior),
              nota: `Reversión de venta por cambio de producto para comprador ${compradorID}`,
            },
          });
        }

        await tx.inventariocliente.update({
          where: { productoID: productoNuevoID },
          data: {
            cantidadQQ: { decrement: new Prisma.Decimal(cantidadQQNueva) },
          },
        });

        await tx.movimientoinventario.create({
          data: {
            inventarioClienteID: inventarioNuevo.inventarioClienteID,
            tipoMovimiento: "Salida",
            referenciaTipo: `Ajuste cambio venta #${ventaId}`,
            referenciaID: ventaId,
            cantidadQQ: new Prisma.Decimal(cantidadQQNueva),
            nota: `Nueva salida por cambio de producto para comprador ${compradorID}`,
          },
        });
      } else if (diffQQ !== 0) {
        const inventario = await tx.inventariocliente.findUnique({
          where: { productoID: productoNuevoID },
        });

        if (!inventario) {
          throw new Error("No hay inventario para este tipo de café.");
        }

        if (diffQQ > 0) {
          await tx.inventariocliente.update({
            where: { productoID: productoNuevoID },
            data: {
              cantidadQQ: { decrement: new Prisma.Decimal(diffQQ) },
            },
          });

          await tx.movimientoinventario.create({
            data: {
              inventarioClienteID: inventario.inventarioClienteID,
              tipoMovimiento: "Salida",
              referenciaTipo: `Ajuste venta directa #${ventaId}`,
              referenciaID: ventaId,
              cantidadQQ: new Prisma.Decimal(diffQQ),
              nota: `Ajuste por aumento de venta a comprador ${compradorID}`,
            },
          });
        } else {
          const devolver = Math.abs(diffQQ);
          await tx.inventariocliente.update({
            where: { productoID: productoNuevoID },
            data: {
              cantidadQQ: { increment: new Prisma.Decimal(devolver) },
            },
          });

          await tx.movimientoinventario.create({
            data: {
              inventarioClienteID: inventario.inventarioClienteID,
              tipoMovimiento: "Entrada",
              referenciaTipo: `Ajuste venta directa #${ventaId}`,
              referenciaID: ventaId,
              cantidadQQ: new Prisma.Decimal(devolver),
              nota: `Ajuste por disminución de venta a comprador ${compradorID}`,
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
