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
    { title: "Contrato ID", dataIndex: "contratoID", fixed: "left" },
    { title: "Producto", dataIndex: "producto" },
    { title: "Descripción", dataIndex: "descripcion" },
    {
      title: "Cantidad Contrato",
      dataIndex: "cantidadContrato",
      align: "right",
      render: renderNumber,
    },
    {
      title: "Total QQ",
      dataIndex: "totalQQ",
      align: "right",
      render: renderNumber,
    },
    {
      title: "Total Lps",
      dataIndex: "totalLps",
      align: "right",
      render: renderMoney,
    },
    {
      title: "Promedio Precio",
      dataIndex: "promedioPrecio",
      align: "right",
      render: renderMoney,
    },
    {
      title: "Completado",
      dataIndex: "liquidado",
      align: "center",
      render: renderTag,
    },
  ],
  Depósito: [
    { title: "Depósito ID", dataIndex: "depositoID" },
    { title: "Producto", dataIndex: "producto" },
    { title: "Fecha", dataIndex: "fecha", render: renderDate },
    {
      title: "Cantidad QQ",
      dataIndex: "cantidadQQ",
      align: "right",
      render: renderNumber,
    },
    {
      title: "Total QQ Liquidado",
      dataIndex: "totalQQLiquidado",
      align: "right",
      render: renderNumber,
    },
    {
      title: "Total Lps Liquidado",
      dataIndex: "totalLpsLiquidado",
      align: "right",
      render: renderMoney,
    },
    {
      title: "Promedio Precio",
      dataIndex: "promedioPrecio",
      align: "right",
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
      align: "right",
      render: renderNumber,
    },
    {
      title: "Precio QQ",
      dataIndex: "precioQQ",
      align: "right",
      render: renderMoney,
    },
    {
      title: "Total Lps",
      dataIndex: "totalLps",
      align: "right",
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
    align: "right",
    render: renderNumber,
  },
  {
    title: "Precio QQ",
    dataIndex: "precioQQ",
    align: "right",
    render: renderMoney,
  },
  {
    title: "Total Lps",
    dataIndex: "totalLps",
    align: "right",
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
    align: "right",
    render: (v) => formatNumber(v, 2),
  },
  {
    title: "Total Lps",
    dataIndex: "totalLps",
    key: "totalLps",
    align: "right",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  {
    title: "Promedio Precio",
    dataIndex: "promedioPrecio",
    key: "promedioPrecio",
    align: "right",
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
    align: "right",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  {
    title: "Abonado",
    dataIndex: "abonado",
    align: "right",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  {
    title: "Restante",
    dataIndex: "total",
    align: "right",
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
    align: "right",
    render: (v) => "L. " + formatNumber(v, 2),
  },
  //   {
  //     title: "Interés",
  //     dataIndex: "interes",
  //     align: "right",
  //     render: (v) => "L. " + formatNumber(v, 2),
  //   },
  { title: "Descripción", dataIndex: "descripcion" },
];
