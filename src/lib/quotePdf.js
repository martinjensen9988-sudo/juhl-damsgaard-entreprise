import { jsPDF } from 'jspdf';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from './format';
import { BRAND_LOGO_URL } from './brand';

// Standard faste betingelser for entreprenørtilbud
const DEFAULT_TERMS = [
  'Tilbudet er gyldigt i den angivne periode — herefter forbeholder vi os ret til prisjustering.',
  'Priserne er eksklusive moms, som tilføjes med gældende sats.',
  'Betaling sker efter de aftalte betalingsbetingelser, med mindre der er aftalt acconto.',
  'Arbejdet udføres i overensstemmelse med gældende normer, bygningsreglement og arbejdsmiljølovgivning.',
  'Byggeplads etableres og ryddes af Juhl & Damsgaard Entreprise ved arbejdets afslutning.',
  'Forbehold for ændringer i materialepriser samt uforudsete forhold i undergrund kan forekomme.',
  'Ejendommen / arealet afleveres i fejlfri og rengjort stand efter endt arbejde.',
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

const SLATE = [15, 23, 42];
const SLATE_LIGHT = [100, 116, 139];
const SLATE_MID = [71, 85, 105];
const BORDER = [226, 232, 240];
const ROW_ALT = [248, 250, 252];
const ACCENT = [180, 83, 9]; // warm amber

export async function generateQuotePDF(quote, company = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - 2 * margin;
  let y = 0;

  // ── Logo (hvis tilgængeligt) ──
  const logoUrl = company.logo_url || BRAND_LOGO_URL;
  let logoData = null;
  if (logoUrl) {
    logoData = await fetchImageAsDataURL(logoUrl);
  }

  // ── Header bar (mørk) ──
  doc.setFillColor(...SLATE);
  doc.rect(0, 0, pageW, 38, 'F');

  // Tynd accent-linje under header
  doc.setFillColor(...ACCENT);
  doc.rect(0, 38, pageW, 1.2, 'F');

  // Logo i hvid chip
  if (logoData) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 6, 36, 22, 2, 2, 'F');
      doc.addImage(logoData, imgFormat(logoUrl), margin + 2, 8, 32, 18, undefined, 'FAST');
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin, 20);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin, 20);
  }

  // Dokumenttype + nummer til højre
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TILBUD', pageW - margin, 18, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.quote_number || '', pageW - margin, 25, { align: 'right' });
  doc.setFontSize(9);
  doc.text(formatDate(quote.date), pageW - margin, 30, { align: 'right' });

  // ── Modtager- og metainfo (to kolonner) ──
  y = 50;
  const colW = contentW / 2;

  // Venstre: Tilbud til
  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TILBUD TIL', margin, y);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2, margin + colW - 6, y + 2);

  y += 7;
  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(quote.customer_name || '—', margin, y);
  y += 5;

  if (quote.customer_email) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_LIGHT);
    doc.text(quote.customer_email, margin, y);
    y += 4.5;
  }
  if (quote.project_name) {
    doc.setTextColor(...SLATE_LIGHT);
    doc.setFontSize(9);
    doc.text(quote.project_name, margin, y);
  }

  // Højre: Tilbudsoplysninger
  let metaY = 50;
  const metaX = margin + colW + 6;
  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TILBUDSOPLYSNINGER', metaX, metaY);
  doc.setDrawColor(...BORDER);
  doc.line(metaX, metaY + 2, pageW - margin, metaY + 2);

  const metaRows = [
    ['Tilbudsnr.', quote.quote_number || '—'],
    ['Dato', formatDate(quote.date)],
    ['Gyldig til', quote.valid_until ? formatDate(quote.valid_until) : '30 dage'],
    ['Projekt', quote.project_name || '—'],
  ];
  metaY += 7;
  metaRows.forEach(([label, value]) => {
    doc.setTextColor(...SLATE_LIGHT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, metaX, metaY);
    doc.setTextColor(...SLATE);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), pageW - margin, metaY, { align: 'right' });
    metaY += 5;
  });

  // ── Tabeloverskrift ──
  y = 92;
  const colX = {
    desc: margin,
    qty: margin + 100,
    unit: margin + 118,
    price: margin + 145,
    total: pageW - margin,
  };

  doc.setFillColor(...SLATE);
  doc.rect(margin, y, contentW, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BESKRIVELSE', colX.desc + 3, y + 6);
  doc.text('ANTAL', colX.qty + 8, y + 6, { align: 'right' });
  doc.text('ENHED', colX.unit, y + 6);
  doc.text('STK. PRIS', colX.price, y + 6, { align: 'right' });
  doc.text('BELØB', colX.total - 3, y + 6, { align: 'right' });

  y += 9;

  // ── Linjeelementer ──
  const items = quote.line_items || [];
  doc.setFontSize(9);

  items.forEach((item, i) => {
    if (y > 225) { doc.addPage(); y = 20; }
    const rowH = 7;
    if (i % 2 === 0) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(margin, y, contentW, rowH, 'F');
    }
    doc.setTextColor(...SLATE);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(item.description || '', 94);
    doc.text(descLines, colX.desc + 3, y + 5);

    doc.setTextColor(...SLATE_LIGHT);
    doc.text(String(item.quantity || ''), colX.qty + 8, y + 5, { align: 'right' });
    doc.text(item.unit || '', colX.unit, y + 5);
    doc.text(formatDKK(item.unit_price), colX.price, y + 5, { align: 'right' });

    doc.setTextColor(...SLATE);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDKCLine(item), colX.total - 3, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += rowH;
  });

  if (items.length === 0) {
    doc.setTextColor(...SLATE_LIGHT);
    doc.text('Ingen linjeelementer', colX.desc + 3, y + 5);
    y += 7;
  }

  // ── Totalbox (højre) ──
  y += 6;
  if (y > 235) { doc.addPage(); y = 20; }

  const subtotal = calcSubtotal(items);
  const vat = calcVAT(subtotal);
  const total = calcTotal(items);
  const boxW = 70;
  const boxX = pageW - margin - boxW;

  doc.setFillColor(248, 250, 252);
  doc.rect(boxX, y, boxW, 20, 'F');
  doc.setDrawColor(...BORDER);
  doc.rect(boxX, y, boxW, 20);

  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal ekskl. moms', boxX + 4, y + 6);
  doc.text(formatDKK(subtotal), pageW - margin - 4, y + 6, { align: 'right' });
  doc.text('Moms (25%)', boxX + 4, y + 11);
  doc.text(formatDKK(vat), pageW - margin - 4, y + 11, { align: 'right' });

  // Total bjælke
  doc.setFillColor(...SLATE);
  doc.rect(boxX, y + 14, boxW, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL INKL. MOMS', boxX + 4, y + 20);
  doc.text(formatDKK(total), pageW - margin - 4, y + 20, { align: 'right' });

  // ── Bemærkninger ──
  y = Math.max(y + 26, 200);
  if (quote.notes) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(...SLATE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Bemærkninger', margin, y);
    doc.setDrawColor(...BORDER);
    doc.line(margin, y + 2, margin + 60, y + 2);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_MID);
    const noteLines = doc.splitTextToSize(quote.notes, contentW);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5 + 4;
  }

  // ── Betingelser & vilkår ──
  y += 4;
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setDrawColor(...BORDER);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Betingelser & vilkår', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_MID);

  if (company.payment_terms) {
    doc.text(`Betalingsbetingelser: ${company.payment_terms}`, margin, y);
    y += 4.5;
  }

  DEFAULT_TERMS.forEach((term) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const lines = doc.splitTextToSize(`•  ${term}`, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 1.5;
  });

  // ── Signaturafsnit (ikke på ny side hvis plads) ──
  y += 6;
  if (y > 260) { doc.addPage(); y = 20; }

  const sigW = 80;
  const sigY = y;
  doc.setDrawColor(...SLATE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY, margin + sigW, sigY);
  doc.line(margin + sigW + 14, sigY, margin + 2 * sigW + 14, sigY);

  doc.setTextColor(...SLATE_LIGHT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Dato & underskrift (kunde)', margin, sigY + 5);
  doc.text('Underskrift (Juhl & Damsgaard)', margin + sigW + 14, sigY + 5);

  // ── Footer ──
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, 285, pageW - margin, 285);
  doc.setFillColor(...SLATE);
  doc.rect(0, 285.3, pageW, 0.5, 'F');

  doc.setTextColor(...SLATE_LIGHT);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerParts = [
    company.company_name || 'Juhl & Damsgaard Entreprise',
    company.cvr ? `CVR ${company.cvr}` : '',
    company.bank_account ? `Bank ${company.bank_account}` : '',
  ].filter(Boolean);
  if (footerParts.length) {
    doc.text(footerParts.join('  ·  '), margin, 290);
  }
  const contactParts = [company.phone, company.email].filter(Boolean);
  if (contactParts.length) {
    doc.text(contactParts.join('  ·  '), pageW - margin, 290, { align: 'right' });
  }

  doc.save(`Tilbud-${quote.quote_number}.pdf`);
}

// Hjælpefunktion for linjetotal
function formatDKCLine(item) {
  return formatDKK((item.quantity || 0) * (item.unit_price || 0));
}