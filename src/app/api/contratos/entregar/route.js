import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const {
      contratoID,
      clienteID,
      tipoCafe,
      cantidadQQ,
      precioQQ,
      totalSacos,
      tipoDocumento,
      descripcion,
      liqEn,
    } = await request.json();

    // 1️⃣ Obtener saldo disponible desde la vista
    const saldoResult = await prisma.$queryRaw`
      SELECT saldoDisponibleQQ, saldoDisponibleLps, precioQQ
      FROM vw_SaldoPorContrato
      WHERE contratoID = ${contratoID} 
        AND clienteID = ${clienteID} 
    `;

    // 2️⃣ Validación: si no hay resultados
    if (!saldoResult || saldoResult.length === 0) {
      console.log("⚠️ No se encontró saldo en la vista para:", {
        contratoID,
        clienteID,
      });
      return new Response(
        JSON.stringify({
          error: "No se encontró saldo disponible para este contrato",
        }),
        { status: 400 }
      );
    }

    const saldoDisponibleQQ = parseFloat(saldoResult[0].saldoDisponibleQQ || 0);
    const saldoDisponibleLps = parseFloat(
      saldoResult[0].saldoDisponibleLps || 0
    );
    const precioContrato = parseFloat(saldoResult[0].precioQQ || precioQQ);

    // console.log([
    //   { label: "contratoID", value: contratoID },
    //   { label: "clienteID", value: clienteID },
    //   { label: "tipoCafe", value: tipoCafe },
    //   { label: "cantidadQQ", value: cantidadQQ },
    //   { label: "precioQQ enviado", value: precioQQ },
    //   { label: "sacos", value: totalSacos },

    // ]);

    // 3️⃣ Validación de cantidad a liquidar
    if (parseFloat(cantidadQQ) > saldoDisponibleQQ) {
      return new Response(
        JSON.stringify({
          error: `La cantidad a liquidar (${cantidadQQ}) supera el saldo disponible (${saldoDisponibleQQ})`,
        }),
        { status: 400 }
      );
    }

    // 4️⃣ Llamar al stored procedure para entregar el contrato
    try {
      await prisma.$executeRawUnsafe(
        `CALL EntregarContrato(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Number(contratoID),
        Number(clienteID),
        Number(tipoCafe),
        Number(cantidadQQ),
        Number(precioContrato),
        Number(totalSacos),
        tipoDocumento,
        descripcion,
        liqEn
      );
    } catch (err) {
      // Manejar error del stored procedure
      if (
        err.code === "1644" &&
        err.message.includes("No hay depósitos pendientes")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "No hay depósitos pendientes para este cliente y tipo de café",
          }),
          { status: 400 }
        );
      }
      throw err; // cualquier otro error
    }

    // 5️⃣ Consultar nuevo saldo después de la liquidación
    const nuevoSaldoResult = await prisma.$queryRaw`
      SELECT saldoDisponibleQQ, saldoDisponibleLps
      FROM vw_SaldoPorContrato
      WHERE contratoID = ${contratoID} 
        AND clienteID = ${clienteID} 
        AND tipoCafeID = ${tipoCafe}
    `;

    const nuevoSaldoQQ = parseFloat(
      nuevoSaldoResult[0]?.saldoDisponibleQQ || 0
    );
    const nuevoSaldoLps = parseFloat(
      nuevoSaldoResult[0]?.saldoDisponibleLps || 0
    );

    // 6️⃣ Retornar información al frontend
    return new Response(
      JSON.stringify({
        message: "Liquidación del contrato realizada correctamente",
        saldoAntesQQ: saldoDisponibleQQ,
        saldoAntesLps: saldoDisponibleLps,
        cantidadLiquidadaQQ: cantidadQQ,
        totalLiquidacionLps: cantidadQQ * precioContrato,
        saldoDespuesQQ: nuevoSaldoQQ,
        saldoDespuesLps: nuevoSaldoLps,
      }),
      { status: 201 }
    );
  } catch (error) {
    // console.error("Error al entregar contrato:", error);

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
