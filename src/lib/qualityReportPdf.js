import { jsPDF } from 'jspdf';
import { formatDate } from './format';
import { BRAND_LOGO_URL } from './brand';

const SLATE = [15, 23, 42];
const SLATE_LIGHT = [100, 116, 139];
const BORDER = [226, 232, 240];
const ACCENT = [180, 83, 9];

async function fetchImage(url) {
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
  } catch { return null; }
}

function imgFormat(url) {
  const ext = (url || '').split('?')[0].split('.').pop().toUpperCase();
  return ['PNG', 'JPEG', 'JPG', 'WEBP'].includes(ext) ? (ext === 'JPG' ? 'JPEG' : ext) : 'JPEG';
}

export async function generateQualityReportPDF({ project, checks, images, documents, company = {} }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210, margin = 20, contentW = pageW - 2 * margin;
  let y = 0;

  // Header
  doc.setFillColor(...SLATE); doc.rect(0, 0, pageW, 38, 'F');
  doc.setFillColor(...ACCENT); doc.rect(0, 38, pageW, 1.2, 'F');
  const logoUrl = company.logo_url || BRAND_LOGO_URL;
  const logoData = await fetchImage(logoUrl);
  if (logoData) {
    try { doc.setFillColor(255, 255, 255); doc.roundedRect(margin, 6, 36, 22, 2, 2, 'F'); doc.addImage(logoData, imgFormat(logoUrl), margin + 2, 8, 32, 18, undefined, 'FAST'); }
    catch { doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin, 20); }
  } else { doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin, 20); }

  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text('AFLEVERINGSRAPPORT', pageW - margin, 18, { align: 'right' });
  doc.setTextColor(203, 213, 225); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(project?.name || '', pageW - margin, 25, { align: 'right' });
  doc.setFontSize(9); doc.text(formatDate(new Date().toISOString().slice(0, 10)), pageW - margin, 30, { align: 'right' });

  // Project info
  y = 50;
  doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('PROJEKT', margin, y); doc.setDrawColor(...BORDER); doc.line(margin, y + 2, margin + contentW, y + 2);
  y += 7;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SLATE_LIGHT);
  const info = [
    ['Projektnavn', project?.name || '—'],
    ['Kunde', project?.customer_name || '—'],
    ['Adresse', project?.address || '—'],
    ['Type', project?.type || '—'],
    ['Status', project?.status || '—'],
    ['Periode', [project?.start_date, project?.end_date].filter(Boolean).map(formatDate).join(' – ') || '—'],
  ];
  info.forEach(([k, v]) => {
    doc.setTextColor(...SLATE_LIGHT); doc.text(k, margin, y);
    doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold'); doc.text(String(v), margin + 40, y); doc.setFont('helvetica', 'normal');
    y += 6;
  });

  // Quality checks
  y += 4;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('Kvalitetschecks', margin, y); doc.setDrawColor(...BORDER); doc.line(margin, y + 2, margin + 60, y + 2);
  y += 8;

  checks.forEach((c) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...SLATE);
    doc.text(c.title || '—', margin, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...SLATE_LIGHT);
    doc.text(`${c.type || ''} · ${c.status || ''} · ${c.check_date ? formatDate(c.check_date) : ''} · Tjekket af: ${c.checked_by || '—'}`, margin, y); y += 5;
    (c.items || []).forEach((it) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setTextColor(it.checked ? [21, 128, 61] : [220, 38, 38]);
      doc.text(it.checked ? '✓' : '✗', margin, y);
      doc.setTextColor(...SLATE_LIGHT); doc.text(it.description || '', margin + 6, y);
      if (it.notes) { doc.setTextColor(180, 83, 9); doc.text(`· ${it.notes}`, margin + 6 + doc.getTextWidth(it.description || '') + 2, y); }
      y += 5;
    });
    if (c.notes) { doc.setTextColor(...SLATE_LIGHT); const lines = doc.splitTextToSize(`Noter: ${c.notes}`, contentW); doc.text(lines, margin, y); y += lines.length * 4.5; }
    y += 4;
  });

  // Documents
  if (documents.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Dokumentation', margin, y); doc.setDrawColor(...BORDER); doc.line(margin, y + 2, margin + 60, y + 2);
    y += 8;
    documents.forEach((d) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(9); doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold');
      doc.text(`${d.type || ''}: ${d.title || ''}`, margin, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...SLATE_LIGHT);
      doc.text(d.upload_date ? formatDate(d.upload_date) : '', pageW - margin, y, { align: 'right' });
      y += 5;
    });
    y += 4;
  }

  // Image gallery
  if (images.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Billeder', margin, y); doc.setDrawColor(...BORDER); doc.line(margin, y + 2, margin + 50, y + 2);
    y += 6;
    const imgW = (contentW - 6) / 2, imgH = 42;
    for (let i = 0; i < images.length; i++) {
      if (y + imgH > 270) { doc.addPage(); y = 20; }
      const col = i % 2; const x = margin + col * (imgW + 6);
      if (col === 0 && i > 0) y += imgH + 10;
      const data = await fetchImage(images[i].image_url);
      if (data) {
        try { doc.addImage(data, imgFormat(images[i].image_url), x, y, imgW, imgH, undefined, 'FAST'); }
        catch { doc.setFillColor(248, 250, 252); doc.rect(x, y, imgW, imgH, 'F'); }
      } else { doc.setFillColor(248, 250, 252); doc.rect(x, y, imgW, imgH, 'F'); }
      doc.setDrawColor(...BORDER); doc.rect(x, y, imgW, imgH);
      if (images[i].caption || images[i].phase) {
        doc.setFontSize(8); doc.setTextColor(...SLATE_LIGHT); doc.setFont('helvetica', 'normal');
        doc.text(images[i].caption || images[i].phase || '', x, y + imgH + 4);
      }
      if (col === 1) y += imgH + 10;
    }
    y += 4;
  }

  // Footer
  doc.setDrawColor(...BORDER); doc.line(margin, 285, pageW - margin, 285);
  doc.setFillColor(...SLATE); doc.rect(0, 285.3, pageW, 0.5, 'F');
  doc.setTextColor(...SLATE_LIGHT); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text([company.company_name || 'Juhl & Damsgaard Entreprise', company.cvr ? `CVR ${company.cvr}` : ''].filter(Boolean).join('  ·  '), margin, 290);
  doc.text([company.phone, company.email].filter(Boolean).join('  ·  '), pageW - margin, 290, { align: 'right' });

  doc.save(`Afleveringsrapport-${(project?.name || 'projekt').replace(/\s+/g, '-')}.pdf`);
}