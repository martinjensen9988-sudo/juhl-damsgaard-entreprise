import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User, Building2, Save, Trash2, AlertTriangle, Smartphone } from 'lucide-react';

export default function Indstillinger() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteMyAccount', {});
      setDeleteOpen(false);
      // Clear tokens and redirect to login.
      base44.auth.logout('/login');
    } catch (e) {
      console.error(e);
      alert('Kunne ikke slette kontoen: ' + (e.message || 'Ukendt fejl'));
    } finally {
      setDeleting(false);
    }
  };

  const [appReleaseId, setAppReleaseId] = useState(null);
  const [apkVersion, setApkVersion] = useState('');
  const [apkUrl, setApkUrl] = useState('');
  const [savingApk, setSavingApk] = useState(false);

  const loadAppRelease = async () => {
    try {
      const res = await base44.entities.AppRelease.filter({ platform: 'android' }, '-updated_date', 1);
      if (res.length > 0) {
        setAppReleaseId(res[0].id);
        setApkVersion(res[0].version || '');
        setApkUrl(res[0].file_url || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadAppRelease(); }, []);

  const saveApk = async () => {
    if (!apkUrl.trim()) {
      alert('Indsæt en offentlig download-URL til APK-filen');
      return;
    }
    setSavingApk(true);
    try {
      const payload = { platform: 'android', version: apkVersion || '1.0', file_url: apkUrl.trim() };
      if (appReleaseId) {
        await base44.entities.AppRelease.update(appReleaseId, payload);
      } else {
        const saved = await base44.entities.AppRelease.create(payload);
        setAppReleaseId(saved.id);
      }
      alert('APK-link gemt — download-knappen vises nu på forsiden');
    } catch (e) {
      console.error(e);
      alert('Kunne ikke gemme: ' + (e.message || 'Ukendt fejl'));
    } finally {
      setSavingApk(false);
    }
  };

  const deleteApk = async () => {
    if (!appReleaseId) return;
    if (!confirm('Slet APK-download fra forsiden?')) return;
    try {
      await base44.entities.AppRelease.delete(appReleaseId);
      setAppReleaseId(null);
      setApkUrl('');
      setApkVersion('');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setProfile({ full_name: u.full_name || '' });
      } catch (e) {
        console.error(e);
      }
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
            vat_rate: 25,
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

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await base44.auth.updateMe({ full_name: profile.full_name });
      alert('Profil opdateret');
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = { ...settings, vat_rate: Number(settings.vat_rate) || 25 };
      if (settingsId) {
        await base44.entities.CompanySettings.update(settingsId, payload);
      } else {
        const created = await base44.entities.CompanySettings.create(payload);
        setSettingsId(created.id);
      }
      alert('Virksomhedsindstillinger gemt');
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const setS = (field) => (e) => setSettings({ ...settings, [field]: e.target.value });
  const setP = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Indstillinger</h1>
        <p className="text-slate-500 mt-1">Opdater profil og virksomhedsoplysninger</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1.5" /> Profil</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-1.5" /> Virksomhed</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400">Email kan ikke ændres her.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Navn</Label>
              <Input value={profile.full_name} onChange={setP('full_name')} placeholder="Dit fulde navn" />
            </div>
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <Input value={user?.role === 'admin' ? 'Administrator' : 'Bruger'} disabled className="bg-slate-50" />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-slate-950 hover:bg-slate-800">
              <Save className="w-4 h-4 mr-1.5" /> {savingProfile ? 'Gemmer...' : 'Gem profil'}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-red-200 p-6 max-w-lg">
            <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Slet konto</h2>
            <p className="text-sm text-slate-500 mb-4">
              Sletning fjerner permanent din konto og alle personlige data, herunder tidsregistreringer, udgifter og personlige oplysninger. Handlingen kan ikke fortrydes.
            </p>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
              <Trash2 className="w-4 h-4" /> Slet konto
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          {settings && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Virksomhedsnavn</Label>
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
                <div className="space-y-1.5">
                  <Label>Moms (%)</Label>
                  <Input type="number" value={settings.vat_rate} onChange={setS('vat_rate')} />
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
              <Button onClick={saveSettings} disabled={savingSettings} className="bg-slate-950 hover:bg-slate-800">
                <Save className="w-4 h-4 mr-1.5" /> {savingSettings ? 'Gemmer...' : 'Gem indstillinger'}
              </Button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-slate-900">Android-app (APK)</h2>
            </div>
            <p className="text-sm text-slate-500">
              Indsæt en offentlig download-URL til din APK-fil (f.eks. et direkte Google Drive- eller Dropbox-link). Den bliver tilgængelig på forsiden under "Hent appen". Bemærk: Base44's fil-upload tillader ikke .apk-filer, så filen skal hostes et andet sted.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Version</Label>
                <Input value={apkVersion} onChange={(e) => setApkVersion(e.target.value)} placeholder="f.eks. 1.0.0" />
              </div>
              <div className="space-y-1.5">
                <Label>APK download-URL</Label>
                <Input value={apkUrl} onChange={(e) => setApkUrl(e.target.value)} placeholder="https://...fil.apk" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveApk} disabled={savingApk} className="bg-slate-950 hover:bg-slate-800">
                <Save className="w-4 h-4 mr-1.5" /> {savingApk ? 'Gemmer...' : 'Gem APK-link'}
              </Button>
              {appReleaseId && (
                <Button variant="destructive" onClick={deleteApk} className="gap-2">
                  <Trash2 className="w-4 h-4" /> Slet APK
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="w-5 h-5" /> Bekræft sletning af konto</DialogTitle>
            <DialogDescription>
              Dette sletter permanent din konto. Alle tidsregistreringer, udgifter og personlige oplysninger går tabt og kan ikke gendannes.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">Er du sikker på, at du vil fortsætte? Handlingen kan ikke fortrydes.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuller</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting} className="gap-2">
              {deleting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sletter...</> : <><Trash2 className="w-4 h-4" /> Ja, slet konto</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}