import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNumber } from "@/components/Formulario";
import fondoImg from "@/img/frijoles.png";
import frijol from "@/img/imagenfrijoles.png";
import sello from "@/img/logo_transparente.png";
import tasa from "@/img/tasa.png";
import {
  numeroALetras,
  processImageToGray,
  getLogoScaled,
} from "@/Doc/Documentos/funcionesdeDocumentos";

export const exportEntregaContrato = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 50;
  const rightMargin = 50;
  const topMargin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---------- Un solo tamaño----------
  const scale = 1.1;
  const FS_H1 = 16 * scale;    
  const FS_BODY = 11 * scale;   
  const FS_SMALL = 9 * scale;   

  const fondoGray = await processImageToGray(fondoImg.src, 0.15);
  const logo = await getLogoScaled(tasa.src, 80 * scale, 80 * scale);
  const frijolimg = await getLogoScaled(frijol.src, 80 * scale, 80 * scale);
  const selloimg = await getLogoScaled(sello.src, 50 * scale, 50 * scale);

  const cliente = formState?.cliente?.label || "Cliente";
  const contratoID = formState?.contratoID || "0000";
  const comprobanteID = formState?.comprobanteID || "0000";
  const tipoCafe = formState?.tipoCafe || "Tipo de Café";
  const quintalesIngresados = formState?.quintalesIngresados || 0;
  const precio = formState?.precio || 0;
  const totalPagar = formState?.totalPagar || 0;
  const formaPago = formState?.formaPago || "";
  const observaciones = formState?.observaciones || "N/A";

  const numeroALetrasExtendido = (num) => {
    const entero = Math.floor(num);
    const centavos = Math.round((num - entero) * 100);
    let letrasEntero = numeroALetras(entero)
      .replace(/lempiras?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const letrasCentavos =
      centavos > 0
        ? numeroALetras(centavos).replace(/lempiras?/gi, "").replace(/\s+/g, " ").trim()
        : "";
    return centavos > 0
      ? `${letrasEntero} lempiras con ${letrasCentavos} centavos`
      : `${letrasEntero} lempiras exactos`;
  };

  const cantidadLetras = numeroALetrasExtendido(totalPagar);

  const drawComprobante = (offsetY = 0) => {
    // Fondo
    const imgWidth = pageWidth * 0.9 * scale;
    const imgHeight = pageHeight * 0.45 * scale;
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = offsetY + pageHeight * 0.05;
    doc.addImage(fondoGray, "PNG", imgX, imgY, imgWidth, imgHeight);

    // Logos
    doc.addImage(logo.src, "PNG", leftMargin, 20 + offsetY, logo.width, logo.height);
    const frijolY = 20 + offsetY;
    doc.addImage(
      frijolimg.src,
      "PNG",
      pageWidth - rightMargin - frijolimg.width,
      frijolY,
      frijolimg.width,
      frijolimg.height
    );

    // Encabezado
    doc.setFont("times", "bold");
    doc.setFontSize(FS_H1);
    doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 50 + offsetY, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(FS_BODY);
    doc.text("ENTREGA DE CONTRATO", pageWidth / 2, 70 + offsetY, { align: "center" });
    doc.text("Propietario Enri Lagos", pageWidth / 2, 85 + offsetY, { align: "center" });
    doc.text("Teléfono: (504) 3271-3188, (504) 9877-8789", pageWidth / 2, 100 + offsetY, { align: "center" });

    // Cosecha 
    doc.setFont("times", "bold");
    doc.setFontSize(FS_BODY);
    doc.text("Cosecha 2025 - 2026", leftMargin, topMargin + 60 + offsetY);

    // Productor 
    doc.setFont("times", "normal");
    doc.setFontSize(FS_BODY);
    const yProd = topMargin + 80 + offsetY;
    const labelProd = "Productor:";
    doc.text(labelProd, leftMargin, yProd);
    const wLabelProd = doc.getTextWidth(labelProd);
    doc.setTextColor(255, 0, 0);
    doc.text(` ${cliente}`, leftMargin + wLabelProd, yProd);
    doc.setTextColor(0, 0, 0);

    // Comprobante No
    const compX = pageWidth - rightMargin - 140;
    const compY = frijolY + frijolimg.height + 18;
    doc.setFont("times", "bold");
    doc.setFontSize(FS_BODY);
    doc.text("Comprobante No:", compX, compY);
    doc.setTextColor(255, 0, 0);
    doc.text(`${comprobanteID}`, compX + 125, compY);
    doc.setTextColor(0, 0, 0);

    // Tabla
    let startY = topMargin + 110 + offsetY;
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [["Contrato", "Tipo Café", "Quintales Ingresados", "Precio (Lps)", "Total a Pagar (Lps)"]],
      body: [
        [
          { content: contratoID, styles: { textColor: [255, 0, 0] } },
          { content: tipoCafe, styles: { textColor: [255, 0, 0] } },
          { content: formatNumber(quintalesIngresados), styles: { textColor: [255, 0, 0] } },
          { content: `L. ${formatNumber(precio)}`, styles: { textColor: [255, 0, 0] } },
          { content: `L. ${formatNumber(totalPagar)}`, styles: { textColor: [255, 0, 0] } },
        ],
      ],
      styles: { font: "times", fontSize: 9 * scale, lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0] },
    });

    startY = doc.lastAutoTable.finalY + 30;

    // Total en letras
    doc.setFont("times", "bold");
    doc.setFontSize(FS_BODY);
    doc.text("Total en Letras:", leftMargin, startY);
    doc.setFont("times", "normal");
    doc.setFontSize(FS_BODY);
    doc.setTextColor(255, 0, 0);
    const maxWidth = pageWidth - leftMargin - rightMargin - 150;
    const textoEnLetras = doc.splitTextToSize(cantidadLetras, maxWidth);
    doc.text(textoEnLetras, leftMargin + 115, startY);
    const lineCount = textoEnLetras.length;
    startY += 20 + (lineCount * 12);
    doc.setTextColor(0, 0, 0);

    // Forma de pago
    doc.setFont("times", "bold");
    doc.setFontSize(FS_BODY);
    doc.text("Forma de Pago:", leftMargin, startY);
    doc.setFont("times", "normal");
    doc.setFontSize(FS_BODY);

    const formas = ["Efectivo", "Transferencia", "Cheque"];
    const boxSize = 10;
    let x = leftMargin + 130;
    const boxY = startY - 8;
    const gap = 130;

    doc.setTextColor(255, 0, 0);
    formas.forEach((f) => {
      doc.rect(x, boxY, boxSize, boxSize);
      if (formaPago === f) doc.text("X", x + 2.5, boxY + 8);
      doc.text(f, x + 15, boxY + 9);
      x += gap;
    });
    doc.setTextColor(0, 0, 0);

    startY += 35;

    // Observaciones 
    doc.setFont("times", "bold");
    doc.setFontSize(FS_BODY);
    doc.text("Observaciones:", leftMargin, startY);
    startY += 15;
    doc.setFont("times", "normal");
    doc.setFontSize(FS_BODY);
    doc.text(String(observaciones || ""), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    // ======== BLOQUE DE FIRMAS ========
    const mitadAltura = pageHeight / 2;
    const firmaBase = offsetY + mitadAltura - 25;
    const firmaWidth = 150;
    const firmaY = firmaBase - 8;

    doc.setFont("times", "bold");
    doc.setFontSize(FS_BODY);
    doc.line(leftMargin, firmaY, leftMargin + firmaWidth, firmaY);
    doc.text("FIRMA", leftMargin + 55, firmaY + 14);

    doc.line(pageWidth - rightMargin - firmaWidth, firmaY, pageWidth - rightMargin, firmaY);
    doc.text("LUGAR Y FECHA", pageWidth - rightMargin - 140, firmaY + 14);

    doc.setFont("times", "normal");
    doc.setFontSize(FS_SMALL);
    doc.text("Beneficio Café Henola - El Paraíso, Honduras", pageWidth / 2, firmaY + 12, { align: "center" });

    // Fecha roja
    doc.setFont("times", "bold");
    doc.setFontSize(14); 
    doc.setTextColor(255, 0, 0);
    doc.text("El Paraíso 11/10/2025", (pageWidth / 2) + 120, firmaY - 6);
    doc.setTextColor(0, 0, 0);

    // Sello ajustado
    const selloFactor = 0.85;
    const selloW = selloimg.width * selloFactor;
    const selloH = selloimg.height * selloFactor;
    doc.addImage(
      selloimg.src,
      "PNG",
      leftMargin + firmaWidth / 2 - selloW / 2,
      firmaY - selloH - 1,
      selloW,
      selloH
    );
  };

  // Doble comprobante (arriba y abajo)
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // Línea de corte
  doc.setLineDash([5, 3]);
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash();

  const nombreArchivo = `EntregaContrato_${cliente.replace(/\s+/g, "_")}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
