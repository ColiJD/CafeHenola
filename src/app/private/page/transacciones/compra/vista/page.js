"use client";

import { useEffect, useState, useRef } from "react";
import {
  Table,
  Row,
  Col,
  message,
  Button,
  Popconfirm,
  Dropdown,
  Menu,
} from "antd";
import TarjetasDeTotales from "@/components/DetallesCard";
import Filtros from "@/components/Filtros";
import { FiltrosTarjetas } from "@/lib/FiltrosTarjetas";
import dayjs from "dayjs";
import TarjetaMobile from "@/components/TarjetaMobile";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Link from "next/link";
import useClientAndDesktop from "@/hook/useClientAndDesktop";
import ProtectedPage from "@/components/ProtectedPage";
import { formatNumber } from "@/components/Formulario";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);
import ProtectedButton from "@/components/ProtectedButton";
import { useRouter } from "next/navigation";

export default function TablaCompras() {
  const { mounted, isDesktop } = useClientAndDesktop();
  const isMobile = mounted && !isDesktop;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const messageApiRef = useRef(messageApi);
  const router = useRouter();

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [rangoFecha, setRangoFecha] = useState([dayjs(), dayjs()]);
  const [movimientoFiltro, setMovimientoFiltro] = useState("Entrada"); // Entrada o Salida

  // 🔹 Cargar datos desde API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/compras");
      if (!res.ok) throw new Error("Error al cargar los datos");
      const data = await res.json();

      // 🔹 Filtrar por compraMovimiento
      const dataFiltrada = data.filter(
        (item) => item.compraMovimiento === movimientoFiltro
      );

      // 🔹 Agrupar por cliente y tipo de café
      const mapa = {};
      dataFiltrada.forEach((item) => {
        const key = `${item.clienteID}`;

        // Convertir a número
        const cantidad = parseFloat(item.compraCantidadQQ || 0);
        const precio = parseFloat(item.compraPrecioQQ || 0);
        const totalLps = cantidad * precio;

        if (!mapa[key]) {
          mapa[key] = {
            clienteID: item.clienteID,
            clienteNombreCompleto: item.clienteNombreCompleto,
            tipoCafeNombre: item.tipoCafeNombre,
            cantidadTotal: 0,
            totalLps: 0,
            compraMovimiento: item.compraMovimiento,
            detalles: [],
          };
        } else {
          if (!mapa[key].compraMovimiento.includes(item.compraMovimiento)) {
            mapa[key].compraMovimiento += `, ${item.compraMovimiento}`;
          }
        }

        // Sumar totales
        mapa[key].cantidadTotal += cantidad;
        mapa[key].totalLps += totalLps;

        // Guardar detalles ya como números
        mapa[key].detalles.push({
          ...item,
          compraCantidadQQ: parseFloat(item.compraCantidadQQ || 0),
          compraPrecioQQ: parseFloat(item.compraPrecioQQ || 0),
          totalLps,
        });
      });

      const groupedData = Object.values(mapa);
      setData(groupedData);
      setFilteredData(groupedData);
    } catch (error) {
      console.error(error);
      messageApiRef.current.error("No se pudieron cargar las compras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [movimientoFiltro]);

  // 🔹 Aplicar filtros
  const aplicarFiltros = () => {
    const filtros = {
      clienteNombreCompleto: nombreFiltro,
    };

    const filtrados = FiltrosTarjetas(data, filtros, rangoFecha, "compraFecha");
    setFilteredData(filtrados);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [nombreFiltro, rangoFecha, data]);

  // 🔹 Totales
  const totalQQ = filteredData.reduce(
    (acc, item) => acc + (item.cantidadTotal || 0),
    0
  );
  const totalLps = filteredData.reduce(
    (acc, item) => acc + (item.totalLps || 0),
    0
  );

  // 🔹 Columnas de tabla principal
  const columns = [
    {
      title: "ID Cliente",
      dataIndex: "clienteID",
      key: "clienteID",
      width: 50,
      fixed: "left",
      align: "center",
    },
    {
      title: "Cliente",
      align: "center",
      dataIndex: "clienteNombreCompleto",
      key: "clienteNombreCompleto",
      render: (text, record) => (
        <Link
          href={`/private/page/transacciones/compra/vista/${record.clienteID}`}
        >
          {text}
        </Link>
      ),
    },

    {
      title: "Total (QQ)",
      align: "center",
      dataIndex: "cantidadTotal",
      key: "cantidadTotal",
      render: (val) => formatNumber(val),
    },
    {
      title: "Total (Lps)",
      align: "center",
      dataIndex: "totalLps",
      key: "totalLps",
      render: (val) => formatNumber(val),
    },
  ];

  // 🔹 Columnas de detalles
  const detalleColumns = [
    {
      title: "Compra ID",
      dataIndex: "compraId",
      key: "compraId",
      fixed: "left",
      align: "center",
    },
    {
      title: "Tipo Café",
      dataIndex: "tipoCafeNombre",
      key: "tipoCafeNombre",
      align: "center",
    },
    {
      title: "Fecha",
      dataIndex: "compraFecha",
      align: "center",
      key: "compraFecha",
      render: (val) => dayjs(val, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    {
      title: "Cantidad (QQ)",
      dataIndex: "compraCantidadQQ",
      align: "center",
      key: "compraCantidadQQ",
      render: (val) => formatNumber(val),
    },
    {
      title: "Precio (Lps)",
      dataIndex: "compraPrecioQQ",
      align: "center",
      key: "compraPrecioQQ",
      render: (val) => formatNumber(val),
    },

    {
      title: "Total (Lps)",
      dataIndex: "totalLps",
      align: "center",
      key: "totalLps",
      render: (val) => formatNumber(val),
    },
    {
      title: "Sacos",
      dataIndex: "compraTotalSacos",
      align: "center",
      key: "compraTotalSacos",
      render: (val) => formatNumber(val),
    },
    {
      title: "Descripción",
      dataIndex: "compraDescripcion",
      align: "center",
      key: "compraDescripcion",
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      align: "center",
      width: 120,
      render: (text, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ProtectedButton allowedRoles={["ADMIN", "GERENCIA", "OPERARIO"]}>
            <Popconfirm
              title="¿Seguro que deseas EDITAR esta compra"
              onConfirm={() =>
                router.push(
                  `/private/page/transacciones/compra/${record.compraId}`
                )
              }
              okText="Sí"
              cancelText="No"
            >
              <Button size="small" type="default">
                Editar
              </Button>
            </Popconfirm>
          </ProtectedButton>
          <ProtectedButton allowedRoles={["ADMIN", "GERENCIA"]}>
            <Popconfirm
              title="¿Seguro que deseas eliminar esta compra"
              onConfirm={() => eliminarCompra(record.compraId)}
              okText="Sí"
              cancelText="No"
            >
              <Button size="small" danger>
                Eliminar
              </Button>
            </Popconfirm>
          </ProtectedButton>
        </div>
      ),
    },
  ];

  // Eliminar compra
  const eliminarCompra = async (compraId) => {
    try {
      const res = await fetch(`/api/compras/${compraId}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        messageApiRef.current.success("Compra eliminada correctamente");
        // Recargar datos después de eliminar
        cargarDatos();
      } else {
        messageApiRef.current.error(
          data.error || "Error al eliminar la compra"
        );
      }
    } catch (error) {
      console.error(error);
      messageApiRef.current.error("Error al eliminar la compra");
    }
  };

  return (
    <ProtectedPage
      allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}
    >
      <>
        {contextHolder}
        <div>
          {/* Tarjetas */}
          <TarjetasDeTotales
            title="Registro de Compras"
            cards={[
              {
                title: "Total (QQ)",
                value: formatNumber(totalQQ),
              },
              {
                title: "Total (Lps)",
                value: formatNumber(totalLps),
              },
            ]}
          />

          {/* Filtros */}
          <Filtros
            fields={[
              {
                type: "input",
                placeholder: "Buscar por cliente",
                value: nombreFiltro,
                setter: setNombreFiltro,
              },

              { type: "date", value: rangoFecha, setter: setRangoFecha },
            ]}
          />

          <Row style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6} md={4}>
              <Button onClick={cargarDatos} block>
                Refrescar
              </Button>
            </Col>
          </Row>

          {/* Tabla responsive */}
          {isMobile ? (
            <TarjetaMobile
              loading={loading}
              data={filteredData}
              columns={[
                {
                  label: "Cliente",
                  key: "clienteNombreCompleto",
                  render: (text, record) => (
                    <Link
                      href={`/private/page/transacciones/compra/vista/${record.clienteID}`}
                    >
                      {text}
                    </Link>
                  ),
                },

                {
                  label: "Total (QQ)",
                  key: "cantidadTotal",
                  render: (val) => formatNumber(val),
                },
                {
                  label: "Total (Lps)",
                  key: "totalLps",
                  render: (val) => formatNumber(val),
                },
              ]}
              detailsKey="detalles"
              detailsColumns={[
                { label: "Compra ID", key: "compraId" },
                { label: "Tipo Café", key: "tipoCafeNombre" },
                {
                  label: "Fecha",
                  key: "compraFecha",
                  render: (val) =>
                    dayjs(val, "YYYY-MM-DD").format("DD/MM/YYYY"),
                },
                {
                  label: "Cantidad (QQ)",
                  key: "compraCantidadQQ",
                  render: (val) => formatNumber(val),
                },
                {
                  label: "Precio (Lps/QQ)",
                  key: "compraPrecioQQ",
                  render: (val) => formatNumber(val),
                },
                {
                  label: "Total (Lps)",
                  key: "totalLps",
                  render: (val) => formatNumber(val),
                },
                {
                  label: "Sacos",
                  key: "compraTotalSacos",
                  render: (val) => formatNumber(val),
                },
                { label: "Movimiento", key: "compraMovimiento" },
                { label: "Descripción", key: "compraDescripcion" },
                {
                  label: "Acciones",
                  key: "acciones",
                  render: (_, record) => (
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "editar",
                            label: (
                              <ProtectedButton
                                allowedRoles={["ADMIN", "GERENCIA", "OPERARIO"]}
                              >
                                <Popconfirm
                                  title="¿Seguro que deseas EDITAR esta compra?"
                                  onConfirm={() =>
                                    router.push(
                                      `/private/page/transacciones/compra/${record.compraId}`
                                    )
                                  }
                                  okText="Sí"
                                  cancelText="No"
                                >
                                  <Button type="text" block>
                                    Editar
                                  </Button>
                                </Popconfirm>
                              </ProtectedButton>
                            ),
                          },
                          {
                            key: "eliminar",
                            label: (
                              <ProtectedButton
                                allowedRoles={["ADMIN", "GERENCIA"]}
                              >
                                <Popconfirm
                                  title="¿Seguro que deseas eliminar esta compra?"
                                  onConfirm={() =>
                                    eliminarCompra(record.compraId)
                                  }
                                  okText="Sí"
                                  cancelText="No"
                                >
                                  <Button type="text" danger block>
                                    Eliminar
                                  </Button>
                                </Popconfirm>
                              </ProtectedButton>
                            ),
                          },
                        ],
                      }}
                      trigger={["click"]}
                    >
                      <Button size="small" type="default" block>
                        Acciones
                      </Button>
                    </Dropdown>
                  ),
                },
              ]}
              rowKey={(item, index) =>
                `${item.clienteID}-${item.tipoCafeID ?? index}`
              }
              detailsRowKey={(item) => item.compraId}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey={(row) => `${row.clienteID}-${row.detalles[0]?.compraId}`}
              loading={loading}
              bordered
              size="middle"
              scroll={{ x: true }}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    columns={detalleColumns}
                    dataSource={record.detalles}
                    rowKey="compraId"
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ x: true }}
                  />
                ),
              }}
            />
          )}
        </div>
      </>
    </ProtectedPage>
  );
}
