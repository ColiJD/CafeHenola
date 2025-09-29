"use client";
import { useEffect, useState } from "react";
import { Table, Row, Col, message, Button, Grid } from "antd";
import TarjetasDeTotales from "@/components/DetallesCard";
import { truncarDosDecimalesSinRedondear } from "@/lib/calculoCafe";
import Filtros from "@/components/Filtros";
import TarjetaMobile from "@/components/TarjetaMobile";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import useClientAndDesktop from "@/hook/useClientAndDesktop";

// 🔹 Plugins necesarios para filtros de fechas
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// 🔹 NUEVO: filtro genérico
import { FiltrosTarjetas } from "@/lib/FiltrosTarjetas";

export default function TablaResumenContrato() {
  const { mounted, isDesktop } = useClientAndDesktop();
  const isMobile = mounted && !isDesktop;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Pendiente");
  // 🔹 Inicializamos rangoFecha con el día de hoy
  const [rangoFecha, setRangoFecha] = useState([dayjs(), dayjs()]);

  // 🔹 Cargar datos de la API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contratos/vista");
      if (!res.ok) throw new Error("Error al cargar los datos");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error(error);
      message.error("No se pudieron cargar los resúmenes de contratos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 🔹 Agrupar por cliente, contrato y café
  const agruparDatos = (items) => {
    const mapa = {};
    items.forEach((item) => {
      const key = `${item.clienteID}-${item.contratoID}-${item.tipoCafe}`;
      if (!mapa[key]) {
        mapa[key] = {
          ...item,
          resumenID: key,
          detalles: [],
          totalEntregadoLps: 0,
          totalEntregadoQQ: 0,
          totalContratoLps: parseFloat(item.totalContratoLps || 0),
        };
      }

      // Agregar detalle
      mapa[key].detalles.push({
        detalleID: item.detalleID,
        fechaDetalle: item.fechaDetalle,
        cantidadDetalleQQ: item.cantidadDetalleQQ,
        precioDetalleQQ: item.precioDetalleQQ,
        totalDetalleLps: item.totalDetalleLps,
      });

      // Sumar totales
      mapa[key].totalEntregadoLps += parseFloat(item.totalDetalleLps || 0);
      mapa[key].totalEntregadoQQ += parseFloat(item.cantidadDetalleQQ || 0);
    });
    return Object.values(mapa);
  };

  // 🔹 Aplicar filtros genéricos
  useEffect(() => {
    const filtros = {
      clienteNombreCompleto: nombreFiltro,
      tipoCafe: tipoCafeFiltro,
      contratoEstado: estadoFiltro,
    };

    const filtrados = FiltrosTarjetas(
      data,
      filtros,
      rangoFecha,
      "fechaDetalle", // campo de fecha dentro de los detalles
      "detalles" // propiedad que contiene los detalles
    ).map((item) => ({
      ...item,
      detalles: item.detalles || [], // ✅ fuerza que nunca sea null
    }));

    setFilteredData(agruparDatos(filtrados));
  }, [data, nombreFiltro, tipoCafeFiltro, estadoFiltro, rangoFecha]);

  // 🔹 Totales
  const totalQQ =
    estadoFiltro === "Pendiente"
      ? filteredData.reduce(
          (acc, item) => acc + (item.cantidadContratoQQ || 0),
          0
        )
      : filteredData.reduce(
          (acc, item) => acc + (item.totalEntregadoQQ || 0),
          0
        );

  const totalSaldo =
    estadoFiltro === "Pendiente"
      ? filteredData.reduce((acc, item) => acc + (item.saldoRestanteQQ || 0), 0)
      : filteredData.reduce(
          (acc, item) => acc + (item.totalEntregadoLps || 0),
          0
        );

  const totalEntregado =
    estadoFiltro === "Pendiente"
      ? filteredData.reduce(
          (acc, item) => acc + (item.totalEntregadoLps || 0),
          0
        )
      : 0;

  // 🔹 Columnas para desktop
  const columns = [
    { title: "Cliente", dataIndex: "clienteNombreCompleto", key: "cliente" },
    { title: "Contrato", dataIndex: "contratoID", key: "contrato" },
    { title: "Café", dataIndex: "tipoCafe", key: "tipoCafe" },
    ...(estadoFiltro === "Pendiente"
      ? [
          {
            title: "Cant. QQ",
            dataIndex: "cantidadContratoQQ",
            key: "cantidadContratoQQ",
            render: truncarDosDecimalesSinRedondear,
          },

          {
            title: "Total Lps",
            dataIndex: "totalContratoLps",
            key: "totalContratoLps",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Entregado Lps",
            dataIndex: "totalEntregadoLps",
            key: "totalEntregadoLps",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Saldo QQ",
            dataIndex: "saldoRestanteQQ",
            key: "saldoRestanteQQ",
            render: (v) => (
              <span style={{ color: v > 0 ? "red" : "green", fontWeight: 600 }}>
                {truncarDosDecimalesSinRedondear(v)}
              </span>
            ),
          },
        ]
      : [
          {
            title: "T. Entregado QQ",
            dataIndex: "totalEntregadoQQ",
            key: "totalEntregadoQQ",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "T. Entregado Lps",
            dataIndex: "totalEntregadoLps",
            key: "totalEntregadoLps",
            render: truncarDosDecimalesSinRedondear,
          },
        ]),
  ];

  // 🔹 Columnas detalle para desktop
  const detalleColumns = [
    {
      title: "Detalle ID",
      dataIndex: "detalleID",
      key: "detalleID",
      width: 80,
    },
    {
      title: "Fecha",
      dataIndex: "fechaDetalle",
      key: "fechaDetalle",
      render: (val) => new Date(val).toLocaleDateString("es-HN"),
    },
    ...(estadoFiltro === "Pendiente"
      ? [
          {
            title: "Cantidad (QQ)",
            dataIndex: "cantidadDetalleQQ",
            key: "cantidadDetalleQQ",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Precio QQ",
            dataIndex: "precioDetalleQQ",
            key: "precioDetalleQQ",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Total (Lps)",
            dataIndex: "totalDetalleLps",
            key: "totalDetalleLps",
            render: truncarDosDecimalesSinRedondear,
          },
        ]
      : [
          {
            title: "Cantidad (QQ)",
            dataIndex: "cantidadDetalleQQ",
            key: "cantidadDetalleQQ",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Precio QQ",
            dataIndex: "precioDetalleQQ",
            key: "precioDetalleQQ",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Total (Lps)",
            dataIndex: "totalDetalleLps",
            key: "totalDetalleLps",
            render: truncarDosDecimalesSinRedondear,
          },
        ]),
  ];

  return (
    <div>En Desarrollo</div>
    // <div>
    //   {/* Tarjetas de totales */}
    //   <TarjetasDeTotales
    //     title="Registro de Contrato"
    //     cards={[
    //       {
    //         title:
    //           estadoFiltro === "Pendiente" ? "Total (QQ)" : "Liquidado (QQ)",
    //         value: truncarDosDecimalesSinRedondear(totalQQ),
    //       },
    //       {
    //         title:
    //           estadoFiltro === "Pendiente"
    //             ? "Saldo Pendiente (QQ)"
    //             : "Total (Lps)",
    //         value: truncarDosDecimalesSinRedondear(totalSaldo),
    //       },
    //       // 🔹 Solo mostrar “Total Entregado” cuando es Pendiente
    //       ...(estadoFiltro === "Pendiente"
    //         ? [
    //             {
    //               title: "Total Entregado Lps",
    //               value: truncarDosDecimalesSinRedondear(totalEntregado),
    //             },
    //           ]
    //         : []),
    //     ]}
    //   />

    //   {/* Filtros */}
    //   <Filtros
    //     fields={[
    //       {
    //         type: "input",
    //         placeholder: "Buscar por nombre",
    //         value: nombreFiltro,
    //         setter: setNombreFiltro,
    //       },
    //       {
    //         type: "select",
    //         placeholder: "Tipo de café",
    //         value: tipoCafeFiltro || undefined,
    //         setter: setTipoCafeFiltro,
    //         allowClear: true,
    //         options: [...new Set(data.map((d) => d.tipoCafe))].map((cafe) => ({
    //           value: cafe,
    //           label: cafe,
    //         })),
    //       },
    //       {
    //         type: "select",
    //         value: estadoFiltro,
    //         setter: setEstadoFiltro,
    //         options: [
    //           { value: "Pendiente", label: "Pendiente" },
    //           { value: "Liquidado", label: "Liquidado" },
    //         ],
    //       },
    //       { type: "date", value: rangoFecha, setter: setRangoFecha },
    //     ]}
    //   />

    //   <Row style={{ marginBottom: 16 }}>
    //     <Col xs={24} sm={6} md={4}>
    //       <Button onClick={cargarDatos} block>
    //         Refrescar
    //       </Button>
    //     </Col>
    //   </Row>

    //   {/* Tabla o tarjetas según dispositivo */}
    //   {isMobile ? (
    //     <TarjetaMobile
    //       loading={loading}
    //       data={filteredData.map((item) => ({
    //         ...item,
    //         detalles: item.detalles || [],
    //       }))}
    //       columns={[
    //         { label: "Cliente", key: "clienteNombreCompleto" },
    //         { label: "Contrato", key: "contratoID" },
    //         { label: "Tipo Café", key: "tipoCafe" },
    //         {
    //           label: "Cantidad Contrato (QQ)",
    //           key: "cantidadContratoQQ",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //         {
    //           label: "Precio QQ",
    //           key: "precioQQ",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //         {
    //           label: "Total Contratado (Lps)",
    //           key: "totalContratoLps",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //         {
    //           label: "Total Entregado (Lps)",
    //           key: "totalEntregadoLps",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //         {
    //           label: "Saldo Restante (QQ)",
    //           key: "saldoRestanteQQ",
    //           render: truncarDosDecimalesSinRedondear,
    //           color: (val) => (val > 0 ? "red" : "green"),
    //         },
    //         { label: "Estado", key: "contratoEstado" },
    //       ]}
    //       detailsKey="detalles"
    //       detailsColumns={[
    //         { label: "Detalle ID", key: "detalleID" },
    //         {
    //           label: "Fecha",
    //           key: "fechaDetalle",
    //           render: (val) => new Date(val).toLocaleDateString("es-HN"),
    //         },
    //         {
    //           label: "Cantidad (QQ)",
    //           key: "cantidadDetalleQQ",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //         {
    //           label: "Precio QQ",
    //           key: "precioDetalleQQ",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //         {
    //           label: "Total (Lps)",
    //           key: "totalDetalleLps",
    //           render: truncarDosDecimalesSinRedondear,
    //         },
    //       ]}
    //     />
    //   ) : (
    //     <Table
    //       columns={columns}
    //       dataSource={filteredData}
    //       rowKey="resumenID"
    //       loading={loading}
    //       bordered
    //       expandable={{
    //         expandedRowRender: (record) => (
    //           <Table
    //             columns={detalleColumns}
    //             dataSource={record.detalles}
    //             rowKey="detalleID"
    //             pagination={false}
    //             size="small"
    //             bordered
    //             scroll={{ x: "max-content" }}
    //           />
    //         ),
    //       }}
    //     />
    //   )}
    // </div>
  );
}
