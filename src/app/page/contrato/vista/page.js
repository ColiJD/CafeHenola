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
  Grid,
} from "antd";
import { formatNumber } from "@/config/validacionesForm";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function TablaResumenContrato() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Pendiente");
  const [rangoFecha, setRangoFecha] = useState([]);

  // 🔹 Cargar datos de la API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contratos/vista"); // tu endpoint
      if (!res.ok) throw new Error("Error al cargar los datos");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error(error);
      message.error("No se pudieron cargar los resúmenes de contratos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 🔹 Agrupar por cliente, contrato y café
  const agruparDatos = (items) => {
    const mapa = {};
    items.forEach((item) => {
      const key = `${item.clienteID}-${item.contratoID}-${item.tipoCafe}`;
      if (!mapa[key]) {
        mapa[key] = {
          ...item,
          resumenID: key,
          detalles: [],
          totalEntregadoLps: 0, // inicializar total entregado
          totalContratoLps: parseFloat(item.totalContratoLps || 0), // 🔹 agregar total contratado
        };
      }
      mapa[key].detalles.push({
        detalleID: item.detalleID,
        fechaDetalle: item.fechaDetalle,
        cantidadDetalleQQ: item.cantidadDetalleQQ,
        precioDetalleQQ: item.precioDetalleQQ,
        totalDetalleLps: item.totalDetalleLps,
      });

      // 🔹 sumar total de Lps de los detalles
      mapa[key].totalEntregadoLps += parseFloat(item.totalDetalleLps || 0);
    });
    return Object.values(mapa);
  };

  // 🔹 Aplicar filtros
  const aplicarFiltros = useCallback(
    (items) => {
      let filtrados = [...items];

      if (nombreFiltro) {
        filtrados = filtrados.filter((item) =>
          item.clienteNombreCompleto
            .toLowerCase()
            .includes(nombreFiltro.toLowerCase())
        );
      }

      if (tipoCafeFiltro) {
        filtrados = filtrados.filter(
          (item) => item.tipoCafe === tipoCafeFiltro
        );
      }

      if (estadoFiltro) {
        filtrados = filtrados.filter(
          (item) => item.contratoEstado === estadoFiltro
        );
      }

      if (rangoFecha.length === 2) {
        const [inicio, fin] = rangoFecha;
        filtrados = filtrados.filter((item) => {
          // consideramos la fecha del primer detalle como referencia
          const fecha = new Date(
            item.fechaDetalle || item.detalles[0]?.fechaDetalle
          );
          return fecha >= new Date(inicio) && fecha <= new Date(fin);
        });
      }

      return agruparDatos(filtrados);
    },
    [nombreFiltro, tipoCafeFiltro, estadoFiltro, rangoFecha]
  );

  useEffect(() => {
    setFilteredData(aplicarFiltros(data));
  }, [data, aplicarFiltros]);

  // 🔹 Columnas para desktop
  const columns = [
    {
      title: "Cliente",
      dataIndex: "clienteNombreCompleto",
      key: "cliente",
      width: 120,
    },
    { title: "Contrato", dataIndex: "contratoID", key: "contrato", width: 80 },
    { title: "Café", dataIndex: "tipoCafe", key: "tipoCafe", width: 100 },
    {
      title: "Cant. QQ",
      dataIndex: "cantidadContratoQQ",
      key: "cantidadContratoQQ",
      render: (v) => formatNumber(v),
    },
    {
      title: "Precio",
      dataIndex: "precioQQ",
      key: "precioQQ",
      render: (v) => formatNumber(v),
    },
    {
      title: "T. Contratado",
      dataIndex: "totalContratoLps",
      key: "totalContratoLps",
      render: (v) => formatNumber(v),
    },
    {
      title: "T. Entregado",
      dataIndex: "totalEntregadoLps",
      key: "totalEntregadoLps",
      render: (v) => formatNumber(v),
    },
    {
      title: "Saldo QQ",
      dataIndex: "saldoRestanteQQ",
      key: "saldoRestanteQQ",
      render: (v) => (
        <span style={{ color: v > 0 ? "red" : "green", fontWeight: 600 }}>
          {formatNumber(v)}
        </span>
      ),
    },
    {
      title: "Saldo L.",
      dataIndex: "saldoRestanteLps",
      key: "saldoRestanteLps",
      render: (v) => (
        <span style={{ color: v > 0 ? "red" : "green", fontWeight: 600 }}>
          {formatNumber(v)}
        </span>
      ),
    },
    { title: "Estado", dataIndex: "contratoEstado", key: "estado", width: 100 },
  ];

  // 🔹 Columnas detalle
  const detalleColumns = [
    {
      title: "Detalle ID",
      dataIndex: "detalleID",
      key: "detalleID",
      width: 80,
    },
    {
      title: "Fecha",
      dataIndex: "fechaDetalle",
      key: "fechaDetalle",
      render: (fecha) =>
        new Date(fecha).toLocaleDateString("es-HN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      title: "Cantidad (QQ)",
      dataIndex: "cantidadDetalleQQ",
      key: "cantidadDetalleQQ",
      render: (v) => formatNumber(v),
    },
    {
      title: "Precio QQ",
      dataIndex: "precioDetalleQQ",
      key: "precioDetalleQQ",
      render: (v) => formatNumber(v),
    },
    {
      title: "Total (Lps)",
      dataIndex: "totalDetalleLps",
      key: "totalDetalleLps",
      render: (v) => formatNumber(v),
    },
  ];

  return (
    <div>
      {/* Filtros */}
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
            placeholder={["Fecha Inicio", "Fecha Fin"]}
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

      {/* Tabla o tarjetas */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredData.map((row) => (
            <div
              key={row.resumenID}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              <div>
                <strong>Cliente:</strong> {row.clienteNombreCompleto}
              </div>
              <div>
                <strong>Contrato:</strong> {row.contratoID}
              </div>
              <div>
                <strong>Tipo Café:</strong> {row.tipoCafe}
              </div>
              <div>
                <strong>Cantidad Contrato (QQ):</strong>{" "}
                {formatNumber(row.cantidadContratoQQ)}
              </div>
              <div>
                <strong>Precio QQ:</strong> {formatNumber(row.precioQQ)}
              </div>
              <div>
                <strong>Total Contratado (Lps):</strong>{" "}
                {formatNumber(row.totalContratoLps)}
              </div>
              <div>
                <strong>Total Entregado (Lps):</strong>{" "}
                {formatNumber(row.totalEntregadoLps)}
              </div>
              <div>
                <strong>Saldo Restante (QQ):</strong>{" "}
                <span
                  style={{ color: row.saldoRestanteQQ > 0 ? "red" : "green" }}
                >
                  {formatNumber(row.saldoRestanteQQ)}
                </span>
              </div>
              <div>
                <strong>Estado:</strong> {row.contratoEstado}
              </div>

              {/* Detalles expandibles */}
              {row.detalles.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary>Ver detalle de entregas</summary>
                  {row.detalles.map((d) => (
                    <div
                      key={d.detalleID}
                      style={{ borderTop: "1px dashed #ccc", padding: 4 }}
                    >
                      <div>
                        <strong>Detalle ID:</strong> {d.detalleID}
                      </div>
                      <div>
                        <strong>Fecha:</strong>{" "}
                        {new Date(d.fechaDetalle).toLocaleDateString("es-HN")}
                      </div>
                      <div>
                        <strong>Cantidad (QQ):</strong>{" "}
                        {formatNumber(d.cantidadDetalleQQ)}
                      </div>
                      <div>
                        <strong>Precio QQ:</strong>{" "}
                        {formatNumber(d.precioDetalleQQ)}
                      </div>
                      <div>
                        <strong>Total (Lps):</strong>{" "}
                        {formatNumber(d.totalDetalleLps)}
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
          rowKey="resumenID"
          loading={loading}
          bordered
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={detalleColumns}
                dataSource={record.detalles}
                rowKey={(r) => r.detalleID}
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
