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

/** Genera el PDF de liquidación de depósito */
export const exportLiquidacionDeposito = async (formState) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
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
  doc.text("LIQUIDACIÓN DE DEPÓSITO", pageWidth / 2, 85, { align: "center" });

  doc.setFontSize(12);
  doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 105, {
    align: "center",
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

  let startY = topMargin + 110;
  doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
  doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
    align: "right",
  });
  startY += 30;

  // Tabla con datos principales
  autoTable(doc, {
    startY,
    margin: { left: leftMargin, right: rightMargin },
    head: [["Dato", "Valor"]],
    body: [
      ["Cliente", cliente],
      ["Tipo de Café", tipoCafe],
      ["Saldo Disponible (QQ)", formatNumber(saldoDisponible)],
      ["Cantidad a Liquidar (QQ)", formatNumber(cantidadLiquidar)],
      ["Total a Pagar (Lps)", `L. ${formatNumber(totalPagar)}`],
      ["Saldo Restante (QQ)", formatNumber(saldoPendiente)],
    ],
    styles: { font: "times", fontSize: 12 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  startY = doc.lastAutoTable.finalY + 20;

  // Cantidad en letras
  doc.setFont("times", "normal");

  doc.text(`Cantidad en Letras: ${cantidadLetras}`, leftMargin, startY);
  startY += 30;
  doc.text(
    `Total en Letras: ${numeroALetras(totalPagar, "Lempiras")}`,
    leftMargin,
    startY
  );
  startY += 30;
  // Forma de Pago
  doc.text("Forma de Pago:", leftMargin, startY);
  const formas = ["Efectivo", "Transferencia", "Cheque"];
  let x = leftMargin + 100;
  formas.forEach((f) => {
    // Dibujar cuadro alineado con el texto
    doc.rect(x, startY - 8, 12, 12);
    if (formaPago === f) {
      doc.text("X", x + 3.5, startY + 1); // centrar la X en el cuadro
    }
    doc.text(f, x + 20, startY + 2); // texto alineado al centro del cuadro
    x += 120; // espacio entre opciones
  });

  startY += 40; // salto después de forma de pago

  // Descripción
  doc.setFont("times", "bold");
  doc.text("Descripción:", leftMargin, startY);
  startY += 15;
  doc.setFont("times", "normal");
  doc.text(cleanText(descripcion), leftMargin, startY, {
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

  const nombreArchivo = `Liquidacion_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
