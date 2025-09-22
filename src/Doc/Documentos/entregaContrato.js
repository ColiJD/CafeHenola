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

/** Genera el PDF de entrega de contrato */
export const exportEntregaContrato = async (formState) => {
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
  doc.text("ENTREGA DE CONTRATO", pageWidth / 2, 85, { align: "center" });

  doc.setFontSize(12);
  doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 105, {
    align: "center",
  });

  const cliente = formState?.cliente?.label || "Cliente";
  const contratoID = formState?.contratoID || "0000";
  const comprobanteID = formState?.comprobanteID || "0000";
  const pesoBruto = formState?.pesoBruto || 0;
  const totalSacos = formState?.totalSacos || 0;
  const tipoCafe = formState?.tipoCafe || "Tipo de Café";
  const quintalesDisponibles = formState?.quintalesDisponibles || 0;
  const quintalesIngresados = formState?.quintalesIngresados || 0;
  const precio = formState?.precio || 0;
  const totalPagar = formState?.totalPagar || 0;
  const retencion = formState?.retencion || 0;
  const saldoRestanteQQ = formState?.saldoRestanteQQ || 0;
  const saldoRestanteLps = formState?.saldoRestanteLps || 0;
  const formaPago = formState?.formaPago || "";
  const observaciones = formState?.observaciones || "N/A";

  const cantidadLetras = numeroALetras(totalPagar, "Lempiras");

  let startY = topMargin + 110;
  doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
  doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
    align: "right",
  });
  startY += 30;

  const filaPesoOCantidad = tipoCafe.includes("Cafe Lata")
    ? ["Cantidad de Latas", formatNumber(pesoBruto)]
    : ["Peso Bruto (Lbs)", formatNumber(pesoBruto)];

  // Tabla con datos principales
  autoTable(doc, {
    startY,
    margin: { left: leftMargin, right: rightMargin },
    head: [["Dato", "Valor"]],
    body: [
      ["Cliente", cliente],
      ["Código Contrato", contratoID],
      filaPesoOCantidad,
      ["Total Sacos", formatNumber(totalSacos)],
      ["Tipo de Café", tipoCafe],
      ["Quintales Disponibles", formatNumber(quintalesDisponibles)],
      ["Quintales Ingresados", formatNumber(quintalesIngresados)],
      ["Precio por QQ", `L. ${formatNumber(precio)}`],
      ["Total a Pagar", `L. ${formatNumber(totalPagar)}`],
      ["Retención", `L. ${formatNumber(retencion)}`],
      ["Saldo Restante (QQ)", formatNumber(saldoRestanteQQ)],
      ["Saldo Restante (Lps)", `L. ${formatNumber(saldoRestanteLps)}`],
    ],
    styles: { font: "times", fontSize: 12 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  startY = doc.lastAutoTable.finalY + 20;

  // Total en letras
  doc.setFont("times", "normal");
  doc.text(`Total en Letras: ${cantidadLetras}`, leftMargin, startY);
  startY += 25;
  doc.text(
    `Cantidad en Letras: ${numeroALetras(quintalesIngresados)},Quintales oro}`,
    leftMargin,
    startY
  );
  startY += 25;

  // Forma de Pago
  doc.text("Forma de Pago:", leftMargin, startY);
  const formas = ["Efectivo", "Transferencia", "Cheque"];
  let x = leftMargin + 100;
  formas.forEach((f) => {
    doc.rect(x, startY - 8, 12, 12); // cuadro
    if (formaPago === f) {
      doc.text("X", x + 3.5, startY + 1); // marcar seleccionado
    }
    doc.text(f, x + 20, startY + 2); // etiqueta
    x += 120;
  });

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
  doc.text("LUGAR Y FECHA", pageWidth - rightMargin - firmaWidth, startY + 15);

  // Footer
  doc.setFontSize(10);
  doc.text(
    "Beneficio Café Henola - El Paraíso, Honduras",
    pageWidth / 2,
    pageHeight - 30,
    { align: "center" }
  );

  const nombreArchivo = `EntregaContrato_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
