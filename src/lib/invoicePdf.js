import { jsPDF } from 'jspdf';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from './format';

const DEFAULT_TERMS = [
  'Betaling senest på den angivne forfaldsdato.',
  'Betalinger til det angivne bankkonto. Angiv fakturanummer ved overførsel.',
  'Tilføjes renter og gebyrer ved forsinket betaling i henhold til renteloven.',
  'Spørgsmål til faktura bedes stillet hurtigst muligt efter modtagelse.',
  'Arbejdet er udført i overensstemmelse med gældende normer og arbejdsmiljølovgivning.',
];

async function fetchImageAsDataURL(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imgFormat(url) {
  if (!url) return 'PNG';
  const ext = url.split('?')[0].split('.').pop().toUpperCase();
  if (['PNG', 'JPEG', 'JPG', 'WEBP'].includes(ext)) return ext === 'JPG' ? 'JPEG' : ext;
  return 'PNG';
}

export async function generateInvoicePDF(invoice, company = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  let y = 0;

  let logoData = null;
  if (company.logo_url) {
    logoData = await fetchImageAsDataURL(company.logo_url);
  }

  // ── Header bar ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 35, 'F');

  if (logoData) {
    try {
      doc.addImage(logoData, imgFormat(company.logo_url), margin, 7, 34, 16, undefined, 'FAST');
    } catch {
      // Fald tilbage til virksomhedsnavn
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(logoData ? 12 : 20);
  if (!logoData) {
    doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin, 16);
  } else {
    doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin + 38, 14);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addr = [company.address, [company.postal_code, company.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const contact = [company.phone, company.email].filter(Boolean).join('  ·  ');
  let infoY = logoData ? 18 : 22;
  const infoX = logoData ? margin + 38 : margin;
  if (addr) { doc.text(addr, infoX, infoY); infoY += 5; }
  if (contact) { doc.text(contact, infoX, infoY); infoY += 5; }
  if (company.cvr) { doc.text(`CVR: ${company.cvr}`, infoX, infoY); }

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('FAKTURA', pageW - margin, 16, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(invoice.invoice_number, pageW - margin, 23, { align: 'right' });
  doc.setFontSize(9);
  doc.text(formatDate(invoice.date), pageW - margin, 28, { align: 'right' });

  // ── Customer + meta ──
  y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Faktura til:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.customer_name || '—', margin, y);
  if (invoice.customer_email) {
    y += 5;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(invoice.customer_email, margin, y);
  }

  let metaY = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Projekt:', pageW - margin - 55, metaY);
  doc.text('Forfald:', pageW - margin - 55, metaY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.project_name || '—', pageW - margin, metaY, { align: 'right' });
  doc.text(invoice.due_date ? formatDate(invoice.due_date) : '—', pageW - margin, metaY + 6, { align: 'right' });

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
  const items = invoice.line_items || [];
  doc.setFontSize(9);
  items.forEach((item, i) => {
    if (y > 200) { doc.addPage(); y = 20; }
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

  // ── Bemærkninger ──
  y += 18;
  if (invoice.notes) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Bemærkninger:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(invoice.notes, pageW - 2 * margin);
    doc.text(noteLines, margin, y + 6);
    y += 6 + noteLines.length * 5;
  }

  // ── Betingelser ──
  y += 8;
  if (y > 245) { doc.addPage(); y = 20; }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Betingelser', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  if (company.bank_account) {
    doc.text(`Bankkonto: ${company.bank_account}`, margin, y);
    y += 4.5;
  }

  DEFAULT_TERMS.forEach((term) => {
    if (y > 282) { doc.addPage(); y = 20; }
    const lines = doc.splitTextToSize(`•  ${term}`, pageW - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 1.5;
  });

  // ── Footer ──
  if (y < 282) y = 282;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 285, pageW - margin, 285);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerParts = [
    company.bank_account ? `Bank: ${company.bank_account}` : '',
    company.email || '',
    company.phone || '',
  ].filter(Boolean);
  if (footerParts.length) {
    doc.text(footerParts.join('  ·  '), margin, 290);
  }
  doc.setTextColor(148, 163, 184);
  doc.text('Juhl & Damsgaard Entreprise', pageW - margin, 290, { align: 'right' });

  doc.save(`Faktura-${invoice.invoice_number}.pdf`);
}