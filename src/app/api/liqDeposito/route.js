import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const {
      clienteID,
      tipoCafe,
      cantidadQQ,
      precioQQ,
      tipoDocumento,
      descripcion,
      liqEn
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
      return new Response(
        JSON.stringify({ saldoDisponible }),
        { status: 200 }
      );
    }

    // 2️⃣ Validar cantidad
    if (Number(cantidadQQ) > saldoDisponible) {
      return new Response(
        JSON.stringify({ error: "Cantidad supera saldo pendiente del cliente" }),
        { status: 400 }
      );
    }

    // 3️⃣ Llamar al stored procedure para liquidar
    await prisma.$executeRawUnsafe(
      `CALL LiquidarDepositoAuto(?, ?, ?, ?, ?, ?, ?)`,
      Number(clienteID),
      Number(tipoCafe),
      Number(cantidadQQ),
      Number(precioQQ),
      tipoDocumento,
      descripcion,
      liqEn
    );

    // 4️⃣ Retornar información
    return new Response(
      JSON.stringify({
        message: "Liquidación realizada correctamente",
        saldoAntes: saldoDisponible,
        cantidadLiquidada: Number(cantidadQQ),
        saldoDespues: saldoDisponible - Number(cantidadQQ)
      }),
      { status: 201 }
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteID = searchParams.get("clienteID");
    const tipoCafe = searchParams.get("tipoCafe");

    if (!clienteID) {
      return new Response(
        JSON.stringify({ error: "Debe enviar clienteID" }),
        { status: 400 }
      );
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
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500 }
    );
  }
}

