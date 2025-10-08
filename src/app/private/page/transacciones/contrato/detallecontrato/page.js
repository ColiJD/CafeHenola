"use client";

import { useState, useMemo } from "react";
import { Table, Card, Typography, Divider } from "antd";
import dayjs from "dayjs";
import { FileTextOutlined } from "@ant-design/icons";
import Filtros from "@/components/Filtros";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import TarjetaMobile from "@/components/TarjetaMobile";
import ProtectedPage from "@/components/ProtectedPage"
import { generarReporteDetalleContrato } from "@/Doc/Reportes/FormatoDetalleContratoDoc";

const { Title, Text } = Typography;

export default function Reportedetallecontrato() {
  const hoy = [dayjs().startOf("day"), dayjs().endOf("day")];
  const { mounted, isDesktop } = useClientAndDesktop();
  const [nombreFiltro, setNombreFiltro] = useState("");

  const {
  data,
  loading,
  rangoFechas,
  onFechasChange,
  contextHolder,
  fetchData,
} = useFetchReport("/api/contratos/detallecontrato", hoy);

  const datosFiltrados = useMemo(() => {
    const lista = Array.isArray(data?.detalles) ? data.detalles : [];
    return lista.filter((item) =>
      !nombreFiltro
        ? true
        : item.nombreCliente
            ?.toLowerCase()
            .includes(nombreFiltro.toLowerCase())
    );
  }, [data, nombreFiltro]);

  const estadisticas = useMemo(() => {
    if (!datosFiltrados.length) return null;
    return datosFiltrados.reduce(
      (acc, item) => ({
        totalRegistros: datosFiltrados.length,
        totalQQ: (acc.totalQQ || 0) + (parseFloat(item.cantidadQQ) || 0),
        totalLps: (acc.totalLps || 0) + (parseFloat(item.totalLps) || 0),
      }),
      {}
    );
  }, [datosFiltrados]);

  // columnas desktop
  const columnasDesktop = [
    { title: "Detalle ID", dataIndex: "detalleID", width: 90, align: "center" },
    { title: "Contrato ID", dataIndex: "contratoID", width: 90, align: "center" },
    {
      title: "Fecha",
      dataIndex: "fecha",
      render: (f) => dayjs(f).format("DD/MM/YYYY"),
      width: 120,
    },
    {
      title: "Cliente",
      dataIndex: "nombreCliente",
      width: 200,
      render: (text) => <Text style={{ color: "#1890ff" }}>{text}</Text>,
    },
    { title: "Tipo de Café", dataIndex: "tipoCafe", width: 150 },
    {
      title: "Cantidad QQ",
      dataIndex: "cantidadQQ",
      align: "right",
      render: (v) => <Text>{v.toFixed(2)}</Text>,
    },
    {
      title: "Precio QQ (Lps)",
      dataIndex: "precioQQ",
      align: "right",
      render: (v) => <Text>L. {v.toFixed(2)}</Text>,
    },
    {
      title: "Total (Lps)",
      dataIndex: "totalLps",
      align: "right",
      render: (v) => <Text>L. {v.toFixed(2)}</Text>,
    },
    { title: "Movimiento", dataIndex: "tipoMovimiento", align: "center" },
    { title: "Observaciones", dataIndex: "observaciones", width: 250 },
  ];

  // columnas mobile
  const columnasMobile = [
    { label: "Detalle ID", key: "detalleID" },
    { label: "Contrato ID", key: "contratoID" },
    { label: "Fecha", key: "fecha" },
    { label: "Cliente", key: "nombreCliente" },
    { label: "Tipo Café", key: "tipoCafe" },
    { label: "Cantidad QQ", key: "cantidadQQ" },
    { label: "Precio QQ", key: "precioQQ" },
    { label: "Total Lps", key: "totalLps" },
    { label: "Movimiento", key: "tipoMovimiento" },
  ];

  if (!mounted) return null;

  return (
    <ProtectedPage
      allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}
    >
      <div
        style={{
          padding: isDesktop ? "24px" : "12px",
          background: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {contextHolder}

        <Card>
          <SectionHeader
            isDesktop={isDesktop}
            loading={loading}
            icon={<FileTextOutlined />}
            titulo="Reporte de Detalle Contrato"
            subtitulo="Movimientos detallados de contratos"
            onRefresh={() => {
              if (rangoFechas?.[0] && rangoFechas?.[1]) {
                fetchData(
                  rangoFechas[0].startOf("day").toISOString(),
                  rangoFechas[1].endOf("day").toISOString()
                );
              } else {
                fetchData();
              }
            }}
            onExportPDF={() =>
              generarReporteDetalleContrato(
                datosFiltrados,
                {
                  fechaInicio: rangoFechas?.[0]?.toISOString(),
                  fechaFin: rangoFechas?.[1]?.toISOString(),
                  nombreFiltro,
                },
                {
                  totalRegistros: estadisticas?.totalRegistros || 0,
                  totalQQ: estadisticas?.totalQQ || 0,
                  totalLps: estadisticas?.totalLps || 0,
                }
              )
            }
            disableExport={!datosFiltrados.length}
          />

          <Divider />

          <Filtros
            fields={[
              {
                type: "input",
                placeholder: "Buscar por nombre de cliente",
                value: nombreFiltro,
                setter: setNombreFiltro,
                allowClear: true,
              },
              {
                type: "date",
                value: rangoFechas,
                setter: onFechasChange,
                placeholder: "Seleccionar rango de fechas",
              },
            ]}
          />

          {estadisticas && (
            <>
              <Divider />
              <EstadisticasCards
                isDesktop={isDesktop}
                data={[
                  {
                    titulo: "Registros",
                    valor: estadisticas.totalRegistros,
                    color: "#1890ff",
                  },
                  {
                    titulo: "Total QQ",
                    valor: estadisticas.totalQQ,
                    color: "#fa8c16",
                  },
                  {
                    titulo: "Total Lps",
                    valor: estadisticas.totalLps,
                    color: "#52c41a",
                  },
                ]}
              />
            </>
          )}
        </Card>

        <Card style={{ borderRadius: 6 }}>
          <div style={{ marginBottom: isDesktop ? 16 : 12 }}>
            <Title
              level={4}
              style={{ margin: 0, fontSize: isDesktop ? 16 : 14 }}
            >
              Detalle por Movimiento ({datosFiltrados.length} registros)
            </Title>
            <Text type="secondary" style={{ fontSize: isDesktop ? 14 : 12 }}>
              {rangoFechas?.[0] &&
                rangoFechas?.[1] &&
                `Período: ${rangoFechas[0].format(
                  "DD/MM/YYYY"
                )} - ${rangoFechas[1].format("DD/MM/YYYY")}`}
            </Text>
          </div>

          {isDesktop ? (
            <Table
              columns={columnasDesktop}
              dataSource={datosFiltrados}
              rowKey="detalleID"
              loading={loading}
              pagination={false}
              bordered
              scroll={{ x: "max-content" }}
              size="small"
            />
          ) : (
            <TarjetaMobile
              data={datosFiltrados}
              columns={columnasMobile}
              loading={loading}
            />
          )}
        </Card>
      </div>
    </ProtectedPage>
  );
}
