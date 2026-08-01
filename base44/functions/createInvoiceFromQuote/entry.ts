import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { quote_id } = body;

    if (!quote_id) return Response.json({ error: 'Manglende tilbud ID' }, { status: 400 });

    let quote;
    try {
      quote = await base44.asServiceRole.entities.Quote.get(quote_id);
    } catch {
      return Response.json({ error: 'Tilbud ikke fundet' }, { status: 404 });
    }

    // Undgå dubletter – tjek om faktura allerede findes for dette tilbud
    const existing = await base44.asServiceRole.entities.Invoice.filter({ quote_id: quote_id });
    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Faktura eksisterer allerede', invoice_id: existing[0].id });
    }

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
      customer_id: quote.customer_id || '',
      customer_name: quote.customer_name || '',
      customer_email: quote.customer_email || '',
      project_id: quote.project_id || '',
      project_name: quote.project_name || '',
      quote_id: quote.id,
      status: 'Kladde',
      date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      line_items: quote.line_items || [],
      paid_amount: 0,
      notes: `Oprettet fra tilbud ${quote.quote_number}`,
    });

    return Response.json({ success: true, invoice_id: invoice.id, invoice_number: invoiceNumber });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}