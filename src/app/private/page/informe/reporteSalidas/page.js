"use client";

import { useState, useMemo } from "react";
import { Table, Card, Typography, Divider } from "antd";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import dayjs from "dayjs";
import TarjetaMobile from "@/components/TarjetaMobile";
import Filtros from "@/components/Filtros";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import { formatNumber } from "@/components/Formulario";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import TablaTotales from "@/components/ReportesElement/TablaTotales";
import ProtectedPage from "@/components/ProtectedPage";
import { generarReportePDF } from "@/Doc/Reportes/FormatoDoc";

const { Title, Text } = Typography;

// ---------------------------
// Función universal para totales y promedio
// ---------------------------
export function calcularTotalesComprador(comprador = {}) {
  const totalQQ = parseFloat(comprador.compraCantidadQQ) || 0;
  const totalLps = parseFloat(comprador.compraTotalLps) || 0;
  const promedio = totalQQ > 0 ? totalLps / totalQQ : 0; // promedio ponderado
  return { totalQQ, totalLps, promedio };
}

// ---------------------------
// Componente principal
// ---------------------------
export default function ReporteCompradoresSalidas() {
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
  } = useFetchReport("/api/reportes/reporteSalidas", hoy);

  // ---------------------------
  // Filtrado y cálculo de totales por comprador
  // ---------------------------
  const datosFiltrados = useMemo(() => {
    return data
      .filter((item) =>
        !nombreFiltro
          ? true
          : item.nombre?.toLowerCase().includes(nombreFiltro.toLowerCase())
      )
      .map((item) => {
        const { totalQQ, totalLps, promedio } = calcularTotalesComprador(item);
        return { ...item, totalQQ, totalLps, promedio };
      });
  }, [data, nombreFiltro]);

  // ---------------------------
  // Totales generales
  // ---------------------------
  const estadisticas = useMemo(() => {
    if (!datosFiltrados.length) return null;

    const resultado = datosFiltrados.reduce(
      (acc, comprador) => {
        const { totalQQ, totalLps } = calcularTotalesComprador(comprador);
        acc.totalCompradores += 1;
        acc.totalQQ += totalQQ;
        acc.totalLps += totalLps;
        return acc;
      },
      { totalCompradores: 0, totalQQ: 0, totalLps: 0 }
    );

    // Promedio general ponderado
    resultado.promedioGeneral =
      resultado.totalQQ > 0 ? resultado.totalLps / resultado.totalQQ : 0;

    return resultado;
  }, [datosFiltrados]);

  // ---------------------------
  // Columnas configurables (reutilizable)
  // ---------------------------
  const columnasDesktop = [
    {
      title: "ID Comprador",
      dataIndex: "compradorId",
      width: 100,
      align: "center",
      fixed: "left",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Nombre Comprador",
      dataIndex: "nombre",
      width: 200,
      render: (text) => <Text style={{ color: "#1890ff" }}>{text}</Text>,
    },
    {
      title: "Salidas",
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
      title: "Totales",
      align: "center",
      children: [
        {
          title: "QQ",
          key: "totalQQ",
          dataIndex: "totalQQ",
          align: "right",
          render: (_, r) => (
            <Text strong type={r.totalQQ > 0 ? "success" : "secondary"}>
              {formatNumber(r.totalQQ)}
            </Text>
          ),
        },
        {
          title: "Lps",
          key: "totalLps",
          dataIndex: "totalLps",
          align: "right",
          render: (_, r) => (
            <Text strong type={r.totalLps > 0 ? "success" : "secondary"}>
              L. {formatNumber(r.totalLps)}
            </Text>
          ),
        },
        {
          title: "Promedio",
          key: "promedio",
          align: "right",
          dataIndex: "promedio",
          render: (_, r) => (
            <Text strong type={r.promedio > 0 ? "success" : "secondary"}>
              L. {formatNumber(r.promedio)}
            </Text>
          ),
        },
      ],
    },
  ];

  const columnasMobile = [
    { label: "ID Comprador", key: "compradorId" },
    { label: "Nombre", key: "nombre" },
    { label: "QQ", key: "compraCantidadQQ", render: (v) => formatNumber(v) },
    { label: "Lps", key: "compraTotalLps", render: (v) => formatNumber(v) },
    { label: "Promedio", key: "promedio", render: (v) => formatNumber(v) },
  ];

  const columnasPDF = [
    { header: "ID Comprador", key: "compradorId" },
    { header: "Nombre Comprador", key: "nombre" },
    {
      header: "QQ",
      key: "compraCantidadQQ",
      format: "numero",
      isCantidad: true,
    },
    {
      header: "Total Lps",
      key: "compraTotalLps",
      format: "moneda",
      isTotal: true,
    },
    { header: "Promedio", key: "promedio", format: "moneda" },
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
            icon={<CalendarOutlined />}
            titulo="Reporte de Salidas"
            subtitulo="Resumen de compras realizadas a compradores"
            onRefresh={() => {
              if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
                fetchData(
                  rangoFechas[0].startOf("day").toISOString(),
                  rangoFechas[1].endOf("day").toISOString()
                );
              } else fetchData();
            }}
            onExportPDF={() => {
              if (!datosFiltrados.length) {
                // Mensaje opcional
                message.warning("No hay datos para exportar");
                return;
              }
              generarReportePDF(
                datosFiltrados, // datos filtrados de la tabla
                {
                  fechaInicio: rangoFechas?.[0]?.toISOString(),
                  fechaFin: rangoFechas?.[1]?.toISOString(),
                  nombreFiltro,
                },
                columnasPDF,
                { title: "Reporte de Salidas" }
              );
            }}
            disableExport={!datosFiltrados.length}
          />
          <Divider />

          <Filtros
            fields={[
              {
                type: "input",
                placeholder: "Buscar por nombre de comprador",
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
                    titulo: "Compradores",
                    valor: formatNumber(estadisticas.totalCompradores),
                    icon: <UserOutlined style={{ color: "#1890ff" }} />,
                    color: "#1890ff",
                  },
                  {
                    titulo: "Total Quintales",
                    valor: formatNumber(estadisticas.totalQQ),
                    prefix: "QQ.",
                    color: "#52c41a",
                  },
                  {
                    titulo: "Total Lempiras",
                    valor: formatNumber(estadisticas.totalLps),
                    prefix: "L.",
                    color: "#1890ff",
                  },
                  {
                    titulo: "Promedio General",
                    valor: formatNumber(estadisticas.promedioGeneral),
                    prefix: "L.",
                    color: "#faad14",
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
              Detalle por Comprador ({datosFiltrados.length} registros)
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
              rowKey="compradorId"
              loading={loading}
              pagination={false}
              bordered
              scroll={{ x: "max-content" }}
              size="small"
              summary={() => (
                <TablaTotales
                  columns={columnasDesktop}
                  data={datosFiltrados}
                  offset={2} // ID y nombre no cuentan
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
