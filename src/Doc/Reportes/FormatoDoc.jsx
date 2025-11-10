import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import fondoImg from "@/img/frijoles.png";

/**
 * Genera PDF para cualquier reporte de manera automática con diseño mejorado.
 *
 * @param {Array} data - Datos del reporte
 * @param {Object} filtros - Filtros aplicados
 * @param {Array} columnas - Columnas [{ header, key, format, isCantidad, isTotal }]
 *      isCantidad -> columna de cantidad (QQ)
 *      isTotal -> columna de monto (Lps)
 * @param {Object} options - Opciones (title, colores, orientación)
 */
export const generarReportePDF = (
  data,
  filtros = {},
  columnas = [],
  options = {}
) => {
  const doc = new jsPDF({
    orientation: options.orientation || "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  const colorPrimario = options.colorPrimario || [41, 128, 185];
  const colorSecundario = options.colorSecundario || [236, 240, 241];
  const colorTexto = options.colorTexto || [44, 62, 80];
  const colorAccento = options.colorAccento || [52, 152, 219];

  const formatNumber = (num) =>
    !num || isNaN(num)
      ? "0.00"
      : Number(num).toLocaleString("es-HN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  // -------------------------------
  // ENCABEZADO CON LOGO
  // -------------------------------
  const headerHeight = 32;

  // Fondo del encabezado
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Franja decorativa superior
  doc.setFillColor(colorAccento[0], colorAccento[1], colorAccento[2]);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Logo (izquierda con margen seguro)
  const logoSize = 18;
  const logoX = margin;
  const logoY = 7;

  try {
    doc.addImage(fondoImg, "PNG", logoX, logoY, logoSize, logoSize);
  } catch (error) {
    console.warn("No se pudo cargar el logo:", error);
  }

  // Título centrado (asegurando espacio para el logo)
  const titleAreaStart = logoX + logoSize + 10;
  const titleAreaEnd = pageWidth - margin;
  const titleCenterX = (titleAreaStart + titleAreaEnd) / 2;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(options.title || "REPORTE", pageWidth / 2, 14, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado el: ${dayjs().format("DD/MM/YYYY [a las] HH:mm")}`,
    pageWidth / 2,
    22,
    { align: "center" }
  );

  // Línea decorativa inferior del encabezado
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(
    margin + 30,
    headerHeight - 3,
    pageWidth - margin - 30,
    headerHeight - 3
  );

  // -------------------------------
  // SECCIÓN DE FILTROS
  // -------------------------------
  let yPos = headerHeight + 8;

  // Calcular altura necesaria para filtros
  let filtrosLines = 1; // Título
  if (filtros.fechaInicio && filtros.fechaFin) filtrosLines++;
  if (filtros.nombreFiltro) filtrosLines++;
  if (!filtros.fechaInicio && !filtros.nombreFiltro) filtrosLines++;

  const lineHeight = 5.5;
  const filtrosHeight = filtrosLines * lineHeight + 8;

  // Caja de filtros
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(...colorPrimario);
  doc.setLineWidth(0.3);
  doc.roundedRect(
    margin,
    yPos,
    pageWidth - margin * 2,
    filtrosHeight,
    2,
    2,
    "FD"
  );

  // Contenido de filtros
  yPos += 6;
  doc.setTextColor(...colorPrimario);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("FILTROS APLICADOS", margin + 5, yPos);

  yPos += lineHeight + 1;
  doc.setTextColor(...colorTexto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  if (filtros.fechaInicio && filtros.fechaFin) {
    doc.setFont("helvetica", "bold");
    doc.text("Período:", margin + 5, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${dayjs(filtros.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(
        filtros.fechaFin
      ).format("DD/MM/YYYY")}`,
      margin + 23,
      yPos
    );
    yPos += lineHeight;
  }
  if (filtros.nombreFiltro) {
    doc.setFont("helvetica", "bold");
    doc.text("Búsqueda:", margin + 5, yPos);
    doc.setFont("helvetica", "normal");
    const maxTextWidth = pageWidth - margin * 2 - 30;
    const searchText = doc.splitTextToSize(
      `"${filtros.nombreFiltro}"`,
      maxTextWidth
    );
    doc.text(searchText, margin + 25, yPos);
    yPos += lineHeight * searchText.length;
  }
  if (!filtros.fechaInicio && !filtros.nombreFiltro) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Sin filtros aplicados (todos los registros)", margin + 5, yPos);
    yPos += lineHeight;
  }

  // Espacio después de filtros
  yPos = headerHeight + 8 + filtrosHeight + 8;

  // -------------------------------
  // CALCULAR TOTALES Y PROMEDIO
  // -------------------------------
  const totales = {};
  let totalCantidad = 0;
  let totalMonto = 0;

  columnas.forEach((col) => {
    if (col.isCantidad || col.isTotal) {
      const suma = data.reduce((acc, r) => acc + (Number(r[col.key]) || 0), 0);
      totales[col.key] = suma;

      if (col.isCantidad) totalCantidad = suma;
      if (col.isTotal) totalMonto = suma;
    }
  });

  const promedioGeneral = totalCantidad > 0 ? totalMonto / totalCantidad : 0;

  // -------------------------------
  // TABLA DETALLE
  // -------------------------------
  const tableBody = data.map((row) =>
    columnas.map((col) => {
      if (col.format === "moneda") return `L. ${formatNumber(row[col.key])}`;
      if (col.format === "numero") return formatNumber(row[col.key]);
      return row[col.key] || "";
    })
  );

  // Fila de totales
  const totalRow = columnas.map((col) => {
    if (col.isCantidad) return formatNumber(totales[col.key] || 0);
    if (col.isTotal) return `L. ${formatNumber(totales[col.key] || 0)}`;
    if (col.key.toLowerCase().includes("promedio"))
      return `L. ${formatNumber(promedioGeneral)}`;
    return "";
  });

  tableBody.push(totalRow);

  const tableHead = columnas.map((col) => col.header);

  // Calcular espacio disponible para la tabla
  const footerSpace = 20;
  const availableHeight = pageHeight - yPos - footerSpace;

  autoTable(doc, {
    startY: yPos,
    head: [tableHead],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: colorPrimario,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3.5,
      minCellHeight: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: colorTexto,
      cellPadding: 2.5,
      minCellHeight: 7,
    },
    alternateRowStyles: {
      fillColor: colorSecundario,
    },
    columnStyles: columnas.reduce((acc, col, idx) => {
      if (
        col.format === "moneda" ||
        col.format === "numero" ||
        col.isCantidad ||
        col.isTotal
      ) {
        acc[idx] = { halign: "right" };
      }
      return acc;
    }, {}),
    margin: { left: margin, right: margin, bottom: footerSpace },
    didParseCell: (data) => {
      // Fila de totales con estilo especial
      if (data.row.index === tableBody.length - 1 && data.section === "body") {
        data.cell.styles.fillColor = [52, 73, 94];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9;
        data.cell.styles.cellPadding = 3;
      }
    },
    didDrawPage: (dataArg) => {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = dataArg.pageNumber;

      // ✅ Ya NO se dibuja encabezado en páginas siguientes
      // Nada en esta sección excepto en página 1, pero en página 1 ya lo dibujaste arriba
      // Así que no ponemos nada para páginas siguientes

      // ✅ Pie de página
      const footerY = pageHeight - 12;

      doc.setDrawColor(...colorPrimario);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        pageWidth - margin,
        footerY + 5,
        { align: "right" }
      );

      const miniLogoSize = 5;
      try {
        doc.addImage(
          fondoImg,
          "PNG",
          margin,
          footerY + 1.5,
          miniLogoSize,
          miniLogoSize
        );
      } catch (error) {}
    },
  });

  // -------------------------------
  // Guardar PDF
  // -------------------------------
  const filename = `${(options.title || "reporte").replace(
    /\s+/g,
    "_"
  )}-${dayjs().format("YYYY-MM-DD-HHmm")}.pdf`;
  doc.save(filename);
  return doc;
};
