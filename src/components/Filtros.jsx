import { Row, Col, Input, Select, DatePicker, Grid } from "antd";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function Filtros({ fields }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
      {fields.map((f, idx) => (
        <Col key={idx} xs={24} sm={12} md={6}>
          {f.type === "input" ? (
            <Input
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
            />
          ) : f.type === "select" ? (
            <Select
              placeholder={f.placeholder}
              value={f.value}
              onChange={f.setter}
              allowClear={f.allowClear}
              style={{ width: "100%" }}
            >
              {f.options?.map((o) =>
                typeof o === "string" ? (
                  <Option key={o} value={o}>
                    {o}
                  </Option>
                ) : (
                  <Option key={o.value} value={o.value}>
                    {o.label}
                  </Option>
                )
              )}
            </Select>
          ) : f.type === "date" ? (
            isMobile ? (
              <Row gutter={8}>
                <Col xs={12}>
                  <DatePicker
                    placeholder="Fecha inicio"
                    value={f.value[0]}
                    onChange={(date) => f.setter([date, f.value[1]])}
                    style={{ width: "100%" }}
                    size="small"
                  />
                </Col>
                <Col xs={12}>
                  <DatePicker
                    placeholder="Fecha fin"
                    value={f.value[1]}
                    onChange={(date) => f.setter([f.value[0], date])}
                    style={{ width: "100%" }}
                    size="small"
                  />
                </Col>
              </Row>
            ) : (
              <RangePicker
                style={{ width: "100%" }}
                value={f.value}
                allowEmpty={[true, true]}
                onChange={f.setter}
              />
            )
          ) : null}
        </Col>
      ))}
    </Row>
  );
}
