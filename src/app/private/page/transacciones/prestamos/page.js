"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  message,
  Button,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  CalculatorOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import DrawerPrestamo from "@/components/Prestamos/DrawerPrestamo.jsx";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import DrawerCalculoInteres from "@/components/Prestamos/calculoInteres";
import ProtectedPage from "@/components/ProtectedPage";
import { DeleteFilled } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function PrestamosGeneral() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [dataTabla, setDataTabla] = useState([]);
  const { mounted, isDesktop } = useClientAndDesktop(); // 👈 usar hook
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openDrawerInteres, setOpenDrawerInteres] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const messageApiRef = useRef(messageApi);
  const drawerFormRef = useRef(null);

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
    if (!clienteId) return;
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

          // Solo agregar fila de "préstamo inicial" si NO está anulado
          if (!["ANULADO", "ABSORBIDO", "INICIAL"].includes(prestamo.estado)) {
            filas.push({
              key: prestamoKey,
              prestamoId: prestamo.prestamoId,
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
              totalGeneral: Number(prestamo.monto || 0),
              estado: prestamo.estado,
            });
          }

          // Mostrar movimientos activos incluso si el préstamo está anulado
          const movimientosActivos = (
            prestamo.movimientos_prestamo || []
          ).filter((mov) => mov.tipo_movimiento !== "ANULADO");

          movimientosActivos.forEach((mov, idxMov) => {
            const descripcion = [
              mov.descripcion || mov.tipo_movimiento,
              mov.observacion ? `(${mov.observacion})` : "",
            ]
              .filter(Boolean)
              .join(" ");

            filas.push({
              key: `mov-${prestamo.prestamo_id || idxPrestamo}-${idxMov}`,
              MovimientoId: mov.MovimientoId,
              fecha: mov.fecha
                ? new Date(mov.fecha).toLocaleDateString("es-HN")
                : "",
              descripcion: descripcion || "-",
              interes: mov.interes ? `${mov.interes}%` : "",
              dias: mov.tipo_movimiento === "Int-Cargo" ? mov.dias || "" : "",
              abono:
                mov.tipo_movimiento === "ABONO"
                  ? -Number(mov.monto || 0)
                  : null,
              prestamo:
                mov.tipo_movimiento === "PRESTAMO"
                  ? Number(mov.monto || 0)
                  : null,
              intCargo:
                mov.tipo_movimiento === "Int-Cargo"
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
              totalGeneral: ["PRESTAMO", "Int-Cargo"].includes(
                mov.tipo_movimiento
              )
                ? Number(mov.monto || 0)
                : -Number(mov.monto || 0),
            });
          });
        });

        // Totales
        const totales = {
          key: "total",
          descripcion: "Total general",
          abono: filas.reduce((acc, f) => acc + (f.abono || 0), 0),
          prestamo: filas.reduce((acc, f) => acc + (f.prestamo || 0), 0),
          intCargo: filas.reduce((acc, f) => acc + (f.intCargo || 0), 0),
          intAbono: filas.reduce((acc, f) => acc + (f.intAbono || 0), 0),
          anticipo: filas.reduce((acc, f) => acc + (f.anticipo || 0), 0),
          tipo: "TOTAL",
        };

        totales.totalGeneral =
          totales.prestamo +
          totales.intCargo +
          totales.abono +
          totales.intAbono +
          totales.anticipo;

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
        defaultSortOrder: "ascend",
      },
      {
        title: "Días",
        dataIndex: "dias",
        align: "center",
        width: 80,
        render: (val, record) => {
          // Solo mostrar si hay valor
          if (!val) return "";
          // Puedes poner un estilo especial si quieres, por ejemplo para Int-Cargo
          return record.tipo === "Int-Cargo" ? (
            <Text style={{ color: "#fa8c16", fontWeight: 500 }}>{val}</Text>
          ) : (
            val
          );
        },
      },

      { title: "% Interés", dataIndex: "interes", align: "center", width: 90 },
      {
        title: "Descripción / Observación",
        dataIndex: "descripcion",
        width: 250,
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
        title: "Préstamo",
        dataIndex: "prestamo",
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
        title: "Int-Cargo",
        dataIndex: "intCargo",
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
        title: "Int-Abono",
        dataIndex: "intAbono",
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
          const color = val > 0 ? "#52c41a" : val < 0 ? "#ff4d4f" : "#000";
          return (
            <Text strong style={{ fontSize: 16, color }}>
              {formatted}
            </Text>
          );
        },
      },
      {
        title: "Acciones",
        key: "acciones",
        fixed: isDesktop ? "right" : false,
        width: 100,
        align: "center",
        render: (_, record) => {
          // No mostrar para totales, préstamo inicial o ya anulados
          if (
            record.tipo === "TOTAL" ||
            record.tipo === "ANULADO" ||
            record.estado === "ANULADO"
          )
            return null;

          const tipo = record.MovimientoId ? "MOVIMIENTO" : "PRESTAMO";
          const id = record.MovimientoId || record.prestamoId;

          return (
            <Popconfirm
              title={`¿Anular ${
                tipo === "MOVIMIENTO" ? "movimiento" : "préstamo"
              }? Esta acción no se puede deshacer.`}
              okText="Sí, anular"
              cancelText="Cancelar"
              okType="danger"
              onConfirm={() => handleAnular(id, tipo)}
            >
              <Button size="small" danger icon={<DeleteFilled />} />
            </Popconfirm>
          );
        },
      },
    ],
    [isDesktop]
  );

  const handleAnular = async (id, tipo) => {
    try {
      console.log(`Anulando ${tipo} ID:`, id);

      let endpoint = "";
      if (tipo === "MOVIMIENTO") {
        endpoint = `/api/prestamos/movimiento/${id}`;
      } else if (tipo === "PRESTAMO") {
        // ⚠️ Aquí usamos el mismo id que viene de la tabla, en la ruta
        endpoint = `/api/prestamos/${id}`;
      } else {
        throw new Error("Tipo inválido");
      }

      const res = await fetch(endpoint, {
        method: "DELETE", // DELETE seguirá usándose pero la API solo actualiza el estado
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})); // evita crash si no hay JSON
        throw new Error(
          data?.error || `No se pudo anular el ${tipo.toLowerCase()}`
        );
      }

      messageApiRef.current.success(
        `${
          tipo === "MOVIMIENTO" ? "Movimiento" : "Préstamo"
        } anulado correctamente`
      );

      // Recarga los movimientos/préstamos del cliente
      if (clienteSeleccionado?.clienteID) {
        await cargarPrestamos(clienteSeleccionado.clienteID);
      }
    } catch (err) {
      console.error(err);
      messageApiRef.current.error(
        err.message || `Error al anular ${tipo.toLowerCase()}`
      );
    }
  };

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
            interes: nuevoRegistro.interes || 0,
            dias: nuevoRegistro.dias || 0,
            observacion: nuevoRegistro.observacion,
          }),
        });
      }

      const data = await res.json();

      if (res.ok) {
        messageApiRef.current.destroy();
        messageApiRef.current.success(
          data.message || "Registro guardado correctamente"
        );

        await cargarPrestamos(clienteSeleccionado.clienteID);

        // 🔹 Resetear el formulario usando la ref
        drawerFormRef.current?.resetFields();

        // 🔹 Cerrar Drawer
        setOpenDrawer(false);
        return;
      }

      // Si hubo error, solo mostrar mensaje
      messageApiRef.current.destroy();
      messageApiRef.current.error(data.error || "Error al guardar registro");
    } catch (error) {
      messageApiRef.current.destroy();
      messageApiRef.current.error({
        content: data.error || "Error al guardar",
        duration: 8, // 8 segundos
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedPage
      allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}
    >
      <>
        {contextHolder}
        <div style={{ background: "#f0f2f5", minHeight: "100vh" }}>
          <Card
            title={
              <Title level={isDesktop ? 3 : 4}>Préstamos y Anticipos</Title>
            }
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
                    option?.children
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  value={
                    clienteSeleccionado
                      ? clienteSeleccionado.clienteID
                      : undefined
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
                    >
                      Ingresar Movimiento
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setOpenDrawerInteres(true)}
                      icon={<CalculatorOutlined />}
                    >
                      Calculo de Interes
                    </Button>

                    <Button
                      danger
                      onClick={() =>
                        clienteSeleccionado &&
                        cargarPrestamos(clienteSeleccionado.clienteID)
                      }
                      icon={<ReloadOutlined />}
                    >
                      Recargar
                    </Button>
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

                    <Descriptions.Item
                      label={<Text strong>Nombre Completo</Text>}
                    >
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
              onSubmit={handleAgregarPrestamo}
              cliente={clienteSeleccionado}
              formRef={drawerFormRef}
            />
            <DrawerCalculoInteres
              open={openDrawerInteres}
              onClose={() => setOpenDrawerInteres(false)}
              onSubmit={handleAgregarPrestamo}
              cliente={clienteSeleccionado}
            />
          </Card>
        </div>
      </>
    </ProtectedPage>
  );
}
