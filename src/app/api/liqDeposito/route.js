import prisma from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function POST(request, req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  try {
    const {
      clienteID,
      tipoCafe,
      cantidadQQ,
      precioQQ,
      tipoDocumento,
      descripcion,
      liqEn,
      movimiento,
    } = await request.json();

    // 1️⃣ Obtener saldo pendiente del cliente para el tipo de café
    const saldoResult = await prisma.$queryRaw`
      SELECT SUM(saldoPendienteQQ) AS saldoPendiente
      FROM vw_SaldoDepositos
      WHERE clienteID = ${clienteID} AND depositoTipoCafe = ${tipoCafe};
    `;

    const saldoDisponible = saldoResult[0]?.saldoPendiente || 0;

    // Si no se envía cantidad, solo devolvemos el saldo
    if (!cantidadQQ) {
      return new Response(JSON.stringify({ saldoDisponible }), { status: 200 });
    }

    // 2️⃣ Validar cantidad
    if (Number(cantidadQQ) > saldoDisponible) {
      return new Response(
        JSON.stringify({
          error: "Cantidad supera saldo pendiente del cliente",
        }),
        { status: 400 },
      );
    }

    // 3️⃣ Ejecutar liquidación en transacción
    const resultadoLiq = await prisma.$transaction(async (tx) => {
      let restante = Number(cantidadQQ);

      // Crear cabecera de liquidación
      const liqHeader = await tx.liqdeposito.create({
        data: {
          liqFecha: new Date(),
          liqclienteID: Number(clienteID),
          liqTipoCafe: Number(tipoCafe),
          liqCatidadQQ: Number(cantidadQQ),
          liqPrecio: Number(precioQQ),
          liqTotalLps: Number(cantidadQQ) * Number(precioQQ),
          liqTipoDocumento: tipoDocumento || "Liquidación",
          liqMovimiento: "Salida",
        },
      });

      // Obtener depósitos pendientes para este cliente y producto
      const depositos = await tx.deposito.findMany({
        where: {
          clienteID: Number(clienteID),
          depositoTipoCafe: Number(tipoCafe),
          depositoMovimiento: { notIn: ["ANULADO", "Anulado", "anulado"] },
        },
        include: {
          detalleliqdeposito: {
            where: { movimiento: { notIn: ["ANULADO", "Anulado", "anulado"] } },
          },
        },
        orderBy: { depositoFecha: "asc" },
      });

      for (const dep of depositos) {
        if (restante <= 0) break;

        const yaLiquidado = dep.detalleliqdeposito.reduce(
          (sum, d) => sum + Number(d.cantidadQQ || 0),
          0,
        );
        const pendienteDep = Number(dep.depositoCantidadQQ) - yaLiquidado;

        if (pendienteDep > 0) {
          const aLiquidar = Math.min(restante, pendienteDep);

          await tx.detalleliqdeposito.create({
            data: {
              liqID: liqHeader.liqID,
              depositoID: dep.depositoID,
              cantidadQQ: aLiquidar,
              movimiento: "Salida",
            },
          });

          restante -= aLiquidar;
        }
      }

      // 4️⃣ Actualizar inventario global
      const inventarioGlobal = await tx.inventariocliente.update({
        where: { productoID: Number(tipoCafe) },
        data: {
          cantidadQQ: { decrement: Number(cantidadQQ) },
        },
      });

      // 5️⃣ Movimiento de inventario
      await tx.movimientoinventario.create({
        data: {
          inventarioClienteID: inventarioGlobal.inventarioClienteID,
          tipoMovimiento: "Salida",
          referenciaTipo: `Liquidación Depósito #${liqHeader.liqID}`,
          referenciaID: liqHeader.liqID,
          cantidadQQ: Number(cantidadQQ),
          nota: `Liquidación de depósito para cliente ${clienteID}`,
        },
      });

      return liqHeader;
    });

    // 4️⃣ Retornar información
    return new Response(
      JSON.stringify({
        message: "Liquidación realizada correctamente",
        liqID: resultadoLiq.liqID,
        cantidadLiquidada: Number(cantidadQQ),
      }),
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al liquidar depósito:", error);

    let msg = "Error interno";
    if (error?.message) {
      if (error.message.includes("No hay depósitos pendientes")) {
        msg = "No hay depósitos pendientes para este cliente y tipo de café";
      } else if (error.message.includes("saldo insuficiente")) {
        msg = "Saldo insuficiente para liquidar";
      } else {
        msg = error.message;
      }
    }

    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const clienteID = searchParams.get("clienteID");
//     const tipoCafe = searchParams.get("tipoCafe");

//     if (!clienteID || !tipoCafe) {
//       return new Response(
//         JSON.stringify({ error: "Debe enviar clienteID y tipoCafe" }),
//         { status: 400 }
//       );
//     }

//     // Consultar saldo pendiente
//     const saldoResult = await prisma.$queryRaw`
//       SELECT SUM(saldoPendienteQQ) AS saldoPendiente
//       FROM vw_SaldoDepositos
//       WHERE clienteID = ${clienteID} AND depositoTipoCafe = ${tipoCafe};
//     `;

//     const saldoDisponible = saldoResult[0]?.saldoPendiente || 0;

//     return new Response(
//       JSON.stringify({ saldoDisponible }),
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error("Error al obtener saldo pendiente:", error);
//     return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
//   }
// }

export async function GET(request, req) {
  const sessionOrResponse = await checkRole(req, [
    "ADMIN",
    "GERENCIA",
    "OPERARIOS",
    "AUDITORES",
  ]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  try {
    const { searchParams } = new URL(request.url);
    const clienteID = searchParams.get("clienteID");
    const tipoCafe = searchParams.get("tipoCafe");

    if (!clienteID) {
      return new Response(JSON.stringify({ error: "Debe enviar clienteID" }), {
        status: 400,
      });
    }

    // Caso 1: cliente + café específico -> saldo puntual
    if (tipoCafe) {
      const saldoResult = await prisma.$queryRaw`
        SELECT SUM(saldoPendienteQQ) AS saldoPendiente
        FROM vw_SaldoDepositos
        WHERE clienteID = ${clienteID} AND depositoTipoCafe = ${tipoCafe};
      `;

      const saldoDisponible = saldoResult[0]?.saldoPendiente || 0;

      return new Response(JSON.stringify({ saldoDisponible }), {
        status: 200,
      });
    }

    // Caso 2: solo cliente -> devolver lista de cafés con saldo > 0
    const productosResult = await prisma.$queryRaw`
      SELECT depositoTipoCafe AS tipoCafe, SUM(saldoPendienteQQ) AS saldoPendiente
      FROM vw_SaldoDepositos
      WHERE clienteID = ${clienteID}
      GROUP BY depositoTipoCafe
      HAVING SUM(saldoPendienteQQ) > 0;
    `;

    return new Response(JSON.stringify(productosResult), { status: 200 });
  } catch (error) {
    console.error("Error al obtener saldo pendiente:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }
}
