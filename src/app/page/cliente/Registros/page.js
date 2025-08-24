"use client";

import { useEffect, useState } from "react";
import { Table, message, Input, Space, Card, Row, Col, Grid } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { useBreakpoint } = Grid;

export default function ClientesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const screens = useBreakpoint(); // detecta si es móvil o no

  useEffect(() => {
    async function fetchClientes() {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) throw new Error("Error al obtener clientes");
        const clientes = await res.json();
        setData(clientes);
        setFilteredData(clientes);
      } catch (error) {
        message.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, []);

  // 🔎 Filtrar por nombre + apellido
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

  // Municipios y departamentos únicos para filtros
  const municipios = [
    ...new Set(data.map((c) => c.clienteMunicipio).filter(Boolean)),
  ];
  const departamentos = [
    ...new Set(data.map((c) => c.clienteDepartament).filter(Boolean)),
  ];

  // 👀 Columnas principales (para desktop/tablet)
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
    {
      title: "Cédula",
      dataIndex: "clienteCedula",
      key: "cedula",
    },
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

      {/* 🔎 Barra de búsqueda */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Buscar por nombre o apellido"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: screens.xs ? "100%" : 300 }}
          value={searchText}
        />
      </Space>

      {/* 👀 Vista en móviles → Tarjetas */}
      {screens.xs ? (
        <Row gutter={[16, 16]}>
          {filteredData.map((cliente) => (
            <Col span={24} key={cliente.clienteID}>
              <Card
                title={`${cliente.clienteNombre || ""} ${
                  cliente.clienteApellido || ""
                }`}
                type="inner"
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <p>
                  <b>ID:</b> {cliente.clienteID}
                </p>
                <p>
                  <b>Teléfono:</b> {cliente.clienteTelefono || "N/A"}
                </p>
                <p>
                  <b>Municipio:</b> {cliente.clienteMunicipio || "N/A"}
                </p>
                <p>
                  <b>Departamento:</b> {cliente.clienteDepartament || "N/A"}
                </p>
                <hr />
                <p>
                  <b>Cédula:</b> {cliente.clienteCedula || "N/A"}
                </p>
                <p>
                  <b>RTN:</b> {cliente.clienteRTN || "N/A"}
                </p>
                <p>
                  <b>Clave IHCAFE:</b> {cliente.claveIHCAFE || "N/A"}
                </p>
                <p>
                  <b>Dirección:</b> {cliente.clienteDirecion || "N/A"}
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // 👀 Vista en tablets/desktop → Tabla con expandibles
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="clienteID"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 5 }}
          expandable={{
            expandedRowRender: (record) => (
              <Card
                size="small"
                title="Detalles del Cliente"
                type="inner"
              >
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
