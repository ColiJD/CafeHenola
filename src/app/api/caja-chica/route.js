import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const movimientos = await prisma.caja_chica.findMany({
      orderBy: {
        fecha: "desc",
      },
      include: {
        users: {
          select: {
            userName: true,
          },
        },
      },
    });
    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("Error fetching caja chica movements:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
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
