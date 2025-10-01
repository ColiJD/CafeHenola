import JsPDF from "jspdf";
import { formatNumber } from "@/components/Formulario";
import fondoImg from "@/img/frijoles.png";
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

  // 🔹 Fondo a color con opacidad
  const fondoGray = await processImageToGray(fondoImg.src, 0.15);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logo = await getLogoScaled(fondoImg.src, 100, 100);

  const cliente = formState?.cliente?.label || "Cliente";
  const cantidad = formState?.total || 0;
  const observaciones = formState?.observaciones || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";
  const cantidadLetras = numeroALetras(cantidad, "QQ de oro");

  // 🔹 CAMBIO: función que dibuja el comprobante con desplazamiento vertical
  const drawComprobante = (offsetY = 0) => {
    // Fondo compacto y centrado
    const imgWidth = pageWidth * 0.5; // 50% del ancho
    const imgHeight = (imgWidth / pageWidth) * pageHeight; // mantiene proporción
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = offsetY + pageHeight / 4 - imgHeight / 2;
    doc.addImage(fondoGray, "PNG", imgX, imgY, imgWidth, imgHeight);

    // Logo
    doc.addImage(
      logo.src,
      "PNG",
      leftMargin,
      20 + offsetY,
      logo.width,
      logo.height
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

    doc.setFontSize(12);
    doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 105 + offsetY, {
      align: "center",
    });

    // 🔹 Título "Cosecha" y años a la derecha
    const cosechaX = pageWidth - rightMargin - 80; // ajusta según espacio
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Cosecha", cosechaX, 60 + offsetY); // a la altura del logo

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("2025  2026", cosechaX, 80 + offsetY);

    let startY = topMargin + 60 + offsetY;
    doc.setFont("times", "normal");
    doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
    doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
      align: "right",
    });

    startY += 30;
    doc.setFont("times", "bold");
    doc.text(`Cliente: ${cliente}`, leftMargin, startY);

    startY += 20;
    doc.setFont("times", "normal");
    doc.text(
      `Cantidad Depositada: ${formatNumber(cantidad)} QQ de oro`,
      leftMargin,
      startY
    );
    startY += 20;
    doc.text(`En Letras: ${cantidadLetras}`, leftMargin, startY);

    startY += 40;
    doc.setFont("times", "bold");
    doc.text("Observaciones:", leftMargin, startY);
    startY += 15;
    doc.setFont("times", "normal");
    doc.text(cleanText(observaciones), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    startY += 60;
    // Firmas
    const firmaWidth = 200;
    doc.line(leftMargin, startY, leftMargin + firmaWidth, startY);
    doc.text("FIRMA", leftMargin, startY + 15);

    doc.line(
      pageWidth - rightMargin - firmaWidth,
      startY,
      pageWidth - rightMargin,
      startY
    );
    doc.text("LUGAR", pageWidth - rightMargin - firmaWidth, startY + 15);

    // Footer
    doc.setFontSize(10);
    doc.text(
      "Beneficio Café Henola - El Paraíso, Honduras",
      pageWidth / 2,
      offsetY + pageHeight / 2 -15,
      { align: "center" }
    );
  };

  // 🔹 CAMBIO: dibujar dos comprobantes (arriba y abajo)
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // 🔹 CAMBIO: línea punteada de corte en el centro
  doc.setLineDash([5, 3]);
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash(); // reset

  const nombreArchivo = `Deposito_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
