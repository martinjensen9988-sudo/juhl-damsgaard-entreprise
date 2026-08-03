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
import { Mail, Send } from 'lucide-react';
import { formatDKK, calcTotal, formatDate } from '@/lib/format';

export default function SendTilbudDialog({ quote, company, open, onOpenChange, onSent }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!quote) return;
    const link = `${window.location.origin}/portal/tilbud/${quote.id}`;
    setSubject(`Tilbud ${quote.quote_number} fra ${company.company_name || 'Juhl & Damsgaard Entreprise'}`);
    setMessage(
      `Hej ${quote.customer_name || ''}\n\n` +
      `Vi har fornøjelsen af at sende dig vores tilbud ${quote.quote_number} vedrørende ${quote.project_name || 'dit projekt'}.\n\n` +
      `Du kan se og acceptere tilbuddet online her:\n${link}\n\n` +
      `Samlet tilbud: ${formatDKK(calcTotal(quote.line_items))} inkl. moms\n` +
      `Tilbudet er gyldig til: ${quote.valid_until ? formatDate(quote.valid_until) : '30 dage'}\n\n` +
      `Har du spørgsmål, er du meget velkommen til at kontakte os.\n\n` +
      `Venlig hilsen\n${company.company_name || 'Juhl & Damsgaard Entreprise'}`
    );
  }, [quote, company]);

  const handleSend = async () => {
    setSending(true);
    try {
      const mailto = `mailto:${encodeURIComponent(quote.customer_email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailto;
      if (onSent) await onSent();
    } finally {
      setSending(false);
      onOpenChange(false);
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-700" /> Send tilbud til kunde
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Modtager</Label>
            <Input value={quote.customer_email || ''} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Emne</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Besked</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} />
          </div>
          <p className="text-xs text-slate-400">
            Der åbnes din email-klient med alt udfyldt. Tilbuddet markeres som "Sendt" og kunden får et online link.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuller</Button>
          <Button onClick={handleSend} disabled={sending || !quote.customer_email}>
            <Send className="w-4 h-4 mr-1.5" /> {sending ? 'Åbner...' : 'Send via email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}