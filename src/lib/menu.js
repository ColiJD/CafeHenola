import eventos from "@/img/eventos.png";
import producto from "@/img/cliente.png";
import cliente from "@/img/product.png";
import deposito from "@/img/deposito.png";
import money from "@/img/money.png";

// import contrato from "@/img/co.png";
import contrato from "@/img/contrato.png";

import Compras from "@/img/Compras.png";
import Depo from "@/img/depo.png";
import LiqDepo from "@/img/liqD.png";
import prestamo from "@/img/co.png";
import Contrato from "@/img/Contratos.png";
import Reportes from "@/img/Reportes.png";
import {
  UserOutlined,
  HomeOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  MinusCircleOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const Ruta = "/page/";
// 📂 lib/menu.js

export const menuItems = [
  {
    id: 1,
    name: "Entradas",
    image: Compras,
    subItems: [
      {
        id: 101,
        name: "Compra Directa",
        href: Ruta + "/compra/",
        image: Compras,
      },
      { id: 102, name: "Deposito", href: Ruta + "/deposito", image: Depo },
      {
        id: 103,
        name: "Liquidar Deposito",
        href: Ruta + "deposito/liqDeposito",
        image: LiqDepo,
      },
      { id: 104, name: "Contrato", href: Ruta + "/contrato", image: prestamo },
      {
        id: 105,
        name: "Entregar Contrato",
        href: Ruta + "/contrato/entrega",
        image: Contrato,
      },
    ],
  },
  {
    id: 2,
    name: "Salidas",
    image: deposito,
    subItems: [
      {
        id: 201,
        name: "Venta Directa",
        href: Ruta + "Venta/venta",
        image: Compras,
      },
    ],
  },
  {
    id: 3,
    name: "Inventario",
    image: producto,
    href: Ruta + "/inventario",
  },
  {
    id: 4,
    name: "Informe",
    image: eventos,
    subItems: [
      {
        id: 401,
        name: "Saldo Por Deposito",
        href: Ruta + "/deposito/vista",
        image: contrato,
      },
      {
        id: 402,
        name: "Saldo Por Contrato",
        href: Ruta + "/contrato/vista",
        image: prestamo,
      },
      {
        id: 403,
        name: "Detalle de Compras",
        href: Ruta + "/compra/vista",
        image: Reportes,
      }
    ],
  },

  {
    id: 5,
    name: "Registros",
    image: Reportes,
    subItems: [
      { id: 501, name: "Productos", href: Ruta + "/producto", image: cliente },
      { id: 502, name: "Clientes", href: Ruta + "/cliente", image: producto },
      {
        id: 503,
        name: "Registros de clientes",
        href: Ruta + "/cliente/Registros",
        image: Reportes,
      },
    ],
  },
  // resto de items...
];

// Diccionario de menú con rutas y submenus
export const menuItem = [
  { key: "inicio", icon: <HomeOutlined />, label: "Inicio", route: "/" },
  {
    key: "informe",
    icon: <FileTextOutlined />,
    label: "Informe",
    children: [
      {
        key: "SaldoDisponible",
        label: "Saldo Por Deposito",
        route: Ruta + "/deposito/vista",
      },
      {
        key: "SaldoContratoDisponible",
        label: "Saldo Por Contrato",
        route: Ruta + "/contrato/vista",
      },
      {
        key: "detalleCompras",
        label: "Detalle de Compras",
        route: Ruta + "/compra/vista",
      },
    ],
  },
  {
    key: "Entradas",
    icon: <ShoppingCartOutlined />,
    label: "Entradas",

    children: [
      {
        key: "compraDirecta",
        label: "Compra Directa",
        route: Ruta + "/compra",
      },
      {
        key: "compraDeposito",
        label: "Deposito",
        route: Ruta + "/deposito",
      },
      {
        key: "compraLiqDeposito",
        label: "Liquidacion de Deposito",
        route: Ruta + "/deposito/liqDeposito",
      },
      {
        key: "compraContrato",
        label: "Contrato",
        route: Ruta + "/contrato",
      },
      {
        key: "compraEntregaContrato",
        label: "Entrega Contrato",
        route: Ruta + "/contrato/entrega",
      },
    ],
  },
  {
    key: "Salidas",
    icon: <MinusCircleOutlined />,
    label: "Salidas",
    children: [
      {
        key: "venta-directa",
        label: "Venta Directa",
        route: Ruta + "Venta/venta",
      },
    ],
  },
  {
    key: "Registros",
    icon: <SettingOutlined />,
    label: "Registros",
    children: [
      { key: "cliente", label: "Cliente", route: Ruta + "/cliente" },
      { key: "producto", label: "Producto", route: Ruta + "/producto" },
      {
        key: "registroCliente",
        label: "Registros de Clientes",
        route: Ruta + "/cliente/Registros",
      },
    ],
  },
  // {
  //   key: "usuario",
  //   icon: <UserOutlined />,
  //   label: "Usuario",
  //   route: "/usuario",
  // },
  {
    key: "inventario",
    icon: <AppstoreOutlined />,
    label: "Inventario",
    route: Ruta + "/inventario",
  },
];
