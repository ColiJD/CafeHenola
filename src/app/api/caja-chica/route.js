import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) return NextResponse.json([]);

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const movimientos = await prisma.caja_chica.findMany({
      where: {
        fecha: {
          gte: start,
          lte: end, // ← CORRECTO
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
