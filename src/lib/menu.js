import eventos from "@/img/eventos.png";
import producto from "@/img/cliente.png";
import cliente from "@/img/product.png";
import compra from "@/img/deposito.png";
// import contrato from "@/img/co.png";
import deposito from "@/img/contrato.png";

const Ruta = "/page/";
export const menuItems = [
  {
    id: 1,
    name: "Compra Directa",
    image: compra, // imagen importada
    link: Ruta + "compra", // ruta relativa
  },
  {
    id: 2,
    name: "Clientes",
    image: producto, // ruta desde public
    link: Ruta + "cliente",
  },
  {
    id: 3,
    name: "Producto",
    image: cliente,
    link: Ruta + "producto",
  },
  {
    id: 4,
    name: "Evento",
    image: eventos,
    link: Ruta + "eventos",
  },
  {
    id: 5,
    name: "Deposito",
    image: deposito,
    link: Ruta + "deposito",
  },
];
