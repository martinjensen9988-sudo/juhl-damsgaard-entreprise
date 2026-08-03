import { jsPDF } from 'jspdf';
import { formatDKK, formatDate } from './format';

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

const statusLabels = {
  Oprettet: 'Oprettet',
  Anmeldt: 'Anmeldt til forsikring',
  'Under behandling': 'Under behandling',
  Godkendt: 'Godkendt',
  Afvist: 'Afvist',
  Udbedres: 'Under udbedring',
  Afsluttet: 'Afsluttet',
};

const repairStatusLabels = {
  'Ikke påbegyndt': 'Ikke påbegyndt',
  Planlagt: 'Planlagt',
  'I gang': 'I gang',
  Afsluttet: 'Afsluttet',
};

export async function generateDamageReportPDF(incident, company = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const contentW = pageW - margin * 2;
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
      // fallback
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(logoData ? 12 : 20);
  doc.text(company.company_name || 'Juhl & Damsgaard Entreprise', margin, logoData ? 24 : 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (company.address || company.city) {
    doc.text(`${company.address || ''}  ${company.postal_code || ''} ${company.city || ''}`.trim(), margin, 30);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SKADESRAPPORT', pageW - margin, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(incident.case_number || '', pageW - margin, 23, { align: 'right' });

  y = 45;

  // ── Case info grid ──
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Sagsoplysninger', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const colW = contentW / 2;
  const infoRows = [
    ['Kunde', incident.customer_name || '—'],
    ['Skadetype', incident.damage_type || '—'],
    ['Skadesdato', formatDate(incident.damage_date)],
    ['Anmeldt den', formatDate(incident.reported_date)],
    ['Forsikringsselskab', incident.insurance_company || '—'],
    ['Policenummer', incident.policy_number || '—'],
    ['Sagsbehandler', incident.assigned_to || '—'],
    ['Status', statusLabels[incident.status] || incident.status || '—'],
    ['Skadesadresse', incident.address || '—'],
    ['Projekt', incident.project_name || '—'],
  ];
  infoRows.forEach((row, i) => {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, margin + col * colW, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[1]).slice(0, 40), margin + col * colW + 28, rowY);
  });
  y += Math.ceil(infoRows.length / 2) * 6 + 4;

  // ── Insurance contact ──
  if (incident.insurance_contact || incident.insurance_phone || incident.insurance_email) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Kontakt hos forsikringsselskab', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const contactParts = [
      incident.insurance_contact || '',
      incident.insurance_phone ? `Tlf: ${incident.insurance_phone}` : '',
      incident.insurance_email ? `Email: ${incident.insurance_email}` : '',
    ].filter(Boolean);
    doc.text(contactParts.join('   ·   '), margin, y);
    y += 8;
  }

  // ── Damage description ──
  if (incident.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Skadesbeskrivelse', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(incident.description, contentW);
    lines.forEach((line) => {
      if (y > pageH - 20) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // ── Damage items table ──
  const items = incident.damage_items || [];
  if (items.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Skadesposteringer', margin, y);
    y += 6;

    const descW = contentW - 25 - 25 - 30;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Beskrivelse', margin + 2, y);
    doc.text('Omfang', margin + 2 + descW, y);
    doc.text('Udbedring', margin + 2 + descW + 25, y);
    doc.text('Pris (DKK)', margin + 2 + descW + 25 + 25, y, { align: 'right' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    let totalEst = 0;
    let totalAppr = 0;
    items.forEach((item) => {
      if (y > pageH - 20) { doc.addPage(); y = margin; }
      const descLines = doc.splitTextToSize(item.description || '', descW - 4);
      const rowH = Math.max(6, descLines.length * 5);
      doc.text(descLines, margin + 2, y);
      doc.text(item.severity || '', margin + 2 + descW, y);
      doc.text(repairStatusLabels[item.repair_status] || item.repair_status || '', margin + 2 + descW + 25, y);
      const cost = item.approved_cost || item.estimated_cost || 0;
      doc.text(formatDKK(cost), margin + contentW - 2, y, { align: 'right' });
      totalEst += item.estimated_cost || 0;
      totalAppr += item.approved_cost || 0;
      y += rowH;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 1, margin + contentW, y - 1);
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Estimeret i alt:', margin + contentW - 60, y);
    doc.text(formatDKK(totalEst), margin + contentW - 2, y, { align: 'right' });
    y += 6;
    if (totalAppr > 0) {
      doc.text('Godkendt i alt:', margin + contentW - 60, y);
      doc.text(formatDKK(totalAppr), margin + contentW - 2, y, { align: 'right' });
      y += 6;
    }
    if (incident.deductible > 0) {
      doc.text('Selvrisiko:', margin + contentW - 60, y);
      doc.text(formatDKK(incident.deductible), margin + contentW - 2, y, { align: 'right' });
      y += 6;
    }
    y += 4;
  }

  // ── Repair tracking ──
  if (incident.repair_status || incident.repair_assigned_to) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Udbedring', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const repairRows = [
      ['Status', repairStatusLabels[incident.repair_status] || incident.repair_status || '—'],
      ['Ansvarlig', incident.repair_assigned_to || '—'],
      ['Start', formatDate(incident.repair_start_date)],
      ['Slut', formatDate(incident.repair_end_date)],
    ];
    repairRows.forEach((row, i) => {
      const col = i % 2;
      const rowY = y + Math.floor(i / 2) * 6;
      doc.setFont('helvetica', 'bold');
      doc.text(`${row[0]}:`, margin + col * colW, rowY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(row[1]).slice(0, 40), margin + col * colW + 28, rowY);
    });
    y += Math.ceil(repairRows.length / 2) * 6 + 4;

    if (incident.repair_notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(incident.repair_notes, contentW);
      lines.forEach((line) => {
        if (y > pageH - 20) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 4;
    }
  }

  // ── Communication log ──
  const log = incident.communication_log || [];
  if (log.length > 0) {
    if (y > pageH - 40) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Kommunikationslog', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    log.forEach((entry) => {
      if (y > pageH - 20) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(`${formatDate(entry.date)}  ${entry.type || ''}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(entry.author || '', margin + 55, y);
      y += 5;
      if (entry.message) {
        const msgLines = doc.splitTextToSize(entry.message, contentW);
        msgLines.forEach((line) => {
          if (y > pageH - 20) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 5;
        });
      }
      y += 2;
    });
  }

  // ── Photos ──
  const photoSections = [
    { label: 'Før-billeder', urls: incident.before_photo_urls || [] },
    { label: 'Undervejs-billeder', urls: incident.during_photo_urls || [] },
    { label: 'Efter-billeder', urls: incident.after_photo_urls || [] },
  ];

  for (const section of photoSections) {
    if (!section.urls.length) continue;
    if (y > pageH - 40) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(section.label, margin, y);
    y += 6;

    const thumbW = 52;
    const thumbH = 39;
    const gap = 4;
    let x = margin;
    for (const url of section.urls) {
      if (x + thumbW > pageW - margin) { x = margin; y += thumbH + gap + 4; }
      if (y + thumbH > pageH - 15) { doc.addPage(); y = margin; x = margin; }
      const imgData = await fetchImageAsDataURL(url);
      if (imgData) {
        try {
          doc.addImage(imgData, imgFormat(url), x, y, thumbW, thumbH, undefined, 'FAST');
        } catch {
          doc.setFillColor(226, 232, 240);
          doc.rect(x, y, thumbW, thumbH, 'F');
        }
      } else {
        doc.setFillColor(226, 232, 240);
        doc.rect(x, y, thumbW, thumbH, 'F');
      }
      doc.setDrawColor(203, 213, 225);
      doc.rect(x, y, thumbW, thumbH);
      x += thumbW + gap;
    }
    y += thumbH + gap + 6;
  }

  // ── Footer ──
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${company.company_name || 'Juhl & Damsgaard Entreprise'}  ·  ${company.phone || ''}  ·  ${company.email || ''}`,
      margin,
      pageH - 8,
    );
    doc.text(`Side ${p} af ${pages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const filename = `Skadesrapport_${incident.case_number || 'sag'}.pdf`;
  doc.save(filename);
}