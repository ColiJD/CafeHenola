"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Divider,
  message,
  Spin,
  Space,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import { formatNumber } from "@/components/Formulario";
import ProtectedPage from "@/components/ProtectedPage";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import SectionHeader from "@/components/ReportesElement/AccionesResporte";
import {
  CalendarOutlined,
  AppstoreOutlined,
  DollarOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import EstadisticasCards from "@/components/ReportesElement/DatosEstadisticos";
import {
  columnasPorTipo,
  columnsDetalleInterno,
  columns,
  columnsPrestamos,
  prestamosMovi,
} from "./columnas";

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
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { mounted, isDesktop } = useClientAndDesktop();

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

      // 🔹 Prestamos
      const detallesPrestamos = (json.movimientos.Prestamos || []).map((p) => {
        const movimientos = (p.movimientos || []).map((m) => ({
          movimientoId: m.movimientoId,
          fecha: m.fecha,
          tipo: m.tipo,
          monto: Number(m.monto) || 0,
          interes: Number(m.interes) || 0,
          descripcion: m.descripcion || "-",
        }));

        // 🔹 Agregar el préstamo base como un "movimiento"
        movimientos.unshift({
          movimientoId: `prestamo-${p.prestamoId}`,
          fecha: p.fecha,
          tipo: "PRÉSTAMO",
          monto: Number(p.monto) || 0,
          interes: 0,
          descripcion: "Monto del préstamo",
        });

        // Totales por préstamo
        // Monto = préstamo base + ANTICIPO + Int-Cargo (solo monto)
        const monto = movimientos
          .filter((m) =>
            ["PRÉSTAMO", "ANTICIPO", "CARGO_INTERES", "Int-Cargo"].includes(
              m.tipo
            )
          )
          .reduce((sum, m) => sum + m.monto, 0);

        const abonado = movimientos
          .filter((m) => ["PAGO_INTERES", "ABONO"].includes(m.tipo))
          .reduce((sum, m) => sum + m.monto, 0);

        const total = monto - abonado;
        // 🔹 Determinar estado automático
        const estado = abonado >= monto ? "COMPLETADO" : "PENDIENTE";

        return {
          prestamoId: p.prestamoId,
          fecha: p.fecha,
          monto,
          abonado,
          total,
          tipo: p.tipo || "-",
          estado,
          tasaInteres: Number(p.tasaInteres) || 0,
          observacion: p.observacion || "-",
          movimientos, // detalles
        };
      });

      setPrestamos(detallesPrestamos);

      // 🔹 Calcular totales de préstamos
      const totalPrestamosMonto = detallesPrestamos.reduce(
        (sum, p) => sum + p.monto,
        0
      );
      const totalPrestamosAbonado = detallesPrestamos.reduce(
        (sum, p) => sum + p.abonado,
        0
      );
      const totalPrestamosRestante = detallesPrestamos.reduce(
        (sum, p) => sum + p.total,
        0
      );

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
        // 🔹 Totales de préstamos
        prestamosMonto: totalPrestamosMonto,
        prestamosAbonado: totalPrestamosAbonado,
        prestamosRestante: totalPrestamosRestante,
      });
    } catch (err) {
      console.error(err);
      message.error("No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedPage
      allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}
    >
      <Card>
        <SectionHeader
          isDesktop={isDesktop}
          loading={loading}
          icon={<CalendarOutlined />}
          titulo="Registros por Cliente"
          subtitulo="Resumen de actividades por cliente"
        />

        <Divider />

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Cliente:</Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Seleccione un cliente"
                showSearch
                optionFilterProp="children"
                value={clienteID}
                onChange={setClienteID}
                options={clientes.map((c) => ({
                  value: c.clienteID,
                  label: `${c.clienteNombre} ${c.clienteApellido}`,
                }))}
              />
            </Space>
          </Col>

          <Col xs={24} sm={12} md={10} lg={8}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Rango de fechas:</Text>
              <RangePicker
                style={{ width: "100%" }}
                value={fechaRango}
                format="DD/MM/YYYY"
                onChange={(val) => setFechaRango(val || [])}
              />
            </Space>
          </Col>

          <Col xs={24} sm={12} md={10} lg={8}>
            <Button
              type="primary"
              size="large"
              onClick={fetchCompras}
              disabled={!clienteID}
              style={{ width: "100%", marginTop: 24 }}
            >
              Buscar Registros
            </Button>
          </Col>
        </Row>

        {totales && (
          <>
            <Divider />
            <EstadisticasCards
              isDesktop={isDesktop}
              data={[
                {
                  titulo: "Total Quintales",
                  valor: formatNumber(totales.totalQQ, 2),
                  prefix: "QQ.",
                  color: "#52c41a",
                  icon: <AppstoreOutlined style={{ color: "#52c41a" }} />,
                },
                {
                  titulo: "Total Lempiras",
                  valor: formatNumber(totales.totalLps, 2),
                  prefix: "L.",
                  color: "#1890ff",
                  icon: <DollarOutlined style={{ color: "#1890ff" }} />,
                },
                {
                  titulo: "Promedio Precio",
                  valor: formatNumber(totales.promedioPrecio, 2),
                  prefix: "L.",
                  color: "#faad14",
                  icon: <LineChartOutlined style={{ color: "#faad14" }} />,
                },
              ]}
            />

            {prestamos.length > 0 && (
              <>
                <Divider />
                <EstadisticasCards
                  isDesktop={isDesktop}
                  data={[
                    {
                      titulo: "Monto Total Préstamos",
                      valor: formatNumber(totales.prestamosMonto, 2),
                      prefix: "L.",
                      color: "#722ed1",
                      icon: <DollarOutlined style={{ color: "#722ed1" }} />,
                    },
                    {
                      titulo: "Monto Abonado",
                      valor: formatNumber(totales.prestamosAbonado, 2),
                      prefix: "L.",
                      color: "#52c41a",
                      icon: <DollarOutlined style={{ color: "#52c41a" }} />,
                    },
                    {
                      titulo: "Monto Restante",
                      valor: formatNumber(totales.prestamosRestante, 2),
                      prefix: "L.",
                      color: "#cf1322",
                      icon: <DollarOutlined style={{ color: "#cf1322" }} />,
                    },
                  ]}
                />
              </>
            )}
          </>
        )}

        <Divider />

        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 40 }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            rowKey={(r) => r.tipo}
            expandable={{
              expandedRowRender: (record) => {
                if (!record.detalles?.length) return null;
                const col =
                  columnasPorTipo[record.tipo] || columnasPorTipo.Compra;

                return (
                  <Table
                    size="small"
                    columns={col}
                    dataSource={record.detalles}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    rowKey={(r) =>
                      r.contratoID || r.depositoID || r.compraId || r.id
                    }
                    expandable={{
                      expandedRowRender: (item) =>
                        item.detalles?.length ? (
                          <Table
                            scroll={{ x: "max-content" }}
                            size="small"
                            columns={columnsDetalleInterno}
                            dataSource={item.detalles}
                            pagination={false}
                            rowKey={(r) => r.detalleID || r.id}
                          />
                        ) : null,
                    }}
                  />
                );
              },
            }}
            pagination={false}
          />
        )}

        {!loading && data.length > 0 && prestamos.length > 0 && (
          <>
            <Divider />
            <Title level={4}>Préstamos y Anticipos</Title>
            <Table
              columns={columnsPrestamos}
              dataSource={prestamos}
              rowKey="prestamoId"
              scroll={{ x: "max-content" }}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    size="small"
                    columns={prestamosMovi}
                    dataSource={record.movimientos}
                    pagination={false}
                    rowKey="movimientoId"
                    scroll={{ x: "max-content" }}
                  />
                ),
              }}
              pagination={false}
            />
            <Divider />
          </>
        )}
      </Card>
    </ProtectedPage>
  );
}
