import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Kun admin' }, { status: 403 });

    const body = await req.json();
    const { project_id } = body;
    if (!project_id) return Response.json({ error: 'Manglende projekt ID' }, { status: 400 });

    const project = await base44.asServiceRole.entities.Project.get(project_id);
    if (!project) return Response.json({ error: 'Projekt ikke fundet' }, { status: 404 });

    if (!project.customer_email) {
      return Response.json({ error: 'Projektet har ingen kundeemail', skipped: true }, { status: 200 });
    }

    const link = `${req.headers.get('origin') || ''}/portal/tilfredshed`;

    const subject = `Hvad synes du om dit projekt? — ${project.name || ''}`;
    const body_text =
      `Hej ${project.customer_name || ''}\n\n` +
      `Vi har nu afsluttet "${project.name || 'dit projekt'}".\n\n` +
      `Din tilfredshed er vigtig for os, og vi vil gerne høre om din oplevelse af samarbejdet og arbejdets udførelse.\n\n` +
      `Det tager kun 1-2 minutter at give en vurdering og skrive en kommentar her:\n${link}\n\n` +
      `På forhånd tak for din tid.\n\n` +
      `Venlig hilsen\n${'Juhl & Damsgaard Entreprise'}`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: project.customer_email,
        subject,
        body: body_text,
      });
    } catch (e) {
      return Response.json({ error: 'Email kunne ikke sendes (kunden er muligvis ikke registreret)', details: e.message }, { status: 200 });
    }

    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        entity_type: 'Projekt',
        entity_id: project.id,
        entity_name: project.name || project_id,
        action: 'Feedback anmodning sendt',
        user_email: user.email || '',
        user_name: user.full_name || 'Admin',
        details: `Tilfredshedsanmodning sendt til ${project.customer_email} for afsluttet projekt`,
      });
    } catch (e) { /* log fejler ikke flow */ }

    return Response.json({ success: true, sent_to: project.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
