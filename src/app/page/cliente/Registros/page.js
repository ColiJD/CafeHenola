"use client";

import { useEffect, useState } from "react";
import {
  Table,
  message,
  Input,
  Space,
  Card,
  Row,
  Col,
  Grid,
  Button,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { obtenerClientesSelect } from "@/lib/consultas";
import TarjetaMobile from "@/components/TarjetaMobile";

const { useBreakpoint } = Grid;

export default function ClientesPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // 🔹 Cargar clientes usando la función exportada
  const cargarClientes = async () => {
    setLoading(true);
    try {
      const clientesSelect = await obtenerClientesSelect(message);
      // Transformar al formato original de cliente
      const clientes = clientesSelect.map((c) => {
        const cliente = c.data;
        return {
          ...cliente,
          clienteNombreCompleto: `${cliente.clienteNombre || ""} ${
            cliente.clienteApellido || ""
          }`,
          detalles: [cliente], // 🔹 todos los demás campos se mostrarán en detalles
        };
      });
      setData(clientes);
      setFilteredData(clientes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // 🔎 Filtrar por nombre y apellido
  const handleSearch = (value) => {
    setSearchText(value);
    if (value) {
      const filtro = data.filter((c) =>
        `${c.clienteNombre || ""} ${c.clienteApellido || ""}`
          .toLowerCase()
          .includes(value.toLowerCase())
      );
      setFilteredData(filtro);
    } else {
      setFilteredData(data);
    }
  };

  // Departamentos únicos para filtros de tabla
  const departamentos = [
    ...new Set(data.map((c) => c.clienteDepartament).filter(Boolean)),
  ];

  // 👀 Columnas principales
  const columns = [
    { title: "ID", dataIndex: "clienteID", key: "id", width: 70 },
    {
      title: "Nombre",
      dataIndex: "clienteNombre",
      key: "nombre",
      sorter: (a, b) =>
        (a.clienteNombre || "").localeCompare(b.clienteNombre || ""),
    },
    {
      title: "Apellido",
      dataIndex: "clienteApellido",
      key: "apellido",
      sorter: (a, b) =>
        (a.clienteApellido || "").localeCompare(b.clienteApellido || ""),
    },
    { title: "Teléfono", dataIndex: "clienteTelefono", key: "telefono" },
    { title: "Cédula", dataIndex: "clienteCedula", key: "cedula" },
    {
      title: "Departamento",
      dataIndex: "clienteDepartament",
      key: "departamento",
      filters: departamentos.map((d) => ({ text: d, value: d })),
      onFilter: (value, record) => record.clienteDepartament === value,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: screens.xs ? "18px" : "22px" }}>
        Lista de Clientes
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
        <Col xs={24} sm={12} md={6}>
          <Input.Search
            placeholder="Buscar por nombre o apellido"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: "100%" }}
            value={searchText}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Button onClick={cargarClientes} block>
            Refrescar
          </Button>
        </Col>
      </Row>

      {/* 👀 Vista móvil → tarjetas */}
      {isMobile ? (
        <TarjetaMobile
          data={filteredData}
          loading={loading} // 🔹 Spinner mientras carga
          columns={[
            {
              label: "Nombre",
              key: "clienteNombreCompleto",
              render: (v, item) =>
                `${item.clienteNombre || ""} ${item.clienteApellido || ""}`,
            },
            { label: "ID", key: "clienteID" },
          ]}
          detailsKey="detalles"
          detailsColumns={[
            {
              label: "Teléfono",
              key: "clienteTelefono",
              render: (v) => v || "N/A",
            },
            {
              label: "Municipio",
              key: "clienteMunicipio",
              render: (v) => v || "N/A",
            },
            {
              label: "Departamento",
              key: "clienteDepartament",
              render: (v) => v || "N/A",
            },
            {
              label: "Cédula",
              key: "clienteCedula",
              render: (v) => v || "N/A",
            },
            { label: "RTN", key: "clienteRTN", render: (v) => v || "N/A" },
            {
              label: "Clave IHCAFE",
              key: "claveIHCAFE",
              render: (v) => v || "N/A",
            },
            {
              label: "Dirección",
              key: "clienteDirecion",
              render: (v) => v || "N/A",
            },
          ]}
        />
      ) : (
        // 👀 Vista tablet/desktop → tabla con expandibles
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="clienteID"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 5 }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small" title="Detalles del Cliente" type="inner">
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12}>
                    <p>
                      <b>Municipio:</b> {record.clienteMunicipio || "N/A"}
                    </p>
                    <p>
                      <b>Clave IHCAFE:</b> {record.claveIHCAFE || "N/A"}
                    </p>
                  </Col>
                  <Col xs={24} sm={12}>
                    <p>
                      <b>RTN:</b> {record.clienteRTN || "N/A"}
                    </p>
                    <p>
                      <b>Dirección:</b> {record.clienteDirecion || "N/A"}
                    </p>
                  </Col>
                </Row>
              </Card>
            ),
          }}
        />
      )}
    </div>
  );
}
