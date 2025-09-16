"use client";
import { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Modal,
  Popconfirm,
} from "antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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
  const selectRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function cargarClientes() {
      const clientes = await obtenerClientesSelect(messageApi);
      setClientesOptions(clientes);
    }
    cargarClientes();
    setTimeout(() => selectRef.current?.focus(), 200);
  }, [messageApi]);

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

  const validarDatos = (values) => {
    const newErrors = {};
    if (!values.clienteNombre) newErrors.clienteNombre = "Ingrese el nombre";
    if (!values.clienteApellido)
      newErrors.clienteApellido = "Ingrese el apellido";
    if (values.clienteCedula && !validarCedula(values.clienteCedula))
      newErrors.clienteCedula = "Cédula inválida, formato: 0000-0000-00000";
    if (!values.clienteDirecion)
      newErrors.clienteDirecion = "Ingrese la dirección";
    if (!values.clienteDepartament)
      newErrors.clienteDepartament = "Seleccione departamento";
    if (!values.clienteMunicipio)
      newErrors.clienteMunicipio = "Seleccione municipio";
    if (!values.clienteTelefono)
      newErrors.clienteTelefono = "Teléfono inválido, solo números";
    if (values.clienteRTN && !validarRTN(values.clienteRTN))
      newErrors.clienteRTN = "RTN inválido, formato: 0000-0000-0000000";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      messageApi.warning("Complete los campos obligatorios correctamente");
      return false;
    }
    return true;
  };

  const handlePrevisualizar = () => {
    const values = form.getFieldsValue();
    if (validarDatos(values)) {
      messageApi.info("Revisa la previsualización antes de confirmar");
      setPreviewVisible(true);
    }
  };

  const handleConfirmar = async () => {
    setSubmitting(true);
    const values = form.getFieldsValue();
    const data = {
      clienteCedula: values.clienteCedula || null,
      clienteNombre: capitalizarNombre(values.clienteNombre) || "",
      clienteApellido: capitalizarNombre(values.clienteApellido) || "",
      clienteDirecion: values.clienteDirecion || "",
      clienteDepartament: values.clienteDepartament?.value || "",
      clienteMunicipio: values.clienteMunicipio?.value || "",
      claveIHCAFE: values.claveIHCAFE || "",
      clienteTelefono: values.clienteTelefono || "",
      clienteRTN: values.clienteRTN || "",
    };

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
        setPreviewVisible(false);
        setTimeout(() => selectRef.current?.focus(), 200);
      } else {
        const err = await res.json();
        messageApi.error(
          "Error: " + (err.error || "No se pudo guardar el cliente")
        );
      }
    } catch {
      messageApi.error("Error de red o servidor");
    } finally {
      setSubmitting(false);
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
        setTimeout(() => selectRef.current?.focus(), 200);
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
      valuePropName="value"
      validateStatus={errors[name] ? "error" : ""}
      help={errors[name]}
    >
      <Select
        options={options}
        placeholder={placeholder}
        isDisabled={isDisabled}
        onChange={(value) => {
          form.setFieldsValue({ [name]: value });
          if (onChange) onChange(value);
        }}
        styles={{
          control: (base) => ({
            ...base,
            borderColor: errors[name] ? "red" : base.borderColor,
            boxShadow: errors[name]
              ? "0 0 0 2px rgba(255,0,0,0.2)"
              : base.boxShadow,
          }),
        }}
      />
    </Form.Item>
  );

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical">
        <h2 style={{ textAlign: "left", marginBottom: "1rem" }}>Cliente</h2>

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
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: errors.clienteNombre
                      ? "red"
                      : base.borderColor,
                    boxShadow: errors.clienteNombre
                      ? "0 0 0 2px rgba(255,0,0,0.2)"
                      : base.boxShadow,
                  }),
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Campos del formulario */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteNombre"
              label="Nombre"
              validateStatus={errors.clienteNombre ? "error" : ""}
              help={errors.clienteNombre}
            >
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteApellido"
              label="Apellido"
              validateStatus={errors.clienteApellido ? "error" : ""}
              help={errors.clienteApellido}
            >
              <Input maxLength={50} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteCedula"
              label="Cédula"
              validateStatus={errors.clienteCedula ? "error" : ""}
              help={errors.clienteCedula}
            >
              <Input maxLength={15} placeholder="0000-0000-00000" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteDirecion"
              label="Dirección"
              validateStatus={errors.clienteDirecion ? "error" : ""}
              help={errors.clienteDirecion}
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
            <Form.Item
              name="clienteTelefono"
              label="Teléfono"
              validateStatus={errors.clienteTelefono ? "error" : ""}
              help={errors.clienteTelefono}
            >
              <PhoneInput
                country={"hn"} // País por defecto: Honduras
                value={form.getFieldValue("clienteTelefono") || ""}
                onChange={(phone) => {
                  // Asegurarse de guardar con +
                  const formatted = phone.startsWith("+") ? phone : "+" + phone;
                  form.setFieldsValue({ clienteTelefono: formatted });
                }}
                inputProps={{
                  name: "telefono",
                  autoFocus: true,
                  maxLength: 15,
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clienteRTN"
              label="RTN"
              validateStatus={errors.clienteRTN ? "error" : ""}
              help={errors.clienteRTN}
            >
              <Input maxLength={17} placeholder="0000-0000-0000000" />
            </Form.Item>
          </Col>
        </Row>

        {/* Botones */}
        <Row justify="center" gutter={16} style={{ marginTop: 16 }}>
          <Col>
            <Button
              type="primary"
              onClick={handlePrevisualizar}
              disabled={submitting}
            >
              {selectedCliente?.data?.clienteID
                ? "Actualizar Cliente"
                : "Crear Cliente"}
            </Button>
          </Col>
          {selectedCliente?.data?.clienteID && (
            <Col>
              <Popconfirm
                title="¿Seguro que quieres eliminar?"
                onConfirm={() => handleDelete(selectedCliente.data.clienteID)}
                okText="Sí"
                cancelText="No"
              >
                <Button danger disabled={submitting}>
                  Eliminar Cliente
                </Button>
              </Popconfirm>
            </Col>
          )}
        </Row>

        {/* Modal de previsualización */}
        <Modal
          open={previewVisible}
          title="Previsualización del Cliente"
          onCancel={() => setPreviewVisible(false)}
          onOk={handleConfirmar}
          confirmLoading={submitting}
          okText="Confirmar"
          cancelText="Cancelar"
        >
          <p>
            <strong>Nombre:</strong> {form.getFieldValue("clienteNombre")}
          </p>
          <p>
            <strong>Apellido:</strong> {form.getFieldValue("clienteApellido")}
          </p>
          <p>
            <strong>Cédula:</strong> {form.getFieldValue("clienteCedula")}
          </p>
          <p>
            <strong>Dirección:</strong> {form.getFieldValue("clienteDirecion")}
          </p>
          <p>
            <strong>Departamento:</strong>{" "}
            {form.getFieldValue("clienteDepartament")?.label}
          </p>
          <p>
            <strong>Municipio:</strong>{" "}
            {form.getFieldValue("clienteMunicipio")?.label}
          </p>
          <p>
            <strong>Clave IHCAFE:</strong>{" "}
            {form.getFieldValue("claveIHCAFE") || "-"}
          </p>
          <p>
            <strong>Teléfono:</strong> {form.getFieldValue("clienteTelefono")}
          </p>
          <p>
            <strong>RTN:</strong> {form.getFieldValue("clienteRTN")}
          </p>
        </Modal>
      </Form>
    </>
  );
}
