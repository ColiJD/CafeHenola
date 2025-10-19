import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { clienteId } = params;

    // Buscar cliente con sus préstamos y movimientos
    const cliente = await prisma.cliente.findUnique({
      where: { clienteID: Number(clienteId) },
      include: {
        prestamos: {
          include: {
            movimientos_prestamo: {
              orderBy: { fecha: "asc" },
            },
          },
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!cliente) {
      return new Response(
        JSON.stringify({ message: "Cliente no encontrado" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(cliente), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener préstamos:", error);
    return new Response(
      JSON.stringify({ message: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}
