import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

// Registrar nueva salida (venta/compromiso)
export async function POST(request, req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const body = await request.json();
    const {
      compradorID,
      salidaMovimiento,
      salidaCantidadQQ,
      salidaPrecio,
      salidaDescripcion,
      contratoID,
    } = body;

    // 🔹 Validaciones básicas
    if (!compradorID || !salidaCantidadQQ || !salidaPrecio) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }

    // 🔹 Convertir y validar números
    const cantidadQQ = parseFloat(salidaCantidadQQ);
    const precio = parseFloat(salidaPrecio);

    if (isNaN(cantidadQQ) || cantidadQQ <= 0) {
      return new Response(
        JSON.stringify({
          error: "La cantidad en QQ debe ser un número mayor que cero",
        }),
        { status: 400 }
      );
    }

    if (isNaN(precio) || precio <= 0) {
      return new Response(
        JSON.stringify({
          error: "El precio debe ser un número mayor que cero",
        }),
        { status: 400 }
      );
    }

    // 🔹 Crear salida (venta/compromiso)
    const nuevaSalida = await prisma.salida.create({
      data: {
        compradorID: Number(compradorID),
        salidaFecha: new Date(),
        salidaMovimiento: "Salida",
        salidaCantidadQQ: cantidadQQ,
        salidaPrecio: precio,
        salidaDescripcion: salidaDescripcion || "",
      },
    });

    return new Response(JSON.stringify(nuevaSalida), { status: 201 });
  } catch (error) {
    console.error("Error al registrar salida:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar salida" }),
      { status: 500 }
    );
  }
}

// Obtener todas las salidas (ventas/compromisos)
export async function GET(req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    // Puedes usar una vista o traer directamente de la tabla
    const salidas = await prisma.salida.findMany({
      include: {
        comprador: true,
        contrato: true,
      },
      orderBy: {
        salidaFecha: "desc",
      },
    });

    return new Response(JSON.stringify(salidas), { status: 200 });
  } catch (error) {
    console.error("Error al obtener salidas:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }
}
