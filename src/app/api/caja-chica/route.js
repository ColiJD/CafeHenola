import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) return NextResponse.json([]);

    // /Ajuste de zona horaria: Honduras (UTC-6)
    // Cuando es 00:00 en Honduras, es 06:00 UTC.
    // Vercel corre en UTC. Si filtramos por local time del server, perdemos datos.

    // Inicio del día: 06:00 UTC del día seleccionado
    const start = new Date(`${date}T06:00:00Z`);

    // Fin del día: 06:00 UTC del día siguiente (Usamos lt para excluir el límite exacto)
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const movimientos = await prisma.caja_chica.findMany({
      where: {
        fecha: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        fecha: "asc",
      },
      include: {
        users: {
          select: { userName: true },
        },
      },
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("Error fetching caja chica movements:", error);
    return NextResponse.json(
      { error: "Error fetching caja chica" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { descripcion, monto, tipo, usuarioId } = data;

    const newMovement = await prisma.caja_chica.create({
      data: {
        descripcion,
        monto,
        tipo,
        usuarioId: usuarioId ? parseInt(usuarioId) : null,
      },
    });

    return NextResponse.json(newMovement);
  } catch (error) {
    console.error("Error creating caja chica movement:", error);
    return NextResponse.json(
      { error: "Error creating movement" },
      { status: 500 }
    );
  }
}
