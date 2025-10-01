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

/** Genera el PDF de entrega de contrato con 12 columnas divididas en 2 filas */
export const exportEntregaContrato = async (formState) => {
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

  const drawComprobante = (offsetY = 0) => {
    // Fondo
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
    doc.text("ENTREGA DE CONTRATO", pageWidth / 2, 70 + offsetY, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 85 + offsetY, {
      align: "center",
    });

    // 🔹 Título "Cosecha" y años a la derecha
    const cosechaX = pageWidth - rightMargin - 80; // ajusta según espacio
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Cosecha", cosechaX, 60 + offsetY); // a la altura del logo

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("2024  2025", cosechaX, 80 + offsetY);
    // Datos del comprobante
    let startY = topMargin + 60 + offsetY;
    doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
    doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
      align: "right",
    });
    startY += 20;

    // 🔹 Primera fila (6 columnas)
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [
        [
          "Cliente",
          "Contrato",
          "Tipo Café",
          "Peso/Cantidad",
          "Total Sacos",
          "Quintales Disponibles",
        ],
      ],
      body: [
        [
          cliente,
          contratoID,
          tipoCafe,
          tipoCafe.includes("Cafe Lata")
            ? formatNumber(pesoBruto) + " Latas"
            : formatNumber(pesoBruto) + " Lbs",
          formatNumber(totalSacos),
          formatNumber(quintalesDisponibles),
        ],
      ],
      styles: { font: "times", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      didDrawCell: (data) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
      },
    });

    startY = doc.lastAutoTable.finalY + 5;

    // 🔹 Segunda fila (6 columnas)
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [
        [
          "Quintales Ingresados",
          "Precio",
          "Total Pagar",
          "Retención",
          "Saldo QQ",
          "Saldo Lps",
        ],
      ],
      body: [
        [
          formatNumber(quintalesIngresados),
          `L. ${formatNumber(precio)}`,
          `L. ${formatNumber(totalPagar)}`,
          `L. ${formatNumber(retencion)}`,
          formatNumber(saldoRestanteQQ),
          `L. ${formatNumber(saldoRestanteLps)}`,
        ],
      ],
      styles: { font: "times", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      didDrawCell: (data) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
      },
    });

    startY = doc.lastAutoTable.finalY + 30;

    // Totales en letras
    doc.text(`Total en Letras: ${cantidadLetras}`, leftMargin, startY);
    startY += 15;
    doc.text(
      `Cantidad en Letras: ${numeroALetras(
        quintalesIngresados,
        "Quintales oro"
      )}`,
      leftMargin,
      startY
    );
    startY += 20;

    // Forma de Pago
    doc.text("Forma de Pago:", leftMargin, startY);
    let x = leftMargin + 90;
    ["Efectivo", "Transferencia", "Cheque"].forEach((f) => {
      doc.rect(x, startY - 6, 12, 12);
      if (formaPago === f) doc.text("X", x + 3.5, startY + 1);
      doc.text(f, x + 20, startY + 2);
      x += 100;
    });
    startY += 20;

    // Observaciones
    doc.setFont("times", "bold");
    doc.text("Observaciones:", leftMargin, startY);
    startY += 12;
    doc.setFont("times", "normal");
    doc.text(cleanText(observaciones), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });
    startY += 30;

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
    doc.text(
      "LUGAR Y FECHA",
      pageWidth - rightMargin - firmaWidth,
      startY + 12
    );

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

  const nombreArchivo = `EntregaContrato_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
