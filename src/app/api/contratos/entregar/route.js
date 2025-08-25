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
        AND tipoCafeID = ${tipoCafe}
    `;

    if (!saldoResult || saldoResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontró saldo disponible para este contrato" }),
        { status: 400 }
      );
    }

    const saldoDisponibleQQ = parseFloat(saldoResult[0].saldoDisponibleQQ || 0);
    const saldoDisponibleLps = parseFloat(saldoResult[0].saldoDisponibleLps || 0);
    const precioContrato = parseFloat(saldoResult[0].precioQQ || precioQQ);

    // 2️⃣ Validación de cantidad a liquidar
    if (parseFloat(cantidadQQ) > saldoDisponibleQQ) {
      return new Response(
        JSON.stringify({
          error: `La cantidad a liquidar (${cantidadQQ}) supera el saldo disponible (${saldoDisponibleQQ})`,
        }),
        { status: 400 }
      );
    }

    // 3️⃣ Ejecutar todo dentro de una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // a) Llamar al stored procedure para entregar el contrato
      try {
        await tx.$executeRawUnsafe(
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
        if (err.code === "1644" && err.message.includes("No hay depósitos pendientes")) {
          throw new Error("No hay depósitos pendientes para este cliente y tipo de café");
        }
        throw err;
      }

      // b) Actualizar inventario del cliente
      const inventarioCliente = await tx.inventariocliente.upsert({
        where: {
          clienteID_productoID: {
            clienteID: Number(clienteID),
            productoID: Number(tipoCafe),
          },
        },
        update: {
          cantidadQQ: { increment: Number(cantidadQQ) },
          cantidadSacos: { increment: Number(totalSacos) },
        },
        create: {
          clienteID: Number(clienteID),
          productoID: Number(tipoCafe),
          cantidadQQ: Number(cantidadQQ),
          cantidadSacos: Number(totalSacos),
        },
      });

      // c) Registrar movimiento de inventario
      await tx.movimientoinventario.create({
        data: {
          inventarioClienteID: inventarioCliente.inventarioClienteID,
          tipoMovimiento: "Entrada",
          referenciaTipo: `Contrato #${contratoID}`,
          referenciaID: contratoID,
          cantidadQQ: Number(cantidadQQ),
          cantidadSacos: Number(totalSacos),
          nota: "Entrada de café por liquidación de contrato",
        },
      });

      // d) Consultar nuevo saldo después de la liquidación
      const nuevoSaldoResult = await tx.$queryRaw`
        SELECT saldoDisponibleQQ, saldoDisponibleLps
        FROM vw_SaldoPorContrato
        WHERE contratoID = ${contratoID} 
          AND clienteID = ${clienteID} 
          AND tipoCafeID = ${tipoCafe}
      `;

      const nuevoSaldoQQ = parseFloat(nuevoSaldoResult[0]?.saldoDisponibleQQ || 0);
      const nuevoSaldoLps = parseFloat(nuevoSaldoResult[0]?.saldoDisponibleLps || 0);

      return {
        saldoAntesQQ: saldoDisponibleQQ,
        saldoAntesLps: saldoDisponibleLps,
        cantidadLiquidadaQQ: cantidadQQ,
        totalLiquidacionLps: cantidadQQ * precioContrato,
        saldoDespuesQQ: nuevoSaldoQQ,
        saldoDespuesLps: nuevoSaldoLps,
      };
    });

    // 4️⃣ Retornar resultado
    return new Response(
      JSON.stringify({
        message: "Liquidación del contrato realizada correctamente",
        ...resultado,
      }),
      { status: 201 }
    );
  } catch (error) {
    let msg = "Error interno";
    if (error?.message) {
      msg = error.message;
    }
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
