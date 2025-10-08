import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function GET(req) {
  // verificar rol antes de continuar
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const fechaInicio = searchParams.get("desde") || searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("hasta") || searchParams.get("fechaFin");

    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    const fin = fechaFin ? new Date(fechaFin) : new Date();

    const detalles = await prisma.detallecontrato.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
      },
      select: {
        detalleID: true,
        contratoID: true,
        cantidadQQ: true,
        precioQQ: true,
        tipoMovimiento: true,
        observaciones: true,
        fecha: true,
        contrato: {
          select: {
            contratoID: true,
            cliente: {
              select: {
                clienteID: true,
                clienteNombre: true,
                clienteApellido: true,
              },
            },
            producto: {
              select: { productName: true },
            },
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const totalQQ = detalles.reduce((acc, c) => acc + Number(c.cantidadQQ || 0), 0);
    const totalLps = detalles.reduce(
      (acc, c) => acc + Number(c.cantidadQQ * c.precioQQ || 0),
      0
    );

    return new Response(
      JSON.stringify({
        resumen: {
          totalRegistros: detalles.length,
          totalQQ,
          totalLps,
        },
        detalles: detalles.map((d) => ({
          detalleID: d.detalleID,
          fecha: d.fecha,
          contratoID: d.contrato?.contratoID || 0,
          clienteID: d.contrato?.cliente?.clienteID || 0,
          nombreCliente: `${d.contrato?.cliente?.clienteNombre || ""} ${
            d.contrato?.cliente?.clienteApellido || ""
          }`.trim() || "Sin nombre",
          tipoCafe: d.contrato?.producto?.productName || "Sin especificar",
          cantidadQQ: Number(d.cantidadQQ || 0),
          precioQQ: Number(d.precioQQ || 0),
          totalLps: Number(d.cantidadQQ || 0) * Number(d.precioQQ || 0),
          tipoMovimiento: d.tipoMovimiento || "Entrada",
          observaciones: d.observaciones || "—",
        })),
        rango: { inicio: inicio.toISOString(), fin: fin.toISOString() },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en reporte detalle contrato:", error);
    return new Response(
      JSON.stringify({ error: "Error al generar reporte detalle contrato" }),
      { status: 500 }
    );
  }
}
