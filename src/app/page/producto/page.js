"use client";
import { useState, useEffect } from "react";
import { Form, Input, Button, message, Table, Popconfirm } from "antd";
import { obtenerProductosSelect } from "@/lib/consultas";

export default function ProductoForm() {
  const [form] = Form.useForm();
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [msgApi, contextHolder] = message.useMessage();

  // Cargar productos existentes
  useEffect(() => {
    async function cargarProductos() {
      const opciones = await obtenerProductosSelect();
      setProductos(opciones);
    }
    cargarProductos();
  }, []);

  // Guardar o actualizar producto
  const handleSubmit = async (values) => {
    const nombreLimpio = values.productName.trim();
    if (!nombreLimpio)
      return msgApi.error("El nombre del producto no puede estar vacío");

    try {
      const url = selectedProducto
        ? `/api/productos/${selectedProducto.productID}`
        : "/api/productos";
      const method = selectedProducto ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: nombreLimpio }),
      });

      if (res.ok) {
        msgApi.success(
          selectedProducto ? "Producto actualizado" : "Producto agregado"
        );
        form.resetFields();
        setSelectedProducto(null);

        // Recargar lista de productos
        const data = await fetch("/api/productos").then((res) => res.json());
        setProductos(
          data.map((p) => ({
            value: p.productID,
            label: p.productName,
            data: p,
          }))
        );
      } else {
        const err = await res.json();
        msgApi.error(err.error || "Error al guardar el producto");
      }
    } catch {
      msgApi.error("Error de red o servidor");
    }
  };

  // Editar producto
  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    form.setFieldsValue({ productName: producto.productName });
  };

  // Eliminar producto
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (res.ok) {
        msgApi.success("Producto eliminado");
        setProductos(productos.filter((p) => p.value !== id));
        if (selectedProducto?.productID === id) {
          form.resetFields();
          setSelectedProducto(null);
        }
      } else {
        const err = await res.json();
        msgApi.error(err.error || "Error al eliminar el producto");
      }
    } catch {
      msgApi.error("Error de red o servidor");
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      title: "Nombre del Producto",
      dataIndex: "label",
      key: "productName",
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record.data)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Seguro que quieres eliminar?"
            onConfirm={() => handleDelete(record.value)}
            okText="Sí"
            cancelText="No"
          >
            <Button type="link" danger>
              Eliminar
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <h2>{selectedProducto ? "Editar Producto" : "Agregar Producto"}</h2>

        <Form.Item
          name="productName"
          label="Nombre del Producto"
          rules={[
            { required: true, message: "Ingrese el nombre del producto" },
          ]}
        >
          <Input placeholder="Nombre del producto" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {selectedProducto ? "Actualizar" : "Guardar"}
          </Button>
          {selectedProducto && (
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => {
                form.resetFields();
                setSelectedProducto(null);
              }}
            >
              Cancelar
            </Button>
          )}
        </Form.Item>
      </Form>

      <Table
        dataSource={productos}
        columns={columns}
        rowKey="productID"
        style={{ marginTop: 24 }}
        pagination={{ pageSize: 3 }}
      />
    </>
  );
}
