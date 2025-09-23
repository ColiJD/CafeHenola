"use client";
import { useEffect, useState } from "react";
import { Table, Row, Col, message, Button } from "antd";
import { truncarDosDecimalesSinRedondear } from "@/lib/calculoCafe";
import TarjetasDeTotales from "@/components/DetallesCard";
import Filtros from "@/components/Filtros";
import { useRouter } from "next/navigation";
import useClientAndDesktop from "@/hook/useClientAndDesktop";

export default function InventarioActualPage() {
  const { mounted, isDesktop } = useClientAndDesktop();
  const isMobile = mounted && !isDesktop;

  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");

  // Cargar inventario actual
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventario/Actual"); // endpoint que devuelve vw_inventario_actual
      if (!res.ok) throw new Error("Error al cargar inventario");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error(error);
      message.error("No se pudo cargar el inventario actual");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Totales generales
  const totalEntradas = data.reduce(
    (acc, item) => acc + (item.totalEntradasQQ || 0),
    0
  );
  const totalSalidas = data.reduce(
    (acc, item) => acc + (item.totalSalidasQQ || 0),
    0
  );
  const totalSaldo = data.reduce((acc, item) => acc + (item.saldoQQ || 0), 0);

  // Columnas de tabla
  const columns = [
    {
      title: "Tipo de Café",
      dataIndex: "tipoCafe",
      key: "tipoCafe",
      render: (text, record) => (
        <a
          onClick={() =>
            router.push(`/page/inventario/${record.productoID}`)
          }
        >
          {text}
        </a>
      ),
    },
    {
      title: "Total Entradas (QQ)",
      dataIndex: "totalEntradasQQ",
      key: "totalEntradasQQ",
      render: truncarDosDecimalesSinRedondear,
    },
    {
      title: "Total Salidas (QQ)",
      dataIndex: "totalSalidasQQ",
      key: "totalSalidasQQ",
      render: truncarDosDecimalesSinRedondear,
    },
    {
      title: "Saldo (QQ)",
      dataIndex: "saldoQQ",
      key: "saldoQQ",
      render: truncarDosDecimalesSinRedondear,
    },
  ];

  return (
    <div>
      <TarjetasDeTotales
        title="Inventario Actual"
        cards={[
          {
            title: "Total Entradas",
            value: truncarDosDecimalesSinRedondear(totalEntradas),
          },
          {
            title: "Total Salidas",
            value: truncarDosDecimalesSinRedondear(totalSalidas),
          },
          {
            title: "Saldo Total",
            value: truncarDosDecimalesSinRedondear(totalSaldo),
          },
        ]}
      />

      {/* Filtros */}
      <Filtros
        fields={[
          {
            type: "select",
            placeholder: "Tipo de café",
            value: tipoCafeFiltro || undefined,
            setter: setTipoCafeFiltro,
            allowClear: true,
            options: [...new Set(data.map((d) => d.tipoCafe))],
          },
        ]}
      />

      <Row style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6} md={4}>
          <Button onClick={cargarDatos} block>
            Refrescar
          </Button>
        </Col>
      </Row>

      {/* Tabla */}
      <Table
        columns={columns}
        dataSource={
          tipoCafeFiltro
            ? data.filter((d) => d.tipoCafe === tipoCafeFiltro)
            : data
        }
        rowKey="productoID"
        loading={loading}
        bordered
        size="middle"
      />
    </div>
  );
}
