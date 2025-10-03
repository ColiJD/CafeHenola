import JsPDF from "jspdf";
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

export const exportDeposito = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 72;
  const rightMargin = 72;
  const topMargin = 72;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fondo en escala de grises
  const fondoGray = await processImageToGray(fondoImg.src, 0.15);

  // Fecha
  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Escalamos imágenes
  const logo = await getLogoScaled(tasa.src, 80, 80);
  const frijolimg = await getLogoScaled(frijol.src, 80, 80);
  const selloimg = await getLogoScaled(sello.src, 60, 60);

  // Datos del comprobante
  const cliente = formState?.cliente?.label || "Cliente";
  const cantidad = formState?.total || 0;
  const observaciones = formState?.observaciones || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";
  const cantidadLetras = numeroALetras(cantidad, "QQ de oro");

  // Función que dibuja un comprobante
  const drawComprobante = (offsetY = 0) => {
    // Fondo
    const imgWidth = pageWidth * 0.6;
    const imgHeight = (imgWidth / pageWidth) * pageHeight;
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = offsetY + pageHeight / 4 - imgHeight / 2;
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

    // Imagen frijol a la derecha
    const frijolY = 20 + offsetY;
    doc.addImage(
      frijolimg.src,
      "PNG",
      pageWidth - rightMargin - frijolimg.width,
      frijolY,
      frijolimg.width,
      frijolimg.height
    );

    // Cosecha junto a frijol
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(
      "Cosecha",
      pageWidth - rightMargin - frijolimg.width,
      frijolY + frijolimg.height + 20
    );
    doc.setFont("times", "normal");
    doc.text(
      "2025  2026",
      pageWidth - rightMargin - frijolimg.width,
      frijolY + frijolimg.height + 30
    );

    // Encabezado
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 60 + offsetY, {
      align: "center",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text("COMPROBANTE DE DEPÓSITO", pageWidth / 2, 85 + offsetY, {
      align: "center",
    });
    doc.text("Propietario Enri Lagos", pageWidth / 2, 100 + offsetY, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text("Teléfono: (504) 3271-3188, (504) 9877-8789", pageWidth / 2, 115 + offsetY, {
      align: "center",
    });

    // Datos
    let startY = topMargin + 60 + offsetY;
    doc.setFont("times", "normal");
    doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
    doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
      align: "right",
    });

    startY += 30;
    doc.setFont("times", "bold");
    doc.text(`Productor: ${cliente}`, leftMargin, startY);

    startY += 20;
    doc.setFont("times", "normal");
    doc.text(
      `Cantidad Depositada: ${formatNumber(cantidad)} QQ de oro`,
      leftMargin,
      startY
    );
    startY += 20;
    doc.text(`En Letras: ${cantidadLetras}`, leftMargin, startY);

    // Observaciones
    startY += 40;
    doc.setFont("times", "bold");
    doc.text("Observaciones:", leftMargin, startY);
    startY += 15;
    doc.setFont("times", "normal");
    doc.text(String(observaciones || ""), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    // Firmas
    startY += 80;
    const firmaWidth = 180;

    // Línea y texto firma cliente
    doc.line(leftMargin, startY, leftMargin + firmaWidth, startY);
    doc.text("FIRMA", leftMargin, startY + 15);

    // Sello sobre la firma cliente
    doc.addImage(
      selloimg.src,
      "PNG",
      leftMargin + firmaWidth / 2 - selloimg.width / 2,
      startY - selloimg.height - 5,
      selloimg.width,
      selloimg.height
    );

    // Línea y texto lugar
    doc.line(
      pageWidth - rightMargin - firmaWidth,
      startY,
      pageWidth - rightMargin,
      startY
    );
    doc.text("LUGAR", pageWidth - rightMargin - firmaWidth, startY + 15);

    // Texto "El Paraíso" sobre la línea de LUGAR
    doc.setFont("times", "bold");
    doc.text(
      "El Paraíso",
      pageWidth - rightMargin - firmaWidth + 40,
      startY - 5
    );
    doc.setFont("times", "normal");

    // Footer
    doc.setFontSize(10);
    doc.text(
      "Beneficio Café Henola - El Paraíso, Honduras",
      pageWidth / 2,
      offsetY + pageHeight / 2 - 15,
      { align: "center" }
    );
  };

  // Dibuja dos comprobantes en la misma hoja
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // Línea punteada de corte
  doc.setLineDash([5, 3]);
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash();

  const nombreArchivo = `Deposito_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
