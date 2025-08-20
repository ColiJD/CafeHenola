"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  Button,
  Space,
  Grid,
} from "antd";
import { formatNumber } from "@/config/validacionesForm";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function TablaSaldoDepositos() {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // true si pantalla < 768px

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");
  const [rangoFecha, setRangoFecha] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("Pendiente");

  // 🔹 Cargar datos de la API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deposito");
      if (!res.ok) throw new Error("Error al cargar los datos");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error(error);
      message.error("No se pudieron cargar los saldos de depósitos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 🔹 Agrupar depósitos por cliente, café y estado
  const agruparDatos = (items) => {
    const mapa = {};
    items.forEach((item) => {
      const key = `${item.clienteID}-${item.tipoCafeNombre}-${item.estado}`;
      if (!mapa[key]) {
        mapa[key] = {
          ...item,
          depositoID: key,
          cantidadTotal: 0,
          cantidadLiquidada: 0,
          saldoPendienteQQ: 0,
          detalles: [],
        };
      }
      mapa[key].cantidadTotal += item.cantidadTotal;
      mapa[key].cantidadLiquidada += item.cantidadLiquidada;
      mapa[key].saldoPendienteQQ += item.saldoPendienteQQ;
      mapa[key].detalles.push(item);
    });
    return Object.values(mapa);
  };

  // 🔹 Aplicar filtros
  const aplicarFiltros = useCallback(
    (items) => {
      let filtrados = [...items];

      if (nombreFiltro) {
        filtrados = filtrados.filter((item) =>
          item.clienteNombre.toLowerCase().includes(nombreFiltro.toLowerCase())
        );
      }
      if (tipoCafeFiltro) {
        filtrados = filtrados.filter(
          (item) => item.tipoCafeNombre === tipoCafeFiltro
        );
      }
      if (estadoFiltro) {
        filtrados = filtrados.filter((item) => item.estado === estadoFiltro);
      }
      if (rangoFecha.length === 2) {
        const [inicio, fin] = rangoFecha;
        filtrados = filtrados.filter((item) => {
          const fecha = new Date(item.depositoFecha);
          return fecha >= new Date(inicio) && fecha <= new Date(fin);
        });
      }

      return agruparDatos(filtrados);
    },
    [nombreFiltro, tipoCafeFiltro, estadoFiltro, rangoFecha]
  );

  // 🔹 Reaplicar filtros cada vez que cambian los datos o filtros
  useEffect(() => {
    setFilteredData(aplicarFiltros(data));
  }, [data, aplicarFiltros]);

  // 🔹 Columnas principales para desktop/tablet
  const columns = [
    {
      title: "ID",
      dataIndex: "clienteID",
      key: "clienteID",
      width: 60,
      responsive: ["md"],
    },
    {
      title: "Cliente",
      dataIndex: "clienteNombre",
      key: "clienteNombre",
      width: 120,
    },
    {
      title: "Tipo Café",
      dataIndex: "tipoCafeNombre",
      key: "tipoCafeNombre",
      width: 100,
    },
    {
      title: "Total (QQ)",
      dataIndex: "cantidadTotal",
      key: "cantidadTotal",
      width: 90,
      render: (value) => formatNumber(value),
    },
    {
      title: "Liquidado (QQ)",
      dataIndex: "cantidadLiquidada",
      key: "cantidadLiquidada",
      width: 90,
      render: (value) => formatNumber(value),
    },
    {
      title: "Saldo (QQ)",
      dataIndex: "saldoPendienteQQ",
      key: "saldoPendienteQQ",
      width: 90,
      render: (value) => {
        const num = parseFloat(value);
        return (
          <span style={{ color: num > 0 ? "red" : "green", fontWeight: 600 }}>
            {formatNumber(value)}
          </span>
        );
      },
    },
    { title: "Estado", dataIndex: "estado", key: "estado", width: 80 },
  ];

  // 🔹 Columnas de detalle expandible
  const detalleColumns = [
    {
      title: "Depósito ID",
      dataIndex: "depositoID",
      key: "depositoID",
      width: 80,
    },
    {
      title: "Fecha Depósito",
      dataIndex: "depositoFecha",
      key: "depositoFecha",
      width: 100,
      render: (date) =>
        new Date(date).toLocaleDateString("es-HN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      title: "Total (QQ)",
      dataIndex: "cantidadTotal",
      key: "cantidadTotal",
      width: 80,
      render: (value) => formatNumber(value),
    },
    {
      title: "Liquidado (QQ)",
      dataIndex: "cantidadLiquidada",
      key: "cantidadLiquidada",
      width: 80,
      render: (value) => formatNumber(value),
    },
    {
      title: "Saldo (QQ)",
      dataIndex: "saldoPendienteQQ",
      key: "saldoPendienteQQ",
      width: 80,
      render: (value) => formatNumber(value),
    },
  ];

  return (
    <div>
      {/* 🔹 Filtros y botón refrescar */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Buscar por nombre"
            value={nombreFiltro}
            onChange={(e) => setNombreFiltro(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Tipo de café"
            value={tipoCafeFiltro}
            onChange={setTipoCafeFiltro}
            allowClear
            style={{ width: "100%" }}
          >
            {[...new Set(data.map((d) => d.tipoCafeNombre))].map((tipo) => (
              <Option key={tipo} value={tipo}>
                {tipo}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            style={{ width: "100%" }}
          >
            <Option value="Pendiente">Pendiente</Option>
            <Option value="Liquidado">Liquidado</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: "100%" }}
            onChange={(values) => setRangoFecha(values || [])}
          />
        </Col>
      </Row>

      <Row
        gutter={[8, 8]}
        style={{ marginBottom: 16, justifyContent: "flex-end" }}
      >
        <Col xs={24} sm={12} md={4}>
          <Button onClick={cargarDatos} block>
            Refrescar
          </Button>
        </Col>
      </Row>

      {/* 🔹 Tabla o tarjetas según pantalla */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredData.map((row) => (
            <div
              key={row.depositoID}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              <div>
                <strong>Cliente:</strong> {row.clienteNombre}
              </div>
              <div>
                <strong>Tipo Café:</strong> {row.tipoCafeNombre}
              </div>
              <div>
                <strong>Total:</strong> {formatNumber(row.cantidadTotal)}
              </div>
              <div>
                <strong>Liquidado:</strong>{" "}
                {formatNumber(row.cantidadLiquidada)}
              </div>
              <div>
                <strong>Saldo:</strong>{" "}
                <span
                  style={{ color: row.saldoPendienteQQ > 0 ? "red" : "green" }}
                >
                  {formatNumber(row.saldoPendienteQQ)}
                </span>
              </div>
              <div>
                <strong>Estado:</strong> {row.estado}
              </div>

              {/* Detalles expandibles opcionales */}
              {row.detalles.length > 1 && (
                <details style={{ marginTop: 8 }}>
                  <summary>Ver depósitos individuales</summary>
                  {row.detalles.map((d) => (
                    <div
                      key={d.depositoID}
                      style={{ borderTop: "1px dashed #ccc", padding: 4 }}
                    >
                      <div>Depósito ID: {d.depositoID}</div>
                      <div>
                        Fecha:{" "}
                        {new Date(d.depositoFecha).toLocaleDateString("es-HN")}
                      </div>
                      <div>Total: {formatNumber(d.cantidadTotal)}</div>
                      <div>Liquidado: {formatNumber(d.cantidadLiquidada)}</div>
                      <div>Saldo: {formatNumber(d.saldoPendienteQQ)}</div>
                    </div>
                  ))}
                </details>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="depositoID"
          loading={loading}
          bordered
          size="middle"
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={detalleColumns}
                dataSource={record.detalles}
                rowKey={(r) => r.depositoID}
                pagination={false}
                size="small"
                bordered
                scroll={{ x: "max-content" }}
              />
            ),
          }}
          pagination={{ pageSize: 6 }}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
}
