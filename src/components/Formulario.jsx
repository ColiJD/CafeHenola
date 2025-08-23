import { Form, Input, Button, Row, Col } from "antd";
import Select from "react-select";
import {
  handleIntegerChange,
  handleFloatChange,
} from "@/config/validacionesForm";

export default function Formulario({
  title,
  fields,
  onSubmit,
  submitting,
  button,
}) {
  return (
    <Form layout="vertical" onSubmitCapture={onSubmit}>
      {title && (
        <h2 style={{ textAlign: "left", marginBottom: "1rem" }}>{title}</h2>
      )}
      <Row gutter={16}>
        {fields.map((f, idx) => (
          <Col key={idx} xs={24} sm={12}>
            <Form.Item
              label={f.label}
              required={f.required}
              validateStatus={f.error ? "error" : ""}
              help={f.error}
            >
              {f.type === "select" ? (
                <Select
                  options={f.options || []}
                  readOnly={f.readOnly}
                  value={
                    f.options?.find((o) => o.value === f.value?.value) || null
                  }
                  onChange={f.setter}
                  placeholder={`Seleccione ${f.label}`}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: f.error ? "red" : base.borderColor,
                    }),
                  }}
                />
              ) : f.type === "textarea" ? (
                <Input.TextArea
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  readOnly={f.readOnly}
                />
              ) : f.type === "integer" ? (
                <Input
                  value={f.value}
                  onChange={handleIntegerChange(f.setter)}
                  readOnly={f.readOnly}
                />
              ) : f.type === "Float" ? (
                <Input
                  value={f.value}
                  onChange={handleFloatChange(f.setter)}
                  readOnly={f.readOnly}
                />
              ) : (
                <Input
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  readOnly={f.readOnly}
                />
              )}
            </Form.Item>
          </Col>
        ))}
      </Row>

      {/* Botón genérico */}
      {button && (
        <Button
          type={button.type || "primary"}
          htmlType={button.htmlType || "submit"}
          onClick={button.onClick}
          disabled={submitting || button.disabled}
        >
          {submitting ? "Enviando..." : button.text}
        </Button>
      )}
    </Form>
  );
}
