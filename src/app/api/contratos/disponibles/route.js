// src/app/api/clientes/pendientes/route.js
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkRole } from "@/lib/checkRole";

export async function GET(req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const clienteID = searchParams.get("clienteID");

    // 🟢 Si se pasa clienteID: mantener lógica original
    if (clienteID) {
      const contratos = await prisma.contrato.findMany({
        where: {
          contratoclienteID: Number(clienteID),
          contratoMovimiento: { not: "ANULADO" }, // ignorar contratos anulados
        },
        include: { cliente: { select: { clienteNombre: true } } },
      });

      if (contratos.length === 0) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const contratoIds = contratos.map((c) => c.contratoID);

      const totales = await prisma.$queryRaw(
        Prisma.sql`
          SELECT
            dc.contratoID,
            COALESCE(SUM(dc.cantidadQQ * dc.precioQQ), 0) AS totalDetalle,
            COALESCE(SUM(dc.cantidadQQ), 0) AS cantidadEntregada
          FROM detallecontrato dc
          WHERE dc.contratoID IN (${Prisma.join(contratoIds)})
            AND dc.tipoMovimiento != 'ANULADO'
          GROUP BY dc.contratoID
        `
      );

      const totalesMap = new Map(
        totales.map((t) => [
          t.contratoID,
          {
            totalDetalle: Number(t.totalDetalle),
            cantidadEntregada: Number(t.cantidadEntregada),
          },
        ])
      );

      const resultado = contratos
        .map((c) => {
          const totalesContrato = totalesMap.get(c.contratoID) || {
            totalDetalle: 0,
            cantidadEntregada: 0,
          };
          const saldoInicial = Number(c.contratoTotalLps || 0);
          const faltante = saldoInicial - totalesContrato.totalDetalle;

          const cantidadInicial = Number(c.contratoCantidadQQ || 0);
          const cantidadFaltante =
            cantidadInicial - totalesContrato.cantidadEntregada;

          const completado =
            totalesContrato.cantidadEntregada >= cantidadInicial;

          return {
            contratoID: c.contratoID,
            clienteNombreCompleto: c.cliente?.clienteNombre || "",
            saldoInicial,
            totalDetalle: totalesContrato.totalDetalle,
            faltante,
            cantidadInicial,
            cantidadEntregada: totalesContrato.cantidadEntregada,
            cantidadFaltante,
            completado,
          };
        })
        .filter((c) => !c.completado);

      return new Response(JSON.stringify(resultado), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🟡 Si NO se pasa clienteID: devolver todos los clientes con contratos pendientes
    const clientesPendientes = await prisma.$queryRaw`
  SELECT 
    cl.clienteID,
    cl.clienteNombre,
    cl.clienteApellido
  FROM cliente cl
  LEFT JOIN (
    SELECT
      contratoclienteID,
      SUM(contratoCantidadQQ) AS cantidadTotal
    FROM contrato
    WHERE contratoMovimiento != 'ANULADO'
    GROUP BY contratoclienteID
  ) ct ON ct.contratoclienteID = cl.clienteID
  LEFT JOIN (
    SELECT
      c.contratoclienteID,
      SUM(dc.cantidadQQ) AS cantidadEntregada
    FROM contrato c
    JOIN detallecontrato dc
      ON dc.contratoID = c.contratoID
      AND dc.tipoMovimiento != 'ANULADO'
    WHERE c.contratoMovimiento != 'ANULADO'
    GROUP BY c.contratoclienteID
  ) dt ON dt.contratoclienteID = cl.clienteID
  WHERE (COALESCE(ct.cantidadTotal, 0) - COALESCE(dt.cantidadEntregada, 0)) > 0;
`;

    const resultado = clientesPendientes.map((c) => ({
      clienteID: c.clienteID,
      clienteNombreCompleto: `${c.clienteNombre || ""} ${
        c.clienteApellido || ""
      }`.trim(),
    }));

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener contratos pendientes:", error);
    return new Response(
      JSON.stringify({ error: "No se pudieron cargar los contratos." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
