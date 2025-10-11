import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNumber } from "@/components/Formulario";
import fondoImg from "@/img/frijoles.png";
import frijol from "@/img/imagenfrijoles.png";
import sello from "@/img/logo_transparente.png";
import tasa from "@/img/tasa.png";
import {
  numeroALetras,
  cleanText,
  processImageToGray,
  getLogoScaled,
} from "@/Doc/Documentos/funcionesdeDocumentos";

export const exportLiquidacionDeposito = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 50;
  const rightMargin = 50;
  const topMargin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const fondoGray = await processImageToGray(fondoImg.src, 0.15);

  const scale = 0.9;
  const logo = await getLogoScaled(tasa.src, 80 * scale, 80 * scale);
  const frijolimg = await getLogoScaled(frijol.src, 80 * scale, 80 * scale);
  const selloimg = await getLogoScaled(sello.src, 50 * scale, 50 * scale);

  const tipoCafe = formState?.tipoCafe || "Tipo de Café";
  const cantidadLiquidar = formState?.cantidadLiquidar || 0;
  const totalPagar = formState?.totalPagar || 0;
  const descripcion = formState?.descripcion || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";
  const cantidadLetras = numeroALetras(cantidadLiquidar, "QQ de oro");
  const formaPago = formState?.formaPago || "";

  // ✅ Aquí se corrige: el nombre del productor se toma desde `cliente`
  const productor =
    (typeof formState?.cliente === "object"
      ? formState?.cliente?.label
      : formState?.cliente) || "Nombre del Productor";

  const fechaActual = new Date().toLocaleDateString("es-HN");

  const drawComprobante = (offsetY = 0) => {
    // Fondo centrado
    const imgWidth = pageWidth * 0.9 * scale;
    const imgHeight = pageHeight * 0.45 * scale;
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = offsetY + pageHeight * 0.05;
    doc.addImage(fondoGray, "PNG", imgX, imgY, imgWidth, imgHeight);

    // Logo izquierda
    doc.addImage(
      logo.src,
      "PNG",
      leftMargin,
      20 + offsetY,
      logo.width,
      logo.height
    );

    // Frijol derecha
    const frijolY = 20 + offsetY;
    doc.addImage(
      frijolimg.src,
      "PNG",
      pageWidth - rightMargin - frijolimg.width,
      frijolY,
      frijolimg.width,
      frijolimg.height
    );

    // Encabezado central
    doc.setFont("times", "bold");
    doc.setFontSize(16 * scale);
    doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 50 + offsetY, {
      align: "center",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(12 * scale);
    doc.text("LIQUIDACIÓN DE DEPÓSITO", pageWidth / 2, 70 + offsetY, {
      align: "center",
    });
    doc.text("Propietario Enri Lagos", pageWidth / 2, 85 + offsetY, {
      align: "center",
    });
    doc.text(
      "Teléfono: (504) 3271-3188,(504) 9877-8789",
      pageWidth / 2,
      100 + offsetY,
      { align: "center" }
    );

    // === Comprobante No. arriba a la derecha (en rojo y grande) ===
    doc.setFont("times", "bold");
    doc.setFontSize(14 * scale);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Comprobante No:",
      pageWidth - rightMargin - 130,
      frijolY + frijolimg.height + 15
    );
    doc.setFontSize(16 * scale);
    doc.setTextColor(255, 0, 0);
    doc.text(
      `${comprobanteID}`,
      pageWidth - rightMargin - 15,
      frijolY + frijolimg.height + 15,
      { align: "right" }
    );

    // === Cosecha y Productor debajo ===
    doc.setFontSize(11 * scale);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cosecha 2025 - 2026`, leftMargin, topMargin + 60 + offsetY);
    doc.text(`Productor: ${productor}`, leftMargin, topMargin + 80 + offsetY);

    let startY = topMargin + 110 + offsetY;

    // === Tabla con texto en rojo ===
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [
        ["Tipo de Café", "Cantidad a Liquidar (QQ)", "Total a Pagar (Lps)"],
      ],
      body: [
        [
          { content: tipoCafe, styles: { textColor: [255, 0, 0] } },
          {
            content: formatNumber(cantidadLiquidar),
            styles: { textColor: [255, 0, 0] },
          },
          {
            content: `L. ${formatNumber(totalPagar)}`,
            styles: { textColor: [255, 0, 0] },
          },
        ],
      ],
      styles: {
        font: "times",
        fontSize: 10 * scale,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
    });

    startY = doc.lastAutoTable.finalY + 15;

    // Cantidad en letras
    doc.setTextColor(0, 0, 0);
    doc.text(`Cantidad en Letras:`, leftMargin, startY);
    doc.setTextColor(255, 0, 0);
    doc.text(`${cantidadLetras}`, leftMargin + 90, startY);
    doc.setTextColor(0, 0, 0);

    startY += 20;

    // Forma de Pago
    doc.text("Forma de Pago:", leftMargin, startY);
    const formas = ["Efectivo", "Transferencia", "Cheque"];
    let x = leftMargin + 100;
    doc.setTextColor(255, 0, 0);
    formas.forEach((f) => {
      doc.rect(x, startY - 7, 10, 10);
      if (formaPago === f) doc.text("X", x + 2, startY + 1);
      doc.text(f, x + 15, startY + 1);
      x += 100;
    });
    doc.setTextColor(0, 0, 0);

    startY += 25;

    // Descripción
    doc.setFont("times", "bold");
    doc.text("Descripción:", leftMargin, startY);
    startY += 18;
    doc.setFont("times", "normal");
    doc.text(String(descripcion || ""), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    startY += 80;

    // Firmas
    const firmaWidth = 150;
    const firmaY = startY;
    doc.line(leftMargin, firmaY, leftMargin + firmaWidth, firmaY);
    doc.text("FIRMA", leftMargin + firmaWidth / 2 - 20, firmaY + 12);

    // Línea y texto lugar
    doc.line(
      pageWidth - rightMargin - firmaWidth,
      firmaY,
      pageWidth - rightMargin,
      firmaY
    );
    doc.text(
      "LUGAR Y FECHA",
      pageWidth - rightMargin - firmaWidth / 2 - 45,
      firmaY + 12
    );

    // El Paraíso + fecha
    doc.setFont("times", "normal");
    doc.setTextColor(255, 0, 0);
    doc.text(
      `El Paraíso  ${fechaActual}`,
      pageWidth - rightMargin - firmaWidth / 2 - 50,
      firmaY - 4
    );
    doc.setTextColor(0, 0, 0);

    // Sello subido (más pegado a la línea)
    doc.addImage(
      selloimg.src,
      "PNG",
      leftMargin + firmaWidth / 2 - selloimg.width / 2,
      firmaY - selloimg.height + 1,
      selloimg.width,
      selloimg.height
    );

    // Footer
    doc.setFontSize(8 * scale);
    doc.text(
      "Beneficio Café Henola - El Paraíso, Honduras",
      pageWidth / 2,
      offsetY + pageHeight * 0.45,
      { align: "center" }
    );
  };

  // Doble comprobante
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // Línea de corte
  doc.setLineDash([5, 3]);
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash();

  const nombreArchivo = `Liquidacion_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};

