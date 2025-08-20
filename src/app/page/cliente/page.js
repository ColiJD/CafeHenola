"use client";
import { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message, Row, Col, Popconfirm } from "antd";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { departamentos, municipiosPorDepartamento } from "./data";
import { obtenerClientesSelect } from "@/lib/consultas";
import {
  capitalizarNombre,
  validarCedula,
  validarRTN,
  validarTelefono,
} from "@/config/validacionesForm";

export default function ClienteForm() {
  const [form] = Form.useForm();
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [municipiosOptions, setMunicipiosOptions] = useState([]);
  const [clientesOptions, setClientesOptions] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const selectRef = useRef(null); // Para focus automático

  useEffect(() => {
    async function cargarClientes() {
      const clientes = await obtenerClientesSelect();
      setClientesOptions(clientes);
    }
    cargarClientes();
    // Focus al CreatableSelect al cargar
    setTimeout(() => {
      selectRef.current?.focus();
    }, 200);
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
        clienteCedula: c.clienteCedula || "",
        clienteNombre: c.clienteNombre || "",
        clienteApellido: c.clienteApellido || "",
        clienteDirecion: c.clienteDirecion || "",
        clienteDepartament: c.clienteDepartament
          ? { value: c.clienteDepartament, label: c.clienteDepartament }
          : null,
        clienteMunicipio: c.clienteMunicipio
          ? { value: c.clienteMunicipio, label: c.clienteMunicipio }
          : null,
        claveIHCAFE: c.claveIHCAFE || "",
        clienteTelefono: c.clienteTelefono || "",
        clienteRTN: c.clienteRTN || "",
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
      clienteCedula: values.clienteCedula || "",
      clienteNombre: capitalizarNombre(values.clienteNombre) || "",
      clienteApellido: capitalizarNombre(values.clienteApellido) || "",
      clienteDirecion: values.clienteDirecion || "",
      clienteDepartament: values.clienteDepartament?.value || "",
      clienteMunicipio: values.clienteMunicipio?.value || "",
      claveIHCAFE: values.claveIHCAFE || "",
      clienteTelefono: values.clienteTelefono || "",
      clienteRTN: values.clienteRTN || "",
    };
    // Validaciones
    if (!validarCedula(data.clienteCedula)) {
      messageApi.error("Cédula inválida, formato esperado: 0703-2001-00798");
      return;
    }

    if (!validarRTN(data.clienteRTN)) {
      messageApi.error("RTN inválido, formato esperado: 0703-2001-0079812");
      return;
    }

    if (!validarTelefono(data.clienteTelefono)) {
      messageApi.error("Teléfono inválido, solo números");
      return;
    }
    const method = selectedCliente?.data?.clienteID ? "PUT" : "POST";
    const url = selectedCliente?.data?.clienteID
      ? `/api/clientes/${selectedCliente.data.clienteID}`
      : "/api/clientes";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        messageApi.success(
          selectedCliente?.data?.clienteID
            ? "Cliente actualizado con éxito"
            : "Cliente creado con éxito"
        );
        form.resetFields();
        setSelectedCliente(null);
        setMunicipiosOptions([]);
        const clientes = await obtenerClientesSelect();
        setClientesOptions(clientes);
        // Volver a focus en el select
        setTimeout(() => {
          selectRef.current?.focus();
        }, 200);
      } else {
        const err = await res.json();
        messageApi.error(
          "Error: " + (err.error || "No se pudo guardar el cliente")
        );
      }
    } catch {
      messageApi.error("Error de red o servidor");
    }
  };

  const handleDelete = async (clienteID) => {
    try {
      const res = await fetch(`/api/clientes/${clienteID}`, {
        method: "DELETE",
      });
      if (res.ok) {
        messageApi.success("Cliente eliminado con éxito");
        if (selectedCliente?.data?.clienteID === clienteID) {
          form.resetFields();
          setSelectedCliente(null);
          setMunicipiosOptions([]);
        }
        const clientes = await obtenerClientesSelect();
        setClientesOptions(clientes);
        setTimeout(() => {
          selectRef.current?.focus();
        }, 200);
      } else {
        const err = await res.json();
        messageApi.error(
          "Error eliminando: " + (err.error || "Error desconocido")
        );
      }
    } catch {
      messageApi.error("Error de red o servidor");
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

        {/* Select para buscar cliente existente */}
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item label="Buscar cliente existente">
              <CreatableSelect
                ref={selectRef}
                options={clientesOptions}
                placeholder="Seleccione un cliente"
                value={selectedCliente}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                formatCreateLabel={(inputValue) =>
                  `Crear nuevo cliente: "${inputValue}"`
                }
                onCreateOption={(inputValue) => {
                  const newOption = {
                    value: inputValue,
                    label: inputValue,
                    data: { clienteNombre: inputValue },
                  };
                  setSelectedCliente(newOption);
                  form.setFieldsValue({ clienteNombre: inputValue });
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
                  form.setFieldsValue({ clienteNombre: selected?.label || "" });
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
                autoFocus
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteNombre"
              label="Nombre"
              rules={[
                { required: true, message: "Por favor ingrese el nombre" },
              ]}
            >
              <Input
                maxLength={50}
                onBlur={() => form.validateFields(["clienteNombre"])}
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
              <Input
                maxLength={50}
                onBlur={() => form.validateFields(["clienteApellido"])}
              />
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
                {
                  pattern: /^\d{4}-\d{4}-\d{5}$/,
                  message: "Cédula inválida, formato esperado: 0000-0000-00000",
                },
              ]}
            >
              <Input
                maxLength={15}
                placeholder="0000-0000-00000"
                onBlur={() => form.validateFields(["clienteCedula"])}
              />
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
              <Input
                maxLength={200}
                onBlur={() => form.validateFields(["clienteDirecion"])}
              />
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
            <Form.Item
              name="clienteTelefono"
              label="Teléfono"
              rules={[
                { required: true, message: "Por favor ingrese el teléfono" },
                {
                  pattern: /^\d+$/,
                  message: "El teléfono solo puede contener números",
                },
              ]}
            >
              <Input
                maxLength={13}
                placeholder="Solo números"
                onBlur={() => form.validateFields(["clienteTelefono"])}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteRTN"
              label="RTN"
              rules={[
                { required: true, message: "Por favor ingrese el RTN" },
                {
                  pattern: /^\d{4}-\d{4}-\d{7}$/,
                  message: "RTN inválido, formato esperado: 0000-0000-0000000",
                },
              ]}
            >
              <Input
                maxLength={17}
                placeholder="0000-0000-0000000"
                onBlur={() => form.validateFields(["clienteRTN"])}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Botones centrados y separados */}
        <Row justify="center" gutter={16} style={{ marginTop: 16 }}>
          <Col>
            <Button type="primary" htmlType="submit">
              {selectedCliente?.data?.clienteID
                ? "Actualizar Cliente"
                : "Crear Cliente"}
            </Button>
          </Col>

          {selectedCliente?.data?.clienteID && (
            <Col>
              <Popconfirm
                title="¿Seguro que quieres eliminar?"
                onConfirm={() => handleDelete(selectedCliente.data.clienteID)} // usamos value = id
                okText="Sí"
                cancelText="No"
              >
                <Button danger>Eliminar Cliente</Button>
              </Popconfirm>
            </Col>
          )}
        </Row>
      </Form>
    </>
  );
}
