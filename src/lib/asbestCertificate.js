import { jsPDF } from 'jspdf';

export function generateAsbestCertificate(data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // === Decorative border ===
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(2);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin - 8, margin - 8, contentWidth + 16, pageHeight - margin * 2 + 16);

  // === Company header ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Juhl & Damsgaard Entreprise', margin, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Professionel entreprenørvirksomhed · Asbestfjernelse & dokumentation', margin, margin + 13);

  // Horizontal line
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 17, pageWidth - margin, margin + 17);

  // === Certificate title ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text('Asbestfjernelsescertifikat', pageWidth / 2, margin + 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Bekræftelse af korrekt udført asbestfjernelse', pageWidth / 2, margin + 38, { align: 'center' });

  // Certificate number box
  const certBoxY = margin + 45;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, certBoxY, contentWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Certifikatnr.: ${data.certificate_number || '—'}`, margin + 4, certBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const certDate = data.end_date || new Date().toISOString().split('T')[0];
  doc.text(`Dato: ${certDate}`, pageWidth - margin - 4, certDate ? certBoxY + 6 : certBoxY + 6, { align: 'right' });

  // === Details section ===
  let y = certBoxY + 24;
  const lineHeight = 7;
  const labelCol = margin + 4;
  const valueCol = margin + 50;

  const addRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, labelCol, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(value || '—', contentWidth - 55);
    doc.text(lines, valueCol, y);
    y += lineHeight + (lines.length > 1 ? (lines.length - 1) * 5 : 0);
  };

  addRow('Titel:', data.title);
  addRow('Projekt:', data.project_name);
  addRow('Kunde:', data.customer_name);
  addRow('Adresse:', data.address);
  addRow('Placering:', data.location);
  addRow('Asbesttype:', data.asbestos_type);
  addRow('Mængde:', data.amount ? `${data.amount} ${data.unit}` : '—');
  addRow('Fjernelsesmetode:', data.removal_method);
  addRow('Modtageranlæg:', data.disposal_facility);
  addRow('Ansvarlig:', data.responsible_person);
  addRow('Prøveresultater:', data.sample_results);
  addRow('Sikkerhedsforanstalt.:', data.safety_measures);

  // === Period ===
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Arbejdsperiode:', labelCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.start_date || '—'} — ${data.end_date || '—'}`, valueCol, y);

  // === Certification statement ===
  y += 14;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const statement = `Hermed bekærtes, at asbestfjernelsen ovenfor er udført i overensstemmelse med gældende regler og sikkerhedsstandarder. Affaldet er korrekt håndteret og deponeret på godkendt modtageranlæg.`;
  const statementLines = doc.splitTextToSize(statement, contentWidth - 8);
  doc.text(statementLines, margin + 4, y + 7);

  // === Signature area ===
  y += 30;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Ansvarlig udførende', margin, y + 5);
  doc.text(`${data.responsible_person || ''}`, margin, y + 9);
  doc.text('Dato & sted', pageWidth - margin - 70, y + 5);
  doc.text(`${certDate}`, pageWidth - margin - 70, y + 9);

  // === Footer ===
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Juhl & Damsgaard Entreprise · Dette certifikat genereres automatisk og er en officiel dokumentation af asbestfjernelse.', pageWidth / 2, pageHeight - 12, { align: 'center' });

  return doc;
}