"use client";
import { Form, Input, Button, Row, Col, message } from "antd";
import Select from "react-select";

export default function DynamicForm({
  fields = [], // Array de campos: { label, value, setter, type, options?, required? }
  onSubmit, // Función que se llama al registrar
  submitting = false,
  previewVisible,
  setPreviewVisible,
  PreviewModal, // Componente de previsualización
}) {
  const [errors, setErrors] = React.useState({});
  const [messageApi, contextHolder] = message.useMessage();

  const handleEnteroInput = (setter) => (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setter(value);
  };

  const validarDatos = () => {
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && (!f.value || f.value === "")) {
        newErrors[f.label] = `${f.label} es obligatorio`;
      }
      if (f.type === "integer" && f.value) {
        if (!/^\d+$/.test(f.value) || parseInt(f.value, 10) <= 0) {
          newErrors[f.label] = `${f.label} debe ser un entero positivo`;
        }
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      messageApi.warning("Complete los campos obligatorios correctamente");
      return false;
    }
    return true;
  };

  const handleRegistrarClick = (e) => {
    e.preventDefault();
    if (validarDatos()) {
      setPreviewVisible(true);
    }
  };

  return (
    <>
      {contextHolder}
      <Form layout="vertical" onSubmitCapture={handleRegistrarClick}>
        <Row gutter={16}>
          {fields.map((f, idx) => (
            <Col xs={24} sm={12} key={idx}>
              <Form.Item
                label={f.label}
                required={f.required}
                validateStatus={errors[f.label] ? "error" : ""}
                help={errors[f.label]}
              >
                {f.type === "select" ? (
                  <Select
                    options={f.options}
                    value={f.options?.find((o) => o.value === f.value) || null}
                    onChange={f.setter}
                    placeholder={`Seleccione ${f.label}`}
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: errors[f.label] ? "red" : base.borderColor,
                      }),
                    }}
                  />
                ) : f.type === "textarea" ? (
                  <Input.TextArea
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                  />
                ) : f.type === "integer" ? (
                  <Input
                    type="text"
                    value={f.value}
                    onChange={handleEnteroInput(f.setter)}
                  />
                ) : (
                  <Input
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                  />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Button
          type="primary"
          onClick={handleRegistrarClick}
          disabled={submitting}
        >
          Registrar
        </Button>

        <PreviewModal
          open={previewVisible}
          title="Previsualización"
          onCancel={() => setPreviewVisible(false)}
          onConfirm={onSubmit}
          confirmLoading={submitting}
          fields={fields.map((f) => ({
            label: f.label,
            value:
              f.type === "select"
                ? f.options?.find((o) => o.value === f.value)?.label
                : f.value || "-",
          }))}
        />
      </Form>
    </>
  );
}
