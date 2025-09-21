"use client";
import { useEffect, useState } from "react";
import { Table, message, Card, Button } from "antd";
import dayjs from "dayjs";
import TarjetaMobile from "@/components/TarjetaMobile";
import { formatNumber } from "@/components/Formulario";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import Filtros from "@/components/Filtros";
import TarjetasDeTotales from "@/components/DetallesCard";
import { ReloadOutlined } from "@ant-design/icons";
import { exportPDFGeneral } from "@/Doc/Reportes/General";

export default function ResumenMovimientos() {
  const hoy = dayjs().startOf("day"); // 🔹 Día actual
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangoFechas, setRangoFechas] = useState([hoy, hoy]);

  const { mounted, isDesktop } = useClientAndDesktop();

  // 🔹 Función para cargar datos desde la API
  async function fetchData(desde, hasta) {
    try {
      setLoading(true);
      let url = "/api/reportes";

      if (desde && hasta) {
        url += `?desde=${desde}&hasta=${hasta}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error en la API");

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      message.error("⚠️ Error cargando datos.");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Cargar datos del día actual por defecto
  useEffect(() => {
    const desde = hoy.startOf("day").toDate().toISOString();
    const hasta = hoy.endOf("day").toDate().toISOString();
    fetchData(desde, hasta);
  }, []);

  // 🔹 Manejar cambio de fechas
  const onFechasChange = (val) => {
    setRangoFechas(val);
    if (!val || !val[0] || !val[1]) {
      // si el usuario borra → traer mes actual
      fetchData();
      return;
    }
    const desde = val[0].startOf("day").toDate().toISOString();
    const hasta = val[1].endOf("day").toDate().toISOString();
    fetchData(desde, hasta);
  };

  // 🔹 preparar datos
  const formatearData = (entradas, salidas, keys) => [
    {
      key: "entrada",
      movimiento: "📥 Entrada",
      cantidad: formatNumber(entradas?._sum?.[keys.cantidad] || 0),
      total: formatNumber(entradas?._sum?.[keys.total] || 0),
    },
    {
      key: "salida",
      movimiento: "📤 Salida",
      cantidad: formatNumber(salidas?._sum?.[keys.cantidad] || 0),
      total: formatNumber(salidas?._sum?.[keys.total] || 0),
    },
  ];

  // 🔹 Datos específicos por sección
  const comprasData = data
    ? formatearData(data.compras.entradas, data.compras.salidas, {
        cantidad: "compraCantidadQQ",
        total: "compraTotal",
      })
    : [];

  const contratosData = data
    ? formatearData(data.contratos.entradas, data.contratos.salidas, {
        cantidad: "totalEntregadoQQ",
        total: "totalLps",
      })
    : [];

  const depositosData = data
    ? formatearData(data.depositos.entradas, data.depositos.salidas, {
        cantidad: "cantidadQQ",
        total: "totalLps",
      })
    : [];

  // 📌 Totales globales sumando compras + contratos + depósitos
  const totales = data
    ? {
        entradas: {
          cantidad:
            (Number(data.compras.entradas._sum.compraCantidadQQ) || 0) +
            (Number(data.contratos.entradas._sum.totalEntregadoQQ) || 0) +
            (Number(data.depositos.entradas._sum.cantidadQQ) || 0),
          total:
            (Number(data.compras.entradas._sum.compraTotal) || 0) +
            (Number(data.contratos.entradas._sum.totalLps) || 0) +
            (Number(data.depositos.entradas._sum.totalLps) || 0),
        },
        salidas: {
          cantidad:
            (Number(data.compras.salidas._sum.compraCantidadQQ) || 0) +
            (Number(data.contratos.salidas._sum.totalEntregadoQQ) || 0) +
            (Number(data.depositos.salidas._sum.cantidadQQ) || 0),
          total:
            (Number(data.compras.salidas._sum.compraTotal) || 0) +
            (Number(data.contratos.salidas._sum.totalLps) || 0) +
            (Number(data.depositos.salidas._sum.totalLps) || 0),
        },
      }
    : {
        entradas: { cantidad: 0, total: 0 },
        salidas: { cantidad: 0, total: 0 },
      };

  // 🔹 columnas para tarjetas móviles
  const columnasTarjetas = [
    { label: "Movimiento", key: "movimiento" },
    { label: "Cantidad QQ", key: "cantidad" },
    { label: "Total Lps", key: "total" },
  ];

  // 🔹 Columnas genéricas
  const columnasGenericas = [
    { title: "Movimiento", dataIndex: "movimiento" },
    { title: "Cantidad QQ", dataIndex: "cantidad" },
    { title: "Total Lps", dataIndex: "total" },
  ];

  // 🔹 Secciones a mostrar
  const secciones = [
    { titulo: "📊 Resumen de Compras", datos: comprasData },
    { titulo: "📑 Resumen de Contratos", datos: contratosData },
    { titulo: "🏦 Resumen de Depósitos", datos: depositosData },
  ];

  if (!mounted) return null; // evitar parpadeo inicial

  return (
    <div>
      {/* Filtros */}
      <Card>
        <h2>Resumen de Movimientos</h2>
        <TarjetasDeTotales
          title="Totales Generales"
          cards={[
            {
              title: "📥 Entradas (QQ)",
              value: totales.entradas.cantidad,
              precision: 2,
            },
            {
              title: "📥 Entradas (Lps)",
              value: totales.entradas.total,
              precision: 2,
            },
            {
              title: "📤 Salidas (QQ)",
              value: totales.salidas.cantidad,
              precision: 2,
            },
            {
              title: "📤 Salidas (Lps)",
              value: totales.salidas.total,
              precision: 2,
            },
          ]}
        />
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
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
          </div>
          <div style={{ width: 120 }}>
            <Button
              type="primary"
              icon={<ReloadOutlined spin={loading} />}
              onClick={() =>
                fetchData(
                  rangoFechas?.[0]?.startOf("day").toDate().toISOString(),
                  rangoFechas?.[1]?.endOf("day").toDate().toISOString()
                )
              }
              style={{ width: "100%" }}
            >
              Refrescar
            </Button>
          </div>
          <div style={{ width: 120 }}>
            <Button onClick={() => exportPDFGeneral(totales, secciones)}>
              Imprimir PDF
            </Button>
          </div>
        </div>
      </Card>
      {secciones.map((sec, idx) => (
        <Card key={idx} title={sec.titulo}>
          {isDesktop ? (
            <Table
              columns={columnasGenericas}
              dataSource={sec.datos}
              loading={loading}
              pagination={false}
              bordered
            />
          ) : (
            <TarjetaMobile
              data={sec.datos}
              columns={columnasTarjetas}
              loading={loading}
            />
          )}
        </Card>
      ))}
    </div>
  );
}
