"use client";
import { Modal } from "antd";

export default function PreviewModal({
  open,
  title = "Previsualización",
  fields = [],
  onCancel,
  onConfirm,
  confirmLoading = false,
  okText = "Confirmar",
  cancelText = "Cancelar",
}) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={confirmLoading}
      okText={okText}
      cancelText={cancelText}
    >
      {fields.map((field, index) => (
        <p key={index}>
          <strong>{field.label}:</strong>{" "}
          {field.value !== undefined &&
          field.value !== null &&
          field.value !== ""
            ? field.value
            : "-"}
        </p>
      ))}
    </Modal>
  );
}
