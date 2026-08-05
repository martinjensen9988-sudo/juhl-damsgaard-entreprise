import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

export default function SupplierInvoiceScanner({ onScanned }) {
  const [fileUrl, setFileUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = React.useRef(null);

  const handleScan = async (url) => {
    const targetUrl = (url || fileUrl || '').trim();
    if (!targetUrl) {
      setError('Angiv en fil-URL eller upload en fil');
      return;
    }
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('scanSupplierInvoice', { file_url: targetUrl });
      const data = res?.data || res;
      if (data?.error) {
        setError(data.error);
      } else {
        setResult(data);
        if (onScanned) onScanned(data);
      }
    } catch (e) {
      setError(e?.message || 'Kunne ikke læse faktura');
    } finally {
      setScanning(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      await handleScan(file_url);
    } catch (e) {
      setError(e?.message || 'Upload fejlede');
      setScanning(false);
    }
  };

  const inv = result?.invoice;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ScanLine className="w-5 h-5 text-amber-600" />
        <div>
          <h3 className="font-semibold text-slate-900">AI Faktura-scanner</h3>
          <p className="text-sm text-slate-500">Upload eller indsæt URL på en leverandørfaktura — AI udtrækker automatisk felter</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label>Fil-URL</Label>
          <Input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://...faktura.pdf"
            disabled={scanning}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleScan()} disabled={scanning || !fileUrl.trim()} className="bg-amber-600 hover:bg-amber-700">
            {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Læser...</> : <><ScanLine className="w-4 h-4" /> Scan faktura</>}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={scanning} className="gap-2">
            <Upload className="w-4 h-4" /> Upload fil
          </Button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleUpload(e.target.files?.[0])}
            disabled={scanning}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && inv && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Faktura læst succesfuldt{result.supplier_created ? ' — ny leverandør oprettet' : ''}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Fakturanr." value={inv.invoice_number} />
            <Field label="Leverandør" value={inv.supplier_name} />
            <Field label="Beløb (ekscl. moms)" value={formatDKK(Number(inv.amount) || 0)} />
            <Field label="Moms" value={inv.vat_amount ? formatDKK(Number(inv.vat_amount) || 0) : '—'} />
            <Field label="Dato" value={inv.date ? formatDate(inv.date) : '—'} />
            <Field label="Forfaldsdato" value={inv.due_date ? formatDate(inv.due_date) : '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value || '—'}</div>
    </div>
  );
}