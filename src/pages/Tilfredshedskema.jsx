import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, Heart, ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/format';

const empty = {
  project_id: '',
  project_name: '',
  overall_rating: 0,
  quality_rating: 0,
  communication_rating: 0,
  punctuality_rating: 0,
  would_recommend: true,
  comment: '',
};

function Stars({ value, onChange, size = 'w-7 h-7' }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)} className="transition-transform hover:scale-110">
          <Star className={`${size} ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function Tilfredshedskema() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [projs, fb] = await Promise.all([
          base44.entities.Project.list('-updated_date', 100),
          base44.entities.CustomerFeedback.list('-created_date', 100),
        ]);
        setProjects(projs || []);
        setFeedbacks(fb || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const finishedProjects = projects.filter((p) => p.status === 'Færdig' || p.status === 'Afsluttet');
  const feedbackByProject = {};
  feedbacks.forEach((f) => {
    if (f.project_id) feedbackByProject[f.project_id] = f;
  });

  const set = (field, value) => setForm((s) => ({ ...s, [field]: value }));

  const openForm = (project) => {
    setForm({ ...empty, project_id: project.id, project_name: project.name });
    setSubmitted(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.overall_rating) {
      alert('Vælg venligst en samlet karakter');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        customer_name: user?.full_name || user?.email || '',
        customer_email: user?.email || '',
        date: new Date().toISOString().split('T')[0],
        status: 'Modtaget',
      };
      const created = await base44.entities.CustomerFeedback.create(payload);
      setFeedbacks((prev) => [created, ...prev]);
      setSubmitted(form.project_name);
      setForm(empty);
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert('Der opstod en fejl ved indsendelse');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center">
          <Heart className="w-6 h-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Tilfredhedskema</h1>
          <p className="text-slate-500 mt-0.5">Fortæl os om din oplevelse efter et afsluttet projekt — vi sætter stor pris på din tilbagemelding</p>
        </div>
      </div>

      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-semibold text-emerald-900">Tak for din feedback til "{submitted}"!</div>
            <div className="text-sm text-emerald-700">Din tilbagemelding hjælper os med at forbedre vores arbejde.</div>
          </div>
        </div>
      )}

      {finishedProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Du har ingen afsluttede projekter klar til feedback endnu.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {finishedProjects.map((p) => {
            const fb = feedbackByProject[p.id];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                    {p.address && <div className="text-xs text-slate-500 truncate">{p.address}</div>}
                  </div>
                  {fb ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Givet
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full flex-shrink-0">
                      Afventer
                    </span>
                  )}
                </div>

                {fb ? (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-4 h-4 ${n <= (Number(fb.overall_rating) || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-xs text-slate-400 ml-1.5">{formatDate(fb.date)}</span>
                    </div>
                    {fb.comment && <p className="text-sm text-slate-600 italic">"{fb.comment}"</p>}
                    {fb.would_recommend && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2">
                        <ThumbsUp className="w-3.5 h-3.5" /> Anbefaler os
                      </div>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => openForm(p)} variant="outline" className="mt-4 w-full">
                    <MessageSquare className="w-4 h-4" /> Giv feedback
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feedback for "{form.project_name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="block mb-2">Samlet karakter</Label>
              <Stars value={Number(form.overall_rating) || 0} onChange={(v) => set('overall_rating', v)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[['Kvalitet', 'quality_rating'], ['Kommunikation', 'communication_rating'], ['Punktualitet', 'punctuality_rating']].map(([label, field]) => (
                <div key={field}>
                  <Label className="text-xs block mb-1.5">{label}</Label>
                  <Stars value={Number(form[field]) || 0} onChange={(v) => set(field, v)} size="w-5 h-5" />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.would_recommend}
                onChange={(e) => set('would_recommend', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-slate-700">Jeg vil anbefale Juhl & Damsgaard til andre</span>
            </label>
            <div>
              <Label className="block mb-1.5">Kommentar</Label>
              <Textarea
                value={form.comment}
                onChange={(e) => set('comment', e.target.value)}
                rows={4}
                placeholder="Fortæl om din oplevelse med projektet, arbejdsudførelse, samarbejde m.m."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={submit} disabled={saving || !form.overall_rating}>
              {saving ? 'Sender...' : 'Indsend feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}