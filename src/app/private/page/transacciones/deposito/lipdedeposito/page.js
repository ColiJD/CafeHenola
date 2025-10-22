"use client";

import { useState, useMemo } from "react";
import {
  Table,
  Card,
  Typography,
  Divider,
  Popconfirm,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  CalendarOutlined,
  UserOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { exportLiquidacionDeposito } from "@/Doc/Documentos/liqDepositp";
import Filtros from "@/components/Filtros";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import TarjetaMobile from "@/components/TarjetaMobile";
import ProtectedPage from "@/components/ProtectedPage";
import ProtectedButton from "@/components/ProtectedButton";

const { Title, Text } = Typography;

export default function ReporteLiquidacionDeposito() {
  const hoy = [dayjs().startOf("month"), dayjs().endOf("month")];
  const { mounted, isDesktop } = useClientAndDesktop();
  const [nombreFiltro, setNombreFiltro] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const { data, loading, rangoFechas, onFechasChange, fetchData } =
    useFetchReport("/api/liqDeposito/RedDeLiquidacion", hoy);

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
        totalQQ: (acc.totalQQ || 0) + (parseFloat(item.liqCatidadQQ) || 0),
        totalLps: (acc.totalLps || 0) + (parseFloat(item.liqTotalLps) || 0),
      }),
      {}
    );
  }, [datosFiltrados]);

  const columnasDesktop = [
    {
      title: "Liq ID",
      dataIndex: "liqID",
      width: 90,
      align: "center",
    },
    {
      title: "Fecha",
      dataIndex: "liqFecha",
      render: (f) => (f ? dayjs(f).format("DD/MM/YYYY") : "—"),
      width: 120,
    },
    {
      title: "Cliente ID",
      dataIndex: "liqclienteID",
      align: "center",
      width: 100,
    },
    {
      title: "Cliente",
      dataIndex: "nombreCliente",
      render: (text) => (
        <Text style={{ color: "#1890ff", fontWeight: 500 }}>{text}</Text>
      ),
      width: 180,
    },
    {
      title: "Tipo de Café",
      dataIndex: "tipoCafe",
      render: (text) => text || "—",
      width: 150,
    },
    {
      title: "Cantidad QQ",
      dataIndex: "liqCatidadQQ",
      align: "right",
      render: (val) => <Text>{Number(val || 0).toFixed(2)}</Text>,
      width: 120,
    },
    {
      title: "Precio (Lps)",
      dataIndex: "liqPrecio",
      align: "right",
      render: (val) => <Text>L. {Number(val || 0).toFixed(2)}</Text>,
      width: 130,
    },
    {
      title: "Total (Lps)",
      dataIndex: "liqTotalLps",
      align: "right",
      render: (val) => <Text>L. {Number(val || 0).toFixed(2)}</Text>,
      width: 130,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      align: "center",
      render: (estado) => {
        let color;
        switch (estado) {
          case "Pendiente":
            color = "#faad14";
            break;
          case "Liquidado":
            color = "#52c41a";
            break;
          default:
            color = "#000000";
        }
        return <Text style={{ color }}>{estado}</Text>;
      },
      width: 120,
    },
    {
      title: "Descripción",
      dataIndex: "liqDescripcion",
      render: (text) => text || "—",
      width: 250,
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "center",
      width: 150,
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* 🟦 Botón PDF */}
          <Popconfirm
            title="¿Exportar comprobante de liquidación?"
            onConfirm={async () => {
              messageApi.open({
                type: "loading",
                content: "Generando comprobante PDF...",
                duration: 0,
                key: "generandoPDF",
              });
              try {
                await exportLiquidacionDeposito({
                  cliente: { label: record.nombreCliente },
                  tipoCafe: record.tipoCafe,
                  cantidadLiquidar: parseFloat(record.liqCatidadQQ),
                  totalPagar: parseFloat(record.liqTotalLps),
                  descripcion: record.liqDescripcion,
                  comprobanteID: record.liqID,
                });
                messageApi.destroy("generandoPDF");
                messageApi.success("Comprobante generado correctamente");
              } catch (err) {
                console.error("Error PDF:", err);
                messageApi.destroy("generandoPDF");
                messageApi.error("Error generando comprobante PDF");
              }
            }}
            okText="Sí"
            cancelText="No"
          >
            <Button
              size="small"
              type="primary"
              shape="circle"
              icon={<FilePdfOutlined style={{ fontSize: 16 }} />}
              style={{
                backgroundColor: "#1E5BAA",
                border: "none",
              }}
            />
          </Popconfirm>

          {/* 🔴 Botón eliminar */}
          <ProtectedButton allowedRoles={["ADMIN", "GERENCIA"]}>
            <Popconfirm
              title="¿Eliminar esta liquidación?"
              onConfirm={async () => {
                try {
                  const res = await fetch(`/api/liqDeposito/${record.liqID}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();
                  if (res.ok) {
                    messageApi.success("Liquidación eliminada correctamente");
                    await fetchData();
                  } else {
                    messageApi.error(data.error || "Error al eliminar");
                  }
                } catch {
                  messageApi.error("Error de conexión al eliminar");
                }
              }}
              okText="Sí"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                shape="circle"
                icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                style={{
                  backgroundColor: "#6A0000",
                  border: "none",
                }}
              />
            </Popconfirm>
          </ProtectedButton>
        </div>
      ),
    },
  ];

  const columnasMobile = [
    { label: "Liq ID", key: "liqID" },
    { label: "Fecha", key: "liqFecha" },
    { label: "Cliente", key: "nombreCliente" },
    { label: "Tipo de Café", key: "tipoCafe" },
    { label: "Cantidad QQ", key: "liqCatidadQQ" },
    { label: "Precio (Lps)", key: "liqPrecio" },
    { label: "Total (Lps)", key: "liqTotalLps" },
    { label: "Estado", key: "estado" },
    { label: "Descripción", key: "liqDescripcion" },
  ];

  if (!mounted) return null;

  return (
    <ProtectedPage allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}>
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
            titulo="Reporte de Liquidación de Depósitos"
            subtitulo="Resumen de liquidaciones por cliente"
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
              exportLiquidacionDeposito(
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
                    icon: <UserOutlined style={{ color: "#1890ff" }} />,
                    color: "#1890ff",
                  },
                  {
                    titulo: "Total QQ",
                    valor: estadisticas.totalQQ.toFixed(2),
                    color: "#fa8c16",
                  },
                  {
                    titulo: "Total Lps",
                    valor: estadisticas.totalLps.toFixed(2),
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
              rowKey="liqID"
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
