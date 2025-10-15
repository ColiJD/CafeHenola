// src/app/api/clientes/pendientes/route.js
import prisma from "@/lib/prisma";
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
    let query;
    if (clienteID) {
      // 🔹 Si se envía clienteID, filtra solo los contratos de ese cliente
      query = prisma.$queryRaw`
        SELECT clienteID, clienteNombreCompleto 
      FROM vw_clientes_con_contratos
        WHERE clienteID = ${Number(clienteID)}
      `;
    } else {
      // 🔹 Si no se envía clienteID, devuelve todos los contratos disponibles
      query = prisma.$queryRaw`
        SELECT clienteID, clienteNombreCompleto 
      FROM vw_clientes_con_contratos
      `;
    }

    const clientes = await query;

    return new Response(JSON.stringify(clientes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener clientes pendientes:", error);
    return new Response(
      JSON.stringify({ error: "No se pudieron cargar los clientes." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
