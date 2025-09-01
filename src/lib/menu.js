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
  DollarOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const Ruta = "/page/";
// 📂 lib/menu.js

export const menuItems = [
  {
    id: 1,
    name: "Compra",
    image: Compras,
    subItems: [
      {
        id: 101,
        name: "Nueva Compra",
        href: Ruta + "/compra/",
        image: Compras,
      },
      { id: 102, name: "Deposito", href: Ruta + "/deposito", image: Depo },
      {
        id: 103,
        name: "Liquidar Deposito",
        href: Ruta + "/liqDeposito",
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
    name: "Ventas",
    image: deposito,
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
    ],
  },
  {
    key: "compras",
    icon: <ShoppingCartOutlined />,
    label: "Compra",

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
        route: Ruta + "/liqDeposito",
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
    key: "venta",
    icon: <DollarOutlined />,
    label: "Venta",
    children: [
      { key: "venta-nueva", label: "Nueva Venta", route: "/venta/nueva" },
      { key: "venta-historial", label: "Historial", route: "/venta/historial" },
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
