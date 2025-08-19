import eventos from "@/img/eventos.png";
import producto from "@/img/cliente.png";
import cliente from "@/img/product.png";
import deposito from "@/img/deposito.png";
import money from "@/img/money.png";
import prestamo from "@/img/co.png";
// import contrato from "@/img/co.png";
import contrato from "@/img/contrato.png";
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
    image: money,
    subItems: [
      { id: 101, name: "Nueva Compra", href: Ruta + "/compra/", image: money },
      { id: 102, name: "Deposito", href: Ruta + "/deposito", image: deposito },
      {
        id: 103,
        name: "Liquidar Deposito",
        href: Ruta + "/liqDeposito",
        image: deposito,
      },
      { id: 104, name: "Contrato", href: Ruta + "/contrato", image: contrato },
      {
        id: 105,
        name: "Entregar Contrato",
        href: Ruta + "/contrato/entrega",
        image: contrato,
      },
    ],
  },
  {
    id: 2,
    name: "Ventas",
    image: deposito,
    subItems: [
      { id: 201, name: "Nueva Venta", href: "/ventas/nueva", image: deposito },
      { id: 202, name: "Reporte", href: "/ventas/reporte", image: deposito },
    ],
  },
  {
    id: 3,
    name: "Inventario",
    image: producto,
    subItems: [
      { id: 201, name: "Nueva Venta", href: "/ventas/nueva", image: deposito },
      { id: 202, name: "Reporte", href: "/ventas/reporte", image: deposito },
    ],
  },
  {
    id: 4,
    name: "Informe",
    image: eventos,
    subItems: [
      { id: 201, name: "Nueva Venta", href: "/ventas/nueva", image: deposito },
      { id: 202, name: "Reporte", href: "/ventas/reporte", image: deposito },
    ],
  },

  {
    id: 5,
    name: "Configuración",
    image: money,
    subItems: [
      { id: 501, name: "Productos", href: Ruta + "/producto", image: deposito },
      { id: 502, name: "Clientes", href: Ruta + "/cliente", image: deposito },
    ],
  },
  // resto de items...
];

// Diccionario de menú con rutas y submenus
export const menuItem = [
  { key: "inicio", icon: <HomeOutlined />, label: "Inicio", route: "/" },
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
    key: "configuracion",
    icon: <SettingOutlined />,
    label: "Configuración",
    children: [
      { key: "cliente", label: "Cliente", route: Ruta + "/cliente" },
      { key: "producto", label: "Producto", route: Ruta + "/producto" },
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
    route: "/inventario",
  },
  {
    key: "informe",
    icon: <FileTextOutlined />,
    label: "Informe",
    route: "/informe",
  },
];
