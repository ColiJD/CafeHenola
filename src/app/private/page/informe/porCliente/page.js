"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Divider,
  message,
  Spin,
  Tag,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import { formatNumber } from "@/components/Formulario";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function MovimientosComprasPage() {
  const [clientes, setClientes] = useState([]);
  const [clienteID, setClienteID] = useState(null);
  const [fechaRango, setFechaRango] = useState([
    dayjs().startOf("year"),
    dayjs().endOf("year"),
  ]);
  const [data, setData] = useState([]);
  const [totales, setTotales] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) throw new Error("Error al cargar clientes");
        const json = await res.json();
        setClientes(json || []);
      } catch (err) {
        console.error(err);
        message.error("No se pudieron cargar los clientes");
      }
    };
    fetchClientes();
  }, []);

  const fetchCompras = async () => {
    if (!clienteID) {
      message.warning("Seleccione un cliente primero");
      return;
    }

    if (!fechaRango || fechaRango.length !== 2) {
      message.warning("Seleccione un rango de fechas válido");
      return;
    }

    setLoading(true);
    try {
      const fechaInicio = fechaRango[0].format("YYYY-MM-DD");
      const fechaFin = fechaRango[1].format("YYYY-MM-DD");

      const res = await fetch(
        `/api/reportes/porCliente?clienteID=${clienteID}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );
      if (!res.ok) throw new Error("Error al obtener movimientos");

      const json = await res.json();

      // 🔹 Procesar Compras
      const detallesCompras = (json.movimientos.Compras || []).map((c) => {
        const cantidadQQ = Number(c.cantidadQQ) || 0;
        const precioQQ = Number(c.precioQQ) || 0;
        return { ...c, cantidadQQ, precioQQ, totalLps: cantidadQQ * precioQQ };
      });

      const totalQQCompras = detallesCompras.reduce(
        (acc, c) => acc + c.cantidadQQ,
        0
      );
      const totalLpsCompras = detallesCompras.reduce(
        (acc, c) => acc + c.totalLps,
        0
      );
      const promedioPrecioCompras =
        totalQQCompras > 0
          ? detallesCompras.reduce(
              (acc, c) => acc + c.precioQQ * c.cantidadQQ,
              0
            ) / totalQQCompras
          : 0;

      const filaCompras = {
        tipo: "Compra",
        totalQQ: totalQQCompras,
        totalLps: totalLpsCompras,
        promedioPrecio: promedioPrecioCompras,
        detalles: detallesCompras,
      };

      // 🔹 Procesar Contratos
      // Procesar Contratos correctamente
      const detallesContratos = (json.movimientos.Contratos || []).map(
        (contrato) => {
          const detalles = (contrato.detalles || []).map((d) => {
            const cantidadQQ = Number(d.cantidadQQ) || 0;
            const precioQQ = Number(d.precioQQ) || 0;
            return {
              fecha: d.fecha,
              cantidadQQ,
              precioQQ,
              totalLps: cantidadQQ * precioQQ,
              detalleID: d.detalleID,
            };
          });

          const totalQQ = detalles.reduce((acc, d) => acc + d.cantidadQQ, 0);
          const totalLps = detalles.reduce((acc, d) => acc + d.totalLps, 0);
          const promedioPrecio =
            totalQQ > 0
              ? detalles.reduce(
                  (acc, d) => acc + d.precioQQ * d.cantidadQQ,
                  0
                ) / totalQQ
              : 0;

          return {
            contratoID: contrato.contratoID,
            descripcion: contrato.descripcion,
            cantidadContrato: contrato.cantidadContrato || 0,
            producto: contrato.producto?.productName || "-",
            totalQQ,
            totalLps,
            promedioPrecio,
            detalles, // solo cantidad, precio, total y fecha
          };
        }
      );

      const filaContratos = {
        tipo: "Contrato",
        totalQQ: detallesContratos.reduce((sum, c) => sum + c.totalQQ, 0),
        totalLps: detallesContratos.reduce((sum, c) => sum + c.totalLps, 0),
        promedioPrecio:
          detallesContratos.reduce(
            (sum, c) => sum + c.promedioPrecio * c.totalQQ,
            0
          ) /
          Math.max(
            1,
            detallesContratos.reduce((sum, c) => sum + c.totalQQ, 0)
          ),
        detalles: detallesContratos.map((c) => ({
          ...c,
          liquidado:
            c.detalles.length > 0 &&
            c.detalles.reduce((sum, d) => sum + d.cantidadQQ, 0) >=
              c.cantidadContrato
              ? "Sí"
              : "No",
        })),
      };
      // 🔹 Depósitos
      // 🔹 Depósitos
      const detallesDepositos = (json.movimientos.Depositos || []).map(
        (dep) => {
          const detallesLiq = (dep.liqDeposito || []).map((l) => ({
            ...l,
            cantidadQQ: Number(l.cantidadQQ) || 0,
            precioQQ: Number(l.precioQQ) || 0,
            totalLps: (Number(l.cantidadQQ) || 0) * (Number(l.precioQQ) || 0),
          }));

          const totalQQLiquidado = detallesLiq.reduce(
            (sum, l) => sum + l.cantidadQQ,
            0
          );
          const totalLpsLiquidado = detallesLiq.reduce(
            (sum, l) => sum + l.totalLps,
            0
          );
          const promedioPrecio =
            detallesLiq.reduce((sum, l) => sum + l.precioQQ * l.cantidadQQ, 0) /
            Math.max(1, totalQQLiquidado);

          return {
            depositoID: dep.depositoID,
            fecha: dep.fecha,
            producto: dep.producto || "-",
            cantidadQQ: dep.cantidadQQ || 0, // solo referencia
            totalQQLiquidado, // lo que usamos para los totales
            totalLpsLiquidado, // lo que usamos para los totales
            promedioPrecio,
            liquidado: totalQQLiquidado >= (dep.cantidadQQ || 0) ? "Sí" : "No",
            detalles: detallesLiq, // detalles de liquidación con cantidad, precio y total
          };
        }
      );

      // Totales generales de depósitos
      const filaDepositos = {
        tipo: "Depósito",
        totalQQ: detallesDepositos.reduce(
          (sum, d) => sum + d.totalQQLiquidado,
          0
        ),
        totalLps: detallesDepositos.reduce(
          (sum, d) => sum + d.totalLpsLiquidado,
          0
        ),
        promedioPrecio:
          detallesDepositos.reduce(
            (sum, d) => sum + d.promedioPrecio * d.totalQQLiquidado,
            0
          ) /
          Math.max(
            1,
            detallesDepositos.reduce((sum, d) => sum + d.totalQQLiquidado, 0)
          ),
        detalles: detallesDepositos,
      };
 

      setData([filaCompras, filaContratos, filaDepositos]);

      setTotales({
        totalQQ:
          filaCompras.totalQQ + filaContratos.totalQQ + filaDepositos.totalQQ,
        totalLps:
          filaCompras.totalLps +
          filaContratos.totalLps +
          filaDepositos.totalLps,
        promedioPrecio:
          (filaCompras.totalQQ * filaCompras.promedioPrecio +
            filaContratos.totalQQ * filaContratos.promedioPrecio +
            filaDepositos.totalQQ * filaDepositos.promedioPrecio) /
          Math.max(
            1,
            filaCompras.totalQQ + filaContratos.totalQQ + filaDepositos.totalQQ
          ),
      });
    } catch (err) {
      console.error(err);
      message.error("No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      render: (tipo) => <Tag color="green">{tipo}</Tag>,
    },
    {
      title: "Total QQ",
      dataIndex: "totalQQ",
      key: "totalQQ",
      align: "right",
      render: (v) => formatNumber(v, 2),
    },
    {
      title: "Total Lps",
      dataIndex: "totalLps",
      key: "totalLps",
      align: "right",
      render: (v) => "L. " + formatNumber(v, 2),
    },
    {
      title: "Promedio Precio",
      dataIndex: "promedioPrecio",
      key: "promedioPrecio",
      align: "right",
      render: (v) => "L. " + formatNumber(v, 2),
    },
  ];

  return (
    <Card className="p-4 shadow-md rounded-xl">
      <Title level={3}>Registros por Cliente</Title>

      <Row gutter={[12, 12]} align="middle" className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Text strong>Cliente:</Text>
          <Select
            style={{ width: "100%" }}
            placeholder="Seleccione un cliente"
            showSearch
            optionFilterProp="children"
            value={clienteID}
            onChange={(val) => setClienteID(val)}
            options={clientes.map((c) => ({
              value: c.clienteID,
              label: `${c.clienteNombre} ${c.clienteApellido}`,
            }))}
          />
        </Col>

        <Col xs={24} sm={12} md={10}>
          <Text strong>Rango de fechas:</Text>
          <RangePicker
            value={fechaRango}
            format="DD/MM/YYYY"
            onChange={(val) => setFechaRango(val || [])}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Button
            type="primary"
            block
            onClick={fetchCompras}
            disabled={!clienteID}
          >
            Buscar Registros
          </Button>
        </Col>
      </Row>

      <Divider />

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => r.tipo}
          expandable={{
            expandedRowRender: (record) => {
              if (!record.detalles || record.detalles.length === 0) return null;

              // Columns para compras, contratos y depósitos
              if (record.tipo === "Contrato" || record.tipo === "Depósito") {
                const columnsDetallePrincipal =
                  record.tipo === "Contrato"
                    ? [
                        { title: "Contrato ID", dataIndex: "contratoID" },
                        { title: "Producto", dataIndex: "producto" },
                        { title: "Descripción", dataIndex: "descripcion" },
                        {
                          title: "Cantidad Contrato",
                          dataIndex: "cantidadContrato",
                          align: "right",
                          render: (v) => formatNumber(v, 2),
                        },
                        {
                          title: "Total QQ",
                          dataIndex: "totalQQ",
                          align: "right",
                          render: (v) => formatNumber(v, 2),
                        },
                        {
                          title: "Total Lps",
                          dataIndex: "totalLps",
                          align: "right",
                          render: (v) => "L. " + formatNumber(v, 2),
                        },
                        {
                          title: "Promedio Precio",
                          dataIndex: "promedioPrecio",
                          align: "right",
                          render: (v) => "L. " + formatNumber(v, 2),
                        },
                        {
                          title: "Completado",
                          dataIndex: "liquidado",
                          align: "center",
                          render: (v) => (
                            <Tag color={v === "Sí" ? "green" : "red"}>{v}</Tag>
                          ),
                        },
                      ]
                    : [
                        { title: "Depósito ID", dataIndex: "depositoID" },
                        { title: "Producto", dataIndex: "producto" },
                        {
                          title: "Fecha",
                          dataIndex: "fecha",
                          render: (v) => dayjs(v).format("DD/MM/YYYY"),
                        },
                        {
                          title: "Cantidad QQ",
                          dataIndex: "cantidadQQ",
                          align: "right",
                          render: (v) => formatNumber(v, 2),
                        },
                        {
                          title: "Total QQ Liquidado",
                          dataIndex: "totalQQLiquidado",
                          align: "right",
                          render: (v) => formatNumber(v, 2),
                        },
                        {
                          title: "Total Lps Liquidado",
                          dataIndex: "totalLpsLiquidado",
                          align: "right",
                          render: (v) => "L. " + formatNumber(v, 2),
                        },
                        {
                          title: "Promedio Precio",
                          dataIndex: "promedioPrecio",
                          align: "right",
                          render: (v) => "L. " + formatNumber(v, 2),
                        },
                        {
                          title: "Liquidado",
                          dataIndex: "liquidado",
                          align: "center",
                          render: (v) => (
                            <Tag color={v === "Sí" ? "green" : "red"}>{v}</Tag>
                          ),
                        },
                      ];

                return (
                  <Table
                    size="small"
                    columns={columnsDetallePrincipal}
                    dataSource={record.detalles}
                    pagination={false}
                    rowKey={(r) => r.contratoID || r.depositoID}
                    expandable={{
                      expandedRowRender: (item) => {
                        if (!item.detalles || item.detalles.length === 0)
                          return null;

                        const columnsDetalle = [
                          { title: "ID", dataIndex: "detalleID" },
                          {
                            title: "Fecha",
                            dataIndex: "fecha",
                            render: (v) => dayjs(v).format("DD/MM/YYYY"),
                          },
                          {
                            title: "Cantidad QQ",
                            dataIndex: "cantidadQQ",
                            align: "right",
                            render: (v) => formatNumber(v, 2),
                          },
                          {
                            title: "Precio QQ",
                            dataIndex: "precioQQ",
                            align: "right",
                            render: (v) => "L. " + formatNumber(v, 2),
                          },
                          {
                            title: "Total Lps",
                            dataIndex: "totalLps",
                            align: "right",
                            render: (v) => "L. " + formatNumber(v, 2),
                          },
                        ];

                        return (
                          <Table
                            size="small"
                            columns={columnsDetalle}
                            dataSource={item.detalles}
                            pagination={false}
                            rowKey={(r) => r.detalleID || r.id}
                          />
                        );
                      },
                    }}
                  />
                );
              }

              // Compras normales
              const columnsDetallesCompras = [
                {
                  title: "Fecha",
                  dataIndex: "fecha",
                  render: (v) => dayjs(v).format("DD/MM/YYYY"),
                },
                { title: "Producto", dataIndex: "producto" },
                {
                  title: "Cantidad QQ",
                  dataIndex: "cantidadQQ",
                  align: "right",
                  render: (v) => formatNumber(v, 2),
                },
                {
                  title: "Precio QQ",
                  dataIndex: "precioQQ",
                  align: "right",
                  render: (v) => "L. " + formatNumber(v, 2),
                },
                {
                  title: "Total Lps",
                  dataIndex: "totalLps",
                  align: "right",
                  render: (v) => "L. " + formatNumber(v, 2),
                },
              ];

              return (
                <Table
                  size="small"
                  columns={columnsDetallesCompras}
                  dataSource={record.detalles}
                  pagination={false}
                  rowKey={(r) => r.compraId || r.fecha}
                />
              );
            },
          }}
          pagination={false}
        />
      )}

      {!loading && data.length > 0 && (
        <>
          <Divider />
          <div className="grid grid-cols-3 gap-4 text-center">
            <Card>
              <Text strong>Total Quintales</Text>
              <div>{formatNumber(totales.totalQQ, 2)} QQ</div>
            </Card>
            <Card>
              <Text strong>Total Lempiras</Text>
              <div>L. {formatNumber(totales.totalLps, 2)}</div>
            </Card>
            <Card>
              <Text strong>Promedio Precio</Text>
              <div>L. {formatNumber(totales.promedioPrecio, 2)}</div>
            </Card>
          </div>
        </>
      )}
    </Card>
  );
}
