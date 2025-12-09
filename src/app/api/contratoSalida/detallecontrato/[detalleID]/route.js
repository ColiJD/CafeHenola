import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function DELETE(req, { params }) {
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { detalleID: idParam } = await params;
    const detalleID = Number(idParam);
    if (!detalleID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // 🔹 Buscar el registro
    const registro = await prisma.detalleContratoSalida.findUnique({
      where: { detalleID },
    });
    if (!registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1️⃣ Actualizar estado del registro a "Anulado"
      await tx.detalleContratoSalida.update({
        where: { detalleID },
        data: { tipoMovimiento: "Anulado" },
      });

      // 2️⃣ Verificar si el contrato debe volver a "Pendiente"
      const contratoID = registro.contratoID;
      const contrato = await tx.contratoSalida.findUnique({
        where: { contratoID },
      });

      if (contrato) {
        const agregado = await tx.detalleContratoSalida.aggregate({
          _sum: { cantidadQQ: true },
          where: {
            contratoID,
            tipoMovimiento: { notIn: ["ANULADO", "Anulado", "anulado"] },
          },
        });

        const totalEntregado = Number(agregado._sum.cantidadQQ || 0);
        const totalContrato = Number(contrato.contratoCantidadQQ || 0);

        if (totalEntregado < totalContrato) {
          await tx.contratoSalida.update({
            where: { contratoID },
            data: { estado: "Pendiente" },
          });
        }
      }
    });

    return new Response(
      JSON.stringify({
        message: "Entrega anulada correctamente",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular registro:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el registro" }),
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function GET(req, context) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
  ]);

  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { detalleID } = await context.params;

    const detalle = await prisma.detalleContratoSalida.findUnique({
      where: { detalleID: parseInt(detalleID) },
      include: {
        contratoSalida: {
          include: {
            compradores: {
              select: {
                compradorId: true,
                compradorNombre: true,
              },
            },
            producto: {
              select: {
                productID: true,
                productName: true,
              },
            },
          },
        },
      },
    });

    if (!detalle) {
      return NextResponse.json(
        { error: "Detalle no encontrado" },
        { status: 404 }
      );
    }

    // Estructura plana para el frontend
    const response = {
      detalleID: detalle.detalleID,
      cantidadQQ: detalle.cantidadQQ,
      precioQQ: detalle.precioQQ,
      observaciones: detalle.observaciones,
      contratoID: detalle.contratoSalida.contratoID,
      contratoTipoCafe: detalle.contratoSalida.contratoTipoCafe,
      cliente: detalle.contratoSalida.compradores.compradorNombre || null,
      producto: detalle.contratoSalida.producto || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Error en GET /api/contratoSalida/detallecontrato/[detalleID]:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const sessionOrResponse = await checkRole(request, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { detalleID: idParam } = await params;
    const detalleID = Number(idParam);
    if (!detalleID) {
      return Response.json(
        { error: "ID de entrega inválido" },
        { status: 400 }
      );
    }

    const { contratoID, cantidadQQ, observaciones } = await request.json();
    console.log("Datos recibidos:", {
      detalleID,
      contratoID,
      cantidadQQ,
      observaciones,
    });

    if (!contratoID || !cantidadQQ || observaciones === undefined) {
      return Response.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener la entrega original
    const entregaOriginal = await prisma.detalleContratoSalida.findUnique({
      where: { detalleID },
    });
    if (!entregaOriginal) {
      return Response.json(
        { error: "No se encontró la entrega a modificar" },
        { status: 404 }
      );
    }

    // 2️⃣ Obtener contrato
    const contrato = await prisma.contratoSalida.findUnique({
      where: { contratoID: Number(contratoID) },
    });
    if (!contrato) {
      return Response.json(
        { error: "No se encontró el contrato asociado" },
        { status: 400 }
      );
    }
    // const clienteID = contrato.compradorID; // Not needed for inventory update anymore

    if (
      contrato.estado?.toUpperCase() === "ANULADO" ||
      contrato.contratoMovimiento?.toUpperCase() === "ANULADO"
    ) {
      return Response.json(
        {
          error: "El contrato está ANULADO y no se pueden modificar entregas.",
        },
        { status: 403 }
      );
    }

    // 3️⃣ Calcular saldo disponible
    const detalle = await prisma.detalleContratoSalida.aggregate({
      _sum: { cantidadQQ: true },
      where: {
        contratoID: Number(contratoID),
        detalleID: { not: detalleID },
        tipoMovimiento: { notIn: ["ANULADO", "anulado", "Anulado"] },
      },
    });
    const totalEntregado = parseFloat(detalle._sum?.cantidadQQ ?? "0");
    const contratoCantidadQQ = Number(contrato.contratoCantidadQQ);
    const saldoDisponible = contratoCantidadQQ - totalEntregado;

    const cantidadNueva = Number(cantidadQQ);
    if (cantidadNueva > saldoDisponible) {
      return Response.json(
        {
          error: `La cantidad actualizada (${cantidadNueva}) supera el saldo disponible (${saldoDisponible}).`,
        },
        { status: 400 }
      );
    }

    // 4️⃣ Transacción para actualizar entrega
    const resultado = await prisma.$transaction(async (tx) => {
      // a) Actualizar detalle
      const entregaActualizada = await tx.detalleContratoSalida.update({
        where: { detalleID },
        data: {
          cantidadQQ: cantidadNueva,
          observaciones: observaciones || null,
          fecha: new Date(),
        },
      });

      // b) Validar si contrato queda liquidado
      const nuevoTotalEntregado = totalEntregado + cantidadNueva;
      let estadoContrato = "Pendiente";
      if (nuevoTotalEntregado >= contratoCantidadQQ) {
        estadoContrato = "Liquidado";
        await tx.contratoSalida.update({
          where: { contratoID },
          data: { estado: "Liquidado" },
        });
      }

      return {
        message: "Entrega actualizada correctamente",
        entregaActualizada,
        estadoContrato,
        saldoRestante: contratoCantidadQQ - nuevoTotalEntregado,
      };
    });

    return Response.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error en PUT /api/contratos/entregar:", error);
    return Response.json(
      { error: error?.message || "Error al actualizar entrega" },
      { status: 500 }
    );
  }
}
