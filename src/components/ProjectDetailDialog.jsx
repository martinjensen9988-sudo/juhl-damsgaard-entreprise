import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, formatDKK } from '@/lib/format';
import { Upload, Trash2, Image as ImageIcon, Calendar, MapPin, X } from 'lucide-react';

const STATUSES = ['Planlægning', 'I gang', 'Afsluttet', 'På hold'];
const STATUS_BADGE = {
  Planlægning: 'bg-amber-100 text-amber-700',
  'I gang': 'bg-blue-100 text-blue-700',
  Afsluttet: 'bg-emerald-100 text-emerald-700',
  'På hold': 'bg-slate-200 text-slate-600',
};

const PHOTO_PHASES = ['Start', 'Igangværende', 'Afsluttet'];
const PHASE_STYLE = {
  Start: 'bg-amber-100 text-amber-700',
  Igangværende: 'bg-blue-100 text-blue-700',
  Afsluttet: 'bg-emerald-100 text-emerald-700',
};

export default function ProjectDetailDialog({ project, onClose, onUpdated }) {
  const [status, setStatus] = useState(project?.status || 'Planlægning');
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('Igangværende');
  const [caption, setCaption] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadImages = async () => {
    if (!project) return;
    setLoadingImages(true);
    try {
      const imgs = await base44.entities.ProjectImage.filter({ project_id: project.id });
      setImages(imgs || []);
    } catch (e) { console.error(e); }
    finally { setLoadingImages(false); }
  };

  useEffect(() => {
    if (project) { setStatus(project.status); loadImages(); }
  }, [project?.id]);

  if (!project) return null;

  const changeStatus = async (newStatus) => {
    setStatus(newStatus);
    setSavingStatus(true);
    try {
      await base44.entities.Project.update(project.id, { status: newStatus });
      onUpdated?.();
    } catch (e) { console.error(e); }
    finally { setSavingStatus(false); }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ProjectImage.create({
        project_id: project.id,
        project_name: project.name,
        customer_email: project.customer_email || '',
        image_url: file_url,
        caption: caption || '',
        phase: uploadPhase,
        upload_date: new Date().toISOString().slice(0, 10),
      });
      setCaption('');
      loadImages();
    } catch (err) { console.error(err); alert('Upload fejlede'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const removeImage = async (img) => {
    if (!confirm('Slet billede?')) return;
    try { await base44.entities.ProjectImage.delete(img.id); loadImages(); } catch (e) {}
  };

  const photosByPhase = (phase) => images.filter((i) => i.phase === phase);

  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {project.name}
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-slate-100'}`}>
              {status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-slate-600"><span className="text-slate-400">Kunde:</span> {project.customer_name || '—'}</div>
            <div className="text-slate-600"><span className="text-slate-400">Type:</span> {project.type || '—'}</div>
            {project.start_date && <div className="flex items-center gap-1.5 text-slate-600"><Calendar className="w-3.5 h-3.5" /> {formatDate(project.start_date)}{project.end_date ? ` → ${formatDate(project.end_date)}` : ''}</div>}
            {project.address && <div className="flex items-center gap-1.5 text-slate-600 col-span-2"><MapPin className="w-3.5 h-3.5" /> {project.address}</div>}
            {project.budget != null && <div className="text-slate-600 col-span-2"><span className="text-slate-400">Budget:</span> {formatDKK(project.budget)}</div>}
          </div>

          {project.description && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{project.description}</p>}

          <div>
            <Label className="text-sm font-semibold">Fase / Status</Label>
            <p className="text-xs text-slate-500 mb-2">Skift projektets fase for at dokumentere fremdragt.</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={savingStatus}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${status === s ? STATUS_BADGE[s] + ' ring-2 ring-offset-1 ring-slate-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <Label className="text-sm font-semibold">Fremdriftsbilleder (pr. fase)</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 mt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Fase</Label>
                  <Select value={uploadPhase} onValueChange={setUploadPhase}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{PHOTO_PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Billedtekst (valgfri)</Label>
                  <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="F.eks. Udgravning færdig" className="h-9" />
                </div>
              </div>
              <label className={`flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-lg py-3 text-sm cursor-pointer hover:bg-slate-100 ${uploading ? 'opacity-60' : ''}`}>
                <Upload className="w-4 h-4" /> {uploading ? 'Uploader...' : `Upload billede til fase "${uploadPhase}"`}
                <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploading} />
              </label>
            </div>

            {loadingImages ? (
              <div className="text-center py-6 text-sm text-slate-400">Indlæser billeder...</div>
            ) : images.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400 flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-300" />
                Ingen fremdriftsbilleder endnu
              </div>
            ) : (
              <div className="space-y-4 mt-3">
                {PHOTO_PHASES.map((phase) => {
                  const photos = photosByPhase(phase);
                  if (photos.length === 0) return null;
                  return (
                    <div key={phase}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_STYLE[phase]}`}>{phase}</span>
                        <span className="text-xs text-slate-400">{photos.length} billede{photos.length > 1 ? 'r' : ''}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {photos.map((img) => (
                          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-200">
                            <img src={img.image_url} alt={img.caption || ''} className="w-full h-28 object-cover" />
                            {img.caption && <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{img.caption}</div>}
                            <div className="absolute top-0 inset-x-0 flex justify-between p-1">
                              <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">{formatDate(img.upload_date)}</span>
                              <button onClick={() => removeImage(img)} className="bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-1.5" /> Luk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}