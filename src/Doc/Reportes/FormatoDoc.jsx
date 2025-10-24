import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

/**
 * Función para generar PDF con resumen y detalle.
 * @param {Array} data - Datos de la tabla
 * @param {Object} filtros - Filtros aplicados
 * @param {Object} options - Opciones de configuración (colores, título, orientación)
 */
export const generarReportePDF = (data, filtros = {}, options = {}) => {
  const doc = new jsPDF({
    orientation: options.orientation || "landscape",
    unit: "mm",
    format: "a4",
  });

  // Colores
  const colorPrimario = options.colorPrimario || [41, 128, 185]; // Azul
  const colorSecundario = options.colorSecundario || [236, 240, 241]; // Gris claro
  const colorTexto = options.colorTexto || [44, 62, 80]; // Gris oscuro

  const formatNumber = (num) =>
    !num || num === 0
      ? "0.00"
      : Number(num).toLocaleString("es-HN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  // ENCABEZADO
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 297, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(options.title || "REPORTE DE ENTRADAS", 148.5, 12, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado el: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 148.5, 18, {
    align: "center",
  });

  // FILTROS
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
      `• Período: ${dayjs(filtros.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(
        filtros.fechaFin
      ).format("DD/MM/YYYY")}`,
      20,
      yPosition
    );
    yPosition += 6;
  }

  if (filtros.nombreFiltro) {
    doc.text(`• Búsqueda por nombre: "${filtros.nombreFiltro}"`, 20, yPosition);
    yPosition += 6;
  }

  if (filtros.clienteFiltro) {
    doc.text(`• Cliente específico: "${filtros.clienteFiltro}"`, 20, yPosition);
    yPosition += 6;
  }

  if (!filtros.fechaInicio && !filtros.nombreFiltro && !filtros.clienteFiltro) {
    doc.text("• Sin filtros aplicados (todos los registros)", 20, yPosition);
    yPosition += 6;
  }

  yPosition += 5;

  // RESUMEN GENERAL
  if (data && data.length > 0) {
    // Calcular totales combinados
    const totales = data.reduce(
      (acc, item) => {
        const totalQQ =
          (parseFloat(item.compraCantidadQQ) || 0) +
          (parseFloat(item.contratoCantidadQQ) || 0) +
          (parseFloat(item.depositoCantidadQQ) || 0);

        const totalLps =
          (parseFloat(item.compraTotalLps) || 0) +
          (parseFloat(item.contratoTotalLps) || 0) +
          (parseFloat(item.depositoTotalLps) || 0);

        acc.totalQQ += totalQQ;
        acc.totalLps += totalLps;
        return acc;
      },
      { totalQQ: 0, totalLps: 0 }
    );

    const totalClientes = data.length;

    autoTable(doc, {
      startY: yPosition,
      head: [["RESUMEN GENERAL", "TOTAL"]],
      body: [
        ["Total de Clientes", formatNumber(totalClientes)],
        ["Total Quintales (QQ)", formatNumber(totales.totalQQ)],
        ["Total en Lempiras (Lps)", `L. ${formatNumber(totales.totalLps)}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: colorPrimario,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: colorTexto },
      alternateRowStyles: { fillColor: colorSecundario },
      margin: { left: 20, right: 20 },
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // TABLA DETALLE
  if (data && data.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE POR CLIENTE", 20, yPosition);
    yPosition += 8;

    const tableData = data.map((item) => [
      item.clienteID || "",
      item.nombre || "",
      formatNumber(item.compraCantidadQQ),
      `L. ${formatNumber(item.compraTotalLps)}`,
      formatNumber(item.contratoCantidadQQ),
      `L. ${formatNumber(item.contratoTotalLps)}`,
      formatNumber(item.depositoCantidadQQ),
      `L. ${formatNumber(item.depositoTotalLps)}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          "ID",
          "Cliente",
          "Compra QQ",
          "Compra Lps",
          "Contrato QQ",
          "Contrato Lps",
          "Depósito QQ",
          "Depósito Lps",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: colorPrimario,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: { fontSize: 8, textColor: colorTexto },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "left", cellWidth: 50 },
        2: { halign: "right", cellWidth: 25 },
        3: { halign: "right", cellWidth: 30 },
        4: { halign: "right", cellWidth: 25 },
        5: { halign: "right", cellWidth: 30 },
        6: { halign: "right", cellWidth: 25 },
        7: { halign: "right", cellWidth: 30 },
      },
      alternateRowStyles: { fillColor: colorSecundario },
      margin: { left: 20, right: 20 },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height
          ? pageSize.height
          : pageSize.getHeight();

        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageSize.width - 20,
          pageHeight - 10,
          { align: "right" }
        );

        doc.setDrawColor(200, 200, 200);
        doc.line(20, pageHeight - 15, pageSize.width - 20, pageHeight - 15);
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(200, 100, 100);
    doc.text("No hay datos disponibles para mostrar", 148.5, yPosition + 20, {
      align: "center",
    });
  }

  // Pie adicional con total de registros
  if (data && data.length > 0) {
    const finalY = doc.lastAutoTable?.finalY || yPosition;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Total de registros: ${data.length}`, 20, finalY + 10);
  }

  const nombreArchivo = `reporte-entradas-${dayjs().format(
    "YYYY-MM-DD-HHmm"
  )}.pdf`;
  doc.save(nombreArchivo);
  return doc;
};
