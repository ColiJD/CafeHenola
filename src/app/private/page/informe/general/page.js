"use client";

import { useMemo } from "react";
import { Table, Card, Divider, Typography, message } from "antd";
import dayjs from "dayjs";
import { formatNumber } from "@/components/Formulario";
import { FileFilled } from "@ant-design/icons";
import useClientAndDesktop from "@/hook/useClientAndDesktop";

import Filtros from "@/components/Filtros";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import { useFetchReport } from "@/hook/useFetchReport";
import { exportPDFGeneral } from "@/Doc/Reportes/General";
import TarjetaMobile from "@/components/TarjetaMobile";

const { Title, Text } = Typography;

export default function ResumenMovimientos() {
  const hoy = [dayjs().startOf("day"), dayjs().endOf("day")];
  const {
    data,
    loading,
    rangoFechas,
    onFechasChange,
    contextHolder,
    messageApi,
    fetchData,
  } = useFetchReport("/api/reportes", hoy);

  const { mounted, isDesktop } = useClientAndDesktop();

  // 🔹 Normalizamos la data en formato tabla
  const datosTabla = useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "entradas",
        tipo: "Entradas",
        compraQQ: data?.compras?.entradas?._sum?.compraCantidadQQ ?? 0,
        compraLps: data?.compras?.entradas?._sum?.compraTotal ?? 0,
        depositoQQ: data?.depositos?.entradas?._sum?.cantidadQQ ?? 0,
        depositoLps: data?.depositos?.entradas?._sum?.totalLps ?? 0,
        contratoQQ: data?.contratos?.entradas?._sum?.cantidadQQ ?? 0,
        contratoLps: data?.contratos?.entradas?._sum?.precioQQ ?? 0,
      },
      {
        key: "salidas",
        tipo: "Salidas (Venta)",
        compraQQ: data?.compras?.salidas?._sum?.compraCantidadQQ ?? 0,
        compraLps: data?.compras?.salidas?._sum?.compraTotal ?? 0,
        depositoQQ: data?.depositos?.salidas?._sum?.cantidadQQ ?? 0,
        depositoLps: data?.depositos?.salidas?._sum?.totalLps ?? 0,
        contratoQQ: data?.contratos?.salidas?._sum?.cantidadQQ ?? 0,
        contratoLps: data?.contratos?.salidas?._sum?.precioQQ ?? 0,
      },
    ];
  }, [data]);

  // 🔹 Columnas de la tabla con subcolumnas
  const columnas = [
    {
      title: "",
      dataIndex: "tipo",
      key: "tipo",
      fixed: "left",
    },
    {
      title: "Compra / Venta",
      children: [
        {
          title: "QQ",
          dataIndex: "compraQQ",
          key: "compraQQ",
          align: "right",
          render: (v) => formatNumber(v),
        },
        {
          title: "Lps",
          dataIndex: "compraLps",
          key: "compraLps",
          align: "right",
          render: (v) => `L. ${formatNumber(v)}`,
        },
      ],
    },
    {
      title: "Depósito",
      children: [
        {
          title: "QQ",
          dataIndex: "depositoQQ",
          key: "depositoQQ",
          align: "right",
          render: (v) => formatNumber(v),
        },
        {
          title: "Lps",
          dataIndex: "depositoLps",
          key: "depositoLps",
          align: "right",
          render: (v) => `L. ${formatNumber(v)}`,
        },
      ],
    },
    {
      title: "Contrato",
      children: [
        {
          title: "QQ",
          dataIndex: "contratoQQ",
          key: "contratoQQ",
          align: "right",
          render: (v) => formatNumber(v),
        },
        {
          title: "Lps",
          dataIndex: "contratoLps",
          key: "contratoLps",
          align: "right",
          render: (v) => `L. ${formatNumber(v)}`,
        },
      ],
    },
  ];

  const columnasMobile = [
    // Compra / Venta
    {
      label: "Tipo",
      key: "compraLps",

      render: (v, row) => {
        const prefix = row.key === "salidas" ? "Venta QQ" : "Compra QQ";
        return `${prefix}: ${formatNumber(row.compraQQ)} / L. ${formatNumber(
          row.compraLps
        )}`;
      },
    },

    // Depósito
    {
      label: "Depósito QQ",
      key: "depositoQQ",

      render: (v) => formatNumber(v),
    },
    {
      label: "Depósito Lps",
      key: "depositoLps",

      render: (v) => `L. ${formatNumber(v)}`,
    },

    // Contrato
    {
      label: "Contrato QQ",
      key: "contratoQQ",

      render: (v) => formatNumber(v),
    },
    {
      label: "Contrato Lps",
      key: "contratoLps",

      render: (v) => `L. ${formatNumber(v)}`,
    },
  ];

  const hayDatos = datosTabla.some(
    (row) =>
      row.compraQQ > 0 ||
      row.compraLps > 0 ||
      row.contratoQQ > 0 ||
      row.contratoLps > 0 ||
      row.depositoQQ > 0 ||
      row.depositoLps > 0
  );

  if (!mounted) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
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
          icon={<FileFilled />}
          titulo="Totales Generales"
          subtitulo="Totales generales de entradas y salidas"
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
          onExportPDF={async () => {
            if (!hayDatos) {
              messageApi.warning(
                "No hay datos válidos para generar el reporte."
              );
              return;
            }

            const key = "generandoPDF";
            messageApi.open({
              key,
              type: "loading",
              content: "Generando reporte...",
              duration: 0,
            });

            try {
              await exportPDFGeneral(
                datosTabla,
                {
                  fechaInicio: rangoFechas?.[0]?.toISOString(),
                  fechaFin: rangoFechas?.[1]?.toISOString(),
                },
                columnas,
                { title: "Reporte de Entradas y Salidas" }
              );
              messageApi.success({
                content: "Reporte generado correctamente",
                key,
                duration: 2,
              });
            } catch (error) {
              messageApi.error({
                content: "Error al generar el reporte",
                key,
                duration: 2,
              });
            }
          }}
          disableExport={!hayDatos}
        />

        <Divider />

        <Filtros
          fields={[
            {
              type: "date",
              value: rangoFechas,
              setter: onFechasChange,
              placeholder: "Rango de fechas",
            },
          ]}
        />
      </Card>

      <Card style={{ borderRadius: 6, marginTop: 16 }}>
        <div style={{ marginBottom: isDesktop ? 16 : 12 }}>
          <Title level={4} style={{ margin: 0, fontSize: isDesktop ? 16 : 14 }}>
            Resumen General
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
            columns={columnas}
            dataSource={datosTabla}
            rowKey="key"
            loading={loading}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: "max-content" }}
            onRow={(record) => {
              const backgroundColor =
                record.key === "entradas"
                  ? "#e6f7ff"
                  : record.key === "salidas"
                  ? "#fff1f0"
                  : "transparent";

              return { style: { backgroundColor } };
            }}
          />
        ) : (
          <TarjetaMobile
            data={datosTabla}
            columns={columnasMobile}
            loading={loading}
          />
        )}
      </Card>
    </div>
  );
}
