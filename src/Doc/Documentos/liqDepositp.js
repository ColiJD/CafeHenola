import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNumber } from "@/components/Formulario";
import fondoImg from "@/img/frijoles.png";
import {
  numeroALetras,
  cleanText,
  processImageToGray,
  getLogoScaled,
} from "@/Doc/Documentos/funcionesdeDocumentos";

/** Genera el PDF de liquidación de depósito compacto */
export const exportLiquidacionDeposito = async (formState) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 50;
  const rightMargin = 50;
  const topMargin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fondo compacto y con opacidad
  const fondoGray = await processImageToGray(fondoImg.src, 0.15);
  const logo = await getLogoScaled(fondoImg.src, 80, 80);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cliente = formState?.cliente?.label || "Cliente";
  const tipoCafe = formState?.tipoCafe || "Tipo de Café";
  const saldoDisponible = formState?.saldoDisponible || 0;
  const cantidadLiquidar = formState?.cantidadLiquidar || 0;
  const totalPagar = formState?.totalPagar || 0;
  const saldoPendiente =
    formState?.saldoPendiente ?? saldoDisponible - cantidadLiquidar;
  const descripcion = formState?.descripcion || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";
  const cantidadLetras = numeroALetras(cantidadLiquidar, "QQ de oro");
  const formaPago = formState?.formaPago || "";

  // 🔹 Función que dibuja cada comprobante
  const drawComprobante = (offsetY = 0) => {
    // Fondo compacto y centrado
    const imgWidth = pageWidth * 0.5;
    const imgHeight = pageHeight * 0.35;
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = offsetY + 20;
    doc.addImage(fondoGray, "PNG", imgX, imgY, imgWidth, imgHeight);

    // Logo
    doc.addImage(
      logo.src,
      "PNG",
      leftMargin,
      15 + offsetY,
      logo.width,
      logo.height
    );

    // Encabezado
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 50 + offsetY, {
      align: "center",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(13);
    doc.text("LIQUIDACIÓN DE DEPÓSITO", pageWidth / 2, 70 + offsetY, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 85 + offsetY, {
      align: "center",
    });

    // 🔹 Título "Cosecha" y años a la derecha
    const cosechaX = pageWidth - rightMargin - 80;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Cosecha", cosechaX, 65 + offsetY);
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("2024  2025", cosechaX, 85 + offsetY);

    // Datos del comprobante
    let startY = topMargin + 60 + offsetY;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
    doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
      align: "right",
    });
    startY += 20;

    // Tabla
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [
        [
          "Cliente",
          "Tipo de Café",
          "Saldo Disponible (QQ)",
          "Cantidad a Liquidar (QQ)",
          "Total a Pagar (Lps)",
          "Saldo Restante (QQ)",
        ],
      ],
      body: [
        [
          cliente,
          tipoCafe,
          formatNumber(saldoDisponible),
          formatNumber(cantidadLiquidar),
          `L. ${formatNumber(totalPagar)}`,
          formatNumber(saldoPendiente),
        ],
      ],
      styles: {
        font: "times",
        fontSize: 10,
        cellPadding: 2,
        lineWidth: 0.5, // grosor de línea de celda
        lineColor: [0, 0, 0], // color negro
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      didDrawCell: (data) => {
        // Asegura que todas las celdas tengan borde
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
      },
    });

    startY = doc.lastAutoTable.finalY + 15;

    // Cantidad en letras
    doc.text(`Cantidad en Letras: ${cantidadLetras}`, leftMargin, startY);
    startY += 20;

    // Forma de Pago
    doc.text("Forma de Pago:", leftMargin, startY);
    const formas = ["Efectivo", "Transferencia", "Cheque"];
    let x = leftMargin + 90;
    formas.forEach((f) => {
      doc.rect(x, startY - 7, 12, 12);
      if (formaPago === f) doc.text("X", x + 3.5, startY + 1);
      doc.text(f, x + 20, startY + 2);
      x += 100;
    });

    startY += 30;

    // Descripción
    doc.setFont("times", "bold");
    doc.text("Descripción:", leftMargin, startY);
    startY += 12;
    doc.setFont("times", "normal");
    doc.text(cleanText(descripcion), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    startY += 40;

    // Firmas
    const firmaWidth = 180;
    doc.line(leftMargin, startY, leftMargin + firmaWidth, startY);
    doc.text("FIRMA", leftMargin, startY + 12);

    doc.line(
      pageWidth - rightMargin - firmaWidth,
      startY,
      pageWidth - rightMargin,
      startY
    );
    doc.text("LUGAR", pageWidth - rightMargin - firmaWidth, startY + 12);

    // Footer
    doc.setFontSize(9);
    doc.text(
      "Beneficio Café Henola - El Paraíso, Honduras",
      pageWidth / 2,
      offsetY + pageHeight - 25,
      { align: "center" }
    );
  };

  // 🔹 Dibujar dos comprobantes por página
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // 🔹 Línea punteada de corte
  doc.setLineDash([5, 3]);
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash();

  const nombreArchivo = `Liquidacion_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
