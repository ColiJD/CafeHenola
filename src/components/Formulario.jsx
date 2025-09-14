import { Form, Input, Button, Row, Col } from "antd";
import React from "react";
import Select from "react-select";
import {
  handleIntegerChange,
  handleFloatChange,
} from "@/config/validacionesForm";

// Funciones de formato
const formatNumber = (num, type) => {
  if (num === "" || num === null || num === undefined) return "";
  const n = parseFloat(num.toString().replace(/,/g, ""));
  if (isNaN(n)) return "";
  if (type === "integer") return Math.round(n).toLocaleString("es-HN");
  return n.toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
// Función para quitar comas
const parseNumber = (str) => (str ? str.toString().replace(/,/g, "") : "");
export default function Formulario({
  title,
  fields,
  onSubmit,
  submitting,
  button,
}) {
  const [rawValues, setRawValues] = React.useState({});

  // Manejo de cambio de número (integer o float)
  const handleNumberChange = (label, setter, type) => (e) => {
    let val = e.target.value;

    if (type === "integer" && !/^\d*$/.test(val)) return;
    if (type === "Float" && !/^\d*\.?\d{0,2}$/.test(val)) return;

    setter(val);
    setRawValues((prev) => ({ ...prev, [label]: val }));
  };

  // Manejo de blur (formato)
  const handleNumberBlur = (label, value, type) => {
    setRawValues((prev) => ({
      ...prev,
      [label]: formatNumber(value ?? "", type),
    }));
  };

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
              ) : f.type === "integer" || f.type === "Float" ? (
                <Input
                  value={
                    f.readOnly
                      ? formatNumber(f.value ?? "", f.type)
                      : rawValues[f.label] ?? f.value ?? ""
                  }
                  onChange={
                    f.readOnly
                      ? undefined
                      : handleNumberChange(f.label, f.setter, f.type)
                  }
                  onFocus={() =>
                    setRawValues((prev) => ({
                      ...prev,
                      [f.label]: f.value ?? "",
                    }))
                  }
                  onBlur={() => handleNumberBlur(f.label, f.value, f.type)}
                  readOnly={f.readOnly}
                  style={{
                    backgroundColor: f.readOnly ? "#f5f5f5" : "white",
                    cursor: f.readOnly ? "not-allowed" : "text",
                  }}
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
