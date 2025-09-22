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

  // Fondo gris
  const fondoGray = await processImageToGray(fondoImg.src, 0.15);
  doc.addImage(fondoGray, "PNG", 0, 0, pageWidth, pageHeight);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logo = await getLogoScaled(fondoImg.src, 100, 100);
  doc.addImage(logo.src, "PNG", leftMargin, 20, logo.width, logo.height);

  // Encabezado
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 60, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("COMPROBANTE DE DEPÓSITO", pageWidth / 2, 85, { align: "center" });
  doc.setFontSize(12);
  doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 105, {
    align: "center",
  });

  // Datos del comprobante
  const cliente = formState?.cliente?.label || "Cliente";
  const cantidad = formState?.total || 0;
  const observaciones = formState?.observaciones || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";

  const cantidadLetras = numeroALetras(cantidad, "QQ de oro");

  let startY = topMargin + 110;
  doc.setFont("times", "normal");
  doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
  doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
    align: "right",
  });

  startY += 30;
  doc.setFont("times", "bold");
  doc.text(`Cliente: ${cliente}`, leftMargin, startY);
  startY += 20;

  // Cantidad depositada
  doc.setFont("times", "normal");
  doc.text(
    `Cantidad Depositada: ${formatNumber(cantidad)} QQ de oro`,
    leftMargin,
    startY
  );
  startY += 20;
  doc.text(`En Letras: ${cantidadLetras}`, leftMargin, startY);

  startY += 40;

  // Observaciones
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
    pageHeight - 30,
    { align: "center" }
  );

  const nombreArchivo = `Deposito_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
