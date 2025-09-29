"use client";

import { useEffect, useState } from "react";
import { Table, Row, Col, message, Button } from "antd";
import { truncarDosDecimalesSinRedondear } from "@/lib/calculoCafe";
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

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

export default function TablaCompras() {
  const { mounted, isDesktop } = useClientAndDesktop();
  const isMobile = mounted && !isDesktop;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombreFiltro, setNombreFiltro] = useState("");
  const [tipoCafeFiltro, setTipoCafeFiltro] = useState("");
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
        const key = `${item.clienteID}-${item.tipoCafeID}`;

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
      message.error("No se pudieron cargar las compras");
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
      tipoCafeNombre: tipoCafeFiltro,
    };

    const filtrados = FiltrosTarjetas(data, filtros, rangoFecha, "compraFecha");
    setFilteredData(filtrados);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [nombreFiltro, tipoCafeFiltro, rangoFecha, data]);

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
    { title: "ID Cliente", dataIndex: "clienteID", key: "clienteID" },
    {
      title: "Cliente",
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
    { title: "Tipo Café", dataIndex: "tipoCafeNombre", key: "tipoCafeNombre" },
    {
      title: "Total (QQ)",
      dataIndex: "cantidadTotal",
      key: "cantidadTotal",
      render: (val) => truncarDosDecimalesSinRedondear(val),
    },
    {
      title: "Total (Lps)",
      dataIndex: "totalLps",
      key: "totalLps",
      render: (val) => truncarDosDecimalesSinRedondear(val),
    },
  ];

  // 🔹 Columnas de detalles
  const detalleColumns = [
    { title: "Compra ID", dataIndex: "compraId", key: "compraId" },
    {
      title: "Fecha",
      dataIndex: "compraFecha",
      key: "compraFecha",
      render: (val) => dayjs(val, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    {
      title: "Cantidad (QQ)",
      dataIndex: "compraCantidadQQ",
      key: "compraCantidadQQ",
      render: (val) => truncarDosDecimalesSinRedondear(val),
    },
    {
      title: "Precio (Lps/QQ)",
      dataIndex: "compraPrecioQQ",
      key: "compraPrecioQQ",
      render: (val) => truncarDosDecimalesSinRedondear(val),
    },

    {
      title: "Total (Lps)",
      dataIndex: "totalLps",
      key: "totalLps",
      render: (val) => truncarDosDecimalesSinRedondear(val),
    },
    {
      title: "Movimiento",
      dataIndex: "compraMovimiento",
      key: "compraMovimiento",
    },
    {
      title: "Descripción",
      dataIndex: "compraDescripcion",
      key: "compraDescripcion",
    },
  ];

  return (
    <ProtectedPage
      allowedRoles={["ADMIN", "GERENCIA", "OPERARIOS", "AUDITORES"]}
    >
      <div>
        {/* Tarjetas */}
        <TarjetasDeTotales
          title="Registro de Compras"
          cards={[
            {
              title: "Total (QQ)",
              value: truncarDosDecimalesSinRedondear(totalQQ),
            },
            {
              title: "Total (Lps)",
              value: truncarDosDecimalesSinRedondear(totalLps),
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
            {
              type: "select",
              placeholder: "Tipo de café",
              value: tipoCafeFiltro || undefined,
              setter: setTipoCafeFiltro,
              allowClear: true,
              options: [...new Set(data.map((d) => d.tipoCafeNombre))],
            },
            {
              type: "select",
              value: movimientoFiltro,
              setter: setMovimientoFiltro,
              options: [
                { value: "Entrada", label: "Entrada" },
                { value: "Salida", label: "Salida" },
              ],
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
              { label: "Tipo Café", key: "tipoCafeNombre" },
              {
                label: "Total (QQ)",
                key: "cantidadTotal",
                render: (val) => truncarDosDecimalesSinRedondear(val),
              },
              {
                label: "Total (Lps)",
                key: "totalLps",
                render: (val) => truncarDosDecimalesSinRedondear(val),
              },
              { label: "Movimiento", key: "compraMovimiento" },
            ]}
            detailsKey="detalles"
            detailsColumns={[
              { label: "Compra ID", key: "compraId" },
              {
                label: "Fecha",
                key: "compraFecha",
                render: (val) => dayjs(val, "YYYY-MM-DD").format("DD/MM/YYYY"),
              },
              {
                label: "Cantidad (QQ)",
                key: "compraCantidadQQ",
                render: (val) => truncarDosDecimalesSinRedondear(val),
              },
              {
                label: "Precio (Lps/QQ)",
                key: "compraPrecioQQ",
                render: (val) => truncarDosDecimalesSinRedondear(val),
              },
              {
                label: "Total (Lps)",
                key: "totalLps",
                render: (val) => truncarDosDecimalesSinRedondear(val),
              },
              { label: "Movimiento", key: "compraMovimiento" },
              { label: "Descripción", key: "compraDescripcion" },
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
            rowKey={(row) =>
              `${row.clienteID}-${row.tipoCafeID ?? row.detalles[0]?.compraId}`
            }
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
                  rowKey="compraId"
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
    </ProtectedPage>
  );
}
