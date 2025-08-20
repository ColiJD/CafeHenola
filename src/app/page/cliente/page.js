"use client";
import { useState, useEffect } from "react";
import { Form, Input, Button, message, Row, Col } from "antd";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { departamentos, municipiosPorDepartamento } from "./data";
import { obtenerClientesSelect } from "@/lib/consultas";

export default function ClienteForm() {
  const [form] = Form.useForm();
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [municipiosOptions, setMunicipiosOptions] = useState([]);
  const [clientesOptions, setClientesOptions] = useState([]);

  // Aquí usamos message.useMessage() para evitar el warning
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    async function cargarClientes() {
      const clientes = await obtenerClientesSelect();
      setClientesOptions(clientes);
    }
    cargarClientes();
  }, []);

  const handleDepartamentoChange = (selected) => {
    form.setFieldsValue({ clienteMunicipio: null });
    setMunicipiosOptions(
      selected
        ? (municipiosPorDepartamento[selected.value] || []).map((m) => ({
            value: m,
            label: m,
          }))
        : []
    );
  };

  const handleClienteSelect = (selected) => {
    setSelectedCliente(selected);
    if (selected?.data) {
      const c = selected.data;
      form.setFieldsValue({
        clienteCedula: c.clienteCedula,
        clienteNombre: selected,
        clienteApellido: c.clienteApellido,
        clienteDirecion: c.clienteDirecion,
        clienteDepartament: c.clienteDepartament
          ? { value: c.clienteDepartament, label: c.clienteDepartament }
          : null,
        clienteMunicipio: c.clienteMunicipio
          ? { value: c.clienteMunicipio, label: c.clienteMunicipio }
          : null,
        claveIHCAFE: c.claveIHCAFE,
        clienteTelefono: c.clienteTelefono,
        clienteRTN: c.clienteRTN,
      });

      if (c.clienteDepartament) {
        setMunicipiosOptions(
          (municipiosPorDepartamento[c.clienteDepartament] || []).map((m) => ({
            value: m,
            label: m,
          }))
        );
      }
    }
  };

  const handleSubmit = async (values) => {
    const data = {
      clienteCedula: values.clienteCedula,
      clienteNombre:
        typeof values.clienteNombre === "string"
          ? values.clienteNombre
          : values.clienteNombre?.data?.clienteNombre || "",
      clienteApellido:
        values.clienteApellido?.value || values.clienteApellido || "",
      clienteDirecion: values.clienteDirecion || "",
      clienteDepartament: values.clienteDepartament?.value || "",
      clienteMunicipio: values.clienteMunicipio?.value || "",
      claveIHCAFE: values.claveIHCAFE || "",
      clienteTelefono: values.clienteTelefono || "",
      clienteRTN: values.clienteRTN ? Number(values.clienteRTN) : null,
    };
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        messageApi.success("Cliente creado con éxito"); // usamos messageApi
        form.resetFields();
        setSelectedCliente(null);
        setMunicipiosOptions([]);
      } else {
        const err = await res.json();
        messageApi.error(
          "Error: " + (err.error || "No se pudo crear el cliente")
        ); // messageApi
      }
    } catch {
      messageApi.error("Error de red o servidor"); // messageApi
    }
  };

  const SelectField = ({
    name,
    options,
    placeholder,
    isDisabled,
    onChange,
  }) => (
    <Form.Item
      name={name}
      rules={[
        {
          required: true,
          message: `Por favor seleccione ${placeholder.toLowerCase()}`,
        },
      ]}
    >
      <Select
        options={options}
        placeholder={placeholder}
        isDisabled={isDisabled}
        onChange={(value) => {
          form.setFieldsValue({ [name]: value });
          if (onChange) onChange(value);
        }}
      />
    </Form.Item>
  );

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800, margin: "0 auto" }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Cliente</h2>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteNombre"
              label="Nombre"
              rules={[
                {
                  required: true,
                  message: "Por favor seleccione o ingrese un cliente",
                },
              ]}
            >
              <CreatableSelect
                options={clientesOptions}
                placeholder="Seleccione o ingrese un cliente"
                value={selectedCliente}
                getOptionValue={(option) => option.value}
                formatCreateLabel={(inputValue) =>
                  `Crear nuevo cliente: "${inputValue}"`
                }
                onCreateOption={(inputValue) => {
                  // opción temporal SOLO seleccionada
                  const newOption = {
                    value: inputValue, // el texto escrito
                    label: inputValue,
                    data: { clienteNombre: inputValue },
                  };

                  // 👇 con esto se selecciona automáticamente
                  setSelectedCliente(newOption);
                  form.setFieldsValue({ clienteNombre: newOption });

                  // limpiar los demás campos
                  form.resetFields([
                    "clienteCedula",
                    "clienteApellido",
                    "clienteDirecion",
                    "clienteDepartament",
                    "clienteMunicipio",
                    "claveIHCAFE",
                    "clienteTelefono",
                    "clienteRTN",
                  ]);
                }}
                onChange={(selected) => {
                  setSelectedCliente(selected);
                  form.setFieldsValue({ clienteNombre: selected });
                  if (selected?.data) handleClienteSelect(selected);
                  else {
                    form.resetFields([
                      "clienteCedula",
                      "clienteApellido",
                      "clienteDirecion",
                      "clienteDepartament",
                      "clienteMunicipio",
                      "claveIHCAFE",
                      "clienteTelefono",
                      "clienteRTN",
                    ]);
                  }
                }}
                isClearable
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="clienteApellido"
              label="Apellido"
              rules={[
                { required: true, message: "Por favor ingrese el apellido" },
              ]}
            >
              <Input maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteCedula"
              label="Cédula"
              rules={[
                { required: true, message: "Por favor ingrese la cédula" },
              ]}
            >
              <Input maxLength={13} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="clienteDirecion"
              label="Dirección"
              rules={[
                { required: true, message: "Por favor ingrese la dirección" },
              ]}
            >
              <Input maxLength={200} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <SelectField
              name="clienteDepartament"
              options={departamentos.map((dep) => ({ value: dep, label: dep }))}
              placeholder="Seleccione departamento"
              onChange={handleDepartamentoChange}
            />
          </Col>

          <Col xs={24} md={12}>
            <SelectField
              name="clienteMunicipio"
              options={municipiosOptions}
              placeholder="Seleccione municipio"
              isDisabled={municipiosOptions.length === 0}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="claveIHCAFE" label="Clave IHCAFE">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="clienteTelefono" label="Teléfono">
              <Input maxLength={13} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="clienteRTN" label="RTN">
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            {/* Espacio libre o futuro campo */}
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!!selectedCliente?.data?.clienteID}
          >
            Crear Cliente
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
