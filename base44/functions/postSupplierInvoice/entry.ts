import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  accountForCategory,
  CREDITOR_ACCOUNT,
  INPUT_VAT_ACCOUNT,
} from '../../shared/supplierInvoiceAccounting.js';

// Approves a supplier invoice and posts it to the accounting journal (JournalEntry).
// Double-entry: debit expense account (net) + debit input VAT, credit creditors (total).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Kun admin kan godkende fakturaer' }, { status: 403 });

    const body = await req.json();
    const { invoice_id } = body || {};
    if (!invoice_id) return Response.json({ error: 'invoice_id mangler' }, { status: 400 });

    const invoice = await base44.asServiceRole.entities.SupplierInvoice.get(invoice_id);
    if (!invoice) return Response.json({ error: 'Faktura ikke fundet' }, { status: 404 });
    if (invoice.status === 'Godkendt' || invoice.status === 'Betalt') {
      return Response.json({ error: 'Faktura er allerede godkendt', invoice }, { status: 409 });
    }

    const amount = Number(invoice.amount) || 0;
    const vat = Number(invoice.vat_amount) || 0;
    const total = amount + vat;
    const [expAcc, expName, vatCode] = accountForCategory(invoice.category);
    const date = invoice.date || new Date().toISOString().slice(0, 10);
    const period = date.slice(0, 7);

    // Generate a sequential bilagsnr. (entry number)
    const existing = await base44.asServiceRole.entities.JournalEntry.list('-entry_number', 1);
    let nextNr = 1;
    if (existing.length > 0 && existing[0].entry_number) {
      const parsed = parseInt(String(existing[0].entry_number).replace(/\D/g, ''), 10);
      if (!isNaN(parsed)) nextNr = parsed + 1;
    }
    const entryNumber = String(nextNr).padStart(5, '0');

    const lines = [
      {
        account_number: expAcc,
        account_name: expName,
        debit: amount,
        credit: 0,
        vat_code: vatCode,
        description: `${invoice.invoice_number} — ${invoice.supplier_name}`,
      },
    ];
    if (vat > 0) {
      lines.push({
        account_number: INPUT_VAT_ACCOUNT[0],
        account_name: INPUT_VAT_ACCOUNT[1],
        debit: vat,
        credit: 0,
        vat_code: 'none',
        description: `Indgående moms ${invoice.invoice_number}`,
      });
    }
    lines.push({
      account_number: CREDITOR_ACCOUNT[0],
      account_name: CREDITOR_ACCOUNT[1],
      debit: 0,
      credit: total,
      vat_code: 'none',
      description: `${invoice.supplier_name} — ${invoice.invoice_number}`,
    });

    const journalEntry = await base44.asServiceRole.entities.JournalEntry.create({
      entry_number: entryNumber,
      date,
      period,
      description: `Leverandørfaktura ${invoice.invoice_number} — ${invoice.supplier_name}`,
      status: 'Bogført',
      lines,
      attachment_url: invoice.file_url || '',
      posted_date: date,
    });

    const approvedDate = new Date().toISOString().slice(0, 10);
    const updated = await base44.asServiceRole.entities.SupplierInvoice.update(invoice_id, {
      status: 'Godkendt',
      approved_by: user.full_name || user.email || 'Admin',
      approved_date: approvedDate,
      journal_entry_id: journalEntry.id,
    });

    return Response.json({
      ok: true,
      invoice: updated,
      journal_entry: { id: journalEntry.id, entry_number: entryNumber },
      posted: { expense_account: expAcc, amount, vat, total },
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Kunne ikke bogføre faktura' }, { status: 500 });
  }
}