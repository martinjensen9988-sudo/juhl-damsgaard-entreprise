import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Kun administratorer' }, { status: 403 });

    const body = await req.json();
    const fileUrl = body?.file_url;
    if (!fileUrl || typeof fileUrl !== 'string') {
      return Response.json({ error: 'file_url kræves' }, { status: 400 });
    }

    const schema = {
      type: 'object',
      properties: {
        invoice_number: { type: 'string' },
        supplier_name: { type: 'string' },
        supplier_cvr: { type: 'string' },
        supplier_address: { type: 'string' },
        supplier_postal_code: { type: 'string' },
        supplier_city: { type: 'string' },
        supplier_phone: { type: 'string' },
        supplier_email: { type: 'string' },
        amount: { type: 'number' },
        vat_amount: { type: 'number' },
        date: { type: 'string' },
        due_date: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['invoice_number', 'supplier_name', 'amount']
    };

    const prompt = `Du er en dansk bogføringsassistent. Læs den vedhæftede leverandørfaktura og udtræk disse felter præcist:
- invoice_number: fakturanummer
- supplier_name: leverandørens (sælgers) virksomhedsnavn
- supplier_cvr: CVR-nummer hvis angivet
- supplier_address: leverandørens adresse
- supplier_postal_code: postnummer
- supplier_city: by
- supplier_phone: telefon
- supplier_email: email
- amount: totalbeløb UDDEN moms (netto) i DKK som tal
- vat_amount: momsbeløb i DKK som tal (hvis beløb er inkl. moms, beregn moms = total * 0,2; hvis ekskl. moms, brug angivet moms)
- date: fakturadato i YYYY-MM-DD format
- due_date: forfaldsdato i YYYY-MM-DD format
- description: kort beskrivelse af hvad fakturaen dækker

Hvis et felt ikke findes på fakturaen, returner tomt eller 0. amount og vat_amount skal være tal.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [fileUrl],
      response_json_schema: schema,
      model: 'gemini_3_flash'
    });

    const data = result || {};
    const supplierName = (data.supplier_name || '').trim();
    if (!supplierName) {
      return Response.json({ error: 'Kunne ikke læse leverandørnavn fra faktura' }, { status: 422 });
    }

    // Find eller opret leverandør
    let supplier = null;
    try {
      const existing = await base44.entities.Supplier.list('-updated_date', 200);
      supplier = existing.find(
        (s) => s.name?.toLowerCase() === supplierName.toLowerCase() ||
          (data.supplier_cvr && s.cvr === data.supplier_cvr)
      );
    } catch (e) {
      console.error('Supplier lookup error:', e);
    }

    if (!supplier) {
      supplier = await base44.entities.Supplier.create({
        name: supplierName,
        cvr: data.supplier_cvr || '',
        address: data.supplier_address || '',
        postal_code: data.supplier_postal_code || '',
        city: data.supplier_city || '',
        phone: data.supplier_phone || '',
        email: data.supplier_email || '',
        category: 'Andet',
        notes: 'Auto-oprettet ved faktura-upload'
      });
    } else {
      // Opdater evt. manglende felter fra fakturaen
      const updates = {};
      if (!supplier.cvr && data.supplier_cvr) updates.cvr = data.supplier_cvr;
      if (!supplier.address && data.supplier_address) updates.address = data.supplier_address;
      if (!supplier.city && data.supplier_city) updates.city = data.supplier_city;
      if (!supplier.postal_code && data.supplier_postal_code) updates.postal_code = data.supplier_postal_code;
      if (!supplier.phone && data.supplier_phone) updates.phone = data.supplier_phone;
      if (!supplier.email && data.supplier_email) updates.email = data.supplier_email;
      if (Object.keys(updates).length > 0) {
        await base44.entities.Supplier.update(supplier.id, updates);
      }
    }

    // Opret leverandørfaktura
    const invoice = await base44.entities.SupplierInvoice.create({
      invoice_number: data.invoice_number || '',
      supplier_name: supplier.name,
      amount: Number(data.amount) || 0,
      vat_amount: Number(data.vat_amount) || 0,
      date: data.date || new Date().toISOString().slice(0, 10),
      due_date: data.due_date || '',
      description: data.description || '',
      file_url: fileUrl,
      status: 'Afventer',
      notes: `AI-indlæst ${new Date().toISOString().slice(0, 10)}`
    });

    return Response.json({
      invoice,
      supplier_created: !supplier?.id || supplier.notes === 'Auto-oprettet ved faktura-upload',
      supplier_name: supplier.name
    });
  } catch (error) {
    console.error('scanSupplierInvoice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}