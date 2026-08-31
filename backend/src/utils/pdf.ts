import PDFDocument from 'pdfkit';

export interface InfoItem {
  label: string;
  value: string;
}

export interface SummaryItem {
  label: string;
  value: string | number;
}

/**
 * Creates a new PDFDocument with standard A4 size, 50pt margins, and page buffering.
 */
export function createPdfDoc(options?: PDFKit.PDFDocumentOptions): PDFKit.PDFDocument {
  return new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    ...options,
  });
}

/**
 * Adds header with school name, report title, date, and horizontal line.
 */
export function addHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle?: string,
  schoolName: string = 'School Management System'
): void {
  // Top brand / school name
  doc
    .fillColor('#1E3A8A')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(schoolName, 50, 40, { align: 'left' });

  // Main Report Title
  doc
    .fillColor('#0F172A')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title, 50, 62, { align: 'left' });

  if (subtitle) {
    doc
      .fillColor('#64748B')
      .fontSize(9)
      .font('Helvetica')
      .text(subtitle, 50, 80, { align: 'left' });
  }

  // Right side date line
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc
    .fillColor('#64748B')
    .fontSize(9)
    .font('Helvetica')
    .text(`Generated: ${currentDate}`, 350, 40, { width: 195, align: 'right' });

  // Divider line
  const lineY = subtitle ? 95 : 82;
  doc
    .strokeColor('#CBD5E1')
    .lineWidth(1)
    .moveTo(50, lineY)
    .lineTo(545, lineY)
    .stroke();

  doc.y = lineY + 15;
}

/**
 * Adds key-value info section (e.g. Student Name, Class, Date Range) in a clean grid.
 */
export function addInfoSection(
  doc: PDFKit.PDFDocument,
  items: InfoItem[]
): void {
  const startY = doc.y;
  const itemWidth = 240;
  const rowHeight = 18;

  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 50 + col * itemWidth;
    const y = startY + row * rowHeight;

    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(`${item.label}: `, x, y, { continued: true });
    doc
      .fillColor('#0F172A')
      .font('Helvetica')
      .text(item.value);
  });

  const totalRows = Math.ceil(items.length / 2);
  doc.y = startY + totalRows * rowHeight + 15;
}

/**
 * Adds a formatted data table to the PDF document.
 */
export function addTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: (string | number)[][],
  columnWidths?: number[]
): void {
  const startX = 50;
  const usableWidth = 495; // 595.28 - 100
  const numCols = headers.length;
  const colWidths = columnWidths || Array(numCols).fill(usableWidth / numCols);

  let currentY = doc.y;

  const drawHeaderRow = (y: number): number => {
    doc
      .rect(startX, y, usableWidth, 22)
      .fill('#1E293B');

    let x = startX;
    headers.forEach((header, i) => {
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(header, x + 6, y + 6, {
          width: colWidths[i] - 12,
          align: i === 0 ? 'left' : 'center',
        });
      x += colWidths[i];
    });

    return y + 22;
  };

  currentY = drawHeaderRow(currentY);

  if (rows.length === 0) {
    doc
      .rect(startX, currentY, usableWidth, 24)
      .fill('#F8FAFC');
    doc
      .fillColor('#94A3B8')
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text('No records found', startX + 10, currentY + 7, { align: 'center', width: usableWidth - 20 });
    doc.y = currentY + 30;
    return;
  }

  rows.forEach((row, rowIndex) => {
    // Page break check
    if (currentY + 24 > doc.page.height - 60) {
      doc.addPage();
      currentY = 50;
      currentY = drawHeaderRow(currentY);
    }

    const rowBg = rowIndex % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc
      .rect(startX, currentY, usableWidth, 20)
      .fill(rowBg);

    doc
      .strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .moveTo(startX, currentY + 20)
      .lineTo(startX + usableWidth, currentY + 20)
      .stroke();

    let x = startX;
    row.forEach((cell, i) => {
      const cellText = cell !== null && cell !== undefined ? String(cell) : '-';
      doc
        .fillColor('#1E293B')
        .font('Helvetica')
        .fontSize(8.5)
        .text(cellText, x + 6, currentY + 5, {
          width: colWidths[i] - 12,
          align: i === 0 ? 'left' : 'center',
        });
      x += colWidths[i];
    });

    currentY += 20;
  });

  doc.y = currentY + 15;
}

/**
 * Adds a summary card/box section.
 */
export function addSummary(
  doc: PDFKit.PDFDocument,
  items: SummaryItem[]
): void {
  let currentY = doc.y;

  if (currentY + items.length * 20 + 30 > doc.page.height - 60) {
    doc.addPage();
    currentY = 50;
  }

  const boxWidth = 260;
  const startX = 50;

  doc
    .rect(startX, currentY, boxWidth, items.length * 20 + 10)
    .fillAndStroke('#F1F5F9', '#CBD5E1');

  items.forEach((item, index) => {
    const y = currentY + 6 + index * 20;
    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(item.label, startX + 10, y, { width: 150, align: 'left' });

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(String(item.value), startX + 160, y, { width: 90, align: 'right' });
  });

  doc.y = currentY + items.length * 20 + 25;
}

/**
 * Iterates through buffered pages and adds page numbers and branding footer.
 */
export function addFooter(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 40;

    doc
      .strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .moveTo(50, footerY - 5)
      .lineTo(545, footerY - 5)
      .stroke();

    doc
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(8)
      .text(
        'School Management Platform — Official Academic Report',
        50,
        footerY,
        { align: 'left' }
      );

    doc
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(8)
      .text(`Page ${i + 1} of ${totalPages}`, 350, footerY, {
        width: 195,
        align: 'right',
      });
  }
}
