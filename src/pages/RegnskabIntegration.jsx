import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plug, Check, AlertCircle, Building2, KeyRound, Link2, FileText } from 'lucide-react';

const SYSTEMS = [
  { key: 'none', label: 'Ingen – ikke konfigureret', url: '' },
  { key: 'dinero', label: 'Dinero', url: 'https://dinero.dk' },
  { key: 'economic', label: 'e-conomic', url: 'https://e-conomic.dk' },
  { key: 'billy', label: 'Billy', url: 'https://billy.dk' },
];

export default function RegnskabIntegration() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.CompanySettings.list('-created_date', 10);
      setSettings(list[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const form = settings || {
    accounting_system: 'none',
    accounting_api_key: '',
    accounting_org_id: '',
    accounting_sync_invoices: true,
    accounting_sync_customers: true,
    company_name: '',
  };

  const set = (field, value) => setSettings({ ...form, [field]: value });

  const save = async () => {
    setSaving(true);
    try {
      if (settings?.id) {
        await base44.entities.CompanySettings.update(settings.id, {
          accounting_system: form.accounting_system,
          accounting_api_key: form.accounting_api_key,
          accounting_org_id: form.accounting_org_id,
          accounting_sync_invoices: form.accounting_sync_invoices,
          accounting_sync_customers: form.accounting_sync_customers,
        });
      } else {
        await base44.entities.CompanySettings.create({
          company_name: 'Min virksomhed',
          accounting_system: form.accounting_system,
          accounting_api_key: form.accounting_api_key,
          accounting_org_id: form.accounting_org_id,
          accounting_sync_invoices: form.accounting_sync_invoices,
          accounting_sync_customers: form.accounting_sync_customers,
        });
      }
      load();
      alert('Indstillinger gemt');
    } catch (e) {
      console.error(e);
      alert('Kunne ikke gemme: ' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const isConnected = form.accounting_system && form.accounting_system !== 'none' && form.accounting_api_key;
  const activeSystem = SYSTEMS.find((s) => s.key === form.accounting_system);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Regnskabsintegration</h1>
        <p className="text-slate-500 mt-1">Konfigurér forbindelsen til dit regnskabssystem for synkronisering af fakturaer og kunder</p>
      </div>

      {/* Connection status */}
      <div className={`rounded-xl p-5 border-2 ${isConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}>
            {isConnected ? <Check className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {isConnected ? `Forbundet til ${activeSystem?.label}` : 'Ikke forbundet'}
            </div>
            <div className="text-sm text-slate-500">
              {isConnected
                ? 'Regnskabssystemet er konfigureret og klar til synkronisering.'
                : 'Vælg et system og indtast API-nøgle for at aktivere integrationen.'}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Systemkonfiguration</h2>
        </div>

        <div className="space-y-1.5">
          <Label>Regnskabssystem</Label>
          <Select value={form.accounting_system || 'none'} onValueChange={(v) => set('accounting_system', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SYSTEMS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {form.accounting_system && form.accounting_system !== 'none' && (
          <>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> API-nøgle / Token</Label>
              <Input
                type="password"
                value={form.accounting_api_key || ''}
                onChange={(e) => set('accounting_api_key', e.target.value)}
                placeholder="Indtast API-nøgle fra dit regnskabssystem"
              />
              <p className="text-xs text-slate-400">
                {activeSystem?.url && (
                  <>Find din API-nøgle på <a href={activeSystem.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{activeSystem.url}</a></>
                )}
              </p>
            </div>

            {form.accounting_system === 'economic' && (
              <div className="space-y-1.5">
                <Label>Aftalenummer (e-conomic)</Label>
                <Input
                  value={form.accounting_org_id || ''}
                  onChange={(e) => set('accounting_org_id', e.target.value)}
                  placeholder="F.eks. 123456"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Sync settings */}
      {form.accounting_system && form.accounting_system !== 'none' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Link2 className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Synkroniseringsindstillinger</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Synkroniser fakturaer</div>
              <div className="text-sm text-slate-500">Overfør fakturaer til regnskabssystemet automatisk</div>
            </div>
            <Switch
              checked={form.accounting_sync_invoices}
              onCheckedChange={(v) => set('accounting_sync_invoices', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Synkroniser kunder</div>
              <div className="text-sm text-slate-500">Hold kundedatabasen opdateret i regnskabssystemet</div>
            </div>
            <Switch
              checked={form.accounting_sync_customers}
              onCheckedChange={(v) => set('accounting_sync_customers', v)}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600 space-y-2">
            <div className="font-medium text-slate-700">Sådan kommer du i gang:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Vælg dit regnskabssystem ovenfor</li>
              <li>Log ind i systemet og opret en API-nøgle</li>
              <li>Indtast API-nøglen og gem indstillingerne</li>
              <li>Gå til Regnskab-siden for at eksportere fakturaer</li>
            </ol>
            <p className="text-xs text-slate-400 pt-2">API-nøglen gemmes sikret og er kun tilgængelig for administratorer.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={load}>Annuller</Button>
        <Button onClick={save} disabled={saving} className="bg-slate-950 hover:bg-slate-800">
          <Plug className="w-4 h-4 mr-1.5" /> {saving ? 'Gemmer...' : 'Gem indstillinger'}
        </Button>
      </div>
    </div>
  );
}