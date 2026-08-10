import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, XCircle, FileText, Upload, ClipboardCheck, Receipt,
} from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

const categories = ['Materialer', 'Maskiner', 'Transport', 'Lønninger', 'Brændstof', 'Forsikring', 'Værktøj', 'Kontor', 'Markedsføring', 'Andet'];
const approvalStatuses = ['Afventer', 'Godkendt', 'Afvist', 'Bogført'];

const statusColor = {
  Afventer: 'bg-amber-100 text-amber-700',
  Godkendt: 'bg-emerald-100 text-emerald-700',
  Afvist: 'bg-red-100 text-red-700',
  Bogført: 'bg-slate-200 text-slate-600',
};

export default function Udgiftsgodkendelse() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Afventer');
  const [uploading, setUploading] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Expense.list('-created_date', 200);
      setExpenses(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = expenses.filter((e) => e.approval_status === filter);

  const stats = {
    pending: expenses.filter((e) => e.approval_status === 'Afventer').length,
    pendingAmount: expenses.filter((e) => e.approval_status === 'Afventer').reduce((s, e) => s + (e.amount || 0), 0),
    approved: expenses.filter((e) => e.approval_status === 'Godkendt').length,
    approvedAmount: expenses.filter((e) => e.approval_status === 'Godkendt').reduce((s, e) => s + (e.amount || 0), 0),
  };

  const approve = async (exp) => {
    try {
      const me = await base44.auth.me();
      await base44.entities.Expense.update(exp.id, {
        approval_status: 'Godkendt',
        approved_by: me?.full_name || '',
        approved_date: new Date().toISOString().split('T')[0],
        rejection_reason: '',
      });
      load();
      toast({ title: 'Udgift godkendt', description: exp.title });
    } catch (e) { console.error(e); toast({ title: 'Kunne ikke godkende', variant: 'destructive' }); }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await base44.entities.Expense.update(rejectTarget.id, {
        approval_status: 'Afvist',
        rejection_reason: rejectReason,
      });
      setRejectTarget(null);
      setRejectReason('');
      load();
      toast({ title: 'Udgift afvist' });
    } catch (e) { toast({ title: 'Fejl ved afvisning', variant: 'destructive' }); }
  };

  const bookkeep = async (exp) => {
    try {
      await base44.entities.Expense.update(exp.id, { approval_status: 'Bogført' });
      load();
      toast({ title: 'Bogført', description: exp.title });
    } catch (e) { toast({ title: 'Fejl ved bogføring', variant: 'destructive' }); }
  };

  const uploadReceipt = async (e, exp) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(exp.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Expense.update(exp.id, { receipt_url: file_url });
      load();
    } catch (err) { toast({ title: 'Upload fejlede', variant: 'destructive' }); }
    setUploading('');
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Udgiftsgodkendelse</h1>
          <p className="text-slate-500 mt-0.5">Gennemgå og godkend udgifter og bilag, før de bogføres i projektregnskabet</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Til godkendelse</div><div className="text-xl font-bold text-amber-600 mt-1">{stats.pending}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Afventer beløb</div><div className="text-xl font-bold text-slate-900 mt-1">{formatDKK(stats.pendingAmount)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Godkendt</div><div className="text-xl font-bold text-emerald-600 mt-1">{stats.approved}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Godkendt beløb</div><div className="text-xl font-bold text-slate-900 mt-1">{formatDKK(stats.approvedAmount)}</div></div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {approvalStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <div className="text-center py-20 text-slate-400">Indlæser…</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen udgifter med status "{filter}"</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-slate-500" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{exp.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full">{exp.category}</span>
                      <span>{formatDate(exp.date)}</span>
                      {exp.supplier_name && <span>· {exp.supplier_name}</span>}
                      {exp.project_name && <span>· {exp.project_name}</span>}
                      {exp.submitted_by && <span>· Indsendt af {exp.submitted_by}</span>}
                    </div>
                    {exp.approval_status === 'Afvist' && exp.rejection_reason && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">Afvisningsgrund: {exp.rejection_reason}</div>
                    )}
                    {exp.approved_by && (
                      <div className="mt-1 text-xs text-slate-400">Godkendt af {exp.approved_by} {exp.approved_date ? `· ${formatDate(exp.approved_date)}` : ''}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{formatDKK(exp.amount)}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[exp.approval_status] || 'bg-slate-100'}`}>{exp.approval_status}</span>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                {exp.receipt_url ? (
                  <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <Receipt className="w-4 h-4" /> Vis bilag
                  </a>
                ) : (
                  <label className="flex items-center gap-1 text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                    <Upload className="w-4 h-4" /> {uploading === exp.id ? 'Uploader…' : 'Upload bilag'}
                    <input type="file" className="hidden" onChange={(e) => uploadReceipt(e, exp)} disabled={uploading === exp.id} />
                  </label>
                )}

                {exp.approval_status === 'Afventer' && (
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setRejectTarget(exp)}>
                      <XCircle className="w-4 h-4" /> Afvis
                    </Button>
                    <Button size="sm" onClick={() => approve(exp)}>
                      <CheckCircle2 className="w-4 h-4" /> Godkend
                    </Button>
                  </div>
                )}
                {exp.approval_status === 'Godkendt' && (
                  <Button size="sm" className="ml-auto" onClick={() => bookkeep(exp)}>
                    <FileText className="w-4 h-4" /> Bogfør
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-1">Afvis udgift</h2>
            <p className="text-sm text-slate-500 mb-4">{rejectTarget.title} — {formatDKK(rejectTarget.amount)}</p>
            <Label>Afvisningsgrund</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Begrund afvisningen…" className="mt-1" />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Annuller</Button>
              <Button variant="destructive" onClick={confirmReject}>Afvis udgift</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}