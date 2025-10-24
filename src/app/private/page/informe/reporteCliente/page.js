"use client";

import { useState, useMemo } from "react";
import { Table, Card, Typography, Divider } from "antd";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import dayjs from "dayjs";
import TarjetaMobile from "@/components/TarjetaMobile";
import Filtros from "@/components/Filtros";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import { generarReportePDF } from "@/Doc/Reportes/FormatoDoc";
import { formatNumber } from "@/components/Formulario";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import TablaTotales from "@/components/ReportesElement/TablaTotales";
import { columnasClientes } from "@/Doc/Reportes/EntradasPorCliente";
import ProtectedPage from "@/components/ProtectedPage";

const { Title, Text } = Typography;

export default function ReporteClientesEntradas() {
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
  } = useFetchReport("/api/reportes/reporteCliente", hoy);

  const datosFiltrados = useMemo(() => {
    return data.filter((item) =>
      !nombreFiltro
        ? true
        : item.nombre?.toLowerCase().includes(nombreFiltro.toLowerCase())
    );
  }, [data, nombreFiltro]);

  const estadisticas = useMemo(() => {
    if (!datosFiltrados.length) return null;

    return datosFiltrados.reduce(
      (acc, item) => {
        acc.totalClientes = datosFiltrados.length;
        const totalQQ =
          (parseFloat(item.compraCantidadQQ) || 0) +
          (parseFloat(item.contratoCantidadQQ) || 0) +
          (parseFloat(item.depositoCantidadQQ) || 0);

        const totalLps =
          (parseFloat(item.compraTotalLps) || 0) +
          (parseFloat(item.contratoTotalLps) || 0) +
          (parseFloat(item.depositoTotalLps) || 0);

        acc.totalQQ += totalQQ;
        acc.totalLps += totalLps;

        return acc;
      },
      { totalClientes: 0, totalQQ: 0, totalLps: 0 }
    );
  }, [datosFiltrados]);

  const columnasDesktop = [
    {
      title: "ID Cliente",
      dataIndex: "clienteID",
      width: 100,
      align: "center",
      fixed: "left",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Nombre Cliente",
      dataIndex: "nombre",
      width: 150,
      render: (text) => <Text style={{ color: "#1890ff" }}>{text}</Text>,
    },
    {
      title: "Compra",
      children: [
        {
          title: "QQ",
          dataIndex: "compraCantidadQQ",
          align: "right",
          render: (_, r) => (
            <Text type={r.compraCantidadQQ > 0 ? "success" : "secondary"}>
              {formatNumber(r.compraCantidadQQ)}
            </Text>
          ),
        },
        {
          title: "Total Lps",
          dataIndex: "compraTotalLps",
          align: "right",
          render: (_, r) => (
            <Text strong type={r.compraTotalLps > 0 ? "success" : "secondary"}>
              L. {formatNumber(r.compraTotalLps)}
            </Text>
          ),
        },
      ],
    },
    {
      title: "Contrato",
      children: [
        {
          title: "QQ",
          dataIndex: "contratoCantidadQQ",
          align: "right",
          render: (_, r) => (
            <Text type={r.contratoCantidadQQ > 0 ? "success" : "secondary"}>
              {formatNumber(r.contratoCantidadQQ)}
            </Text>
          ),
        },
        {
          title: "Total Lps",
          dataIndex: "contratoTotalLps",
          align: "right",
          render: (_, r) => (
            <Text
              strong
              type={r.contratoTotalLps > 0 ? "success" : "secondary"}
            >
              L. {formatNumber(r.contratoTotalLps)}
            </Text>
          ),
        },
      ],
    },
    {
      title: "Depósito",
      children: [
        {
          title: "QQ",
          dataIndex: "depositoCantidadQQ",
          align: "right",
          render: (_, r) => (
            <Text type={r.depositoCantidadQQ > 0 ? "success" : "secondary"}>
              {formatNumber(r.depositoCantidadQQ)}
            </Text>
          ),
        },
        {
          title: "Total Lps",
          dataIndex: "depositoTotalLps",
          align: "right",
          render: (_, r) => (
            <Text
              strong
              type={r.depositoTotalLps > 0 ? "success" : "secondary"}
            >
              L. {formatNumber(r.depositoTotalLps)}
            </Text>
          ),
        },
      ],
    },
  ];

  const columnasMobile = [
    { label: "ID Cliente", key: "clienteID" },
    { label: "Nombre", key: "nombre" },
    { label: "Compra QQ", key: "compraCantidadQQ" },
    { label: "Compra Lps", key: "compraTotalLps" },
    { label: "Contrato QQ", key: "contratoCantidadQQ" },
    { label: "Contrato Lps", key: "contratoTotalLps" },
    { label: "Depósito QQ", key: "depositoCantidadQQ" },
    { label: "Depósito Lps", key: "depositoTotalLps" },
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
        {/* Context Holder de message */}
        {contextHolder}

        {/* Header */}
        <Card>
          <SectionHeader
            isDesktop={isDesktop}
            loading={loading}
            icon={<CalendarOutlined />}
            titulo="Reporte de Entradas"
            subtitulo="Resumen de actividades por cliente"
            onRefresh={() => {
              if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
                fetchData(
                  rangoFechas[0].startOf("day").toISOString(),
                  rangoFechas[1].endOf("day").toISOString()
                );
              } else {
                fetchData();
              }
            }}
            onExportPDF={() =>
              generarReportePDF(
                datosFiltrados,
                {
                  fechaInicio: rangoFechas?.[0]?.toISOString(),
                  fechaFin: rangoFechas?.[1]?.toISOString(),
                  nombreFiltro,
                },
                columnasClientes,
                { title: "Reporte de Entradas" }
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
                    titulo: "Clientes",
                    valor: estadisticas.totalClientes,
                    icon: <UserOutlined style={{ color: "#1890ff" }} />,
                    color: "#1890ff",
                  },
                  {
                    titulo: "Total Quintales",
                    valor: estadisticas.totalQQ,
                    prefix: "QQ.",
                    color: "#52c41a",
                  },
                  {
                    titulo: "Total Lempiras",
                    valor: estadisticas.totalLps,
                    prefix: "L.",
                    color: "#1890ff",
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
              Detalle por Cliente ({datosFiltrados.length} registros)
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
              rowKey="clienteID"
              loading={loading}
              pagination={false}
              bordered
              scroll={{ x: "max-content" }}
              size="small"
              summary={() => (
                <TablaTotales
                  columns={columnasDesktop}
                  data={datosFiltrados}
                  offset={2} // columnas ID y Nombre no suman
                  formatNumber={formatNumber}
                />
              )}
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
