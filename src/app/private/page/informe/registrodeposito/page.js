"use client";

import { useState, useMemo } from "react";
import { Table, Card, Typography, Divider } from "antd";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import dayjs from "dayjs";
import TarjetaMobile from "@/components/TarjetaMobile";
import Filtros from "@/components/Filtros";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import { generarReporteDepositosPDF } from "@/Doc/Reportes/FormatoDepositoDoc"; // ✅ nuevo import
import { formatNumber } from "@/components/Formulario";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import ProtectedPage from "@/components/ProtectedPage";

const { Title, Text } = Typography;

export default function ReporteRegistroDeposito() {
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
  } = useFetchReport("/api/deposito/registrodeposito", hoy);

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
      }),
      {}
    );
  }, [datosFiltrados]);

  // Columnas para Desktop
  const columnasDesktop = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      width: 120,
      render: (f) => dayjs(f).format("DD/MM/YYYY"),
    },
    {
      title: "Cliente",
      dataIndex: "nombreCliente",
      width: 180,
      render: (text) => <Text style={{ color: "#1890ff" }}>{text}</Text>,
    },
    {
      title: "Tipo de Café",
      dataIndex: "tipoCafe",
      width: 150,
      render: (text) => text || "—",
    },
    {
      title: "Depósito QQ",
      dataIndex: "cantidadQQ",
      align: "right",
      render: (val) => <Text>{formatNumber(val)}</Text>,
    },
    {
      title: "Retención QQ",
      dataIndex: "retencionQQ",
      align: "right",
      render: (val) => <Text>{formatNumber(val)}</Text>,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      width: 250,
      render: (text) => text || "—",
    },
    // columna Opciones (solo si hay registros)
    ...(datosFiltrados.length > 0
      ? [
          {
            title: "Acciones",
            dataIndex: "opciones",
            align: "center",
            width: 120,
            render: () => (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    background: "#c3d8f5ff",
                    color: "#101010ff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>
                <button
                  style={{
                    background: "#f1989aff",
                    color: "#111111ff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Eliminar
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  // Columnas para móvil
  const columnasMobile = [
    { label: "Fecha", key: "fecha" },
    { label: "Cliente", key: "nombreCliente" },
    { label: "Tipo de Café", key: "tipoCafe" },
    { label: "QQ", key: "cantidadQQ" },
    { label: "Retención", key: "retencionQQ" },
    { label: "Descripción", key: "descripcion" },
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
            titulo="Reporte de Depósitos"
            subtitulo="Resumen de depósitos por cliente"
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
              generarReporteDepositosPDF( 
                datosFiltrados,
                {
                  fechaInicio: rangoFechas?.[0]?.toISOString(),
                  fechaFin: rangoFechas?.[1]?.toISOString(),
                  nombreFiltro,
                },
                { title: "Reporte de Depósitos" }
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

          {/* Estadísticas: Registros y Total QQ */}
          {estadisticas && (
            <>
              <Divider />
              <EstadisticasCards
                isDesktop={isDesktop}
                data={[
                  {
                    titulo: "Registros",
                    valor: estadisticas.totalRegistros,
                    icon: <UserOutlined style={{ color: "#1890ff" }} />,
                    color: "#1890ff",
                  },
                  {
                    titulo: "Total QQ",
                    valor: estadisticas.totalQQ,
                    color: "#fa8c16",
                  },
                ]}
              />
            </>
          )}
        </Card>

        {/* Tabla principal */}
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
              rowKey="id"
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
