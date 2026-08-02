import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.2.1';

function buildCertificatePdf(data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(2);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin - 8, margin - 8, contentWidth + 16, pageHeight - margin * 2 + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Juhl & Damsgaard Entreprise', margin, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Professionel entreprenorvirksomhed - Asbestfjernelse & dokumentation', margin, margin + 13);

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 17, pageWidth - margin, margin + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text('Asbestfjernelsescertifikat', pageWidth / 2, margin + 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Bekaeftelse af korrekt udfort asbestfjernelse', pageWidth / 2, margin + 38, { align: 'center' });

  const certBoxY = margin + 45;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, certBoxY, contentWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Certifikatnr.: ${data.certificate_number || '-'}`, margin + 4, certBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const certDate = data.end_date || new Date().toISOString().split('T')[0];
  doc.text(`Dato: ${certDate}`, pageWidth - margin - 4, certBoxY + 6, { align: 'right' });

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
    const lines = doc.splitTextToSize(value || '-', contentWidth - 55);
    doc.text(lines, valueCol, y);
    y += lineHeight + (lines.length > 1 ? (lines.length - 1) * 5 : 0);
  };

  addRow('Titel:', data.title);
  addRow('Projekt:', data.project_name);
  addRow('Kunde:', data.customer_name);
  addRow('Adresse:', data.address);
  addRow('Placering:', data.location);
  addRow('Asbesttype:', data.asbestos_type);
  addRow('Maengde:', data.amount ? `${data.amount} ${data.unit}` : '-');
  addRow('Fjernelsesmetode:', data.removal_method);
  addRow('Modtageranlaeg:', data.disposal_facility);
  addRow('Ansvarlig:', data.responsible_person);
  addRow('Proeveresultater:', data.sample_results);
  addRow('Sikkerhedsforanstalt.:', data.safety_measures);

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
  doc.text(`${data.start_date || '-'} - ${data.end_date || '-'}`, valueCol, y);

  y += 14;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const statement = `Hermed bekaeftes, at asbestfjernelsen ovenfor er udfort i overensstemmelse med gaeldende regler og sikkerhedsstandarder. Affaldet er korrekt haandteret og deponeret pa godkendt modtageranlaeg.`;
  const statementLines = doc.splitTextToSize(statement, contentWidth - 8);
  doc.text(statementLines, margin + 4, y + 7);

  y += 30;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Ansvarlig udforende', margin, y + 5);
  doc.text(`${data.responsible_person || ''}`, margin, y + 9);
  doc.text('Dato & sted', pageWidth - margin - 70, y + 5);
  doc.text(`${certDate}`, pageWidth - margin - 70, y + 9);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Juhl & Damsgaard Entreprise - Dette certifikat genereres automatisk og er en officiel dokumentation af asbestfjernelse.', pageWidth / 2, pageHeight - 12, { align: 'center' });

  return doc;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const projectId = body.project_id;
    if (!projectId) return Response.json({ error: 'project_id kræves' }, { status: 400 });

    const project = await base44.asServiceRole.entities.Project.get(projectId);
    if (!project) return Response.json({ error: 'projekt ikke fundet' }, { status: 404 });

    const records = await base44.asServiceRole.entities.AsbestFjernelse.filter({ project_id: projectId });
    const pending = records.filter((r) => !r.certificate_url);

    if (pending.length === 0) {
      return Response.json({ success: true, generated: 0, message: 'Ingen asbestdokumenter mangler certifikat for dette projekt' });
    }

    const year = new Date().getFullYear();
    const allRecords = await base44.asServiceRole.entities.AsbestFjernelse.list();
    let counter = allRecords.filter((r) => (r.certificate_number || '').includes(`ASB-${year}`)).length;

    const results = [];
    for (const item of pending) {
      try {
        counter++;
        const certNumber = `ASB-${year}-${String(counter).padStart(4, '0')}`;
        const certData = {
          ...item,
          project_name: item.project_name || project.name,
          customer_name: item.customer_name || project.customer_name,
          address: item.address || project.address,
          certificate_number: certNumber,
        };

        const doc = buildCertificatePdf(certData);
        const pdfBytes = doc.output('arraybuffer');
        const file = new File([pdfBytes], `asbest-certifikat-${certNumber}.pdf`, { type: 'application/pdf' });

        const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        const file_url = uploadRes.file_url;

        await base44.asServiceRole.entities.AsbestFjernelse.update(item.id, {
          certificate_number: certNumber,
          certificate_url: file_url,
          status: 'Certificeret',
        });

        results.push({ id: item.id, title: item.title, certificate_number: certNumber, certificate_url: file_url });
      } catch (e) {
        results.push({ id: item.id, title: item.title, error: e.message });
      }
    }

    return Response.json({
      success: true,
      generated: results.filter((r) => r.certificate_url).length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}