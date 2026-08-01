import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Trash2, Upload, Download, FolderOpen, FileText, File, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

const TYPES = ['Kontrakt', 'Tegning', 'Sikkerhedsvejledning', 'Tilbud', 'Faktura', 'Rapport', 'Andet'];

const TYPE_ICON = {
  Kontrakt: FileText,
  Tegning: File,
  Sikkerhedsvejledning: File,
  Tilbud: FileText,
  Faktura: FileText,
  Rapport: FileText,
  Andet: File,
};

const TYPE_BADGE = {
  Kontrakt: 'bg-blue-100 text-blue-700',
  Tegning: 'bg-purple-100 text-purple-700',
  Sikkerhedsvejledning: 'bg-amber-100 text-amber-700',
  Tilbud: 'bg-slate-100 text-slate-600',
  Faktura: 'bg-emerald-100 text-emerald-700',
  Rapport: 'bg-cyan-100 text-cyan-700',
  Andet: 'bg-slate-100 text-slate-500',
};

export default function Dokumentarkiv() {
  const [docs, setDocs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ project_id: '', title: '', type: 'Andet', description: '' });
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([
        base44.entities.ProjectDocument.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setDocs(d);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = docs.filter((d) => filterType === 'all' || d.type === filterType);

  // Group by project
  const grouped = {};
  filtered.forEach((d) => {
    const key = d.project_id || 'unassigned';
    if (!grouped[key]) grouped[key] = { project_name: d.project_name || 'Uden projekt', docs: [] };
    grouped[key].docs.push(d);
  });

  const toggle = (key) => setExpanded({ ...expanded, [key]: !expanded[key] });

  const openUpload = (projectId = '') => {
    setForm({ project_id: projectId, title: '', type: 'Andet', description: '' });
    setDialogOpen(true);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !form.title) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const project = projects.find((p) => p.id === form.project_id);
      await base44.entities.ProjectDocument.create({
        project_id: project?.id || '',
        project_name: project?.name || '',
        customer_email: project?.customer_email || '',
        title: form.title,
        type: form.type,
        file_url,
        description: form.description || '',
        upload_date: new Date().toISOString().slice(0, 10),
      });
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const download = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_url });
      window.open(signed_url, '_blank');
    } catch {
      window.open(doc.file_url, '_blank');
    }
  };

  const remove = async (id) => {
    if (!confirm('Slet dette dokument?')) return;
    await base44.entities.ProjectDocument.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dokumentarkiv</h1>
          <p className="text-slate-500 mt-1">Tegninger, kontrakter og dokumenter organiseret pr. projekt</p>
        </div>
        <Button onClick={() => openUpload()} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Upload dokument
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">{filtered.length} dokumenter i {Object.keys(grouped).length} projekter</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen dokumenter fundet. Upload det første dokument.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {expanded[key] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-slate-900 flex-1 text-left">{group.project_name}</span>
                <span className="text-sm text-slate-400">{group.docs.length} dokumenter</span>
                <Plus
                  className="w-4 h-4 text-slate-400 hover:text-slate-900"
                  onClick={(e) => { e.stopPropagation(); openUpload(key === 'unassigned' ? '' : key); }}
                />
              </button>
              {expanded[key] && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {group.docs.map((doc) => {
                    const Icon = TYPE_ICON[doc.type] || File;
                    return (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_BADGE[doc.type] || 'bg-slate-100 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{doc.title}</div>
                          {doc.description && <p className="text-xs text-slate-500 truncate">{doc.description}</p>}
                        </div>
                        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[doc.type] || 'bg-slate-100 text-slate-500'}`}>
                          {doc.type}
                        </span>
                        <span className="text-xs text-slate-400 hidden md:block">{formatDate(doc.upload_date)}</span>
                        <Button variant="ghost" size="sm" onClick={() => download(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(doc.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload dokument</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="F.eks. Kontrakt - Kloakrenovering" />
            </div>
            <div className="space-y-1.5">
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dokumenttype</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Fil *</Label>
              <input
                ref={fileRef}
                type="file"
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={handleUpload} disabled={uploading || !form.title}>
              <Upload className="w-4 h-4 mr-1.5" /> {uploading ? 'Uploader...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}