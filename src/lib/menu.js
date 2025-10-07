import eventos from "@/img/eventos.png";
import producto from "@/img/cliente.png";
import cliente from "@/img/product.png";
import deposito from "@/img/deposito.png";
import { LogoutOutlined } from "@ant-design/icons";
import { signOut } from "next-auth/react";

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

const RutaTransaccion = "/private/page/transacciones";
const Ruta = "/private/page";
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
        href: RutaTransaccion + "/compra/",
        image: Compras,
      },
      {
        id: 102,
        name: "Deposito",
        href: RutaTransaccion + "/deposito",
        image: Depo,
      },
      {
        id: 103,
        name: "Liquidar Deposito",
        href: RutaTransaccion + "/deposito/liqDeposito",
        image: LiqDepo,
      },
      {
        id: 104,
        name: "Contrato",
        href: RutaTransaccion + "/contrato",
        image: prestamo,
      },
      {
        id: 105,
        name: "Entregar Contrato",
        href: RutaTransaccion + "/contrato/entrega",
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
        href: RutaTransaccion + "/Venta/venta",
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
        id: 400,
        name: "General",
        href: Ruta + "/informe/general",
        image: deposito,
      },
      {
        id: 401,
        name: "Saldo Por Deposito",
        href: RutaTransaccion + "/deposito/vista",
        image: contrato,
      },
      {
        id: 402,
        name: "Saldo Por Contrato",
        href: RutaTransaccion + "/contrato/vista",
        image: prestamo,
      },
      {
        id: 403,
        name: "Detalle de Compras",
        href: RutaTransaccion + "/compra/vista",
        image: Reportes,
      },
      {
      id: 404,
      name: "Registro Depósitos",
      href: Ruta + "/informe/registrodeposito",
      image: deposito,
      },
      {
      id: 405,
      name: "Registro Contratos",
      href: RutaTransaccion + "/contrato/registrocontrato",
      image: deposito,
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
        key: "InformeGeneral",
        label: "General",
        route: Ruta + "/informe/general",
      },
      {
        key: "PorCLiente",
        label: "Reporte de Entrada ",
        route: Ruta + "/informe/reporteCliente",
      },
      {
        key: "Deposito",
        label: "Saldo Por Deposito",
        route: RutaTransaccion + "/deposito/vista",
      },
      {
        key: "Contrato",
        label: "Saldo Por Contrato",
        route: RutaTransaccion + "/contrato/vista",
      },
      {
        key: "DetalleCompra",
        label: "Detalle de Compras",
        route: RutaTransaccion + "/compra/vista",
      },
      {
       key: "registrodeposito",
       label: "Registro de Depósitos",
       route: Ruta + "/informe/registrodeposito",
      },
      {
      key: "registrocontrato",
      label: "Registro de Contratos",
     route: RutaTransaccion + "/contrato/registrocontrato",
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
        route: RutaTransaccion + "/compra",
      },
      {
        key: "compraDeposito",
        label: "Deposito",
        route: RutaTransaccion + "/deposito",
      },
      {
        key: "compraLiqDeposito",
        label: "Liquidacion de Deposito",
        route: RutaTransaccion + "/deposito/liqDeposito",
      },
      {
        key: "compraContrato",
        label: "Contrato",
        route: RutaTransaccion + "/contrato",
      },
      {
        key: "compraEntregaContrato",
        label: "Entrega Contrato",
        route: RutaTransaccion + "/contrato/entrega",
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
        route: RutaTransaccion + "/Venta/venta",
      },
    ],
  },
  {
    key: "Registros",
    icon: <SettingOutlined />,
    label: "Registros",
    children: [
      {
        key: "cliente",
        label: "Registro de Cliente",
        route: Ruta + "/cliente",
      },
      {
        key: "Comprador",
        label: "Registro de Comprador",
        route: Ruta + "/compradores",
      },

      {
        key: "producto",
        label: "Registro de Producto",
        route: Ruta + "/producto",
      },

      {
        key: "Registrar Usuario",
        label: "Registro de Usuario",
        route: Ruta + "/user",
      },
    ],
  },
  {
    key: "Listado",
    icon: <UserOutlined />,
    label: "Listado",
    children: [
      {
        key: "registroCliente",
        label: "Historial de Cliente",
        route: Ruta + "/cliente/Registros",
      },
    ],
  },
  {
    key: "inventario",
    icon: <AppstoreOutlined />,
    label: "Inventario",
    route: Ruta + "/inventario",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Cerrar Sesion",
    onClick: () => signOut({ callbackUrl: "/login" }),
  },
];
