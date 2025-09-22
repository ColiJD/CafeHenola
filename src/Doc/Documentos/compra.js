import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNumber } from "@/components/Formulario";
import fondoImg from "@/img/frijoles.png";
import { numeroALetras,cleanText, processImageToGray, getLogoScaled} from "@/Doc/Documentos/funcionesdeDocumentos";


export const exportCompraDirecta = async (formState) => {
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const leftMargin = 72;
  const rightMargin = 72;
  const topMargin = 72;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fondo en gris con opacidad
  const fondoGray = await processImageToGray(fondoImg.src, 0.15);
  doc.addImage(fondoGray, "PNG", 0, 0, pageWidth, pageHeight);

  const fecha = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logo = await getLogoScaled(fondoImg.src, 100, 100);
  doc.addImage(logo.src, "PNG", leftMargin, 20, logo.width, logo.height);

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("BENEFICIO CAFÉ HENOLA", pageWidth / 2, 60, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("COMPROBANTE DE COMPRA DIRECTA", pageWidth / 2, 85, {
    align: "center",
  });
  doc.setFontSize(12);
  doc.text("Teléfono: (504) 3271-3188", pageWidth / 2, 105, {
    align: "center",
  });

  const cliente = formState?.cliente?.label || "Cliente";
  const productos = formState?.productos || [];
  const observaciones = formState?.observaciones || "N/A";
  const comprobanteID = formState?.comprobanteID || "0000";
  const cantidadLetras = numeroALetras(formState?.total || 0);
  const formaPago = formState?.formaPago || "";

  let startY = topMargin + 110;
  doc.text(`Comprobante No: ${comprobanteID}`, leftMargin, startY);
  doc.text(`Fecha: ${fecha}`, pageWidth - rightMargin, startY, {
    align: "right",
  });

  startY += 30;
  doc.setFont("times", "bold");
  doc.text(`Cliente: ${cliente}`, leftMargin, startY);
  startY += 20;

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
    // Dibujar cuadro alineado con el texto
    doc.rect(x, startY - 8, 12, 12);
    if (formaPago === f) {
      doc.text("X", x + 3.5, startY + 1); // centrar la X en el cuadro
    }
    doc.text(f, x + 20, startY + 2); // texto alineado al centro del cuadro
    x += 120; // espacio entre opciones
  });

  startY += 40; // salto después de forma de pago

  // Observaciones
  doc.setFont("times", "bold");
  doc.text("Observaciones:", leftMargin, startY);
  startY += 15;
  doc.setFont("times", "normal");
  doc.text(cleanText(observaciones), leftMargin, startY, {
    maxWidth: pageWidth - leftMargin - rightMargin,
  });

  startY += 60; // espacio antes de firmas

  // Firmas justo después de la info
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

  // Footer siempre al pie de página
  doc.setFontSize(10);
  doc.text(
    "Beneficio Café Henola - El Paraíso, Honduras",
    pageWidth / 2,
    pageHeight - 30,
    { align: "center" }
  );

  const nombreArchivo = `CompraDirecta_${cliente.replace(
    /\s+/g,
    "_"
  )}_${comprobanteID}.pdf`;
  doc.save(nombreArchivo);
};
