import prisma from "@/lib/prisma";

export async function GET() {
  const productos = await prisma.producto.findMany();
  return new Response(JSON.stringify(productos), { status: 200 });
}
