import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function GET(req) {
  // Verificar roles permitidos
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const fechaInicio =
      searchParams.get("desde") || searchParams.get("fechaInicio");
    const fechaFin =
      searchParams.get("hasta") || searchParams.get("fechaFin");

   
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    const fin = fechaFin ? new Date(fechaFin) : new Date();

    // Consultar los depósitos en el rango
    const depositos = await prisma.deposito.findMany({
      where: {
        depositoFecha: { gte: inicio, lte: fin },
      },
      select: {
        depositoID: true,
        depositoFecha: true,
        depositoCantidadQQ: true,
        depositoRetencionQQ: true,
        depositoDescripcion: true,
        depositoTipoCafe: true,
        cliente: {
          select: { clienteID: true, clienteNombre: true },
        },
        producto: {
          select: { productName: true },
        },
      },
      orderBy: { depositoFecha: "desc" },
    });

  // totales
    const totalQQ = depositos.reduce(
      (acc, d) => acc + Number(d.depositoCantidadQQ || 0),
      0
    );

    return new Response(
      JSON.stringify({
        resumen: {
          totalRegistros: depositos.length,
          totalQQ,
        },
        detalles: depositos.map((d) => ({
          id: d.depositoID,
          fecha: d.depositoFecha,
          clienteID: d.cliente?.clienteID || 0,
          nombreCliente: d.cliente?.clienteNombre || "Sin nombre",
          tipoCafe: d.producto?.productName || "Sin especificar",
          cantidadQQ: Number(d.depositoCantidadQQ || 0),
          retencionQQ: Number(d.depositoRetencionQQ || 0),
          descripcion: d.depositoDescripcion || "—",
        })),
        rango: { inicio: inicio.toISOString(), fin: fin.toISOString() },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en reporte de depósitos:", error);
    return new Response(
      JSON.stringify({ error: "Error al generar reporte de depósitos" }),
      { status: 500 }
    );
  }
}
