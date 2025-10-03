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

/** Genera el PDF del contrato de café con diseño tipo comprobante */
export const exportContratoCafe = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 50;
  const rightMargin = 50;
  const topMargin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const fondoGray = await processImageToGray(fondoImg.src, 0.15);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scale = 1.1;
  const logo = await getLogoScaled(tasa.src, 80 * scale, 80 * scale);
  const frijolimg = await getLogoScaled(frijol.src, 80 * scale, 80 * scale);
  const selloimg = await getLogoScaled(sello.src, 50 * scale, 50 * scale);

  const cliente = formState?.cliente?.label || "Cliente";
  const producto = formState?.producto?.label || "Producto";
  const cantidadQQ = formatNumber(formState?.contratoCantidadQQ || 0);
  const precioQQ = formatNumber(formState?.contratoPrecio || 0);
  const totalLps = formatNumber(formState?.contratoTotalLps || 0);
  const descripcion = formState?.contratoDescripcion || "N/A";
  const contratoID = formState?.contratoID || "0000";
  const cantidadLetras = numeroALetras(formState?.contratoTotalLps || 0);

  // Fondo centrado
  const imgWidth = pageWidth * 0.9 * scale;
  const imgHeight = pageHeight * 0.45 * scale;
  const imgX = (pageWidth - imgWidth) / 2;
  const imgY = pageHeight * 0.05;
  doc.addImage(fondoGray, "PNG", imgX, imgY, imgWidth, imgHeight);

  // Logo izquierda
  doc.addImage(logo.src, "PNG", leftMargin, 20, logo.width, logo.height);

  // Frijol derecha
  const frijolY = 20;
  doc.addImage(
    frijolimg.src,
    "PNG",
    pageWidth - rightMargin - frijolimg.width,
    frijolY,
    frijolimg.width,
    frijolimg.height
  );

  // Cosecha debajo del frijol
  doc.setFont("times", "bold");
  doc.setFontSize(10 * scale);
  doc.text(
    "Cosecha",
    pageWidth - rightMargin - frijolimg.width,
    frijolY + frijolimg.height + 15
  );
  doc.setFont("times", "normal");
  doc.text(
    "2025  2026",
    pageWidth - rightMargin - frijolimg.width,
    frijolY + frijolimg.height + 25
  );

  // Encabezado
  doc.setFont("times", "bold");
  doc.setFontSize(16 * scale);
  doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 50, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(10 * scale);
  doc.text("CONTRATO DE COMPRA-VENTA DE CAFÉ", pageWidth / 2, 70, {
    align: "center",
  });
  doc.text("Propietario Enri Lagos", pageWidth / 2, 85 , {
    align: "center",
  });
  doc.text("Teléfono: (504) 3271-3188, (504) 9877-8789", pageWidth / 2, 100, {
    align: "center",
  });

  let startY = topMargin + 80;
  doc.setFontSize(10 * scale);
  doc.text(`Contrato No: ${contratoID}`, leftMargin, startY);
  doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
    align: "right",
  });

  startY += 25;
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

  // Tabla contrato (bordes negros, sin colores)
  autoTable(doc, {
    startY: startY + 40,
    margin: { left: leftMargin, right: rightMargin },
    head: [["Producto", "Cantidad (QQ)", "Precio (Lps)", "Total (Lps)"]],
    body: [
      [cleanText(producto), cantidadQQ, `L. ${precioQQ}`, `L. ${totalLps}`],
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

  startY = doc.lastAutoTable.finalY + 20;

  // Cantidad en letras
  doc.setFont("times", "normal");
  doc.text(`Cantidad en Letras: ${cantidadLetras}`, leftMargin, startY);

  startY += 25;
  doc.setFont("times", "bold");
  doc.text("Observaciones:", leftMargin, startY);
  startY += 15;
  doc.setFont("times", "normal");
  doc.text(String(descripcion || ""), leftMargin, startY, {
    maxWidth: pageWidth - leftMargin - rightMargin,
  });

  // Cláusulas
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

  // Firmas y lugar
  startY += 50;
  const firmaWidth = 150;
  const firmaY = startY;
  doc.line(leftMargin, firmaY, leftMargin + firmaWidth, firmaY);
  doc.text("FIRMA", leftMargin, firmaY + 12);

  doc.line(
    pageWidth - rightMargin - firmaWidth,
    firmaY,
    pageWidth - rightMargin,
    firmaY
  );
  doc.text("LUGAR", pageWidth - rightMargin - firmaWidth, firmaY + 12);

  doc.setFont("times", "bold");
  doc.text("El Paraíso", pageWidth - rightMargin - firmaWidth + 20, firmaY - 5);
  doc.setFont("times", "normal");

  // Sello sobre la firma izquierda
  doc.addImage(
    selloimg.src,
    "PNG",
    leftMargin + firmaWidth / 2 - selloimg.width / 2,
    firmaY - selloimg.height - 5,
    selloimg.width,
    selloimg.height
  );

  // Footer
  doc.setFontSize(8 * scale);
  doc.text(
    "Beneficio Café Henola - El Paraíso, Honduras",
    pageWidth / 2,
    pageHeight - 30,
    { align: "center" }
  );

  const nombreArchivo = `Contrato_${cliente.replace(
    /\s+/g,
    "_"
  )}_${contratoID}.pdf`;
  doc.save(nombreArchivo);
};
