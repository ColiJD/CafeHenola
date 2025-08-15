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
  {
    id: 6,
    name: "Liquidación de Depósito",
    image: deposito,
    link: Ruta + "liqDeposito",
  },
    {
    id: 7,
    name: "Contrato",
    image: deposito,
    link: Ruta + "contrato",
  },
   {
    id: 8,
    name: "Entrega Contrato",
    image: deposito,
    link: Ruta + "contrato/entrega",
  },
];

export const menuHeader = [
  {

    name: "Inicio",
    link: "/",
  },
  {

    name: "Compra",
    link: Ruta + "compra",
  },
  {

    name: "Clientes",
    link: Ruta + "cliente",
  },
  {

    name: "Productos",
    link: Ruta + "producto",
  },
  {

    name: "Eventos",
    link: Ruta + "eventos",
  },
  {
    name: "Deposito",
    link: Ruta + "deposito",
  },
];
