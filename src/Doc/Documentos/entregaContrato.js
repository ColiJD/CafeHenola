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

export const exportEntregaContrato = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 50;
  const rightMargin = 50;
  const topMargin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const fondoGray = await processImageToGray(fondoImg.src, 0.15);

  const scale = 1.1;
  const logo = await getLogoScaled(tasa.src, 80 * scale, 80 * scale);
  const frijolimg = await getLogoScaled(frijol.src, 80 * scale, 80 * scale);
  const selloimg = await getLogoScaled(sello.src, 50 * scale, 50 * scale);

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
  const saldoRestanteQQ = formState?.saldoRestanteQQ || 0;
  const saldoRestanteLps = formState?.saldoRestanteLps || 0;
  const formaPago = formState?.formaPago || "";
  const observaciones = formState?.observaciones || "N/A";

  const cantidadLetras = numeroALetras(totalPagar, "Lempiras");

  const drawComprobante = (offsetY = 0) => {
    // Fondo
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

    // Cosecha al lado de frijol
    doc.setFont("times", "bold");
    doc.setFontSize(10 * scale);
    doc.text(
      "Cosecha",
      pageWidth - rightMargin - frijolimg.width,
      frijolY + frijolimg.height + 25
    );
    doc.setFont("times", "normal");
    doc.text(
      "2025  2026",
      pageWidth - rightMargin - frijolimg.width,
      frijolY + frijolimg.height + 35
    );

    // Encabezado
    doc.setFont("times", "bold");
    doc.setFontSize(16 * scale);
    doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 50 + offsetY, {
      align: "center",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(10 * scale);
    doc.text("ENTREGA DE CONTRATO", pageWidth / 2, 70 + offsetY, {
      align: "center",
    });
    doc.text("Propietario Enri Lagos", pageWidth / 2, 85 + offsetY, {
      align: "center",
    });
    doc.text(
      "Teléfono: (504) 3271-3188, (504) 9877-8789",
      pageWidth / 2,
      100 + offsetY,
      { align: "center" }
    );

    // Datos básicos
    let startY = topMargin + 50 + offsetY;
    doc.setFontSize(10 * scale);
    doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
    doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
      align: "right",
    });

    startY += 30;

    // Tabla 1
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [
        [
          "Cliente",
          "Contrato",
          "Tipo Café",
          
        ],
      ],
      body: [
        [
          cliente,
          contratoID,
          tipoCafe,
        
       
        ],
      ],
      styles: {
        font: "times",
        fontSize: 9 * scale,
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

    startY = doc.lastAutoTable.finalY + 5;

    // Tabla 2
    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [
        [
          "Quintales Ingresados",
          "Precio",
          "Total Pagar",
        
        ],
      ],
      body: [
        [
          formatNumber(quintalesIngresados),
          `L. ${formatNumber(precio)}`,
          `L. ${formatNumber(totalPagar)}`,
        
        ],
      ],
      styles: {
        font: "times",
        fontSize: 9 * scale,
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

    // Totales
    doc.text(`Total en Letras: ${cantidadLetras}`, leftMargin, startY);
    startY += 12;
    doc.text(
      `Cantidad en Letras: ${numeroALetras(
        quintalesIngresados,
        "Quintales oro"
      )}`,
      leftMargin,
      startY
    );
    startY += 20;

    // Forma de pago
    doc.text("Forma de Pago:", leftMargin, startY);
    let x = leftMargin + 100;
    ["Efectivo", "Transferencia", "Cheque"].forEach((f) => {
      doc.rect(x, startY - 7, 10, 10);
      if (formaPago === f) doc.text("X", x + 2, startY + 1);
      doc.text(f, x + 15, startY + 1);
      x += 100;
    });

    startY += 15;

    // Observaciones
    doc.setFont("times", "bold");
    doc.text("Observaciones:", leftMargin, startY);
    startY += 12;
    doc.setFont("times", "normal");
    doc.text(String(observaciones || ""), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    startY += 70;

    // Firmas
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
    doc.text(
      "El Paraíso",
      pageWidth - rightMargin - firmaWidth + 20,
      firmaY - 5
    );
    doc.setFont("times", "normal");

    // Sello
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
      offsetY + pageHeight * 0.45,
      { align: "center" }
    );
  };

  // Doble comprobante
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // Línea punteada separadora
  doc.setLineDash([5, 3]);
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash();

  const nombreArchivo = `EntregaContrato_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
