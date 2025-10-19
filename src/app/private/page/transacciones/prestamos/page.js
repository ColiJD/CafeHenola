"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Card,
  Select,
  Typography,
  Space,
  Divider,
  Spin,
  Descriptions,
  Row,
  Col,
  Tag,
  Empty,
  Button,
} from "antd";
import {
  PlusOutlined,
  CalculatorOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import DrawerPrestamo from "@/components/Prestamos/DrawerPrestamo.jsx";
import useClientAndDesktop from "@/hook/useClientAndDesktop";

const { Title, Text } = Typography;

export default function PrestamosGeneral() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [dataTabla, setDataTabla] = useState([]);
  const { mounted, isDesktop } = useClientAndDesktop(); // 👈 usar hook
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) throw new Error("Error al cargar clientes");
        const data = await res.json();
        setClientes(data);
      } catch (err) {
        setError("No se pudieron cargar los clientes");
        console.error(err);
      }
    };
    cargarClientes();
  }, []);

  const cargarPrestamos = useCallback(async (clienteId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/prestamos/${clienteId}`);
      if (!res.ok) throw new Error("Error al cargar préstamos");
      const data = await res.json();
      setClienteSeleccionado(data);

      if (data?.prestamos?.length > 0) {
        const filas = [];

        data.prestamos.forEach((prestamo, idxPrestamo) => {
          const prestamoKey = `prestamo-${prestamo.prestamo_id || idxPrestamo}`;
          if (
            prestamo.estado !== "INICIAL" &&
            prestamo.estado !== "ABSORBIDO"
          ) {
            filas.push({
              key: prestamoKey,
              fecha: prestamo.fecha
                ? new Date(prestamo.fecha).toLocaleDateString("es-HN")
                : "",
              interes: prestamo.tasa_interes ? `${prestamo.tasa_interes}%` : "",
              descripcion: prestamo.observacion || "Préstamo inicial",
              abono: null,
              prestamo: Number(prestamo.monto || 0),
              intCargo: null,
              intAbono: null,
              anticipo: null,
              tipo: "PRESTAMO_INICIAL",
              totalGeneral: Number(prestamo.monto || 0), // ← agregar aquí para que se vea
            });
          }

          (prestamo.movimientos_prestamo || []).forEach((mov, idxMov) => {
            const descripcion = [
              mov.descripcion || "",
              mov.observacion ? `(${mov.observacion})` : "",
            ]
              .filter(Boolean)
              .join(" ");

            filas.push({
              key: `mov-${prestamo.prestamo_id || idxPrestamo}-${idxMov}`,
              fecha: mov.fecha
                ? new Date(mov.fecha).toLocaleDateString("es-HN")
                : "",
              descripcion: descripcion || "-",
              abono: ["ABONO", "ABONO_INTERES", "PAGO_INTERES"].includes(
                mov.tipo_movimiento
              )
                ? -Number(mov.monto || 0)
                : null,
              prestamo:
                mov.tipo_movimiento === "PRESTAMO"
                  ? Number(mov.monto || 0)
                  : null,
              intCargo:
                mov.tipo_movimiento === "CARGO_INTERES"
                  ? Number(mov.monto || 0)
                  : null,
              intAbono: ["ABONO_INTERES", "PAGO_INTERES"].includes(
                mov.tipo_movimiento
              )
                ? -Number(mov.monto || 0)
                : null,
              anticipo:
                mov.tipo_movimiento === "ANTICIPO"
                  ? -Number(mov.monto || 0)
                  : null,
              tipo: mov.tipo_movimiento,
              totalGeneral:
                mov.tipo_movimiento === "PRESTAMO" ||
                mov.tipo_movimiento === "CARGO_INTERES"
                  ? Number(mov.monto || 0)
                  : -Number(mov.monto || 0),
            });
          });
        });

        const totales = {
          key: "total",
          descripcion: "Total general",
          abono: filas.reduce((acc, f) => acc + (f.abono || 0), 0),
          prestamo: filas.reduce((acc, f) => acc + (f.prestamo || 0), 0),
          intCargo: filas.reduce((acc, f) => acc + (f.intCargo || 0), 0),
          intAbono: filas.reduce((acc, f) => acc + (f.intAbono || 0), 0),
          anticipo: filas.reduce((acc, f) => acc + (f.anticipo || 0), 0), // ← sumar anticipos
          tipo: "TOTAL",
        };

        totales.totalGeneral =
          totales.prestamo +
          totales.intCargo +
          totales.abono + // abonos negativos
          totales.intAbono + // intAbonos negativos
          totales.anticipo; // anticipos negativos
        filas.push(totales);

        setDataTabla(filas);
      } else {
        setDataTabla([]);
      }
    } catch (err) {
      setError("Error al cargar los préstamos del cliente");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const columnas = useMemo(
    () => [
      {
        title: "Fecha",
        dataIndex: "fecha",
        width: 110,
        fixed: isDesktop ? "left" : false,
        sorter: (a, b) => {
          const dateA = a.fecha
            ? new Date(a.fecha.split("/").reverse().join("/"))
            : 0;
          const dateB = b.fecha
            ? new Date(b.fecha.split("/").reverse().join("/"))
            : 0;
          return dateA - dateB;
        },
        sortDirections: ["ascend", "descend"], // solo estos dos, no hay opción de "none"
        defaultSortOrder: "descend",
      },
      { title: "% Interés", dataIndex: "interes", align: "center", width: 90 },
      {
        title: "Descripción / Observación",
        dataIndex: "descripcion",
        ellipsis: true,
        render: (text, record) => {
          if (record.tipo === "TOTAL") return <Text strong>{text}</Text>;
          if (record.tipo === "PRESTAMO_INICIAL")
            return (
              <Text strong style={{ color: "#1890ff" }}>
                {text}
              </Text>
            );
          return text;
        },
      },
      {
        title: "Anticipo",
        dataIndex: "anticipo",
        align: "right",
        width: 120,
        render: (val, record) =>
          val ? (
            record.tipo === "TOTAL" ? (
              <Text strong style={{ color: "#722ed1" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={{ color: "#722ed1" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )
          ) : (
            ""
          ),
      },

      {
        title: "Abono",
        dataIndex: "abono",
        align: "right",
        width: 120,
        render: (val, record) =>
          val ? (
            record.tipo === "TOTAL" ? (
              <Text strong style={{ color: "#52c41a" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={{ color: "#52c41a" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )
          ) : (
            ""
          ),
      },
      {
        title: "Préstamo",
        dataIndex: "prestamo",
        align: "right",
        width: 120,
        render: (val, record) =>
          val ? (
            record.tipo === "TOTAL" ? (
              <Text strong style={{ color: "#ff4d4f" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={{ color: "#ff4d4f" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )
          ) : (
            ""
          ),
      },
      {
        title: "Int-Cargo",
        dataIndex: "intCargo",
        align: "right",
        width: 120,
        render: (val, record) =>
          val ? (
            record.tipo === "TOTAL" ? (
              <Text strong style={{ color: "#fa8c16" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={{ color: "#fa8c16" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )
          ) : (
            ""
          ),
      },
      {
        title: "Int-Abono",
        dataIndex: "intAbono",
        align: "right",
        width: 120,
        render: (val, record) =>
          val ? (
            record.tipo === "TOTAL" ? (
              <Text strong style={{ color: "#13c2c2" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={{ color: "#13c2c2" }}>
                {val.toLocaleString("es-HN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )
          ) : (
            ""
          ),
      },
      {
        title: "Saldo Total",
        dataIndex: "totalGeneral",
        align: "right",
        width: 140,
        fixed: isDesktop ? "right" : false,
        render: (val, record) => {
          if (val == null) return "";
          const formatted = val.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const color = val > 0 ? "#ff4d4f" : val < 0 ? "#52c41a" : "#000";
          return (
            <Text strong style={{ fontSize: 16, color }}>
              {formatted}
            </Text>
          );
        },
      },
    ],
    [isDesktop]
  );

  const handleAgregarPrestamo = async (nuevoRegistro) => {
    try {
      setLoading(true);

      let res;

      if (nuevoRegistro.tipo === "PRESTAMO") {
        // 1️⃣ Registrar un préstamo nuevo
        res = await fetch("/api/prestamos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteID: nuevoRegistro.clienteID,
            monto: nuevoRegistro.monto,
            tasa_interes: nuevoRegistro.tasa_interes,
            fecha: nuevoRegistro.fecha,
            observacion: nuevoRegistro.observacion,
            estado: "ACTIVO",
          }),
        });
      } else {
        // 2️⃣ Registrar un movimiento (anticipo, abono, pago de interés)
        res = await fetch("/api/prestamos/movimiento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteID: nuevoRegistro.clienteID,
            tipo_movimiento: nuevoRegistro.tipo,
            monto: nuevoRegistro.monto,
            fecha: nuevoRegistro.fecha,
            observacion: nuevoRegistro.observacion,
          }),
        });
      }

      // 3️⃣ Manejo de errores detallado
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error detalle del fetch:", errorText);
        throw new Error(`Error al guardar ${nuevoRegistro.tipo.toLowerCase()}`);
      }

      // 4️⃣ Volver a cargar los préstamos actualizados
      await cargarPrestamos(nuevoRegistro.clienteID);

      // 5️⃣ Cerrar Drawer
      setOpenDrawer(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      message.error(error.message || "Ocurrió un error al guardar el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh" }}>
      <Card
        title={<Title level={isDesktop ? 3 : 4}>Préstamos y Anticipos</Title>}
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row
          gutter={[8, 8]}
          align="middle"
          justify="start"
          style={{ marginBottom: 24 }}
        >
          {/* Select del cliente */}
          <Col xs={24} sm={24} md={12} lg={8} xl={6}>
            <Select
              showSearch
              placeholder="🔍 Buscar cliente..."
              style={{ width: "100%" }}
              onChange={cargarPrestamos}
              optionFilterProp="children"
              size="large"
              loading={clientes.length === 0}
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              value={
                clienteSeleccionado ? clienteSeleccionado.clienteID : undefined
              } // ✅ asegúrate que sea solo el ID
            >
              {clientes.map((c) => (
                <Select.Option key={c.clienteID} value={c.clienteID}>
                  {`${c.clienteNombre} ${c.clienteApellido}`}
                </Select.Option>
              ))}
            </Select>
          </Col>

          {/* Botones solo si hay cliente seleccionado */}
          {clienteSeleccionado && (
            <Col xs={24} sm={24} md={12} lg={16} xl={18}>
              <Space wrap style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setOpenDrawer(true)}
                />
                <Button
                  type="default"
                  onClick={() => console.log("Registrar abono")}
                  icon={<CalculatorOutlined />}
                />

                <Button
                  danger
                  onClick={() => console.log("Eliminar préstamo")}
                  icon={<ReloadOutlined />}
                />
              </Space>
            </Col>
          )}
        </Row>

        {clienteSeleccionado && (
          <>
            <Card
              size="small"
              style={{ marginBottom: 24, background: "#fafafa" }}
            >
              <Descriptions
                bordered
                size="small"
                column={{
                  xs: 1, // móviles
                  sm: 1, // tablets pequeñas
                  md: 2, // tablets grandes
                  lg: 3, // escritorio
                  xl: 3,
                  xxl: 3,
                }}
              >
                <Descriptions.Item label={<Text strong>ID Cliente</Text>}>
                  <Tag color="blue">{clienteSeleccionado.clienteID}</Tag>
                </Descriptions.Item>

                <Descriptions.Item label={<Text strong>Nombre Completo</Text>}>
                  <Text strong style={{ color: "#1890ff", fontSize: 15 }}>
                    {clienteSeleccionado.clienteNombre}{" "}
                    {clienteSeleccionado.clienteApellido}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label={<Text strong>Cédula</Text>}>
                  <Text style={{ fontSize: 15 }}>
                    {clienteSeleccionado.clienteCedula || "N/A"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}

        <Divider />

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : dataTabla.length > 0 ? (
          <Table
            dataSource={dataTabla}
            columns={columnas}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 800 }} // 🔹 Activa scroll horizontal
            style={{
              overflowX: "auto",
              fontSize: "12px", // 🔹 Letras más pequeñas
            }}
            rowClassName={(record) =>
              record.tipo === "TOTAL" ? "total-row" : ""
            }
          />
        ) : clienteSeleccionado ? (
          <Empty description="No hay movimientos registrados para este cliente" />
        ) : (
          <Empty description="Seleccione un cliente para ver sus préstamos" />
        )}
        <DrawerPrestamo
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          placement="left"
          onSubmit={handleAgregarPrestamo}
          cliente={clienteSeleccionado}
        />
      </Card>
    </div>
  );
}
