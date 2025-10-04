import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function DELETE(req, { params }) {
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  try {
    const compraId = Number(params.id);
    if (!compraId) {
      return new Response(JSON.stringify({ error: "ID de compra inválido" }), {
        status: 400,
      });
    }

    // 🔹 Buscar la compra y su movimiento de inventario en paralelo
    const compra = await prisma.compra.findUnique({ where: { compraId } });
    if (!compra) {
      return new Response(JSON.stringify({ error: "Compra no encontrada" }), {
        status: 404,
      });
    }

    const movimiento = await prisma.movimientoinventario.findFirst({
      where: { referenciaID: compraId, tipoMovimiento: "Entrada" },
    });

    if (!movimiento) {
      return new Response(
        JSON.stringify({ error: "Movimiento de inventario no encontrado" }),
        { status: 404 }
      );
    }

    // 🔹 Ejecutar todo en una transacción
    await prisma.$transaction([
      // Actualizar movimiento para marcarlo como anulado
      prisma.movimientoinventario.update({
        where: { movimientoID: movimiento.movimientoID },
        data: {
          tipoMovimiento: "Anulado",
          nota: `Compra anulada #${compraId}`,
        },
      }),
      // Actualizar inventario restando la cantidad
      prisma.inventariocliente.update({
        where: { inventarioClienteID: movimiento.inventarioClienteID },
        data: {
          cantidadQQ: { decrement: movimiento.cantidadQQ },
          cantidadSacos: { decrement: movimiento.cantidadSacos },
        },
      }),
      // Marcar la compra como anulada
      prisma.compra.update({
        where: { compraId },
        data: { compraMovimiento: "Anulado" },
      }),
    ]);

    return new Response(
      JSON.stringify({ message: "Compra anulada correctamente" }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Error al anular la compra" }),
      { status: 500 }
    );
  }
}
export async function PUT(request, { params }) {
  const sessionOrResponse = await checkRole(request, [
    "ADMIN",
    "GERENCIA",
    "OPERARIO",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const compraId = Number(params.id);
    if (!compraId)
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });

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

    const cantidadQQNueva = parseFloat(compraCantidadQQ);
    const cantidadSacosNueva = parseFloat(compraTotalSacos);

    const compraExistente = await prisma.compra.findUnique({
      where: { compraId },
    });

    if (!compraExistente)
      return new Response(JSON.stringify({ error: "Compra no encontrada" }), {
        status: 404,
      });

    const cantidadQQAnterior = parseFloat(compraExistente.compraCantidadQQ);
    const cantidadSacosAnterior = parseFloat(compraExistente.compraTotalSacos);

    const diffQQ = cantidadQQNueva - cantidadQQAnterior;
    const diffSacos = cantidadSacosNueva - cantidadSacosAnterior;

    // 🔹 Ejecutar transacción
    const updated = await prisma.$transaction(async (prisma) => {
      // 1️⃣ Actualizar compra
      const compraActualizada = await prisma.compra.update({
        where: { compraId },
        data: {
          clienteID: Number(clienteID),
          compraTipoDocumento,
          compraTipoCafe: Number(compraTipoCafe),
          compraPrecioQQ: parseFloat(compraPrecioQQ),
          compraCantidadQQ: cantidadQQNueva,
          compraTotal: parseFloat(compraTotal),
          compraTotalSacos: cantidadSacosNueva,
          compraRetencio: compraRetencio ? parseFloat(compraRetencio) : 0,
          compraEn,
          compraDescripcion: compraDescripcion || "",
        },
      });

      // 2️⃣ Actualizar inventario (solo por tipo de café)
      const productoID = Number(compraTipoCafe);
      const inventario = await prisma.inventariocliente.findFirst({
        where: { productoID },
      });

      if (inventario) {
        await prisma.inventariocliente.update({
          where: { inventarioClienteID: inventario.inventarioClienteID },
          data: {
            cantidadQQ: { increment: diffQQ },
            cantidadSacos: { increment: diffSacos },
          },
        });
      } else {
        await prisma.inventariocliente.create({
          data: {
            clienteID: Number(clienteID),
            productoID,
            cantidadQQ: cantidadQQNueva,
            cantidadSacos: cantidadSacosNueva,
          },
        });
      }

      // 3️⃣ Actualizar movimiento de inventario
      const movimiento = await prisma.movimientoinventario.findFirst({
        where: { referenciaID: compraId },
      });

      if (movimiento) {
        await prisma.movimientoinventario.update({
          where: { movimientoID: movimiento.movimientoID },
          data: {
            cantidadQQ: cantidadQQNueva,
            cantidadSacos: cantidadSacosNueva,
            nota: "Compra actualizada",
          },
        });
      }

      return compraActualizada;
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Error al actualizar compra" }),
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

export async function GET(req, context) {
  try {
    const { id } = context.params;

    const compra = await prisma.compra.findUnique({
      where: { compraId: parseInt(id) },
      include: {
        cliente: {
          select: {
            clienteID: true,
            clienteNombre: true,
            clienteApellido: true,
          },
        },
        producto: {
          select: {
            productID: true,
            productName: true, // ✅ nombre correcto
            tara: true,
            descuento: true,
            factorOro: true,
          },
        },
        compradores: {
          select: {
            compradorId: true,
            compradorNombre: true,
          },
        },
      },
    });

    if (!compra) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    return NextResponse.json(compra);
  } catch (error) {
    console.error("Error en GET /api/compras/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
