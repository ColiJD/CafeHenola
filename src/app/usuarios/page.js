import prisma from "@/lib/prisma";

export async function GET() {
  const usuarios = await prisma.usuario.findMany();
  return new Response(JSON.stringify(usuarios), { status: 200 });
}

export async function POST(request) {
  const body = await request.json();
  const { nombre, email } = body;

  if (!nombre || !email) {
    return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400 });
  }

  const nuevoUsuario = await prisma.usuario.create({
    data: { nombre, email },
  });

  return new Response(JSON.stringify(nuevoUsuario), { status: 201 });
}
