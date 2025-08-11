import prisma from "@/lib/prisma";

export async function GET() {
  const eventos = await prisma.$queryRaw`
    SELECT * FROM vw_Eventos ORDER BY fecha DESC
  `;
  return new Response(JSON.stringify(eventos), { status: 200 });
}
