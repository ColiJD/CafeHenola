import prisma from "@/lib/prisma";

export async function GET() {
  const usuarios = await prisma.usuario.findMany();
  return new Response(JSON.stringify(usuarios), { status: 200 });
}

export async function POST(request) {
  const body = await request.json();
  const { nombre, email } = body;

  const nuevoUsuario = await prisma.usuario.create({
    data: { nombre, email },
  });

  return new Response(JSON.stringify(nuevoUsuario), { status: 201 });
}
