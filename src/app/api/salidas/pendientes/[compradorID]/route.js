import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const compradorID = Number(params.compradorID);

  if (!compradorID) {
    return new Response(
      JSON.stringify({ error: "compradorID es obligatorio" }),
      { status: 400 }
    );
  }

  try {
    // Obtener todas las salidas del comprador con sus detalles de entregas
    const salidas = await prisma.salida.findMany({
      where: { compradorID },
      select: {
        salidaID: true,
        salidaCantidadQQ: true,
        salidaDescripcion: true,
        detalleliqsalida: { select: { cantidadQQ: true } },
      },
    });

    // Calcular cantidad pendiente por salida
    const pendientes = salidas
      .map((s) => {
        const entregado = s.detalleliqsalida.reduce(
          (acc, d) => acc + Number(d.cantidadQQ),
          0
        );
        const cantidadPendiente = Number(s.salidaCantidadQQ) - entregado;
        return {
          salidaID: s.salidaID,
          cantidadPendiente,
          detalles: s.salidaDescripcion,
        };
      })
      .filter((s) => s.cantidadPendiente > 0); // solo pendientes

    // Total general
    const cantidadPendiente = pendientes.reduce(
      (acc, s) => acc + s.cantidadPendiente,
      0
    );

    return new Response(
      JSON.stringify({
        cantidadPendiente,
        detalles: pendientes,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Error obteniendo salidas pendientes" }),
      { status: 500 }
    );
  }
}
