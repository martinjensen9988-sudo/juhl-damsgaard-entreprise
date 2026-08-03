import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Mail, Send, Download } from 'lucide-react';
import { formatDKK, calcTotal, formatDate } from '@/lib/format';
import { generateInvoicePDF } from '@/lib/invoicePdf';

export default function SendFakturaDialog({ invoice, company, open, onOpenChange, onSent }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    setSubject(`Faktura ${invoice.invoice_number} fra ${company.company_name || 'Juhl & Damsgaard Entreprise'}`);
    setMessage(
      `Hej ${invoice.customer_name || ''}\n\n` +
      `Vedhæftet / hermed fremsendes faktura ${invoice.invoice_number} vedrørende ${invoice.project_name || 'dit projekt'}.\n\n` +
      `Beløb til betaling: ${formatDKK(calcTotal(invoice.line_items))} inkl. moms\n` +
      `Forfaldsdato: ${invoice.due_date ? formatDate(invoice.due_date) : '—'}\n\n` +
      `Betaling til: ${company.bank_account || 'Oplyses på faktura'}\n\n` +
      `Har du spørgsmål, er du meget velkommen til at kontakte os.\n\n` +
      `Venlig hilsen\n${company.company_name || 'Juhl & Damsgaard Entreprise'}`
    );
  }, [invoice, company]);

  const handleSend = async () => {
    setSending(true);
    try {
      const mailto = `mailto:${encodeURIComponent(invoice.customer_email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailto;
      if (onSent) await onSent();
    } finally {
      setSending(false);
      onOpenChange(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generateInvoicePDF(invoice, company);
    } catch (e) {
      alert('Kunne ikke generere PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-700" /> Send faktura til kunde
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Modtager</Label>
            <Input value={invoice.customer_email || ''} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Emne</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Besked</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={9} />
          </div>
          <p className="text-xs text-slate-400">
            Hent PDF'en og vedhæft den i din email-klient, der åbnes med alt udfyldt.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={downloadPDF} disabled={pdfLoading}>
            {pdfLoading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Hent PDF
          </Button>
          <Button onClick={handleSend} disabled={sending || !invoice.customer_email}>
            <Send className="w-4 h-4 mr-1.5" /> {sending ? 'Åbner...' : 'Send via email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}