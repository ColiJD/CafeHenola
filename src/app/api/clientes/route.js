import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany();
    return new Response(JSON.stringify(clientes), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
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
        claveIHCAFE: body.claveIHCAFE,
        clienteTelefono: body.clienteTelefono,
        clienteRTN: body.clienteRTN,
      },
    });

    return new Response(JSON.stringify(cliente), { status: 201 });
  } catch (error) {
    console.error("Error creando cliente:", error); // <- Mostrar el error real en la consola
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
