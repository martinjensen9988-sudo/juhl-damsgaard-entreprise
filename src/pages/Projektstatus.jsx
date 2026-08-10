import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Image as Img } from '@/components/ui/image';
import { formatDKK, formatDate } from '@/lib/format';
import { Camera, Upload, Trash2, MapPin } from 'lucide-react';

const COLUMNS = [
  { key: 'Planlægning', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  { key: 'I gang', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { key: 'Afsluttet', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  { key: 'På hold', color: 'bg-slate-200 text-slate-600', border: 'border-slate-300' },
];

function calcProgress(start, end) {
  if (!start || !end) return 0;
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return 0;
  if (now > e) return 100;
  const total = e - s;
  const elapsed = now - s;
  return Math.round((elapsed / total) * 100);
}

export default function Projektstatus() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Project.list('-created_date', 200);
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openProject = async (project) => {
    setSelected(project);
    setLoadingImages(true);
    try {
      const imgs = await base44.entities.ProjectImage.filter({ project_id: project.id }, '-upload_date', 50);
      setImages(imgs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ProjectImage.create({
        project_id: selected.id,
        project_name: selected.name,
        customer_email: selected.customer_email || '',
        image_url: file_url,
        caption: caption || '',
        phase: selected.status === 'Afsluttet' ? 'Afsluttet' : 'Igangværende',
        upload_date: new Date().toISOString().slice(0, 10),
      });
      setCaption('');
      const imgs = await base44.entities.ProjectImage.filter({ project_id: selected.id }, '-upload_date', 50);
      setImages(imgs);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteImage = async (id) => {
    if (!confirm('Slet dette billede?')) return;
    await base44.entities.ProjectImage.delete(id);
    setImages(images.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektstatus</h1>
        <p className="text-slate-500 mt-1">Visuelt overblik over alle aktive projekter</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.key);
          return (
            <div key={col.key} className={`rounded-xl border-2 ${col.border} bg-white overflow-hidden`}>
              <div className={`px-4 py-3 ${col.color} font-semibold text-sm flex items-center justify-between`}>
                {col.key}
                <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs">{colProjects.length}</span>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {colProjects.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Ingen projekter</p>
                )}
                {colProjects.map((p) => {
                  const progress = calcProgress(p.start_date, p.end_date);
                  return (
                    <div
                      key={p.id}
                      onClick={() => openProject(p)}
                      className="bg-slate-50 hover:bg-slate-100 rounded-lg p-3 cursor-pointer border border-slate-200 transition-colors"
                    >
                      <div className="font-medium text-slate-900 text-sm mb-1">{p.name}</div>
                      <div className="text-xs text-slate-500 mb-2">{p.customer_name || '—'}</div>
                      {(p.start_date || p.end_date) && (
                        <>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>{formatDate(p.start_date)}</span>
                            <span>{formatDate(p.end_date)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="text-xs text-slate-400 mt-1 text-center">{progress}%</div>
                        </>
                      )}
                      {p.budget != null && (
                        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                          Budget: <span className="font-medium">{formatDKK(p.budget)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project detail dialog with images */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Kunde:</span>{' '}
                    <span className="font-medium text-slate-900">{selected.customer_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>{' '}
                    <span className="font-medium text-slate-900">{selected.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Periode:</span>{' '}
                    <span className="font-medium text-slate-900">{formatDate(selected.start_date)} → {formatDate(selected.end_date)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Budget:</span>{' '}
                    <span className="font-medium text-slate-900">{formatDKK(selected.budget)}</span>
                  </div>
                  {selected.address && (
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selected.address}
                    </div>
                  )}
                </div>
                {selected.description && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selected.description}</p>
                )}

                {/* Image gallery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Fremskridtsbilleder ({images.length})
                    </h3>
                  </div>

                  {/* Upload area */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <Input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Billedtekst (valgfrit)"
                    />
                    <div className="flex items-center gap-2">
                      <label className={`flex items-center gap-1.5 cursor-pointer text-sm px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploader...' : 'Vælg billede'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  {loadingImages ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
                    </div>
                  ) : images.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Ingen billeder endnu. Upload det første her.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((img) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-200">
                          <Img src={img.image_url} className="w-full h-32" fittingType="fill" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5">
                            {img.caption || formatDate(img.upload_date)}
                          </div>
                          <button
                            onClick={() => deleteImage(img.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}