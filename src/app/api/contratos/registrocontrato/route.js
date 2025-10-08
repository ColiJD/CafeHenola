import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function GET(req) {
  // ✅ Verificar roles permitidos
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    // ✅ Obtener parámetros de filtro (fechas)
    const { searchParams } = new URL(req.url);
    const fechaInicio =
      searchParams.get("desde") || searchParams.get("fechaInicio");
    const fechaFin =
      searchParams.get("hasta") || searchParams.get("fechaFin");

    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    const fin = fechaFin ? new Date(fechaFin) : new Date();

    // ✅ Consultar contratos dentro del rango de fechas
    const contratos = await prisma.contrato.findMany({
      where: {
        contratoFecha: { gte: inicio, lte: fin },
      },
      select: {
        contratoID: true,
        contratoFecha: true,
        contratoCantidadQQ: true,
        contratoRetencionQQ: true,
        contratoTotalLps: true,
        contratoPrecio: true, // ✅ Se agregó el campo de PRECIO
        contratoDescripcion: true,
        estado: true,
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
      orderBy: { contratoFecha: "desc" },
    });

    // ✅ Calcular totales generales
    const totalQQ = contratos.reduce(
      (acc, c) => acc + Number(c.contratoCantidadQQ || 0),
      0
    );
    const totalLps = contratos.reduce(
      (acc, c) => acc + Number(c.contratoTotalLps || 0),
      0
    );

    // ✅ Estructurar respuesta JSON
    return new Response(
      JSON.stringify({
        resumen: {
          totalRegistros: contratos.length,
          totalQQ,
          totalLps,
        },
        detalles: contratos.map((c) => ({
          contratoID: c.contratoID, // ✅ Agregado explícitamente
          fecha: c.contratoFecha,
          clienteID: c.cliente?.clienteID || 0,
          nombreCliente: `${c.cliente?.clienteNombre || ""} ${
            c.cliente?.clienteApellido || ""
          }`.trim() || "Sin nombre",
          tipoCafe: c.producto?.productName || "Sin especificar",
          cantidadQQ: Number(c.contratoCantidadQQ || 0),
          retencionQQ: Number(c.contratoRetencionQQ || 0),
          precio: Number(c.contratoPrecio || 0), // ✅ Nuevo campo
          totalLps: Number(c.contratoTotalLps || 0),
          descripcion: c.contratoDescripcion || "—",
          estado: c.estado || "Pendiente",
        })),
        rango: { inicio: inicio.toISOString(), fin: fin.toISOString() },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error en reporte de contratos:", error);
    return new Response(
      JSON.stringify({ error: "Error al generar reporte de contratos" }),
      { status: 500 }
    );
  }
}
