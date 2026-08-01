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
import { Plus, Trash2, Upload, Download, FileText, Archive, File } from 'lucide-react';

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

export default function Dokumenter() {
  const [docs, setDocs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ project_id: '', title: '', type: 'Andet', description: '' });
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([
        base44.entities.ProjectDocument.list('-created_date', 200),
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

  const filtered = docs.filter((d) => {
    if (filterProject !== 'all' && d.project_id !== filterProject) return false;
    if (filterType !== 'all' && d.type !== filterType) return false;
    return true;
  });

  const openUpload = () => {
    setForm({ project_id: filterProject !== 'all' ? filterProject : '', title: '', type: 'Andet', description: '' });
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
          <p className="text-slate-500 mt-1">Kontrakter, tegninger og sikkerhedsvejledninger per projekt</p>
        </div>
        <Button onClick={openUpload} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Upload dokument
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Projekt" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">{filtered.length} dokumenter</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen dokumenter fundet. Upload det første dokument.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const Icon = TYPE_ICON[doc.type] || File;
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_BADGE[doc.type] || 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[doc.type] || 'bg-slate-100 text-slate-500'}`}>
                    {doc.type}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 mb-1 truncate">{doc.title}</div>
                <div className="text-xs text-slate-500 mb-2">{doc.project_name || '—'}</div>
                {doc.description && <p className="text-sm text-slate-600 line-clamp-2 mb-2">{doc.description}</p>}
                <div className="text-xs text-slate-400 mb-3">{formatDate(doc.upload_date)}</div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => download(doc)} className="flex-1">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Vis
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(doc.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
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