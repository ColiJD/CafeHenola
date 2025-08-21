// components/GenericButton.jsx
"use client";
import { Button } from "antd";

export default function GenericButton({
  onClick,
  htmlType = "button",
  disabled = false,
  children,
  type = "primary",
}) {
  return (
    <Button
      type={type}
      htmlType={htmlType}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
