import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Image as Img } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Trash2, Upload, Images } from 'lucide-react';

const PHASES = [
  { key: 'all', label: 'Alle' },
  { key: 'Start', label: 'Før' },
  { key: 'Igangværende', label: 'Igangværende' },
  { key: 'Afsluttet', label: 'Efter' },
];

const PHASE_BADGE = {
  Start: 'bg-amber-100 text-amber-700',
  Igangværende: 'bg-blue-100 text-blue-700',
  Afsluttet: 'bg-emerald-100 text-emerald-700',
};

export default function ProjektGalleri() {
  const [images, setImages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ project_id: '', phase: 'Igangværende', caption: '' });
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [imgs, p] = await Promise.all([
        base44.entities.ProjectImage.list('-upload_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setImages(imgs);
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

  const filtered = images.filter((img) => {
    if (filterProject !== 'all' && img.project_id !== filterProject) return false;
    if (filterPhase !== 'all' && img.phase !== filterPhase) return false;
    return true;
  });

  const openUpload = () => {
    setForm({ project_id: filterProject !== 'all' ? filterProject : '', phase: filterPhase !== 'all' ? filterPhase : 'Igangværende', caption: '' });
    setDialogOpen(true);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !form.project_id) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const project = projects.find((p) => p.id === form.project_id);
      await base44.entities.ProjectImage.create({
        project_id: project.id,
        project_name: project.name,
        customer_email: project.customer_email || '',
        image_url: file_url,
        caption: form.caption || '',
        phase: form.phase,
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

  const remove = async (id) => {
    if (!confirm('Slet dette billede?')) return;
    await base44.entities.ProjectImage.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projekt Galleri</h1>
          <p className="text-slate-500 mt-1">Organisér før-, status- og efterbilleder per projekt</p>
        </div>
        <Button onClick={openUpload} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Upload billede
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Projekt" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PHASES.map((ph) => (
            <button
              key={ph.key}
              onClick={() => setFilterPhase(ph.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterPhase === ph.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {ph.label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-slate-500">{filtered.length} billeder</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Images className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen billeder fundet. Upload det første billede.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((img) => (
            <div key={img.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden">
              <Img src={img.image_url} className="w-full h-40" fittingType="fill" />
              <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PHASE_BADGE[img.phase] || 'bg-slate-100 text-slate-500'}`}>
                    {PHASES.find((p) => p.key === img.phase)?.label || img.phase}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(img.upload_date)}</span>
                </div>
                <div className="text-sm font-medium text-slate-900 truncate">{img.project_name || '—'}</div>
                {img.caption && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{img.caption}</div>}
              </div>
              <button
                onClick={() => remove(img.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload billede</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Projekt *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fase</Label>
              <Select value={form.phase} onValueChange={(v) => setForm({ ...form, phase: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Start">Før (start)</SelectItem>
                  <SelectItem value="Igangværende">Igangværende (status)</SelectItem>
                  <SelectItem value="Afsluttet">Efter (afsluttet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Billedtekst</Label>
              <Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Beskrivelse af billedet" />
            </div>
            <div className="space-y-1.5">
              <Label>Billede *</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={handleUpload} disabled={uploading || !form.project_id}>
              <Upload className="w-4 h-4 mr-1.5" /> {uploading ? 'Uploader...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}