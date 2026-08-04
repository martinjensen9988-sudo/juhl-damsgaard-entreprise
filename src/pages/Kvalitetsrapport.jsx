import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileCheck, FileDown, Loader2, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateQualityReportPDF } from '@/lib/qualityReportPdf';

export default function Kvalitetsrapport() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState({ checks: [], images: [], documents: [] });

  useEffect(() => { (async () => { setProjects((await base44.entities.Project.list().catch(() => [])) || []); })(); }, []);

  useEffect(() => {
    if (!projectId) { setPreview({ checks: [], images: [], documents: [] }); return; }
    (async () => {
      const p = projects.find((x) => x.id === projectId);
      const [checks, images, docs] = await Promise.all([
        base44.entities.QualityCheck.filter({ project_id: projectId }).catch(() => []),
        base44.entities.ProjectImage.filter({ project_id: projectId }).catch(() => []),
        base44.entities.ProjectDocument.filter({ project_id: projectId }).catch(() => []),
      ]);
      setPreview({ checks: checks || [], images: images || [], documents: (docs || []).filter((d) => ['Kontrakt', 'Tegning', 'Rapport', 'Andet'].includes(d.type)) });
    })();
  }, [projectId, projects]);

  const project = projects.find((p) => p.id === projectId);
  const totalItems = preview.checks.reduce((s, c) => s + (c.items?.length || 0), 0);
  const passed = preview.checks.reduce((s, c) => s + (c.items || []).filter((i) => i.checked).length, 0);

  const generate = async () => {
    if (!project) return;
    setGenerating(true);
    try {
      const company = (await base44.entities.CompanySettings.list().catch(() => []))?.[0] || {};
      await generateQualityReportPDF({ project, checks: preview.checks, images: preview.images, documents: preview.documents, company });
    } catch (e) { alert('Kunne ikke generere rapport: ' + e.message); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><FileCheck className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kvalitetsstyringsrapport</h1>
          <p className="text-slate-500">Samler kvalitetschecks, billeder og dokumentation til en professionel afleveringsrapport (PDF)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-slate-500">Vælg projekt</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Vælg projekt..." /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={!project || generating} className="bg-slate-950">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? 'Genererer...' : 'Generer PDF'}
          </Button>
        </div>

        {project && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <Stat label="Kvalitetschecks" value={preview.checks.length} />
            <Stat label="Tjekpunkter" value={totalItems} />
            <Stat label="Godkendt" value={passed} tone="emerald" />
            <Stat label="Billeder" value={preview.images.length} tone="amber" />
          </div>
        )}
      </div>

      {project && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold mb-3">Kvalitetschecks ({preview.checks.length})</h2>
            {preview.checks.length === 0 ? <p className="text-slate-400 text-sm">Ingen checks fundet.</p> : (
              <div className="space-y-3">
                {preview.checks.map((c) => (
                  <div key={c.id} className="border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between"><span className="font-medium text-sm">{c.title}</span><span className={`px-2 py-0.5 rounded-full text-[11px] ${c.status === 'Godkendt' ? 'bg-emerald-100 text-emerald-700' : c.status === 'Afvigelse' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{c.status}</span></div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.type} · {c.check_date || ''}</div>
                    {(c.items || []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.items.map((it, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs">
                            {it.checked ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5" />}
                            <span className="text-slate-600">{it.description}{it.notes ? ` · ${it.notes}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold mb-3">Billeder ({preview.images.length})</h2>
            {preview.images.length === 0 ? <div className="text-slate-400 text-sm flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Ingen billeder.</div> : (
              <div className="grid grid-cols-2 gap-2">
                {preview.images.map((im) => (
                  <div key={im.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={im.image_url} alt={im.caption || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {preview.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="font-medium text-sm mb-2">Dokumenter ({preview.documents.length})</h3>
                <div className="space-y-1">{preview.documents.map((d) => <div key={d.id} className="text-sm text-slate-600 flex justify-between"><span>{d.type}: {d.title}</span><span className="text-slate-400 text-xs">{d.upload_date || ''}</span></div>)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const tones = { emerald: 'text-emerald-700', amber: 'text-amber-700', slate: 'text-slate-900' };
  return <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500">{label}</div><div className={`text-xl font-bold ${tones[tone] || tones.slate}`}>{value}</div></div>;
}