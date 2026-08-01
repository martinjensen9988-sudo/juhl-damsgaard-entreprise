import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Beregn måldato: 3 dage siden
    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() - 3);
    const targetDateStr = target.toISOString().slice(0, 10);

    // Find ubetalte fakturaer med forfaldsdato 3 dage siden, hvor påmindelse ikke allerede er sendt
    const invoices = await base44.asServiceRole.entities.Invoice.filter({
      status: { $in: ["Sendt", "Forfalden"] },
      due_date: targetDateStr,
      reminder_sent: { $ne: true },
    });

    let sentCount = 0;
    const errors = [];

    for (const inv of invoices) {
      if (!inv.customer_email) continue;
      try {
        const total = (inv.line_items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
        const outstanding = total - (Number(inv.paid_amount) || 0);
        const fmtDKK = (n) => `${n.toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: inv.customer_email,
          subject: `Påmindelse: Faktura ${inv.invoice_number} er forfalden`,
          body: [
            `Hej ${inv.customer_name || ''}`,
            ``,
            `Dette er en venlig påmindelse om, at faktura ${inv.invoice_number} forfaldt den ${inv.due_date} og stadig er ubetalt.`,
            ``,
            `Fakturanummer: ${inv.invoice_number}`,
            `Forfaldsdato: ${inv.due_date}`,
            `Restbeløb: ${fmtDKK(outstanding)}`,
            ``,
            `Vi beder venligst om at betale beløbet hurtigst muligt. Kontakt os, hvis du allerede har betalt.`,
            ``,
            `Med venlig hilsen,`,
            `Juhl & Damsgaard Entreprise`,
          ].join('\n'),
        });

        await base44.asServiceRole.entities.Invoice.update(inv.id, { reminder_sent: true });
        sentCount++;

        try {
          await base44.asServiceRole.entities.ActivityLog.create({
            entity_type: 'Faktura',
            entity_id: inv.id,
            entity_name: inv.invoice_number,
            action: 'Sendt',
            user_email: '',
            user_name: 'System',
            details: `Automatisk betalingspåmindelse sendt (3 dage efter forfald)`,
          });
        } catch (e) { /* log fejler ikke flow */ }
      } catch (e) {
        errors.push({ invoice: inv.invoice_number, error: e.message });
      }
    }

    return Response.json({ success: true, sent: sentCount, checked: invoices.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}