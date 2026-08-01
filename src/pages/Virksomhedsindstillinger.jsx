import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Image } from '@/components/ui/image';
import { Building2, Save, Upload, Loader2 } from 'lucide-react';

export default function Virksomhedsindstillinger() {
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const existing = await base44.entities.CompanySettings.list('-created_date', 1);
        if (existing.length > 0) {
          setSettings(existing[0]);
          setSettingsId(existing[0].id);
        } else {
          setSettings({
            company_name: '',
            cvr: '',
            address: '',
            postal_code: '',
            city: '',
            phone: '',
            email: '',
            logo_url: '',
            vat_rate: 25,
            vat_enabled: true,
            invoice_prefix: 'FAK',
            quote_prefix: 'TIL',
            payment_terms: '15 dage netto',
            bank_account: '',
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const setS = (field) => (e) => {
    const val = typeof e === 'boolean' ? e : e.target.value;
    setSettings({ ...settings, [field]: val });
  };

  const handleLogoUpload = async () => {
    const file = logoRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSettings({ ...settings, logo_url: file_url });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings, vat_rate: Number(settings.vat_rate) || 25 };
      if (settingsId) {
        await base44.entities.CompanySettings.update(settingsId, payload);
      } else {
        const created = await base44.entities.CompanySettings.create(payload);
        setSettingsId(created.id);
      }
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Virksomhedsindstillinger</h1>
        <p className="text-slate-500 mt-1">Firmaoplysninger, logo og momsindstillinger</p>
      </div>

      {/* Logo section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" /> Logo
        </h2>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
            {settings.logo_url ? (
              <Image src={settings.logo_url} fittingType="fit" className="w-full h-full" />
            ) : (
              <Building2 className="w-10 h-10 text-slate-300" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => logoRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {uploading ? 'Uploader...' : 'Upload logo'}
            </Button>
            {settings.logo_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, logo_url: '' })}
                className="block text-destructive"
              >
                Fjern logo
              </Button>
            )}
            <p className="text-xs text-slate-400">PNG eller JPG, max 2 MB</p>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Firmaoplysninger</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Virksomhedsnavn *</Label>
            <Input value={settings.company_name} onChange={setS('company_name')} placeholder="BygStyring ApS" />
          </div>
          <div className="space-y-1.5">
            <Label>CVR-nr.</Label>
            <Input value={settings.cvr} onChange={setS('cvr')} placeholder="12345678" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={settings.phone} onChange={setS('phone')} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={settings.email} onChange={setS('email')} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Adresse</Label>
            <Input value={settings.address} onChange={setS('address')} />
          </div>
          <div className="space-y-1.5">
            <Label>Postnummer</Label>
            <Input value={settings.postal_code} onChange={setS('postal_code')} />
          </div>
          <div className="space-y-1.5">
            <Label>By</Label>
            <Input value={settings.city} onChange={setS('city')} />
          </div>
        </div>
      </div>

      {/* VAT settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Momsindstillinger</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Moms aktiveret</Label>
              <p className="text-xs text-slate-400 mt-0.5">Tilføj moms på tilbud og fakturaer</p>
            </div>
            <Switch checked={settings.vat_enabled} onCheckedChange={setS('vat_enabled')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moms (%)</Label>
              <Input type="number" value={settings.vat_rate} onChange={setS('vat_rate')} disabled={!settings.vat_enabled} />
            </div>
            <div className="space-y-1.5">
              <Label>Bankkonto</Label>
              <Input value={settings.bank_account} onChange={setS('bank_account')} placeholder="Reg. nr. Kontonr." />
            </div>
            <div className="space-y-1.5">
              <Label>Faktura prefix</Label>
              <Input value={settings.invoice_prefix} onChange={setS('invoice_prefix')} />
            </div>
            <div className="space-y-1.5">
              <Label>Tilbud prefix</Label>
              <Input value={settings.quote_prefix} onChange={setS('quote_prefix')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Betalingsbetingelser</Label>
              <Input value={settings.payment_terms} onChange={setS('payment_terms')} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={saving} className="bg-slate-950 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Gemmer...' : 'Gem indstillinger'}
        </Button>
        {savedMsg && <span className="text-sm text-emerald-600 font-medium">✓ Gemt</span>}
      </div>
    </div>
  );
}