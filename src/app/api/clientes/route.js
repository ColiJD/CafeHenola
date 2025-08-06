import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany();
    return new Response(JSON.stringify(clientes), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const cliente = await prisma.cliente.create({
      data: {
        clienteCedula: body.clienteCedula,
        clienteNombre: body.clienteNombre,
        clienteApellido: body.clienteApellido,
        clienteDirecion: body.clienteDirecion,
        clienteMunicipio: body.clienteMunicipio,
        clienteDepartament: body.clienteDepartament,
        claveIHCAFE: body.claveIHCAFE ? Number(body.claveIHCAFE) : null,
        clienteTelefono: body.clienteTelefono,
        clienteRTN: body.clienteRTN ? Number(body.clienteRTN) : null,
      },
    });

    return new Response(JSON.stringify(cliente), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
