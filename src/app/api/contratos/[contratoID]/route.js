import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import { NextResponse } from "next/server";
export async function DELETE(req, { params }) {
  const sessionOrResponse = await checkRole(req, ["ADMIN", "GERENCIA"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const contratoID = Number(params.contratoID);
    if (!contratoID) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // 🔹 Buscar el contrato
    const contrato = await prisma.contrato.findUnique({
      where: { contratoID },
    });
    if (!contrato) {
      return new Response(JSON.stringify({ error: "Contrato no encontrado" }), {
        status: 404,
      });
    }

    // 🔹 Buscar detalles activos (NO anulados)
    const detallesActivos = await prisma.detallecontrato.findMany({
      where: {
        contratoID,
        tipoMovimiento: { not: "Anulado" }, // ← ignorar anulados
      },
      select: {
        detalleID: true,
      },
    });

    if (detallesActivos.length > 0) {
      const lista = detallesActivos.map((d) => `#${d.detalleID}`).join(", ");

      return new Response(
        JSON.stringify({
          error: `No se puede eliminar el contrato porque tiene entregas activas: ${lista}.`,
          detalles: detallesActivos,
        }),
        { status: 400 }
      );
    }
    // 🔹 Anular el contrato si no hay detalles tipo Entrada activos
    await prisma.contrato.update({
      where: { contratoID },
      data: { estado: "Anulado", contratoMovimiento: "Anulado" },
    });

    return new Response(
      JSON.stringify({
        message: "Contrato anulado correctamente",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al anular contrato:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al anular el contrato" }),
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
    const contratoID = Number(params.contratoID);
    if (!contratoID) {
      return new Response(
        JSON.stringify({ error: "ID de contrato inválido" }),
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Body recibido:", body);

    const {
      contratoclienteID,
      contratoTipoCafe,
      contratoPrecio,
      contratoCantidadQQ,
      contratoTotalLps,
      contratoRetencion,
      contratoEn,
      contratoDescripcion,
    } = body;

    // Validación de campos obligatorios
    if (
      !contratoclienteID ||
      !contratoTipoCafe ||
      !contratoPrecio ||
      !contratoCantidadQQ ||
      !contratoTotalLps
    ) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    // Verificar existencia del contrato
    const contratoExistente = await prisma.contrato.findUnique({
      where: { contratoID },
    });
    if (!contratoExistente) {
      return new Response(JSON.stringify({ error: "Contrato no encontrado" }), {
        status: 404,
      });
    }

    // Verificar si existen detalles asociados
    const detallesCount = await prisma.detallecontrato.count({
      where: { contratoID },
    });
    if (detallesCount > 0) {
      return new Response(
        JSON.stringify({
          error: `No se puede modificar este contrato #${contratoID} porque ya tiene entregas registradas .`,
        }),
        { status: 403 }
      );
    }

    // 🔧 Actualizar contrato
    const contratoActualizado = await prisma.contrato.update({
      where: { contratoID },
      data: {
        contratoclienteID: Number(contratoclienteID),
        contratoTipoCafe: Number(contratoTipoCafe),
        contratoPrecio: parseFloat(contratoPrecio),
        contratoCantidadQQ: parseFloat(contratoCantidadQQ),
        contratoRetencionQQ: contratoRetencion
          ? parseFloat(contratoRetencion)
          : 0,
        contratoTotalLps: parseFloat(contratoTotalLps),
        contratoEn: contratoEn || "Contrato Directo",
        contratoDescripcion: contratoDescripcion || "N/A",
      },
    });

    return new Response(JSON.stringify(contratoActualizado), { status: 200 });
  } catch (error) {
    console.error("Error al actualizar contrato:", error);
    return new Response(
      JSON.stringify({ error: "Error al actualizar contrato" }),
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
  ]);

  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { contratoID } = context.params;

    const contrato = await prisma.contrato.findUnique({
      where: { contratoID: parseInt(contratoID) },

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
            productName: true,
          },
        },
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(contrato);
  } catch (error) {
    console.error("Error en GET /api/contratos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
