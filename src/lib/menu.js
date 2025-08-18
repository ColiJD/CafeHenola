import eventos from "@/img/eventos.png";
import producto from "@/img/cliente.png";
import cliente from "@/img/product.png";
import compra from "@/img/deposito.png";
import money from "@/img/money.png";
import prestamo from "@/img/co.png";
// import contrato from "@/img/co.png";
import deposito from "@/img/contrato.png";
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
export const menuItems = [
  {
    id: 1,
    name: "Compra",
    image: compra, // imagen importada
    link: Ruta + "compra", // ruta relativa
  },

  {
    id: 5,
    name: "ventas",
    image: money,
    link: Ruta + "deposito",
  },
  {
    id: 6,
    name: "Inventario",
    image: deposito,
    link: Ruta + "liqDeposito",
  },
  {
    id: 7,
    name: "Informe",
    image: eventos,
    link: Ruta + "contrato",
  },
  {
    id: 8,
    name: "Prestamo",
    image: prestamo,
    link: Ruta + "contrato/entrega",
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
