import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      contratoclienteID,
      contratoTipoCafe,
      contratoPrecio,
      contratoCatidadQQ,
      contratoTotalLps,
      contratoEn,
      contratoDescripcion,
    } = body;

    // Validar campos obligatorios
    if (
      !contratoclienteID ||
      !contratoTipoCafe ||
      !contratoPrecio ||
      !contratoCatidadQQ ||
      !contratoTotalLps
    ) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios del contrato" }),
        { status: 400 }
      );
    }

    // Crear contrato
    const nuevoContrato = await prisma.contrato.create({
      data: {
        contratoclienteID: Number(contratoclienteID),
        contratoFecha: new Date(),
        contratoMovimiento: "Contrato",
        contratoTipoCafe: Number(contratoTipoCafe),
        contratoPrecio: parseFloat(contratoPrecio),
        contratoCatidadQQ: parseFloat(contratoCatidadQQ),
        contratoTotalLps: parseFloat(contratoTotalLps),
        contratoEn,
        contratoDescripcion: contratoDescripcion || "",
        estado: "Pendiente",
      },
    });

    return new Response(JSON.stringify(nuevoContrato), { status: 201 });
  } catch (error) {
    console.error("Error al registrar contrato:", error);
    return new Response(
      JSON.stringify({ error: "Error al registrar contrato" }),
      { status: 500 }
    );
  }
}
