import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ API para obtener todas las liquidaciones registradas
export async function GET() {
  try {
    const liquidaciones = await prisma.$queryRawUnsafe(`
      SELECT 
        L.liqID,
        L.liqFecha,
        L.liqclienteID,
        CONCAT(C.clienteNombre, ' ', C.clienteApellido) AS nombreCliente,
        P.productName AS tipoCafe,
        L.liqCatidadQQ,
        L.liqPrecio,
        L.liqTotalLps,
        L.liqDescripcion,
        L.liqEn
      FROM liqdeposito AS L
      LEFT JOIN cliente AS C ON C.clienteID = L.liqclienteID
      LEFT JOIN producto AS P ON P.productID = L.liqTipoCafe
      ORDER BY L.liqFecha DESC;
    `);

    return NextResponse.json({ detalles: liquidaciones }, { status: 200 });
  } catch (error) {
    console.error("⚠️ Error SQL:", error);
    return NextResponse.json(
      {
        error: "Error al obtener reporte de liquidaciones",
        detalle: error.message,
      },
      { status: 500 }
    );
  }
}
