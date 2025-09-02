import { Row, Col, Card, Statistic } from "antd";

export default function TarjetasDeTotales({ title, cards }) {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      {title && (
        <Col span={24}>
          <h3 style={{ marginBottom: 8, fontWeight: 600, color: "#333" }}>
            {title}
          </h3>
        </Col>
      )}

      {cards.map((c, idx) => (
        <Col key={idx} xs={24} sm={12} md={8} lg={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              border: "1.5px solid #d9d9d9", // borde más visible
              background: "#f9f9f9",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              padding: "12px 16px",
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, color: "#666" }}>{c.title}</span>}
              value={c.value}
              precision={c.precision || 2}
              valueStyle={{ fontSize: 20, fontWeight: 500, color: "#111" }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
