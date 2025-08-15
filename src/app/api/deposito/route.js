import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clienteID,
      depositoTipoCafe,
      depositoCantidadQQ,
      depositoTotalSacos,
      depositoEn,
      depositoDescripcion,
    } = body;

    if (!clienteID || !depositoTipoCafe || !depositoCantidadQQ || !depositoEn) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        { status: 400 }
      );
    }
    const cantidadQQ = parseFloat(depositoCantidadQQ);
    const cantidadSacos = depositoTotalSacos
      ? parseFloat(depositoTotalSacos)
      : 0;

    const nuevoDeposito = await prisma.deposito.create({
      data: {
        clienteID: Number(clienteID),
        depositoFecha: new Date(),
        depositoTipoCafe: Number(depositoTipoCafe),
        depositoMovimiento: "Deposito",
        depositoCantidadQQ: cantidadQQ,
        depositoTotalSacos: cantidadSacos,
        depositoEn,
        depositoDescripcion: depositoDescripcion || "",
        estado: "Pendiente",
      },
    });
    // 2. Actualizar inventario del cliente
    await prisma.inventariocliente.upsert({
      where: {
        clienteID_productoID: {
          clienteID: Number(clienteID),
          productoID: Number(depositoTipoCafe),
        },
      },
      update: {
        cantidadQQ: { increment: cantidadQQ },
        cantidadSacos: { increment: cantidadSacos },
      },
      create: {
        clienteID: Number(clienteID),
        productoID: Number(depositoTipoCafe),
        cantidadQQ: cantidadQQ,
        cantidadSacos: cantidadSacos,
      },
    });

    // 3. Registrar movimiento de inventario
    await prisma.movimientoinventario.create({
      data: {
        tipoInventario: "Cliente",
        inventarioID: nuevoDeposito.clienteID, // ID del cliente
        tipoMovimiento: "Entrada",
        referenciaTipo: "Deposito",
        referenciaID: nuevoDeposito.depositoID,
        cantidadQQ: cantidadQQ,
        cantidadSacos: cantidadSacos,
        nota: depositoDescripcion || "",
      },
    });

    return new Response(JSON.stringify(nuevoDeposito), { status: 201 });
  } catch (error) {
    console.error("Error al registrar depósito:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar depósito" }),
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteID = Number(searchParams.get("clienteID"));
    const productoID = Number(searchParams.get("productoID"));

    if (!clienteID || !productoID) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400 });
    }

    const depositos = await prisma.deposito.findMany({
      where: {
        clienteID,
        depositoTipoCafe: productoID,
        estado: { not: "Liquidado" },
      },
      include: {
        cliente: { select: { clienteID: true, clienteNombre: true, clienteApellido: true } },
        producto: { select: { productID: true, productName: true } },
        detalleliqdeposito: { select: { cantidadQQ: true } },
      },
    });

    const depositosConSaldo = depositos.map((dep) => {
      const totalLiquidado = dep.detalleliqdeposito.reduce(
        (acc, detalle) => acc + Number(detalle.cantidadQQ),
        0
      );

      return {
        depositoID: dep.depositoID,
        depositoFecha: dep.depositoFecha,
        depositoCantidadQQ: dep.depositoCantidadQQ,
        saldoDisponibleQQ: Number(dep.depositoCantidadQQ) - totalLiquidado,
        estado: dep.estado,
        cliente: dep.cliente,
        producto: dep.producto,
      };
    });

    return new Response(JSON.stringify(depositosConSaldo), { status: 200 });
  } catch (error) {
    console.error("Error al obtener depósitos:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}
