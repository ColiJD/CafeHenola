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
import { exportPDFGeneralConPrestamos } from "@/Doc/Reportes/General";
import ProtectedPage from "@/components/ProtectedPage";

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

  // 🔹 Normalizar y calcular totales
  const datosTabla = useMemo(() => {
    if (!data) return [];

    const filas = [
      {
        key: "entradas",
        tipo: "Entradas",
        compraQQ: Number(data?.compras?.entradas?._sum?.compraCantidadQQ ?? 0),
        compraLps: Number(data?.compras?.entradas?._sum?.compraTotal ?? 0),
        depositoQQ: Number(data?.depositos?.entradas?._sum?.cantidadQQ ?? 0),
        depositoLps: Number(data?.depositos?.entradas?._sum?.totalLps ?? 0),
        contratoQQ: Number(data?.contratos?.entradas?.cantidadQQ ?? 0),
        contratoLps: Number(data?.contratos?.entradas?.total ?? 0),
      },
      {
        key: "salidas",
        tipo: "Salidas",
        compraQQ: Number(data?.compras?.salidas?._sum?.compraCantidadQQ ?? 0),
        compraLps: Number(data?.compras?.salidas?._sum?.compraTotal ?? 0),
        depositoQQ: 0,
        depositoLps: 0,
        contratoQQ: Number(data?.salidas?.cantidadQQ ?? 0),
        contratoLps: Number(data?.salidas?.total ?? 0),
      },
    ];

    return filas.map((row) => {
      const totalQQ = row.compraQQ + row.depositoQQ + row.contratoQQ;
      const totalLps = row.compraLps + row.depositoLps + row.contratoLps;
      const promedio = totalQQ > 0 ? totalLps / totalQQ : 0;
      return { ...row, totalQQ, totalLps, promedio };
    });
  }, [data]);

  // 🔹 Columnas de la tabla
  const columnas = [
    { title: "", dataIndex: "tipo", key: "tipo", fixed: "left" },
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
    {
      title: "Totales",
      children: [
        {
          title: "QQ Total",
          dataIndex: "totalQQ",
          key: "totalQQ",
          align: "right",
          render: (v) => formatNumber(v),
        },
        {
          title: "Total Lps",
          dataIndex: "totalLps",
          key: "totalLps",
          align: "right",
          render: (v) => `L. ${formatNumber(v)}`,
        },
        {
          title: "Promedio",
          dataIndex: "promedio",
          key: "promedio",
          align: "right",
          render: (v) => `L. ${formatNumber(v)}`,
        },
      ],
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

  // 🔹 Normalizar y calcular totales de préstamos
  // 🔹 Normalizar y calcular totales de préstamos
  const datosPrestamosYAnticipos = useMemo(() => {
    const filas = [];

    // 🔹 Préstamos
    if (data?.prestamos) {
      const movimientos = data.prestamos.movimientos || {};

      const filaPrestamos = {
        key: "prestamos",
        tipo: "Préstamos Activos",
        totalPrestamos: Number(data.prestamos.totalPrestamosActivos ?? 0),
        abono: Number(movimientos.ABONO ?? 0),
        pagoInteres: Number(movimientos.PAGO_INTERES ?? 0),
        intCargo: Number(movimientos["Int-Cargo"] ?? 0),
      };

      const totalCreditos =
        filaPrestamos.totalPrestamos + filaPrestamos.intCargo;
      const totalAbonos = filaPrestamos.abono + filaPrestamos.pagoInteres;
      const saldo = totalCreditos - totalAbonos;

      filas.push({
        ...filaPrestamos,
        totalCreditos,
        totalAbonos,
        saldo,
      });
    }

    // 🔹 Anticipos
    if (data?.anticipos) {
      const movimientos = data.anticipos.movimientos || {};

      const filaAnticipos = {
        key: "anticipos",
        tipo: "Anticipos Activos",
        totalPrestamos: Number(data.anticipos.totalAnticiposActivos ?? 0),
        abono: Number(movimientos.ABONO_ANTICIPO ?? 0), // se mantiene como pagoInteres
        pagoInteres: Number(movimientos.INTERES_ANTICIPO ?? 0),
        intCargo: Number(movimientos.CARGO_ANTICIPO ?? 0), // ahora mapeado igual que intCargo
      };

      const totalCreditos =
        filaAnticipos.totalPrestamos + filaAnticipos.intCargo;
      const totalAbonos = filaAnticipos.abono + filaAnticipos.pagoInteres;
      const saldo = totalCreditos - totalAbonos;

      filas.push({
        ...filaAnticipos,
        totalCreditos,
        totalAbonos,
        saldo,
      });
    }

    return filas;
  }, [data]);

  // 🔹 Columnas de la tabla de préstamos
  const columnasPrestamos = [
    { title: "", dataIndex: "tipo", key: "tipo", fixed: "left" },
    {
      title: "Monto Inicial",
      dataIndex: "totalPrestamos",
      key: "totalPrestamos",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
    {
      title: "Abono",
      dataIndex: "abono",
      key: "abono",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
    {
      title: "Pago de interes",
      dataIndex: "pagoInteres",
      key: "pagoInteres",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
    {
      title: "Cargar Interes",
      dataIndex: "intCargo",
      key: "intCargo",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
    {
      title: "Total Créditos",
      dataIndex: "totalCreditos",
      key: "totalCreditos",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
    {
      title: "Total Abonos",
      dataIndex: "totalAbonos",
      key: "totalAbonos",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
    {
      title: "Saldo",
      dataIndex: "saldo",
      key: "saldo",
      align: "right",
      render: (v) => `L. ${formatNumber(v)}`,
    },
  ];

  const flattenColumns = (cols, parentTitle = "") => {
    return cols.flatMap((col) => {
      if (col.children) {
        return flattenColumns(
          col.children,
          parentTitle ? `${parentTitle} ${col.title}` : col.title
        );
      }
      return {
        header: parentTitle ? `${parentTitle} ${col.title}` : col.title,
        key: col.dataIndex || col.key,
        format: col.format, // toma directamente el valor definido en la columna
        isCantidad: [
          "compraQQ",
          "depositoQQ",
          "contratoQQ",
          "totalQQ",
        ].includes(col.dataIndex),
        isTotal: [
          "compraLps",
          "depositoLps",
          "contratoLps",
          "totalLps",
          "promedio",
        ].includes(col.dataIndex),
      };
    });
  };

  if (!mounted) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <ProtectedPage
      allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}
    >
      <div
        style={{
          padding: isDesktop ? 24 : 12,
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
            onRefresh={() =>
              fetchData(
                rangoFechas?.[0]?.startOf("day").toISOString(),
                rangoFechas?.[1]?.endOf("day").toISOString()
              )
            }
            onExportPDF={() => {
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
                exportPDFGeneralConPrestamos(
                  [...datosTabla, ...datosPrestamosYAnticipos],
                  { fechaInicio: rangoFechas?.[0], fechaFin: rangoFechas?.[1] },
                  { title: "Reporte Completo" }
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
            <Title
              level={4}
              style={{ margin: 0, fontSize: isDesktop ? 16 : 14 }}
            >
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

          <Table
            columns={columnas}
            dataSource={datosTabla}
            rowKey="key"
            loading={loading}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              style: {
                backgroundColor:
                  record.key === "entradas" ? "#e6f7ff" : "#fff1f0",
              },
            })}
          />
        </Card>

        <Card style={{ borderRadius: 6, marginTop: 16 }}>
          <div style={{ marginBottom: isDesktop ? 16 : 12 }}>
            <Title
              level={4}
              style={{ margin: 0, fontSize: isDesktop ? 16 : 14 }}
            >
              Resumen de Préstamos y Anticipos
            </Title>
           
          </div>

          <Table
            columns={columnasPrestamos}
            dataSource={datosPrestamosYAnticipos}
            rowKey="key"
            loading={loading}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              style: { backgroundColor: "#fffbe6" },
            })}
          />
        </Card>
      </div>
    </ProtectedPage>
  );
}
