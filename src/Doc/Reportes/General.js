// utils/exportPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNumber } from "@/components/Formulario";

// 🔹 Quitar emojis que dañan la exportación
function removeEmojis(text) {
  return text.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu, "").trim();
}

export const exportPDFGeneral = (totales, secciones) => {
  const doc = new jsPDF({
    unit: "pt", // puntos tipográficos (1pt ≈ 1/72 pulgada)
    format: "letter", // tamaño carta (estándar APA)
  });

  // 🔹 Configuración APA
  const leftMargin = 72; // 1 pulgada
  const rightMargin = 72;
  const topMargin = 72;
  const bottomMargin = 72;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 🔹 Encabezado y pie en todas las páginas
  const addHeaderFooter = (data) => {
    const pageSize = doc.internal.pageSize;
    const width = pageSize.getWidth();
    const height = pageSize.getHeight();

    // Encabezado estilo APA
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    // Fecha a la izquierda
    doc.text(`Generado el: ${fecha}`, leftMargin, 50);

    // Número de página a la derecha
    doc.text(String(data.pageNumber), width - rightMargin, 50, {
      align: "right",
    });

    // Pie de página (institución o autor)
    doc.setFontSize(10);
    doc.text("Beneficio Cafe Henola", width / 2, height - 30, {
      align: "center",
    });
  };

  // 🔹 Título principal centrado (APA)
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Resumen de Movimientos", pageWidth / 2, topMargin, {
    align: "center",
  });

  // 🔹 Tabla de totales (encabezado gris oscuro)
  const totalesData = [
    ["Entradas (QQ)", formatNumber(totales.entradas.cantidad)],
    ["Entradas (Lps)", formatNumber(totales.entradas.total)],
    ["Salidas (QQ)", formatNumber(totales.salidas.cantidad)],
    ["Salidas (Lps)", formatNumber(totales.salidas.total)],
  ];

  autoTable(doc, {
    startY: topMargin + 30,
    margin: { left: leftMargin, right: rightMargin },
    head: [["Concepto", "Valor"]],
    body: totalesData,
    didDrawPage: addHeaderFooter,
    styles: { font: "times", fontSize: 12 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] }, // azul
  });

  let startY = doc.lastAutoTable.finalY + 20;

  // 🔹 Tablas por sección (encabezado azul)
  secciones.forEach((sec) => {
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(removeEmojis(sec.titulo), leftMargin, startY);

    autoTable(doc, {
      startY: startY + 10,
      margin: { left: leftMargin, right: rightMargin },
      head: [["Movimiento", "Cantidad QQ", "Total Lps"]],
      body: sec.datos.map((d) => [
        removeEmojis(d.movimiento),
        d.cantidad,
        d.total,
      ]),
      didDrawPage: addHeaderFooter,
      styles: { font: "times", fontSize: 12 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] }, // azul
    });

    startY = doc.lastAutoTable.finalY + 30;
  });

  // 🔹 Guardar
  doc.save(`reporteGeneral_${fecha}.pdf`);
};
