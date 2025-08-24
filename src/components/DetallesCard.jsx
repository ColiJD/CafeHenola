import { Card, Row, Col } from "antd";

/**
 * Componente genérico para mostrar detalles en tarjetas.
 *
 * @param {string} title → Título de la tarjeta
 * @param {Array<{ label: string, value: any }>} fields → Campos a mostrar
 * @param {number} cols → Número de columnas en desktop/tablet (móvil siempre apilado)
 */
export default function DetalleCard({ title, fields, cols = 2 }) {
  return (
    <Card
      title={title}
      bordered
      style={{
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <Row gutter={[16, 16]}>
        {fields.map((field, index) => (
          <Col key={index} xs={24} sm={24 / cols}>
            <p>
              <b>{field.label}:</b> {field.value || "N/A"}
            </p>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
