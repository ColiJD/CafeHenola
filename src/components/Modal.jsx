"use client";
import { Modal, Button } from "antd";

export default function PreviewModal({
  open,
  title = "Previsualización",
  fields = [],
  onCancel,
  onConfirm,
  confirmLoading = false,
  okText = "Confirmar",
  cancelText = "Cancelar",
  extraButtons = [],
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
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        ...extraButtons,
        <Button
          key="confirm"
          type="primary"
          loading={confirmLoading}
          onClick={onConfirm}
        >
          {okText}
        </Button>,
      ]}
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
