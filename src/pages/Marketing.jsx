import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Megaphone, Mail, Send, Eye, MousePointerClick, Calendar } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const campaignChannels = ['Facebook', 'Google Ads', 'Instagram', 'LinkedIn', 'Lokal avis', 'Hjemmeside', 'Flyer', 'Andet'];
const campaignStatuses = ['Planlagt', 'Aktiv', 'Afsluttet'];
const campaignStatusColor = { Planlagt: 'bg-slate-100 text-slate-600', Aktiv: 'bg-emerald-100 text-emerald-700', Afsluttet: 'bg-slate-200 text-slate-600' };
const channelColor = { Facebook: 'bg-blue-100 text-blue-700', 'Google Ads': 'bg-red-100 text-red-700', Instagram: 'bg-pink-100 text-pink-700', LinkedIn: 'bg-sky-100 text-sky-700' };

const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'Google My Business', 'Hjemmeside', 'Andet'];
const postTypes = ['Opslag', 'Reklame', 'Event', 'Kunde-reference', 'Kampagneindlæg', 'Andet'];
const postStatuses = ['Idé', 'Kladde', 'Planlagt', 'Offentliggjort', 'Afvist'];
const postStatusColor = { Idé: 'bg-amber-100 text-amber-700', Kladde: 'bg-slate-100 text-slate-600', Planlagt: 'bg-blue-100 text-blue-700', Offentliggjort: 'bg-emerald-100 text-emerald-700', Afvist: 'bg-red-100 text-red-700' };

const audiences = ['Alle kunder', 'Erhverv', 'Private', 'Foreninger', 'Nyhedsbrev-abonnenter', 'Specifik segment', 'Andet'];
const nlStatuses = ['Kladde', 'Planlagt', 'Sendt', 'Afvist'];
const nlStatusColor = { Kladde: 'bg-slate-100 text-slate-600', Planlagt: 'bg-blue-100 text-blue-700', Sendt: 'bg-emerald-100 text-emerald-700', Afvist: 'bg-red-100 text-red-700' };

const emptyCampaign = { name: '', channel: 'Facebook', start_date: '', end_date: '', budget: '', status: 'Aktiv', inquiries: 0, quotes_sent: 0, won: 0, notes: '' };
const emptyPost = { title: '', platform: 'Facebook', post_type: 'Opslag', content: '', image_url: '', planned_date: '', status: 'Kladde', campaign_name: '', assigned_to: '', reach: 0, engagement: 0, notes: '' };
const emptyNewsletter = { title: '', audience: 'Alle kunder', content: '', planned_date: '', status: 'Kladde', recipients_count: 0, opened: 0, clicked: 0, assigned_to: '', campaign_name: '', notes: '' };

function StatCards({ items }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(([l, v, c, icon]) => (
        <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-slate-500">{l}</div>
            {icon}
          </div>
          <div className={`text-2xl font-bold ${c}`}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export default function Marketing() {
  const [tab, setTab] = useState('kampagner');

  // Kampagner
  const [campaigns, setCampaigns] = useState([]);
  const [campLoading, setCampLoading] = useState(true);
  const [campOpen, setCampOpen] = useState(false);
  const [campEdit, setCampEdit] = useState(null);
  const [campForm, setCampForm] = useState(emptyCampaign);
  const [campSaving, setCampSaving] = useState(false);

  // Opslag
  const [posts, setPosts] = useState([]);
  const [postLoading, setPostLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [postEdit, setPostEdit] = useState(null);
  const [postForm, setPostForm] = useState(emptyPost);
  const [postSaving, setPostSaving] = useState(false);

  // Nyhedsbreve
  const [newsletters, setNewsletters] = useState([]);
  const [nlLoading, setNlLoading] = useState(true);
  const [nlOpen, setNlOpen] = useState(false);
  const [nlEdit, setNlEdit] = useState(null);
  const [nlForm, setNlForm] = useState(emptyNewsletter);
  const [nlSaving, setNlSaving] = useState(false);

  const loadCampaigns = async () => { setCampLoading(true); try { const c = await base44.entities.Campaign.list(); setCampaigns(c || []); } catch (e) { console.error(e); } setCampLoading(false); };
  const loadPosts = async () => { setPostLoading(true); try { const c = await base44.entities.MarketingPost.list('-planned_date'); setPosts(c || []); } catch (e) { console.error(e); } setPostLoading(false); };
  const loadNewsletters = async () => { setNlLoading(true); try { const c = await base44.entities.Newsletter.list('-planned_date'); setNewsletters(c || []); } catch (e) { console.error(e); } setNlLoading(false); };

  useEffect(() => { loadCampaigns(); loadPosts(); loadNewsletters(); }, []);

  // --- Kampagner handlers ---
  const setCamp = (f, v) => setCampForm((s) => ({ ...s, [f]: v }));
  const openCampCreate = () => { setCampEdit(null); setCampForm({ ...emptyCampaign, start_date: new Date().toISOString().split('T')[0] }); setCampOpen(true); };
  const openCampEdit = (c) => { setCampEdit(c); setCampForm({ ...emptyCampaign, ...c }); setCampOpen(true); };
  const saveCamp = async () => { if (!campForm.name) return alert('Angiv navn'); setCampSaving(true); try { campEdit ? await base44.entities.Campaign.update(campEdit.id, campForm) : await base44.entities.Campaign.create(campForm); setCampOpen(false); loadCampaigns(); } catch (e) { console.error(e); alert('Fejl'); } setCampSaving(false); };
  const removeCamp = async (c) => { if (!confirm('Slet kampagne?')) return; try { await base44.entities.Campaign.delete(c.id); loadCampaigns(); } catch (e) {} };
  const cpl = (c) => { const inq = Number(c.inquiries) || 0; const b = Number(c.budget) || 0; return inq > 0 ? b / inq : null; };

  // --- Opslag handlers ---
  const setPost = (f, v) => setPostForm((s) => ({ ...s, [f]: v }));
  const openPostCreate = () => { setPostEdit(null); setPostForm({ ...emptyPost, planned_date: new Date().toISOString().split('T')[0] }); setPostOpen(true); };
  const openPostEdit = (p) => { setPostEdit(p); setPostForm({ ...emptyPost, ...p }); setPostOpen(true); };
  const savePost = async () => { if (!postForm.title) return alert('Angiv overskrift'); setPostSaving(true); try { postEdit ? await base44.entities.MarketingPost.update(postEdit.id, postForm) : await base44.entities.MarketingPost.create(postForm); setPostOpen(false); loadPosts(); } catch (e) { console.error(e); alert('Fejl'); } setPostSaving(false); };
  const removePost = async (p) => { if (!confirm('Slet opslag?')) return; try { await base44.entities.MarketingPost.delete(p.id); loadPosts(); } catch (e) {} };

  // --- Nyhedsbrev handlers ---
  const setNl = (f, v) => setNlForm((s) => ({ ...s, [f]: v }));
  const openNlCreate = () => { setNlEdit(null); setNlForm({ ...emptyNewsletter, planned_date: new Date().toISOString().split('T')[0] }); setNlOpen(true); };
  const openNlEdit = (n) => { setNlEdit(n); setNlForm({ ...emptyNewsletter, ...n }); setNlOpen(true); };
  const saveNl = async () => { if (!nlForm.title) return alert('Angiv emne'); setNlSaving(true); try { nlEdit ? await base44.entities.Newsletter.update(nlEdit.id, nlForm) : await base44.entities.Newsletter.create(nlForm); setNlOpen(false); loadNewsletters(); } catch (e) { console.error(e); alert('Fejl'); } setNlSaving(false); };
  const removeNl = async (n) => { if (!confirm('Slet nyhedsbrev?')) return; try { await base44.entities.Newsletter.delete(n.id); loadNewsletters(); } catch (e) {} };

  const campStats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'Aktiv').length,
    budget: campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0),
    won: campaigns.reduce((s, c) => s + (Number(c.won) || 0), 0),
  }), [campaigns]);

  const postStats = useMemo(() => ({
    total: posts.length,
    scheduled: posts.filter((p) => p.status === 'Planlagt').length,
    published: posts.filter((p) => p.status === 'Offentliggjort').length,
    reach: posts.reduce((s, p) => s + (Number(p.reach) || 0), 0),
  }), [posts]);

  const nlStats = useMemo(() => ({
    total: newsletters.length,
    scheduled: newsletters.filter((n) => n.status === 'Planlagt').length,
    sent: newsletters.filter((n) => n.status === 'Sendt').length,
    recipients: newsletters.reduce((s, n) => s + (Number(n.recipients_count) || 0), 0),
  }), [newsletters]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Megaphone className="w-5 h-5 text-purple-600" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Marketing</h1>
          <p className="text-slate-500 mt-0.5">Planlæg og administrer reklamekampagner, opslag og kundenyhedsbreve</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="kampagner">Kampagner</TabsTrigger>
          <TabsTrigger value="opslag">Opslag</TabsTrigger>
          <TabsTrigger value="nyhedsbreve">Nyhedsbreve</TabsTrigger>
        </TabsList>

        {/* KAMPAGNER */}
        <TabsContent value="kampagner" className="space-y-5 mt-5">
          <div className="flex justify-end">
            <Button onClick={openCampCreate}><Plus className="w-4 h-4" /> Ny kampagne</Button>
          </div>
          <StatCards items={[
            ['Kampagner', campStats.total, 'text-slate-900', <Megaphone className="w-4 h-4 text-slate-400" />],
            ['Aktive', campStats.active, 'text-emerald-600', <Megaphone className="w-4 h-4 text-emerald-400" />],
            ['Total budget', formatDKK(campStats.budget), 'text-purple-600', <Megaphone className="w-4 h-4 text-purple-400" />],
            ['Vundet', campStats.won, 'text-amber-600', <Megaphone className="w-4 h-4 text-amber-400" />],
          ]} />
          {campLoading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : campaigns.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen kampagner endnu</p></div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3 font-medium">Kampagne</th>
                  <th className="text-left px-4 py-3 font-medium">Kanal</th>
                  <th className="text-left px-4 py-3 font-medium">Periode</th>
                  <th className="text-right px-4 py-3 font-medium">Budget</th>
                  <th className="text-right px-4 py-3 font-medium">Henv.</th>
                  <th className="text-right px-4 py-3 font-medium">Tilbud</th>
                  <th className="text-right px-4 py-3 font-medium">Vundet</th>
                  <th className="text-right px-4 py-3 font-medium">CPL</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => {
                    const cost = cpl(c);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${channelColor[c.channel] || 'bg-slate-100 text-slate-600'}`}>{c.channel}</span></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(c.start_date)} – {formatDate(c.end_date)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatDKK(c.budget)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{c.inquiries || 0}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{c.quotes_sent || 0}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">{c.won || 0}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-600">{cost != null ? formatDKK(cost) : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${campaignStatusColor[c.status]}`}>{c.status}</span></td>
                        <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openCampEdit(c)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => removeCamp(c)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* OPSLAG */}
        <TabsContent value="opslag" className="space-y-5 mt-5">
          <div className="flex justify-end">
            <Button onClick={openPostCreate}><Plus className="w-4 h-4" /> Nyt opslag</Button>
          </div>
          <StatCards items={[
            ['Opslag', postStats.total, 'text-slate-900', <Megaphone className="w-4 h-4 text-slate-400" />],
            ['Planlagt', postStats.scheduled, 'text-blue-600', <Calendar className="w-4 h-4 text-blue-400" />],
            ['Offentliggjort', postStats.published, 'text-emerald-600', <Megaphone className="w-4 h-4 text-emerald-400" />],
            ['Rækkevidde', postStats.reach, 'text-purple-600', <Eye className="w-4 h-4 text-purple-400" />],
          ]} />
          {postLoading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen opslag endnu</p></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${channelColor[p.platform] || 'bg-slate-100 text-slate-600'}`}>{p.platform}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${postStatusColor[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{p.title}</h3>
                  <span className="text-xs text-slate-400 mb-2">{p.post_type} · {formatDate(p.planned_date)}</span>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">{p.content || '—'}</p>
                  {p.campaign_name && <div className="text-xs text-slate-500 mt-3">Kampagne: {p.campaign_name}</div>}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {p.reach || 0}</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" /> {p.engagement || 0}</span>
                  </div>
                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => openPostEdit(p)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => removePost(p)} className="text-red-400 hover:text-red-600 ml-auto"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* NYHEDSBREVE */}
        <TabsContent value="nyhedsbreve" className="space-y-5 mt-5">
          <div className="flex justify-end">
            <Button onClick={openNlCreate}><Plus className="w-4 h-4" /> Nyt nyhedsbrev</Button>
          </div>
          <StatCards items={[
            ['Nyhedsbreve', nlStats.total, 'text-slate-900', <Mail className="w-4 h-4 text-slate-400" />],
            ['Planlagt', nlStats.scheduled, 'text-blue-600', <Calendar className="w-4 h-4 text-blue-400" />],
            ['Sendt', nlStats.sent, 'text-emerald-600', <Send className="w-4 h-4 text-emerald-400" />],
            ['Modtagere', nlStats.recipients, 'text-purple-600', <Mail className="w-4 h-4 text-purple-400" />],
          ]} />
          {nlLoading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : newsletters.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen nyhedsbreve endnu</p></div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3 font-medium">Emne</th>
                  <th className="text-left px-4 py-3 font-medium">Målgruppe</th>
                  <th className="text-left px-4 py-3 font-medium">Planlagt</th>
                  <th className="text-right px-4 py-3 font-medium">Modtagere</th>
                  <th className="text-right px-4 py-3 font-medium">Åbnede</th>
                  <th className="text-right px-4 py-3 font-medium">Klikkede</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {newsletters.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{n.title}</td>
                      <td className="px-4 py-3 text-slate-600">{n.audience}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(n.planned_date)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{n.recipients_count || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{n.opened || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{n.clicked || 0}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${nlStatusColor[n.status]}`}>{n.status}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openNlEdit(n)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => removeNl(n)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Kampagne-dialog */}
      <Dialog open={campOpen} onOpenChange={setCampOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{campEdit ? 'Rediger kampagne' : 'Ny kampagne'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Navn *</Label><Input value={campForm.name} onChange={(e) => setCamp('name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kanal</Label><Select value={campForm.channel} onValueChange={(v) => setCamp('channel', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{campaignChannels.map((ch) => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={campForm.status} onValueChange={(v) => setCamp('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{campaignStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start</Label><Input type="date" value={campForm.start_date} onChange={(e) => setCamp('start_date', e.target.value)} /></div>
              <div><Label>Slut</Label><Input type="date" value={campForm.end_date} onChange={(e) => setCamp('end_date', e.target.value)} /></div>
            </div>
            <div><Label>Budget (DKK)</Label><Input type="number" value={campForm.budget} onChange={(e) => setCamp('budget', e.target.value ? Number(e.target.value) : '')} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Henvendelser</Label><Input type="number" value={campForm.inquiries} onChange={(e) => setCamp('inquiries', Number(e.target.value) || 0)} /></div>
              <div><Label>Tilbud sendt</Label><Input type="number" value={campForm.quotes_sent} onChange={(e) => setCamp('quotes_sent', Number(e.target.value) || 0)} /></div>
              <div><Label>Vundet</Label><Input type="number" value={campForm.won} onChange={(e) => setCamp('won', Number(e.target.value) || 0)} /></div>
            </div>
            <div><Label>Noter</Label><Textarea value={campForm.notes} onChange={(e) => setCamp('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampOpen(false)}>Annuller</Button>
            <Button onClick={saveCamp} disabled={campSaving}>{campSaving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opslag-dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{postEdit ? 'Rediger opslag' : 'Nyt opslag'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Overskrift *</Label><Input value={postForm.title} onChange={(e) => setPost('title', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Platform</Label><Select value={postForm.platform} onValueChange={(v) => setPost('platform', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Type</Label><Select value={postForm.post_type} onValueChange={(v) => setPost('post_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{postTypes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Indhold</Label><Textarea value={postForm.content} onChange={(e) => setPost('content', e.target.value)} rows={4} /></div>
            <div><Label>Billede URL</Label><Input value={postForm.image_url} onChange={(e) => setPost('image_url', e.target.value)} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Planlagt dato</Label><Input type="date" value={postForm.planned_date} onChange={(e) => setPost('planned_date', e.target.value)} /></div>
              <div><Label>Status</Label><Select value={postForm.status} onValueChange={(v) => setPost('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{postStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kampagnenavn</Label><Input value={postForm.campaign_name} onChange={(e) => setPost('campaign_name', e.target.value)} /></div>
              <div><Label>Ansvarlig</Label><Input value={postForm.assigned_to} onChange={(e) => setPost('assigned_to', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rækkevidde</Label><Input type="number" value={postForm.reach} onChange={(e) => setPost('reach', Number(e.target.value) || 0)} /></div>
              <div><Label>Interaktioner</Label><Input type="number" value={postForm.engagement} onChange={(e) => setPost('engagement', Number(e.target.value) || 0)} /></div>
            </div>
            <div><Label>Noter</Label><Textarea value={postForm.notes} onChange={(e) => setPost('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>Annuller</Button>
            <Button onClick={savePost} disabled={postSaving}>{postSaving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nyhedsbrev-dialog */}
      <Dialog open={nlOpen} onOpenChange={setNlOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{nlEdit ? 'Rediger nyhedsbrev' : 'Nyt nyhedsbrev'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Emne *</Label><Input value={nlForm.title} onChange={(e) => setNl('title', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Målgruppe</Label><Select value={nlForm.audience} onValueChange={(v) => setNl('audience', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{audiences.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={nlForm.status} onValueChange={(v) => setNl('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{nlStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Indhold</Label><Textarea value={nlForm.content} onChange={(e) => setNl('content', e.target.value)} rows={4} /></div>
            <div><Label>Planlagt afsendelse</Label><Input type="date" value={nlForm.planned_date} onChange={(e) => setNl('planned_date', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kampagnenavn</Label><Input value={nlForm.campaign_name} onChange={(e) => setNl('campaign_name', e.target.value)} /></div>
              <div><Label>Ansvarlig</Label><Input value={nlForm.assigned_to} onChange={(e) => setNl('assigned_to', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Modtagere</Label><Input type="number" value={nlForm.recipients_count} onChange={(e) => setNl('recipients_count', Number(e.target.value) || 0)} /></div>
              <div><Label>Åbnede</Label><Input type="number" value={nlForm.opened} onChange={(e) => setNl('opened', Number(e.target.value) || 0)} /></div>
              <div><Label>Klikkede</Label><Input type="number" value={nlForm.clicked} onChange={(e) => setNl('clicked', Number(e.target.value) || 0)} /></div>
            </div>
            <div><Label>Noter</Label><Textarea value={nlForm.notes} onChange={(e) => setNl('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNlOpen(false)}>Annuller</Button>
            <Button onClick={saveNl} disabled={nlSaving}>{nlSaving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}