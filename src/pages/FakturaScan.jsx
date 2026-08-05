import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ScanLine, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';

export default function FakturaScan() {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: f });
      setFileUrl(res.file_url);
    } catch (err) {
      toast({ title: 'Upload fejlede', description: err.message, variant: 'destructive' });
    }
  }

  async function scan() {
    if (!fileUrl) return;
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch('/functions/scanSupplierInvoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan fejlede');
      setResult(data);
      toast({ title: 'Faktura indscannet', description: data.created ? 'Leverandør oprettet' : 'Leverandør fundet' });
      setRecent((r) => [data.invoice, ...r].slice(0, 8));
      setFile(null);
      setFileUrl('');
    } catch (err) {
      toast({ title: 'Scan fejlede', description: err.message, variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Faktura Scan</h1>
        <p className="text-slate-500 mt-1">Upload en leverandørfaktura — systemet aflæser automatisk data og opretter leverandøren, hvis den ikke findes</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-amber-600" /> Upload faktura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Vælg PDF eller billede</Label>
              <Input id="file" type="file" accept="image/*,application/pdf" onChange={handleFile} />
            </div>
            {fileUrl && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Fil uploadet
              </div>
            )}
            {fileUrl && file && (
              <div className="text-xs text-slate-500 truncate">Fil: {file.name}</div>
            )}
            <Button onClick={scan} disabled={!fileUrl || scanning} className="w-full">
              {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aflæser…</> : <><ScanLine className="w-4 h-4 mr-2" /> Scan & opret</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Resultat</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-2 text-sm">
                <Row label="Fakturanr." value={result.invoice?.invoice_number} />
                <Row label="Leverandør" value={result.invoice?.supplier_name} />
                <Row label="Beløb" value={result.invoice?.amount != null ? formatDKK(result.invoice.amount) : '—'} />
                <Row label="Moms" value={result.invoice?.vat_amount != null ? formatDKK(result.invoice.vat_amount) : '—'} />
                <Row label="Dato" value={result.invoice?.date ? formatDate(result.invoice.date) : '—'} />
                <Row label="Leverandør oprettet" value={result.created ? 'Ja' : 'Eksisterende'} />
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">Ingen scannet faktura endnu</div>
            )}
          </CardContent>
        </Card>
      </div>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seneste scannet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {recent.map((inv, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{inv.invoice_number} — {inv.supplier_name}</div>
                    <div className="text-xs text-slate-500">{inv.date ? formatDate(inv.date) : '—'}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatDKK(inv.amount || 0)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-slate-500">
        <Link to="/leverandoerfakturaer" className="text-amber-600 hover:underline">Se alle leverandørfakturaer →</Link>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value || '—'}</span>
    </div>
  );
}