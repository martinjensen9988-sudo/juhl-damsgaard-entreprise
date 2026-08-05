import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Ikke logget ind' }, { status: 401 });

    const body = await req.json();
    const { quote_id, action, customer_name, signature_ip } = body;

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
      const updatePayload = { status: newStatus };

      if (action === 'accept') {
        const signedName = (customer_name || '').trim();
        if (!signedName) {
          return Response.json({ error: 'Angiv venligst dit fulde navn for at godkende' }, { status: 400 });
        }
        updatePayload.accepted_at = new Date().toISOString();
        updatePayload.accepted_by = signedName;
        const clientIp = signature_ip
          || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || req.headers.get('x-real-ip')
          || req.headers.get('cf-connecting-ip')
          || '';
        if (clientIp) updatePayload.accepted_ip = clientIp;
      }

      await base44.asServiceRole.entities.Quote.update(quote_id, updatePayload);

      try {
        const signer = action === 'accept'
          ? `${signedName || user.full_name || user.email}`
          : user.full_name || user.email;
        await base44.asServiceRole.entities.ActivityLog.create({
          entity_type: 'Tilbud',
          entity_id: quote_id,
          entity_name: quote.quote_number || quote_id,
          action: action === 'accept' ? 'Accepteret' : 'Afvist',
          user_email: user.email,
          user_name: signer,
          details: action === 'accept'
            ? `Tilbud accepteret digitalt af ${signer} (${user.email})${signature_ip ? ` fra ${signature_ip}` : ''}`
            : `Tilbud afvist af kunde (${user.email})`,
        });
      } catch (e) { /* log fejler ikke flow */ }

      return Response.json({ success: true, status: newStatus, accepted_by: updatePayload.accepted_by, accepted_at: updatePayload.accepted_at, accepted_ip: updatePayload.accepted_ip });
    }

    return Response.json({ error: 'Ukendt handling' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}