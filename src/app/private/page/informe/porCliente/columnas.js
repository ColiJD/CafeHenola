import { Tag } from "antd";
import { formatNumber } from "@/components/Formulario";
import dayjs from "dayjs";

// ----- Helpers -----
const renderNumber = (v) => formatNumber(v, 2);
const renderMoney = (v) => "L. " + formatNumber(v, 2);
const renderDate = (v) => dayjs(v).format("DD/MM/YYYY");
const renderTag = (v) => <Tag color={v === "Sí" ? "green" : "red"}>{v}</Tag>;

export const columnasPorTipo = {
  Contrato: [
    { title: "ID", dataIndex: "contratoID", fixed: "left" },
    { title: "Producto", dataIndex: "producto" },
    { title: "Descripción", dataIndex: "descripcion", width: 120 },
    {
      title: "Cantidad Inicial",
      dataIndex: "cantidadContrato",
      align: "center",
      width: 120,
      render: renderNumber,
    },
    {
      title: "Total QQ",
      dataIndex: "totalQQ",
      align: "center",
      render: renderNumber,
    },
    {
      title: "Total Lps",
      dataIndex: "totalLps",
      align: "center",
      render: renderMoney,
    },
    {
      title: "Promedio Precio",
      dataIndex: "promedioPrecio",
      align: "center",
      render: renderMoney,
      width: 120,
    },
    {
      title: "Completado",
      dataIndex: "liquidado",
      align: "center",
      render: renderTag,
      width: 120,
    },
  ],
  Depósito: [
    { title: "Depósito ID", dataIndex: "depositoID" },
    { title: "Producto", dataIndex: "producto" },
    { title: "Fecha", dataIndex: "fecha", render: renderDate },
    {
      title: "Cantidad QQ",
      dataIndex: "cantidadQQ",
      align: "center",
      render: renderNumber,
    },
    {
      title: "Total QQ Liquidado",
      dataIndex: "totalQQLiquidado",
      align: "center",
      render: renderNumber,
    },
    {
      title: "Total Lps Liquidado",
      dataIndex: "totalLpsLiquidado",
      align: "center",
      render: renderMoney,
    },
    {
      title: "Promedio Precio",
      dataIndex: "promedioPrecio",
      align: "center",
      render: renderMoney,
    },
    {
      title: "Liquidado",
      dataIndex: "liquidado",
      align: "center",
      render: renderTag,
    },
  ],
  Compra: [
    { title: "ID", dataIndex: "compraId" },
    { title: "Fecha", dataIndex: "fecha", render: renderDate },
    { title: "Producto", dataIndex: "producto" },
    {
      title: "Cantidad QQ",
      dataIndex: "cantidadQQ",
      align: "center",
      render: renderNumber,
    },
    {
      title: "Precio QQ",
      dataIndex: "precioQQ",
      align: "center",
      render: renderMoney,
    },
    {
      title: "Total Lps",
      dataIndex: "totalLps",
      align: "center",
      render: renderMoney,
    },
  ],
};

// ----- Subtabla genérica para detalles internos -----
export const columnsDetalleInterno = [
  { title: "ID", dataIndex: "detalleID" },
  { title: "Fecha", dataIndex: "fecha", render: renderDate },
  {
    title: "Cantidad QQ",
    dataIndex: "cantidadQQ",
    align: "center",
    render: renderNumber,
  },
  {
    title: "Precio QQ",
    dataIndex: "precioQQ",
    align: "center",
    render: renderMoney,
  },
  {
    title: "Total Lps",
    dataIndex: "totalLps",
    align: "center",
    render: renderMoney,
  },
];

export const columns = [
  {
    title: "Tipo",
    dataIndex: "tipo",
    key: "tipo",
    render: (tipo) => <Tag color="green">{tipo}</Tag>,
  },
  {
    title: "Total QQ",
    dataIndex: "totalQQ",
    key: "totalQQ",
    align: "center",
    render: (v) => formatNumber(v, 2),
  },
  {
    title: "Total Lps",
    dataIndex: "totalLps",
    key: "totalLps",
    align: "center",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  {
    title: "Promedio Precio",
    dataIndex: "promedioPrecio",
    key: "promedioPrecio",
    align: "center",
    render: (v) => "L. " + formatNumber(v, 2),
  },
];

// 🔸 Columnas de préstamos
export const columnsPrestamos = [
  { title: "Préstamo ID", dataIndex: "prestamoId" },
  {
    title: "Fecha",
    dataIndex: "fecha",
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: "Monto",
    dataIndex: "monto",
    align: "center",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  {
    title: "Abonado",
    dataIndex: "abonado",
    align: "center",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  {
    title: "Restante",
    dataIndex: "total",
    align: "center",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  { title: "Tipo", dataIndex: "tipo" },
  {
    title: "Estado",
    dataIndex: "estado",
    render: (v) => (
      <Tag color={v === "PENDIENTE" ? "orange" : "green"}>{v}</Tag>
    ),
  },
];

export const prestamosMovi = [
  {
    title: "Fecha",
    dataIndex: "fecha",
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  { title: "Tipo Movimiento", dataIndex: "tipo" },
  {
    title: "Monto",
    dataIndex: "monto",
    align: "center",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  //   {
  //     title: "Interés",
  //     dataIndex: "interes",
  //     align: "center",
  //     render: (v) => "L. " + formatNumber(v, 2),
  //   },
  { title: "Descripción", dataIndex: "descripcion" },
];
