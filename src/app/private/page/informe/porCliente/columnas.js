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
    {
      title: "Fecha",
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
      dataIndex: "fecha",
      render: renderDate,
    },
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
      filters: [
        { text: "Sí", value: "Sí" },
        { text: "No", value: "No" },
      ],
      onFilter: (value, record) => record.liquidado === value,
    },
  ],
  Depósito: [
    { title: "Depósito ID", dataIndex: "depositoID" },
    {
      title: "Fecha",
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
      dataIndex: "fecha",
      render: renderDate,
    },
    { title: "Producto", dataIndex: "producto" },

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
      width: 120,
      filters: [
        { text: "Sí", value: "Sí" },
        { text: "No", value: "No" },
      ],
      onFilter: (value, record) => record.liquidado === value,
    },
  ],
  Compra: [
    { title: "ID", dataIndex: "compraId" },
    {
      title: "Fecha",
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
      dataIndex: "fecha",
      render: renderDate,
    },
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
  {
    title: "Fecha",
    sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
    dataIndex: "fecha",
    render: renderDate,
  },
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
  {
    title: "ID",
    render: (r) => r.prestamoId || r.anticipoId || "-",
  },

  {
    title: "Fecha",
    dataIndex: "fecha",
    sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
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
  {
    title: "Tipo Movimiento",
    dataIndex: "tipo",
    filters: [
      { text: "PRÉSTAMO", value: "PRESTAMO" },
      { text: "ANTICIPO", value: "ANTICIPO" },
    ],
    onFilter: (value, record) => record.tipo === value,
  },

  {
    title: "Estado",
    dataIndex: "estado",
    filters: [
      { text: "PENDIENTE", value: "PENDIENTE" },
      { text: "COMPLETADO", value: "COMPLETADO" },
    ],
    onFilter: (value, record) => record.estado === value,
    render: (v) => (
      <Tag color={v === "PENDIENTE" ? "orange" : "green"}>{v}</Tag>
    ),
  },
];

export const getPrestamosMoviColumns = (tipoRegistro) => {
  let filtros = [];

  if (tipoRegistro === "PRESTAMO") {
    filtros = [
      { text: "PRÉSTAMO", value: "PRÉSTAMO" },
      { text: "ABONO", value: "ABONO" },
      { text: "Int-Cargo", value: "Int-Cargo" },
      { text: "PAGO_INTERES", value: "PAGO_INTERES" },
    ];
  } else if (tipoRegistro === "ANTICIPO") {
    filtros = [
      { text: "ANTICIPO", value: "ANTICIPO" },
      { text: "ABONO_ANTICIPO", value: "ABONO_ANTICIPO" },
      { text: "INTERES_ANTICIPO", value: "INTERES_ANTICIPO" },
      { text: "CARGO_ANTICIPO", value: "CARGO_ANTICIPO" },
    ];
  }

  return [
    {
      title: "Fecha",
      dataIndex: "fecha",
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Tipo Movimiento",
      dataIndex: "tipo",
      filters: filtros,
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: "Monto",
      dataIndex: "monto",
      align: "center",
      render: (v) => "L. " + formatNumber(v, 2),
      sorter: (a, b) => a.monto - b.monto,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion", // solo mostrar, sin filtros ni cambios
    },
  ];
};
