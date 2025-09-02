"use client";
import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  Button,
  Card,
  Statistic,
  Grid,
} from "antd";
import { truncarDosDecimalesSinRedondear } from "@/lib/calculoCafe";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function TablaSaldoDepositos() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");
  const [rangoFecha, setRangoFecha] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("Pendiente");

  // 🔹 Cargar datos desde API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deposito");
      if (!res.ok) throw new Error("Error al cargar los datos");
      const data = await res.json();

      // 🔹 Filtrar según estadoFiltro, incluyendo parcialmente liquidados
      const dataFiltrada = data.filter((item) => {
        if (estadoFiltro === "Liquidado") {
          return parseFloat(item.cantidadLiquidada || 0) > 0;
        } else if (estadoFiltro === "Pendiente") {
          return (
            parseFloat(item.cantidadTotal || 0) -
              parseFloat(item.cantidadLiquidada || 0) >
            0
          );
        }
        return true;
      });

      // 🔹 Agrupar datos por cliente, tipo de café y estado
      const mapa = {};
      dataFiltrada.forEach((item) => {
        const key = `${item.clienteID}-${item.tipoCafeNombre}`;
        if (!mapa[key]) {
          mapa[key] = {
            clienteID: item.clienteID,
            clienteNombre: item.clienteNombre,
            tipoCafeNombre: item.tipoCafeNombre,
            cantidadTotal: 0,
            cantidadLiquidada: 0,
            saldoPendienteQQ: 0,
            precioPromedio: item.precioPromedio,
            liquidadoValor: 0,
            saldoPendienteValor: 0,
            detalles: [],
          };
        }

        const cantidadTotal = parseFloat(item.cantidadTotal || 0);
        const cantidadLiquidada = parseFloat(item.cantidadLiquidada || 0);
        const saldoPendienteQQ = cantidadTotal - cantidadLiquidada;
        const liquidadoValor = parseFloat(item.liquidadoValor || 0);
        const saldoPendienteValor = parseFloat(item.saldoPendienteValor || 0);

        mapa[key].cantidadTotal += cantidadTotal;
        mapa[key].cantidadLiquidada += cantidadLiquidada;
        mapa[key].saldoPendienteQQ += saldoPendienteQQ;
        mapa[key].liquidadoValor += liquidadoValor;
        mapa[key].saldoPendienteValor += saldoPendienteValor;
        mapa[key].detalles.push({ ...item, saldoPendienteQQ });
      });

      const groupedData = Object.values(mapa);
      setData(groupedData);
      setFilteredData(groupedData);
    } catch (error) {
      console.error(error);
      message.error("No se pudieron cargar los saldos de depósitos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [estadoFiltro]);

  // 🔹 Aplicar filtros adicionales
  const aplicarFiltros = () => {
    let filtrados = [...data];
    if (nombreFiltro)
      filtrados = filtrados.filter((item) =>
        item.clienteNombre.toLowerCase().includes(nombreFiltro.toLowerCase())
      );
    if (tipoCafeFiltro)
      filtrados = filtrados.filter(
        (item) => item.tipoCafeNombre === tipoCafeFiltro
      );
    if (rangoFecha.length === 2) {
      const [inicio, fin] = rangoFecha;
      filtrados = filtrados.filter((item) =>
        item.detalles.some((d) => {
          const fecha = new Date(d.depositoFecha);
          return fecha >= new Date(inicio) && fecha <= new Date(fin);
        })
      );
    }
    setFilteredData(filtrados);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [nombreFiltro, tipoCafeFiltro, rangoFecha, data]);

  // 🔹 Totales
  const totalQQ =
    estadoFiltro === "Pendiente"
      ? filteredData.reduce((acc, item) => acc + (item.cantidadTotal || 0), 0)
      : filteredData.reduce(
          (acc, item) => acc + (item.cantidadLiquidada || 0),
          0
        );

  const totalSaldo =
    estadoFiltro === "Pendiente"
      ? filteredData.reduce(
          (acc, item) => acc + (item.saldoPendienteQQ || 0),
          0
        )
      : filteredData.reduce((acc, item) => acc + (item.liquidadoValor || 0), 0);

  // 🔹 Columnas
  const columns = [
    { title: "Cliente", dataIndex: "clienteNombre", key: "clienteNombre" },
    { title: "Tipo Café", dataIndex: "tipoCafeNombre", key: "tipoCafeNombre" },
    ...(estadoFiltro === "Pendiente"
      ? [
          {
            title: "Total (QQ)",
            dataIndex: "cantidadTotal",
            key: "cantidadTotal",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Saldo (QQ)",
            dataIndex: "saldoPendienteQQ",
            key: "saldoPendienteQQ",
            render: (v) => (
              <span style={{ color: v > 0 ? "red" : "green", fontWeight: 600 }}>
                {truncarDosDecimalesSinRedondear(v)}
              </span>
            ),
          },
        ]
      : [
          {
            title: "Liquidado (QQ)",
            dataIndex: "cantidadLiquidada",
            key: "cantidadLiquidada",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Total (Lps)",
            dataIndex: "liquidadoValor",
            key: "liquidadoValor",
            render: truncarDosDecimalesSinRedondear,
          },
        ]),
  ];

  const detalleColumns = [
    { title: "Depósito ID", dataIndex: "depositoID", key: "depositoID" },
    {
      title: "Fecha",
      dataIndex: "depositoFecha",
      key: "depositoFecha",
      render: (d) => new Date(d).toLocaleDateString("es-HN"),
    },
    ...(estadoFiltro === "Pendiente"
      ? [
          {
            title: "Total (QQ)",
            dataIndex: "cantidadTotal",
            key: "cantidadTotal",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Saldo (QQ)",
            dataIndex: "saldoPendienteQQ",
            key: "saldoPendienteQQ",
            render: (v) => (
              <span style={{ color: v > 0 ? "red" : "green" }}>
                {truncarDosDecimalesSinRedondear(v)}
              </span>
            ),
          },
        ]
      : [
          {
            title: "Liquidado (QQ)",
            dataIndex: "cantidadLiquidada",
            key: "cantidadLiquidada",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Precio (Lps/QQ)",
            dataIndex: "precioPromedio",
            key: "precioPromedio",
            render: truncarDosDecimalesSinRedondear,
          },
          {
            title: "Total (Lps)",
            dataIndex: "liquidadoValor",
            key: "liquidadoValor",
            render: truncarDosDecimalesSinRedondear,
          },
        ]),
  ];

  return (
    <div>
      {/* Tarjetas */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col span={24}>
          <h2>Registro de Depósitos</h2>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            title={
              estadoFiltro === "Pendiente" ? "Total (QQ)" : "Liquidado (QQ)"
            }
          >
            <Statistic value={truncarDosDecimalesSinRedondear(totalQQ)} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            title={
              estadoFiltro === "Pendiente"
                ? "Saldo Pendiente (QQ)"
                : "Total (Lps)"
            }
          >
            <Statistic value={truncarDosDecimalesSinRedondear(totalSaldo)} />
          </Card>
        </Col>
      </Row>

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
            value={tipoCafeFiltro || undefined}
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
            onChange={(v) => setRangoFecha(v || [])}
          />
        </Col>
      </Row>

      <Row style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6} md={4}>
          <Button onClick={cargarDatos} block>
            Refrescar
          </Button>
        </Col>
      </Row>

      {/* 🔹 Tabla responsive */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredData.map((row) => (
            <div
              key={`${row.clienteID}-${row.tipoCafeNombre}`}
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
              {estadoFiltro === "Pendiente" ? (
                <>
                  <div>
                    <strong>Total (QQ):</strong>{" "}
                    {truncarDosDecimalesSinRedondear(row.cantidadTotal)}
                  </div>
                  <div>
                    <strong>Saldo Pendiente (QQ):</strong>{" "}
                    <span
                      style={{
                        color: row.saldoPendienteQQ > 0 ? "red" : "green",
                      }}
                    >
                      {truncarDosDecimalesSinRedondear(row.saldoPendienteQQ)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <strong>Liquidado (QQ):</strong>{" "}
                    {truncarDosDecimalesSinRedondear(row.cantidadLiquidada)}
                  </div>
                  <div>
                    <strong>Total (Lps):</strong>{" "}
                    {truncarDosDecimalesSinRedondear(row.liquidadoValor)}
                  </div>
                </>
              )}
              <div>
                <strong>Estado:</strong> {estadoFiltro}
              </div>

              {/* Detalles */}
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
                      {estadoFiltro === "Pendiente" ? (
                        <>
                          <div>
                            Total (QQ):{" "}
                            {truncarDosDecimalesSinRedondear(d.cantidadTotal)}
                          </div>
                          <div>
                            Saldo (QQ):{" "}
                            {truncarDosDecimalesSinRedondear(
                              d.saldoPendienteQQ
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            Liquidado (QQ):{" "}
                            {truncarDosDecimalesSinRedondear(
                              d.cantidadLiquidada
                            )}
                          </div>
                          <div>
                            Precio (Lps/QQ):{" "}
                            {truncarDosDecimalesSinRedondear(d.precioPromedio)}
                          </div>
                          <div>
                            Total (Lps):{" "}
                            {truncarDosDecimalesSinRedondear(d.liquidadoValor)}
                          </div>
                        </>
                      )}
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
          rowKey={(row) => `${row.clienteID}-${row.tipoCafeNombre}`}
          loading={loading}
          bordered
          size="middle"
          pagination={{ pageSize: 6 }}
          scroll={{ x: "max-content" }}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={detalleColumns}
                dataSource={record.detalles}
                rowKey="depositoID"
                pagination={false}
                size="small"
                bordered
                scroll={{ x: "max-content" }}
              />
            ),
          }}
        />
      )}
    </div>
  );
}
