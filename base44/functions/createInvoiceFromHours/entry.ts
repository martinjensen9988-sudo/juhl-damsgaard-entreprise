import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const HOURLY_RATE = 280; // kr/time ekskl. moms

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Kun admin' }, { status: 403 });

    const body = await req.json();
    const { project_id, send } = body;
    if (!project_id) return Response.json({ error: 'Manglende projekt ID' }, { status: 400 });

    const project = await base44.asServiceRole.entities.Project.get(project_id);
    if (!project) return Response.json({ error: 'Projekt ikke fundet' }, { status: 404 });

    const times = await base44.asServiceRole.entities.TimeEntry.filter({ project_id });
    if (!times || times.length === 0) {
      return Response.json({ error: 'Ingen registrerede timer på projektet' }, { status: 400 });
    }

    // Saml timer per arbejdstype
    const byType = {};
    times.forEach((t) => {
      const key = t.task_type || 'Andet';
      if (!byType[key]) byType[key] = { hours: 0, lines: [] };
      byType[key].hours += Number(t.hours) || 0;
      if (t.date || t.user_name) {
        byType[key].lines.push(`${t.date || ''} ${t.user_name || ''} – ${t.hours}t${t.description ? ` (${t.description})` : ''}`.trim());
      }
    });

    const lineItems = Object.keys(byType).map((type) => ({
      description: `${type} – arbejdstimer`,
      quantity: Number(byType[type].hours.toFixed(2)),
      unit: 'time',
      unit_price: HOURLY_RATE,
    }));

    // Dokumentation af timer i noter
    const docLines = Object.keys(byType).map((type) => {
      const detail = byType[type].lines.join('\n  ');
      return `${type} (${byType[type].hours}t):\n  ${detail}`;
    });
    const documentation = `Fakturakladde oprettet fra ${times.length} tidsregistreringer.\n\n${docLines.join('\n\n')}`;

    // Generér fakturanummer
    const year = new Date().getFullYear();
    const prefix = `FAK-${year}-`;
    const allInvoices = await base44.asServiceRole.entities.Invoice.list('-created_date', 200);
    const nums = allInvoices
      .filter((i) => i.invoice_number?.startsWith(prefix))
      .map((i) => parseInt(i.invoice_number.replace(prefix, ''), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    const invoiceNumber = `${prefix}${String(next).padStart(4, '0')}`;

    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoice_number: invoiceNumber,
      customer_id: project.customer_id || '',
      customer_name: project.customer_name || '',
      customer_email: project.customer_email || '',
      project_id: project.id,
      project_name: project.name || '',
      status: send ? 'Sendt' : 'Kladde',
      date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      line_items: lineItems,
      paid_amount: 0,
      notes: documentation,
    });

    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        entity_type: 'Faktura',
        entity_id: invoice.id,
        entity_name: invoiceNumber,
        action: send ? 'Oprettet og sendt' : 'Oprettet',
        user_email: user.email || '',
        user_name: user.full_name || 'Admin',
        details: `Faktura oprettet fra ${times.length} tidsregistreringer på projekt ${project.name || project_id}`,
      });
    } catch (e) { /* log fejler ikke flow */ }

    return Response.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      status: invoice.status,
      hours: lineItems.reduce((s, li) => s + li.quantity, 0),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}