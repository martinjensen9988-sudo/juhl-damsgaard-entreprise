import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Ikke logget ind' }, { status: 401 });

    const body = await req.json();
    const { quote_id, action } = body;

    if (!quote_id) return Response.json({ error: 'Manglende tilbud ID' }, { status: 400 });

    let quote;
    try {
      quote = await base44.asServiceRole.entities.Quote.get(quote_id);
    } catch {
      return Response.json({ error: 'Tilbud ikke fundet' }, { status: 404 });
    }

    if (quote.customer_email !== user.email) {
      return Response.json({ error: 'Dette tilbud tilhører ikke din konto' }, { status: 403 });
    }

    if (action === 'view') {
      if (!quote.viewed_at) {
        await base44.asServiceRole.entities.Quote.update(quote_id, {
          viewed_at: new Date().toISOString(),
        });
      }
      return Response.json({ success: true, viewed: true });
    }

    if (action === 'accept' || action === 'reject') {
      const newStatus = action === 'accept' ? 'Accepteret' : 'Afvist';
      await base44.asServiceRole.entities.Quote.update(quote_id, {
        status: newStatus,
      });
      return Response.json({ success: true, status: newStatus });
    }

    return Response.json({ error: 'Ukendt handling' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}