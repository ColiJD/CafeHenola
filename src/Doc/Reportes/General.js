// /Doc/Reportes/General.js
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { formatNumber } from "@/components/Formulario";

/**
 * Exporta resumen de movimientos a PDF con Entradas, Salidas, Préstamos y Anticipos
 * @param {Array} data - Datos de la tabla
 * @param {Object} filtros - Fechas y filtros aplicados
 * @param {Object} options - Opciones: title, colores, orientación
 */
export const exportPDFGeneralConPrestamos = (data, filtros = {}, options = {}) => {
  const doc = new jsPDF({
    orientation: options.orientation || "landscape",
    unit: "mm",
    format: "a4",
  });

  const colorPrimario = options.colorPrimario || [41, 128, 185]; // Azul
  const colorSecundario = options.colorSecundario || [236, 240, 241]; // Gris claro
  const colorTexto = options.colorTexto || [44, 62, 80]; // Gris oscuro
  const colorPrestamos = options.colorPrestamos || [255, 193, 7]; // Amarillo

  // ==== ENCABEZADO ====
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 297, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(options.title || "REPORTE DE MOVIMIENTOS", 148.5, 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado el: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 148.5, 18, { align: "center" });

  // ==== FILTROS ====
  let yPosition = 35;
  doc.setTextColor(...colorTexto);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("FILTROS APLICADOS:", 20, yPosition);
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (filtros.fechaInicio && filtros.fechaFin) {
    doc.text(
      `• Período: ${dayjs(filtros.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(filtros.fechaFin).format("DD/MM/YYYY")}`,
      20,
      yPosition
    );
    yPosition += 6;
  }
  if (!filtros.fechaInicio && !filtros.fechaFin) {
    doc.text("• Sin filtros aplicados (todos los registros)", 20, yPosition);
    yPosition += 6;
  }
  yPosition += 5;

  // ==== ENTRADAS Y SALIDAS ====
  const entradas = data.filter((row) => row.key === "entradas");
  const salidas = data.filter((row) => row.key === "salidas");

  // TABLA ENTRADAS
  if (entradas.length) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ENTRADAS", 20, yPosition);
    yPosition += 8;

    const entradasBody = entradas.map((row) => [
      row.tipo || "",
      formatNumber(row.compraQQ),
      `L. ${formatNumber(row.compraLps)}`,
      formatNumber(row.contratoQQ),
      `L. ${formatNumber(row.contratoLps)}`,
      formatNumber(row.depositoQQ),
      `L. ${formatNumber(row.depositoLps)}`,
      formatNumber(row.totalQQ),
      `L. ${formatNumber(row.totalLps)}`,
      `L. ${formatNumber(row.promedio)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Tipo","Compra Directa QQ","Compra Directa Lps","Contrato QQ","Contrato Lps","Depósito QQ","Depósito Lps","QQ Total","Total Lps","Promedio"]],
      body: entradasBody,
      theme: "grid",
      headStyles: { fillColor: colorPrimario, textColor: [255,255,255], fontSize: 10, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 9, textColor: colorTexto },
      alternateRowStyles: { fillColor: colorSecundario },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // TABLA SALIDAS
  if (salidas.length) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SALIDAS", 20, yPosition);
    yPosition += 8;

    const salidasBody = salidas.map((row) => [
      row.tipo || "",
      formatNumber(row.compraQQ),
      `L. ${formatNumber(row.compraLps)}`,
      formatNumber(row.contratoQQ),
      `L. ${formatNumber(row.contratoLps)}`,
      formatNumber(row.depositoQQ),
      `L. ${formatNumber(row.depositoLps)}`,
      formatNumber(row.totalQQ),
      `L. ${formatNumber(row.totalLps)}`,
      `L. ${formatNumber(row.promedio)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Tipo","Venta Directa QQ","Venta Directa Lps","Contrato QQ","Contrato Lps","Depósito QQ","Depósito Lps","QQ Total","Total Lps","Promedio"]],
      body: salidasBody,
      theme: "grid",
      headStyles: { fillColor: [220,53,69], textColor:[255,255,255], fontSize:10, fontStyle:"bold", halign:"center" },
      bodyStyles: { fontSize: 9, textColor: colorTexto },
      alternateRowStyles: { fillColor: colorSecundario },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // ==== PRÉSTAMOS Y ANTICIPOS ====
  const prestamosYAnticipos = data.filter((row) => row.key === "prestamos" || row.key === "anticipos");
  if (prestamosYAnticipos.length) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRÉSTAMOS Y ANTICIPOS", 20, yPosition);
    yPosition += 8;

    const bodyPrestamos = prestamosYAnticipos.map((row) => [
      row.tipo || "",
      `L. ${formatNumber(row.totalPrestamos)}`,
      `L. ${formatNumber(row.abono)}`,
      `L. ${formatNumber(row.pagoInteres)}`,
      `L. ${formatNumber(row.intCargo)}`,
      `L. ${formatNumber(row.totalCreditos)}`,
      `L. ${formatNumber(row.totalAbonos)}`,
      `L. ${formatNumber(row.saldo)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Tipo","Total Préstamos","ABONO","PAGO_INTERES","Int-Cargo","Total Créditos","Total Abonos","Saldo"]],
      body: bodyPrestamos,
      theme: "grid",
      headStyles: { fillColor: colorPrestamos, textColor:[0,0,0], fontSize:10, fontStyle:"bold", halign:"center" },
      bodyStyles: { fontSize: 9, textColor: colorTexto },
      alternateRowStyles: { fillColor: colorSecundario },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  if (!entradas.length && !salidas.length && !prestamosYAnticipos.length) {
    doc.setFontSize(12);
    doc.setTextColor(200,100,100);
    doc.text("No hay datos disponibles para mostrar", 148.5, yPosition+20, { align:"center" });
  }

  const nombreArchivo = `reporte-movimientos-${dayjs().format("YYYY-MM-DD-HHmm")}.pdf`;
  doc.save(nombreArchivo);
  return doc;
};
