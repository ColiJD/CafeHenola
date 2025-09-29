import prisma from "@/lib/prisma";
import { truncarDosDecimalesSinRedondear } from "@/lib/calculoCafe";
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
      contratoID,
      clienteID,
      tipoCafe,
      cantidadQQ,
      precioQQ,
      totalSacos,
      descripcion,
    } = await request.json();

    // console.log("Datos recibidos:", {
    //   contratoID,
    //   clienteID,
    //   tipoCafe,
    //   cantidadQQ,
    //   precioQQ,
    //   totalSacos,
    //   descripcion,
    // });

    // 1️⃣ Obtener el contrato
    const contrato = await prisma.contrato.findUnique({
      where: { contratoID: Number(contratoID) },
    });

    // console.log("Contrato encontrado:", contrato);

    if (!contrato) {
      return new Response(
        JSON.stringify({ error: "No se encontró el contrato" }),
        { status: 400 }
      );
    }

    // 2️⃣ Calcular saldo disponible desde detallecontrato
    const detalle = await prisma.detallecontrato.aggregate({
      _sum: { cantidadQQ: true },
      where: { contratoID: Number(contratoID) },
    });

    // console.log("Detalle acumulado:", detalle);

    const totalEntregado = parseFloat(detalle._sum?.cantidadQQ ?? "0");
    const contratoCantidadQQ = parseFloat(
      contrato.contratoCantidadQQ.toString()
    );
    const saldoDisponible = contratoCantidadQQ - totalEntregado;

    // console.log({
    //   totalEntregado,
    //   contratoCantidadQQ,
    //   saldoDisponible,
    // });

    if (Number(cantidadQQ) > saldoDisponible) {
      return new Response(
        JSON.stringify({
          error: `La cantidad a entregar (${cantidadQQ}) supera el saldo disponible (${saldoDisponible})`,
        }),
        { status: 400 }
      );
    }

    // 3️⃣ Ejecutar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // a) Registrar entrega en detallecontrato
      const detalleEntrega = await tx.detallecontrato.create({
        data: {
          contratoID: Number(contratoID),
          cantidadQQ: Number(cantidadQQ),
          precioQQ: Number(precioQQ),
          tipoMovimiento: "Entrada",
          fecha: new Date(),
          observaciones: descripcion || null,
        },
      });

      const nuevoTotalEntregado = totalEntregado + Number(cantidadQQ);
      let estadoContrato = "Pendiente";

      // console.log("Nuevo total entregado:", nuevoTotalEntregado);

      // b) Actualizar estado del contrato si se completó
      if (nuevoTotalEntregado >= contratoCantidadQQ) {
        await tx.contrato.update({
          where: { contratoID: Number(contratoID) },
          data: { estado: "Liquidado" },
        });

        estadoContrato = "Liquidado";

        // c) Registrar cierre en cierrecontrato
        await tx.cierrecontrato.create({
          data: {
            contratoID: Number(contratoID),
            totalEntregadoQQ: nuevoTotalEntregado,
            totalLps: nuevoTotalEntregado * Number(precioQQ),
            tipoMovimiento: "Entrada",
            observaciones: "Contrato completado",
          },
        });
      }

      // d) Actualizar inventario del cliente
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

      // e) Registrar movimiento de inventario
      await tx.movimientoinventario.create({
        data: {
          inventarioClienteID: inventarioCliente.inventarioClienteID,
          tipoMovimiento: "Entrada",
          referenciaTipo: `Contrato #${contratoID}`,
          referenciaID: contratoID,
          cantidadQQ: Number(cantidadQQ),
          cantidadSacos: Number(totalSacos),
          nota: "Entrada de café por entrega de contrato",
        },
      });

      return {
        saldoAntesQQ: truncarDosDecimalesSinRedondear(saldoDisponible),
        cantidadEntregadaQQ: truncarDosDecimalesSinRedondear(
          Number(cantidadQQ)
        ),
        saldoDespuesQQ: truncarDosDecimalesSinRedondear(
          contratoCantidadQQ - nuevoTotalEntregado
        ),
        estadoContrato,
        detalleEntregaID: detalleEntrega.detalleID,
        saldoDespuesLps: truncarDosDecimalesSinRedondear(
          (contratoCantidadQQ - nuevoTotalEntregado) * Number(precioQQ)
        ), // 🔹 truncado
      };
    });

    // console.log("Resultado de la transacción:", resultado);

    // 4️⃣ Retornar resultado
    return new Response(
      JSON.stringify({
        message: "Entrega de contrato registrada correctamente",
        ...resultado,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/contratos/entregar:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error interno" }),
      { status: 500 }
    );
  }
}
