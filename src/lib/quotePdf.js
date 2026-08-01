import { jsPDF } from 'jspdf';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from './format';

export function generateQuotePDF(quote, company = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(company.company_name || 'Virksomhed', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addr = [company.address, [company.postal_code, company.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const contact = [company.phone, company.email].filter(Boolean).join('  ·  ');
  let infoY = 22;
  if (addr) { doc.text(addr, margin, infoY); infoY += 5; }
  if (contact) { doc.text(contact, margin, infoY); infoY += 5; }
  if (company.cvr) { doc.text(`CVR: ${company.cvr}`, margin, infoY); }

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('TILBUD', pageW - margin, 16, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(quote.quote_number, pageW - margin, 23, { align: 'right' });
  doc.setFontSize(9);
  doc.text(formatDate(quote.date), pageW - margin, 28, { align: 'right' });

  // ── Customer + meta ──
  y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Tilbud til:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.customer_name || '—', margin, y);
  if (quote.customer_email) {
    y += 5;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(quote.customer_email, margin, y);
  }

  let metaY = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Projekt:', pageW - margin - 55, metaY);
  doc.text('Gyldig til:', pageW - margin - 55, metaY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.project_name || '—', pageW - margin, metaY, { align: 'right' });
  doc.text(quote.valid_until ? formatDate(quote.valid_until) : '30 dage', pageW - margin, metaY + 6, { align: 'right' });

  // ── Table header ──
  y = 72;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Beskrivelse', margin + 2, y + 5.5);
  doc.text('Antal', margin + 115, y + 5.5, { align: 'right' });
  doc.text('Enhed', margin + 130, y + 5.5);
  doc.text('Stk. pris', pageW - margin - 27, y + 5.5, { align: 'right' });
  doc.text('Beløb', pageW - margin - 2, y + 5.5, { align: 'right' });

  y += 8;

  // ── Line items ──
  const items = quote.line_items || [];
  doc.setFontSize(9);
  items.forEach((item, i) => {
    if (y > 235) { doc.addPage(); y = 20; }
    const rowH = 7;
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageW - 2 * margin, rowH, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(item.description || '', 103);
    doc.text(descLines, margin + 2, y + 5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(item.quantity || ''), margin + 115, y + 5, { align: 'right' });
    doc.text(item.unit || '', margin + 130, y + 5);
    doc.text(formatDKK(item.unit_price), pageW - margin - 27, y + 5, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDKK((item.quantity || 0) * (item.unit_price || 0)), pageW - margin - 2, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += rowH;
  });

  if (items.length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.text('Ingen linjeelementer', margin + 2, y + 5);
    y += 7;
  }

  // ── Totals ──
  y += 5;
  const subtotal = calcSubtotal(items);
  const vat = calcVAT(subtotal);
  const total = calcTotal(items);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal ekskl. moms:', pageW - margin - 57, y);
  doc.text(formatDKK(subtotal), pageW - margin - 2, y, { align: 'right' });
  y += 6;
  doc.text('Moms (25%):', pageW - margin - 57, y);
  doc.text(formatDKK(vat), pageW - margin - 2, y, { align: 'right' });
  y += 3;
  doc.setFillColor(15, 23, 42);
  doc.rect(pageW - margin - 57, y, 57, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total inkl. moms:', pageW - margin - 55, y + 6.5);
  doc.text(formatDKK(total), pageW - margin - 2, y + 6.5, { align: 'right' });

  // ── Notes ──
  y += 20;
  if (quote.notes) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Bemærkninger:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(quote.notes, pageW - 2 * margin);
    doc.text(noteLines, margin, y + 6);
  }

  // ── Footer ──
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 285, pageW - margin, 285);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerParts = [
    company.bank_account ? `Bank: ${company.bank_account}` : '',
    company.payment_terms || '',
  ].filter(Boolean);
  if (footerParts.length) {
    doc.text(footerParts.join('  ·  '), margin, 290);
  }

  doc.save(`Tilbud-${quote.quote_number}.pdf`);
}