import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings2, Loader2, Save, ShieldCheck } from 'lucide-react';

const DEFAULTS = {
  label: 'Standard',
  show_projects: true,
  show_project_budget: false,
  show_quotes: true,
  show_invoices: true,
  show_invoice_amounts: true,
  show_images: true,
  show_documents: true,
  show_quality_checks: false,
  show_prisberegner: true,
  allow_quote_accept: true,
  welcome_message: '',
  contact_email: '',
  contact_phone: '',
};

const TOGGLES = [
  { key: 'show_projects', label: 'Projekter', desc: 'Kunder kan se deres projekter og status' },
  { key: 'show_project_budget', label: 'Projektbudget', desc: 'Vis budgetbeløb på projekter' },
  { key: 'show_quotes', label: 'Tilbud', desc: 'Kunder kan se tilbud' },
  { key: 'allow_quote_accept', label: 'Tillad tilbudsaccept', desc: 'Kunder kan acceptere/afvise tilbud online' },
  { key: 'show_invoices', label: 'Fakturaer', desc: 'Kunder kan se fakturaer' },
  { key: 'show_invoice_amounts', label: 'Fakturabeløb', desc: 'Vis beløb på fakturaer' },
  { key: 'show_images', label: 'Projektbilleder', desc: 'Vis galleri med projektbilleder' },
  { key: 'show_documents', label: 'Dokumenter', desc: 'Vis dokumentarkiv' },
  { key: 'show_quality_checks', label: 'Kvalitetssikring', desc: 'Vis kvalitetssikringstjeklister' },
  { key: 'show_prisberegner', label: 'Prisberegner', desc: 'Vis online prisberegner' },
];

export default function KundeportalIndstillinger() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await base44.entities.PortalSetting.list();
      setSettings(list[0] ? { ...DEFAULTS, ...list[0] } : { ...DEFAULTS });
    } catch (e) { console.error(e); setSettings({ ...DEFAULTS }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });
  const set = (f) => (e) => setSettings({ ...settings, [f]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      const list = await base44.entities.PortalSetting.list();
      if (list[0]) {
        await base44.entities.PortalSetting.update(list[0].id, settings);
      } else {
        await base44.entities.PortalSetting.create(settings);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Settings2 className="w-6 h-6 text-amber-500" /> Kundeportal-styring</h1>
        <p className="text-sm text-slate-500 mt-1">Styr hvilke data og dokumenter kunderne har adgang til</p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-500" /> Synlighed</h2>
        <div className="divide-y divide-slate-100">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">{t.label}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
              </div>
              <Switch checked={!!settings[t.key]} onCheckedChange={() => toggle(t.key)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Portaloplysninger</h2>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Velkomstbesked</Label><Textarea value={settings.welcome_message} onChange={set('welcome_message')} rows={2} placeholder="Besked vises i portalen" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Kontakt-email</Label><Input type="email" value={settings.contact_email} onChange={set('contact_email')} /></div>
            <div className="space-y-1.5"><Label>Kontakt-telefon</Label><Input value={settings.contact_phone} onChange={set('contact_phone')} /></div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Gem indstillinger</Button>
      </div>
    </div>
  );
}