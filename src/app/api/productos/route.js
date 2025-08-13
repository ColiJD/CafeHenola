import prisma from "@/lib/prisma";

// GET para obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany();
    return new Response(JSON.stringify(productos), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al obtener productos" }), { status: 500 });
  }
}

// POST para agregar un producto
export async function POST(req) {
  try {
    const body = await req.json();
    const { productName } = body;

    if (!productName) {
      return new Response(JSON.stringify({ error: "El nombre del producto es obligatorio" }), { status: 400 });
    }

    const nuevoProducto = await prisma.producto.create({
      data: { productName },
    });

    return new Response(JSON.stringify(nuevoProducto), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al crear producto" }), { status: 500 });
  }
}
