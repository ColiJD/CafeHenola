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

/** Genera el PDF del contrato de café */
export const exportContratoCafe = async (formState) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 72;
  const rightMargin = 72;
  const topMargin = 72;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fondo blanco y negro con opacidad
  const fondoGray = await processImageToGray(fondoImg.src, 0.15);
  doc.addImage(fondoGray, "PNG", 0, 0, pageWidth, pageHeight);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Logo escalado manteniendo proporciones
  const logo = await getLogoScaled(fondoImg.src, 100, 100); // tamaño máximo 100x100
  doc.addImage(logo.src, "PNG", leftMargin, 20, logo.width, logo.height);

  // Encabezado con separación
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 60, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("CONTRATO DE COMPRA-VENTA DE CAFÉ", pageWidth / 2, 85, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 105, {
    align: "center",
  });

  // Datos del contrato
  const cliente = formState?.cliente?.label || "Cliente";
  const producto = formState?.producto?.label || "Producto";
  const cantidadQQ = formatNumber(formState?.contratoCantidadQQ || 0);
  const precioQQ = formatNumber(formState?.contratoPrecio || 0);
  const totalLps = formatNumber(formState?.contratoTotalLps || 0);
  const descripcion = formState?.contratoDescripcion || "N/A";
  const contratoID = formState?.contratoID || "0000";
  const cantidadLetras = numeroALetras(formState?.contratoTotalLps || 0);

  let startY = topMargin + 110; // ajustado para separar del logo
  doc.setFontSize(12);
  doc.text(`Contrato No.: ${contratoID}`, leftMargin, startY);
  doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
    align: "right",
  });

  startY += 30;
  doc.text(
    `En el departamento del El Paraíso, Honduras, se celebra el presente contrato de compra-venta de café entre:`,
    leftMargin,
    startY,
    { maxWidth: pageWidth - leftMargin - rightMargin }
  );

  startY += 25;
  doc.setFont("times", "bold");
  doc.text(`Productor: ${cliente}`, leftMargin, startY);
  startY += 18;
  doc.setFont("times", "normal");
  doc.text(
    `quien en lo sucesivo se denominará "EL PRODUCTOR", y el BENEFICIO CAFÉ HENOLA, en lo sucesivo denominado "EL COMPRADOR".`,
    leftMargin,
    startY,
    { maxWidth: pageWidth - leftMargin - rightMargin }
  );

  // Tabla principal
  autoTable(doc, {
    startY: startY + 40,
    margin: { left: leftMargin, right: rightMargin },
    head: [["Producto", "Cantidad (QQ)", "Precio (Lps)", "Total (Lps)"]],
    body: [
      [cleanText(producto), cantidadQQ, `L. ${precioQQ}`, `L. ${totalLps}`],
    ],
    styles: { font: "times", fontSize: 12 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
  });

  startY = doc.lastAutoTable.finalY + 20;

  // Cantidad en letras
  doc.setFont("times", "normal");

  doc.text(`Cantidad en Letras: ${cantidadLetras}`, leftMargin, startY);

  startY += 25;

  doc.setFont("times", "bold");
  doc.text("Observaciones:", leftMargin, startY);
  startY += 15;
  doc.setFont("times", "normal");
  doc.text(cleanText(descripcion), leftMargin, startY, {
    maxWidth: pageWidth - leftMargin - rightMargin,
  });

  startY += 40;
  const clausulas = [
    "1. El productor se compromete a entregar el café en la cantidad, calidad y condiciones pactadas.",
    "2. El comprador se obliga a pagar el precio acordado en los términos y plazos establecidos.",
    "3. Ambas partes aceptan que cualquier disputa será resuelta conforme a las leyes de la República de Honduras.",
    "4. El presente contrato se firma en duplicado, quedando una copia para cada parte.",
  ];
  doc.setFont("times", "bold");
  doc.text("CLÁUSULAS:", leftMargin, startY);
  startY += 20;
  doc.setFont("times", "normal");
  clausulas.forEach((c) => {
    doc.text(c, leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });
    startY += 25;
  });

  // Firmas
  startY += 50;
  const halfWidth = (pageWidth - leftMargin - rightMargin) / 2;
  doc.text("_________________________", leftMargin, startY);
  doc.text("Firma del Comprador", leftMargin, startY + 15);
  doc.text("_________________________", leftMargin + halfWidth + 50, startY);
  doc.text("Firma del Productor", leftMargin + halfWidth + 50, startY + 15);

  // Footer
  doc.setFontSize(10);
  doc.text(
    "Beneficio Café Henola - El Paraíso, Honduras",
    pageWidth / 2,
    pageHeight - 30,
    { align: "center" }
  );

  // Guardar PDF
  const nombreArchivo = `Contrato_${cliente.replace(
    /\s+/g,
    "_"
  )}_${contratoID}.pdf`;
  doc.save(nombreArchivo);
};
