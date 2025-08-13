import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const depositos = await prisma.deposito.findMany({
      include: {
        cliente: {
          select: {
            clienteID: true,
            clienteNombre: true,
            clienteApellido: true,
          },
        },
        producto: true, // Mantengo producto completo, si quieres también se puede selectivo
      },
    });

    return new Response(JSON.stringify(depositos), { status: 200 });
  } catch (error) {
    console.error("Error al obtener depósitos:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener depósitos" }),
      { status: 500 }
    );
  }
}

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

    const nuevoDeposito = await prisma.deposito.create({
      data: {
        clienteID: Number(clienteID),
        depositoFecha: new Date(),
        depositoTipoCafe: Number(depositoTipoCafe),
        depositoMovimiento: "Deposito",
        depositoCantidadQQ: parseFloat(depositoCantidadQQ),
        depositoTotalSacos: depositoTotalSacos
          ? parseFloat(depositoTotalSacos)
          : 0,
        depositoEn,
        depositoDescripcion: depositoDescripcion || "",
        estado: "Pendiente",
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
