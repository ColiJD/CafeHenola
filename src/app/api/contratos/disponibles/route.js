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
    const clientes = await prisma.$queryRaw`
      SELECT clienteID, clienteNombreCompleto 
      FROM vw_clientes_con_contratos
    `;

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
