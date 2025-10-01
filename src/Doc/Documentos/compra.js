import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNumber } from "@/components/Formulario";
import fondoImg from "@/img/frijoles.png";
import {
  numeroALetras,
  cleanText,
  processImageToGray,
  getLogoScaled,
} from "@/Doc/Documentos/funcionesdeDocumentos";

export const exportCompraDirecta = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 72;
  const rightMargin = 72;
  const topMargin = 72;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const fondoGray = await processImageToGray(fondoImg.src, 0.15);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logo = await getLogoScaled(fondoImg.src, 100, 100);

  const cliente = formState?.cliente?.label || "Cliente";
  const productos = formState?.productos || [];
  const observaciones = formState?.observaciones || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";
  const cantidadLetras = numeroALetras(formState?.total || 0);
  const formaPago = formState?.formaPago || "";

  // 🔹 CAMBIO: función que dibuja el comprobante con un desplazamiento vertical (offsetY)
  const drawComprobante = (offsetY = 0) => {
    const imgWidth = pageWidth * 0.8; // 50% del ancho de la página
    const imgHeight = (imgWidth / pageWidth) * (pageHeight / 2); // proporción parecida
    const imgX = (pageWidth - imgWidth) / 2; // centrado horizontal
    const imgY = offsetY + pageHeight / 4 - imgHeight / 2; // ce
    // Fondo
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
    doc.text("COMPROBANTE DE COMPRA DIRECTA", pageWidth / 2, 85 + offsetY, {
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
    doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
    doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
      align: "right",
    });

    startY += 30;
    doc.setFont("times", "bold");
    doc.text(`Cliente: ${cliente}`, leftMargin, startY);
    startY += 20;

    // Tabla de productos
    const bodyProductos = productos.map((p) => [
      cleanText(p.nombre),
      formatNumber(p.cantidad),
      `L. ${formatNumber(p.precio)}`,
      `L. ${formatNumber(p.total)}`,
    ]);

    autoTable(doc, {
      startY,
      margin: { left: leftMargin, right: rightMargin },
      head: [["Producto", "Cantidad (QQ)", "Precio (LPS)", "Total (LPS)"]],
      body: bodyProductos,
      styles: { font: "times", fontSize: 12 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    });

    startY = doc.lastAutoTable.finalY + 20;

    // Cantidad en letras
    doc.setFont("times", "normal");
    doc.text(`Cantidad en Letras: ${cantidadLetras}`, leftMargin, startY);

    startY += 25;

    // Forma de Pago
    doc.text("Forma de Pago:", leftMargin, startY);
    const formas = ["Efectivo", "Transferencia", "Cheque"];
    let x = leftMargin + 100;
    formas.forEach((f) => {
      doc.rect(x, startY - 8, 12, 12);
      if (formaPago === f) {
        doc.text("X", x + 3.5, startY + 1);
      }
      doc.text(f, x + 20, startY + 2);
      x += 120;
    });

    startY += 30;

    // Observaciones
    doc.setFont("times", "bold");
    doc.text("Observaciones:", leftMargin, startY);
    startY += 15;
    doc.setFont("times", "normal");
    doc.text(cleanText(observaciones), leftMargin, startY, {
      maxWidth: pageWidth - leftMargin - rightMargin,
    });

    startY += 25;

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
      offsetY + pageHeight / 2 - 15,
      { align: "center" }
    );
  };

  // 🔹 CAMBIO: dibujar dos comprobantes (arriba y abajo)
  drawComprobante(0);
  drawComprobante(pageHeight / 2);

  // 🔹 CAMBIO: agregar línea punteada de corte en el centro
  doc.setLineDash([5, 3]); // patrón punteado
  doc.line(40, pageHeight / 2, pageWidth - 40, pageHeight / 2);
  doc.setLineDash(); // reset estilo de línea

  const nombreArchivo = `CompraDirecta_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
