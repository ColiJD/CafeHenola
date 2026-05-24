import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function POST(req, res) {
  const sessionOrResponse = await checkRole(res, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  try {
    const { fromProductID, toProductID, cantidadQQ, nota } = await req.json();

    // 🔹 1️⃣ Validación de campos obligatorios
    if (!fromProductID || !toProductID || !cantidadQQ) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
      });
    }

    // 🔹 2️⃣ Evitar transferencia al mismo tipo de café
    if (fromProductID === toProductID) {
      return new Response(
        JSON.stringify({
          error: "No se puede transferir al mismo tipo de café",
        }),
        { status: 400 }
      );
    }

    // 🔹 3️⃣ Validar que la cantidad sea un número positivo
    const cantidad = parseFloat(cantidadQQ);
    if (isNaN(cantidad) || cantidad <= 0) {
      return new Response(
        JSON.stringify({ error: "Cantidad inválida. Debe ser mayor a 0" }),
        { status: 400 }
      );
    }

    // 🔹 4️⃣ Transacción para mover inventario de manera atómica
    const result = await prisma.$transaction(async (tx) => {
      const inventarioOrigen = await tx.inventariocliente.findUnique({
        where: { productoID: fromProductID },
      });

      const totalDisponible = Number(inventarioOrigen?.cantidadQQ ?? 0);
      if (totalDisponible < cantidad) {
        return {
          ok: false,
          error: "No hay suficiente inventario para transferir",
        };
      }

      await tx.inventariocliente.update({
        where: { productoID: fromProductID },
        data: { cantidadQQ: Number(inventarioOrigen.cantidadQQ) - cantidad },
      });

      let inventarioDestino = await tx.inventariocliente.findUnique({
        where: { productoID: toProductID },
      });

      if (!inventarioDestino) {
        inventarioDestino = await tx.inventariocliente.create({
          data: { productoID: toProductID, cantidadQQ: 0, cantidadSacos: 0 },
        });
      }

      await tx.inventariocliente.update({
        where: { productoID: toProductID },
        data: { cantidadQQ: Number(inventarioDestino.cantidadQQ) + cantidad },
      });

      await tx.movimientoinventario.create({
        data: {
          inventarioClienteID: inventarioOrigen.inventarioClienteID,
          tipoMovimiento: "Transferencia",
          referenciaTipo: `Transferencia de producto ${fromProductID} ➜ ${toProductID}`,
          referenciaID: toProductID,
          cantidadQQ: cantidad,
          cantidadSacos: 0,
          nota:
            nota ||
            `Transferencia de ${cantidad} QQ desde producto #${fromProductID} hacia producto #${toProductID}`,
        },
      });

      // 🔹 5️⃣ Confirmación de éxito
      return { ok: true };
    });

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
    });
  } catch (err) {
    console.error("❌ Error en transferencia FIFO:", err);

    // 🔹 6️⃣ Captura de error inesperado
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    // 🔹 Consultar solo movimientos de tipo "Transferencia"
    const movimientos = await prisma.movimientoinventario.findMany({
      where: { tipoMovimiento: "Transferencia" },
      orderBy: { fecha: "desc" }, // los más recientes primero
    });

    return new Response(JSON.stringify(movimientos), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error obteniendo movimientos:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
