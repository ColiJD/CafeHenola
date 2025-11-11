import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function POST(req) {
  try {
    const body = await req.json();
    const { compradorID, cantidadLiquidar, descripcion } = body;

    if (!compradorID || !cantidadLiquidar) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const cantidadSolicitada = Number(cantidadLiquidar);

    const resultado = await prisma.$transaction(async (tx) => {
      let cantidad = cantidadSolicitada;

      // obtener todas las salidas del comprador, FIFO
      const salidas = await tx.salida.findMany({
        where: { compradorID: Number(compradorID) },
        orderBy: { salidaFecha: "asc" },
        include: { detalleliqsalida: true },
      });

      // calcular pendientes dinámicos
      const pendientes = salidas
        .map((s) => {
          const totalLiquidado = s.detalleliqsalida.reduce(
            (acc, d) => acc + Number(d.cantidadQQ || 0),
            0
          );
          const pendiente = Number(s.salidaCantidadQQ) - totalLiquidado;
          return { salidaID: s.salidaID, pendiente };
        })
        .filter((s) => s.pendiente > 0);

      if (pendientes.length === 0) {
        throw new Error("NO_PENDIENTES");
      }

      // crear registro maestro de liquidación
      const liqSalida = await tx.liqsalida.create({
        data: {
          liqFecha: new Date(),
          compradorID: Number(compradorID),
          liqMovimiento: "Salida",
          liqCantidadQQ: cantidadSolicitada,
          liqDescripcion: descripcion || "",
        },
      });

      // recorrer FIFO
      for (const s of pendientes) {
        if (cantidad <= 0) break;

        const descontar = Math.min(s.pendiente, cantidad);

        // registrar detalle
        await tx.detalleliqsalida.create({
          data: {
            liqSalidaID: liqSalida.liqSalidaID,
            salidaID: s.salidaID,
            cantidadQQ: descontar,
          },
        });

        cantidad -= descontar;
      }

      return liqSalida;
    });

    return NextResponse.json(
      { liqSalidaID: resultado.liqSalidaID },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error FIFO transacción:", error);

    if (error.message === "NO_PENDIENTES") {
      return NextResponse.json(
        { error: "No hay salidas pendientes para este comprador" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req) {
  // Validar roles
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
    const fechaFin = searchParams.get("hasta") || searchParams.get("fechaFin");

    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    const fin = fechaFin ? new Date(fechaFin) : new Date();

    const registros = await prisma.liqsalida.findMany({
      where: {
        liqFecha: { gte: inicio, lte: fin },
        NOT: { liqMovimiento: "Anulado" },
      },
      select: {
        liqSalidaID: true,
        liqFecha: true,
        liqMovimiento: true,
        liqCantidadQQ: true,
        liqDescripcion: true,
        compradores: {
          select: {
            compradorId: true,
            compradorNombre: true,
          },
        },
      },
      orderBy: { liqFecha: "desc" },
    });

    return new Response(JSON.stringify(registros), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en reporte de liquidaciones de salida:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener liquidaciones de salida" }),
      { status: 500 }
    );
  }
}
