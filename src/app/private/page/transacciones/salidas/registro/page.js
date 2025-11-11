"use client";

import { useState, useMemo, useRef } from "react";
import {
  Table,
  Card,
  Typography,
  Divider,
  message,
  Popconfirm,
  Button,
} from "antd";
import dayjs from "dayjs";
import TarjetaMobile from "@/components/TarjetaMobile";
import Filtros from "@/components/Filtros";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import {
  CalendarOutlined,
  UserOutlined,
  DeleteFilled,
  FilePdfOutlined,
} from "@ant-design/icons";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import ProtectedPage from "@/components/ProtectedPage";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import { exportarPDF } from "../exportarPDF";
import { columnas } from "../columnas";
import { formatNumber } from "@/components/Formulario";
import ProtectedButton from "@/components/ProtectedButton";
import { PDFComprobante } from "@/Doc/Documentos/generico";

const { Title, Text } = Typography;

export default function ReporteRegistroSalida() {
  const hoy = [dayjs().startOf("day"), dayjs().endOf("day")];

  const { mounted, isDesktop } = useClientAndDesktop();
  const [messageApi, contextHolder] = message.useMessage();

  const [nombreFiltro, setNombreFiltro] = useState("");

  const { data, loading, rangoFechas, onFechasChange, fetchData } =
    useFetchReport("/api/salidas", hoy);

  const datosFiltrados = useMemo(() => {
    const lista = Array.isArray(data) ? data : [];

    const totalQQ = lista.reduce(
      (acc, s) => acc + Number(s.salidaCantidadQQ || 0),
      0
    );

    const totalLps = lista.reduce(
      (acc, s) =>
        acc + Number(s.salidaCantidadQQ || 0) * Number(s.salidaPrecio || 0),
      0
    );

    const promedioPonderado = totalQQ > 0 ? totalLps / totalQQ : 0;

    return lista
      .filter((item) =>
        nombreFiltro
          ? item.compradores?.compradorNombre
              ?.toLowerCase()
              .includes(nombreFiltro.toLowerCase())
          : true
      )
      .map((item) => ({
        ...item,
        totalLps:
          Number(item.salidaCantidadQQ || 0) * Number(item.salidaPrecio || 0),

        promedioPonderado: promedioPonderado,
      }));
  }, [data, nombreFiltro]);

  const estadisticas = useMemo(() => {
    if (!datosFiltrados.length) return null;

    const totalQQ = datosFiltrados.reduce(
      (acc, s) => acc + Number(s.salidaCantidadQQ || 0),
      0
    );

    const totalLps = datosFiltrados.reduce(
      (acc, s) =>
        acc + Number(s.salidaCantidadQQ || 0) * Number(s.salidaPrecio || 0),
      0
    );

    const promedioPonderado = totalQQ > 0 ? totalLps / totalQQ : 0;

    return {
      totalRegistros: datosFiltrados.length,
      totalQQ,
      totalLps,
      promedioPonderado,
    };
  }, [datosFiltrados]);

  const columnasDesktop = [
    { title: "Salida ID", fixed: "left", dataIndex: "salidaID", width: 80 },
    {
      title: "Fecha",
      dataIndex: "salidaFecha",
      width: 120,

      render: (f) => dayjs(f).format("DD/MM/YYYY"),
    },
    {
      title: "Comprador",
      dataIndex: ["compradores", "compradorNombre"],
      width: 180,
      fixed: "left",
      render: (text) => <Text style={{ color: "#1890ff" }}>{text}</Text>,
    },
    {
      title: "QQ",
      dataIndex: "salidaCantidadQQ",
      width: 120,
      render: (val) => formatNumber(val),
    },
    {
      title: "Precio",
      dataIndex: "salidaPrecio",
      width: 120,
      render: (val) => formatNumber(val),
    },
    {
      title: "Total Lps",
      dataIndex: "totalLps",
      width: 120,
      render: (val) => formatNumber(val),
    },
    {
      title: "Promedio",
      dataIndex: "promedioPonderado",
      width: 140,
      render: (val) => formatNumber(val),
    },
    {
      title: "Descripción",
      dataIndex: "salidaDescripcion",
      width: 200,
      render: (text) => text || "—",
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      align: "center",
      width: 160,
      render: (text, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Popconfirm
            title="¿Seguro que deseas EXPORTAR este registro?"
            onConfirm={async () => {
              try {
                messageApi.open({
                  type: "loading",
                  content: "Generando comprobante, por favor espere...",
                  duration: 0,
                  key: "generandoComprobante",
                });

                // Datos a exportar
                await PDFComprobante({
                  tipoComprobante: "COMPROBANTE DE SALIDA",
                  cliente: record.compradores?.compradorNombre || "Cliente",
                  productos: [
                    {
                      nombre: "Café Seco", // siempre Café Seco
                      cantidad: parseFloat(record.salidaCantidadQQ),
                      precio: parseFloat(record.salidaPrecio),
                      total:
                        parseFloat(record.salidaCantidadQQ) *
                        parseFloat(record.salidaPrecio),
                    },
                  ],
                  total:
                    parseFloat(record.salidaCantidadQQ) *
                    parseFloat(record.salidaPrecio),
                  observaciones: record.salidaDescripcion,
                  comprobanteID: record.salidaID,
                  columnas: [
                    { title: "Producto", key: "nombre" },
                    { title: "Cantidad (QQ)", key: "cantidad" },
                    { title: "Precio (LPS)", key: "precio" },
                    { title: "Total (LPS)", key: "total" },
                  ],
                });

                messageApi.destroy("generandoComprobante");
                messageApi.success("Comprobante generado correctamente");
              } catch (err) {
                console.error("Error generando comprobante:", err);
                messageApi.destroy("generandoComprobante");
                messageApi.error("Error generando comprobante PDF");
              }
            }}
            okText="Sí"
            cancelText="No"
          >
            <Button size="small" type="primary" icon={<FilePdfOutlined />} />
          </Popconfirm>

          <ProtectedButton allowedRoles={["ADMIN", "GERENCIA"]}>
            <Popconfirm
              title="¿Seguro que deseas eliminar este contrato?"
              onConfirm={() =>
                eliminarRecurso({
                  direccion: `/api/salidas/${record.salidaID}`,
                  mensajeExito: "Registro anulado correctamente",
                  mensajeError: "Error al anular el registro",
                  messageApi,
                  onRefresh: async () => {
                    if (rangoFechas?.[0] && rangoFechas?.[1]) {
                      await fetchData(
                        rangoFechas[0].startOf("day").toISOString(),
                        rangoFechas[1].endOf("day").toISOString()
                      );
                    } else {
                      await fetchData();
                    }
                  },
                })
              }
              okText="Sí"
              cancelText="No"
            >
              <Button size="small" danger icon={<DeleteFilled />} />
            </Popconfirm>
          </ProtectedButton>
        </div>
      ),
    },
  ];

  // utils/fetchActions.js

  const columnasMobile = [
    { label: "Salida ID", key: "salidaID" },
    {
      label: "Fecha",
      key: "salidaFecha",
      render: (val) => dayjs(val).format("DD/MM/YYYY"),
    },
    { label: "Comprador", key: "compradores.compradorNombre" },
    { label: "Movimiento", key: "salidaMovimiento" },
    {
      label: "Cantidad QQ",
      key: "salidaCantidadQQ",
      render: (val) => formatNumber(val),
    },
    {
      label: "Precio",
      key: "salidaPrecio",
      render: (val) => formatNumber(val),
    },
    { label: "Total Lps", key: "totalLps", render: (val) => formatNumber(val) },
    {
      label: "Promedio Ponderado",
      key: "promedioPonderado",
      render: (val) => formatNumber(val),
    },
    { label: "Descripción", key: "salidaDescripcion" },
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
            titulo="Registro de Deposito de Salida"
            subtitulo="Registros de salidas por comprador"
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
              exportarPDF(
                datosFiltrados,
                columnas,
                {
                  fechaInicio: rangoFechas?.[0]?.toISOString(),
                  fechaFin: rangoFechas?.[1]?.toISOString(),
                  nombreFiltro,
                },
                "Reporte de Salidas"
              )
            }
          />

          <Divider />

          <Filtros
            fields={[
              {
                type: "input",
                placeholder: "Buscar por comprador",
                value: nombreFiltro,
                setter: setNombreFiltro,
                allowClear: true,
              },
              {
                type: "date",
                value: rangoFechas,
                setter: onFechasChange,
                placeholder: "Seleccionar rango",
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
                    valor: estadisticas.totalQQ,
                    color: "#fa8c16",
                  },
                  {
                    titulo: "Total Lps",
                    valor: estadisticas.totalLps.toLocaleString("es-HN", {
                      minimumFractionDigits: 2,
                    }),
                    color: "#52c41a",
                  },
                  {
                    titulo: "Promedio Ponderado",
                    valor: (estadisticas.promedioPonderado || 0).toLocaleString(
                      "es-HN",
                      { minimumFractionDigits: 2 }
                    ),
                    color: "#722ed1",
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
              Detalle de Salidas ({datosFiltrados.length} registros)
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
              rowKey="salidaID"
              loading={loading}
              pagination={false}
              bordered
              scroll={{ x: 900 }}
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
// utils/fetchActions.js
export const eliminarRecurso = async ({
  direccion,
  mensajeExito,
  mensajeError,
  onRefresh,
  messageApi,
}) => {
  try {
    const res = await fetch(direccion, {
      method: "DELETE",
    });
    const data = await res.json();

    if (res.ok) {
      if (messageApi && mensajeExito) messageApi.success(mensajeExito);

      // Recargar datos si se pasa la función
      if (onRefresh) await onRefresh();

      return { ok: true, data };
    } else {
      if (messageApi && mensajeError)
        messageApi.error(data.error || mensajeError);
      return { ok: false, error: data.error || mensajeError };
    }
  } catch (error) {
    console.error(error);
    if (messageApi && mensajeError) messageApi.error(mensajeError);
    return { ok: false, error };
  }
};
