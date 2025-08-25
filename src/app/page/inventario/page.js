"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Input, Select, Row, Col, message, Button, Grid } from "antd";
import { convertirAHonduras } from "@/lib/fechaHonduras";

const { Option } = Select;
const { useBreakpoint } = Grid;

export default function InventarioCafePage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");

  // 🔹 Cargar datos de la API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventario/Registro");
      if (!res.ok) throw new Error("Error al cargar los datos");
      const movimientos = await res.json();

      // Agrupar por productoID
      const mapa = new Map();
      movimientos.forEach((m) => {
        const key = m.productoID;
        if (!mapa.has(key)) {
          mapa.set(key, {
            productoID: m.productoID,
            tipoCafe: m.tipoCafe,
            totalQQ: 0,
            totalSacos: 0,
            detalles: [],
          });
        }
        const item = mapa.get(key);
        item.totalQQ += parseFloat(m.cantidadQQ);
        item.totalSacos += parseFloat(m.cantidadSacos);
        item.detalles.push({
          movimientoID: m.movimientoID,
          fecha: m.fecha,
          clienteNombre: m.clienteNombre,
          clienteApellido: m.clienteApellido,
          clienteCedula: m.clienteCedula,
          cantidadQQ: m.cantidadQQ,
          cantidadSacos: m.cantidadSacos,
        });
      });

      setData(Array.from(mapa.values()));
    } catch (error) {
      console.error(error);
      message.error("No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 🔹 Aplicar filtros
  const aplicarFiltros = useCallback(() => {
    let filtrados = [...data];

    if (nombreFiltro) {
      filtrados = filtrados.filter((item) =>
        item.detalles.some((d) =>
          d.clienteNombre.toLowerCase().includes(nombreFiltro.toLowerCase())
        )
      );
    }
    if (tipoCafeFiltro) {
      filtrados = filtrados.filter((item) => item.tipoCafe === tipoCafeFiltro);
    }

    return filtrados;
  }, [data, nombreFiltro, tipoCafeFiltro]);

  useEffect(() => {
    setFilteredData(aplicarFiltros());
  }, [aplicarFiltros]);

  // 🔹 Columnas de tabla
  const columns = [
    { title: "ID Café", dataIndex: "productoID", key: "productoID", width: 80 },
    { title: "Tipo de Café", dataIndex: "tipoCafe", key: "tipoCafe" },
    {
      title: "Total QQ",
      dataIndex: "totalQQ",
      key: "totalQQ",
      render: (v) => parseFloat(v).toFixed(2),
    },
    {
      title: "Total Sacos",
      dataIndex: "totalSacos",
      key: "totalSacos",
      render: (v) => parseFloat(v).toFixed(2),
    },
  ];

  const detalleColumns = [
    { title: "MovimientoID", dataIndex: "movimientoID", key: "movimientoID" },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (v) => convertirAHonduras(v),
    },
    {
      title: "Cliente",
      key: "cliente",
      render: (_, record) =>
        `${record.clienteNombre} ${record.clienteApellido}`,
    },
    { title: "Cédula", dataIndex: "clienteCedula", key: "cedula" },
    {
      title: "Cantidad QQ",
      dataIndex: "cantidadQQ",
      key: "cantidadQQ",
      render: (v) => parseFloat(v).toFixed(2),
    },
    {
      title: "Cantidad Sacos",
      dataIndex: "cantidadSacos",
      key: "cantidadSacos",
      render: (v) => parseFloat(v).toFixed(2),
    },
  ];

  return (
    <div>
      {/* 🔹 Filtros */}
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
            {[...new Set(data.map((d) => d.tipoCafe))].map((tipo) => (
              <Option key={tipo} value={tipo}>
                {tipo}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
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
              key={row.productoID}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              <div>
                <strong>Café:</strong> {row.tipoCafe} (ID: {row.productoID})
              </div>
              <div>
                <strong>Total QQ:</strong> {row.totalQQ.toFixed(2)}
              </div>
              <div>
                <strong>Total Sacos:</strong> {row.totalSacos.toFixed(2)}
              </div>

              {row.detalles.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary>Ver movimientos</summary>
                  {row.detalles.map((d) => (
                    <div
                      key={d.movimientoID}
                      style={{ borderTop: "1px dashed #ccc", padding: 4 }}
                    >
                      <div>Movimiento ID: {d.movimientoID}</div>
                      <div>Fecha: {convertirAHonduras(d.fecha)}</div>
                      <div>
                        Cliente: {d.clienteNombre} {d.clienteApellido}
                      </div>
                      <div>Cédula: {d.clienteCedula}</div>
                      <div>Cantidad QQ: {parseFloat(d.cantidadQQ).toFixed(2)}</div>
                      <div>
                        Cantidad Sacos: {parseFloat(d.cantidadSacos).toFixed(2)}
                      </div>
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
          rowKey="productoID"
          loading={loading}
          bordered
          size="middle"
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={detalleColumns}
                dataSource={record.detalles}
                rowKey={(r) => r.movimientoID}
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
