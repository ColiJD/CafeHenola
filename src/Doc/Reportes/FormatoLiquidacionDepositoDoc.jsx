import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

/**
 * Genera un PDF para el Reporte de Liquidación de Depósitos en formato Vertical
 * @param {Array} data - Datos de las liquidaciones
 * @param {Object} filtros - Fechas, nombre, etc.
 * @param {Object} options - Configuración visual
 */
export const generarReporteLiquidacionesPDF = (
  data,
  filtros = {},
  options = {},
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const colorPrimario = options.colorPrimario || [16, 86, 132];
  const colorSecundario = options.colorSecundario || [240, 242, 245];
  const colorTexto = [33, 37, 41];

  const formatNumber = (num) =>
    !num || num === 0
      ? "0.00"
      : Number(num).toLocaleString("es-HN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const pageWidth = doc.internal.pageSize.width;

  // === ENCABEZADO ===
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("REPORTE DE LIQUIDACIÓN DE DEPÓSITOS", pageWidth / 2, 12, {
    align: "center",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado el: ${dayjs().format("DD/MM/YYYY HH:mm")}`,
    pageWidth / 2,
    18,
    {
      align: "center",
    },
  );

  // === FILTROS APLICADOS ===
  let yPosition = 35;
  doc.setTextColor(...colorTexto);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FILTROS APLICADOS:", 15, yPosition);
  yPosition += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  if (filtros.fechaInicio && filtros.fechaFin) {
    doc.text(
      `• Período: ${dayjs(filtros.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(
        filtros.fechaFin,
      ).format("DD/MM/YYYY")}`,
      15,
      yPosition,
    );
    yPosition += 5;
  }

  if (filtros.nombreFiltro) {
    doc.text(`• Filtro Cliente: "${filtros.nombreFiltro}"`, 15, yPosition);
    yPosition += 5;
  }

  if (!filtros.fechaInicio && !filtros.nombreFiltro) {
    doc.text("• Sin filtros aplicados", 15, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // === TABLA DE TOTALES ===
  if (data && data.length > 0) {
    const totalQQ = data.reduce(
      (acc, item) => acc + (parseFloat(item.liqCatidadQQ) || 0),
      0,
    );
    const totalLps = data.reduce(
      (acc, item) => acc + (parseFloat(item.liqTotalLps) || 0),
      0,
    );

    autoTable(doc, {
      startY: yPosition,
      head: [["TOTAL REGISTROS", "TOTAL QQ", "TOTAL LPS"]],
      body: [
        [data.length, formatNumber(totalQQ), `L. ${formatNumber(totalLps)}`],
      ],
      headStyles: {
        fillColor: colorPrimario,
        textColor: [255, 255, 255],
        halign: "center",
      },
      bodyStyles: {
        textColor: colorTexto,
        halign: "center",
        fontStyle: "bold",
      },
      theme: "grid",
      margin: { left: 15, right: 15 },
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // === TABLA DE DETALLES ===
  if (data && data.length > 0) {
    const tableData = data.map((item) => [
      item.liqID,
      item.liqFecha ? dayjs(item.liqFecha).format("DD/MM/YYYY") : "—",
      item.nombreCliente || "—",
      formatNumber(item.liqCatidadQQ),
      formatNumber(item.liqPrecio),
      `L. ${formatNumber(item.liqTotalLps)}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          "Liq ID",
          "Fecha",
          "Cliente",
          "Cantidad QQ",
          "Precio Lps",
          "Total Lps",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: colorPrimario,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8, textColor: colorTexto },
      alternateRowStyles: { fillColor: colorSecundario },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "left" },
        3: { halign: "right", cellWidth: 25 },
        4: { halign: "right", cellWidth: 25 },
        5: { halign: "right", cellWidth: 35 },
      },
      didDrawPage: function (dataArg) {
        const pageCount = doc.internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height
          ? pageSize.height
          : pageSize.getHeight();

        // Número de página
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Página ${dataArg.pageNumber} de ${pageCount}`,
          pageSize.width - 15,
          pageHeight - 10,
          { align: "right" },
        );

        doc.setDrawColor(200, 200, 200);
        doc.line(15, pageHeight - 15, pageSize.width - 15, pageHeight - 15);
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(200, 100, 100);
    doc.text("No hay datos disponibles", pageWidth / 2, yPosition + 20, {
      align: "center",
    });
  }

  const nombreArchivo = `reporte-liquidaciones-${dayjs().format(
    "YYYY-MM-DD-HHmm",
  )}.pdf`;
  doc.save(nombreArchivo);
  return doc;
};
