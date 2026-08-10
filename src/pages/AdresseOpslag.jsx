import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddressLookup from '@/components/AddressLookup';
import { MapPin, Search, UserPlus, Users, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';

export default function AdresseOpslag() {
  const [addr, setAddr] = useState({ address: '', postal_code: '', city: '', lat: null, lng: null });
  const [customers, setCustomers] = useState([]);
  const [matched, setMatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // New customer form fields
  const [customerForm, setCustomerForm] = useState({ name: '', company: '', email: '', phone: '', cvr: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Customer.list();
      setCustomers(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Auto-fill customer form when address changes
  useEffect(() => {
    setCustomerForm((f) => ({ ...f }));
    setSavedId(null);
  }, [addr.address]);

  const handleAddrChange = (v) => {
    setAddr(v);
    // Search matched customers by address
    if (v.address) {
      const matches = customers.filter((c) =>
        c.address?.toLowerCase().includes(v.address.toLowerCase()) ||
        (v.postal_code && c.postal_code === v.postal_code)
      );
      setMatched(matches);
    } else {
      setMatched([]);
    }
  };

  const handleCustField = (f, v) => setCustomerForm((s) => ({ ...s, [f]: v }));

  const saveCustomer = async () => {
    if (!customerForm.name) { alert('Angiv et navn'); return; }
    setSaving(true);
    try {
      const payload = {
        ...customerForm,
        address: addr.address,
        postal_code: addr.postal_code,
        city: addr.city,
        latitude: addr.lat,
        longitude: addr.lng,
      };
      const created = await base44.entities.Customer.create(payload);
      setSavedId(created.id);
      setCustomers((c) => [...c, created]);
      setMatched((m) => [...m, created]);
    } catch (e) { console.error(e); alert('Fejl ved oprettelse'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Adressesøgning</h1>
          <p className="text-slate-500 mt-0.5">Søg adresser, se grunden på satellitkort og udfyld kundeoplysninger automatisk</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Address search + map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-600" /> Søg adresse
          </h3>
          <AddressLookup value={addr} onChange={handleAddrChange} />

          {/* Matched customers */}
          {addr.address && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Kunder på adressen ({matched.length})
              </h4>
              {matched.length === 0 ? (
                <div className="text-sm text-slate-400 py-3 bg-slate-50 rounded-lg px-4">
                  Ingen eksisterende kunder fundet — opret en ny forneden.
                </div>
              ) : (
                <div className="space-y-2">
                  {matched.map((c) => (
                    <div key={c.id} className="border border-slate-200 rounded-lg p-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900">{c.name}</div>
                        {c.company && <div className="text-sm text-slate-500">{c.company}</div>}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                          {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-600" /> Opret / udfyld kunde
          </h3>

          {savedId ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-medium text-slate-900">Kunde oprettet!</p>
              <p className="text-sm text-slate-500 mt-1">Adressen er gemt med koordinater.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSavedId(null); setCustomerForm({ name: '', company: '', email: '', phone: '', cvr: '', notes: '' }); }}>
                Opret en til
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Kontaktperson *</Label>
                <Input value={customerForm.name} onChange={(e) => handleCustField('name', e.target.value)} placeholder="Navn" />
              </div>
              <div>
                <Label>Virksomhed</Label>
                <Input value={customerForm.company} onChange={(e) => handleCustField('company', e.target.value)} placeholder="CVR/firmanavn" />
              </div>
              <div>
                <Label>CVR-nr.</Label>
                <Input value={customerForm.cvr} onChange={(e) => handleCustField('cvr', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={customerForm.email} onChange={(e) => handleCustField('email', e.target.value)} />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={customerForm.phone} onChange={(e) => handleCustField('phone', e.target.value)} />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Adresse (fra søgning)</div>
                <div className="text-sm text-slate-700 font-medium">{addr.address || '—'}</div>
                <div className="text-sm text-slate-500">{[addr.postal_code, addr.city].filter(Boolean).join(' ') || '—'}</div>
                {addr.lat && addr.lng && <div className="text-xs text-slate-400 mt-1">📍 {addr.lat.toFixed(5)}, {addr.lng.toFixed(5)}</div>}
              </div>
              <Button onClick={saveCustomer} disabled={saving || !addr.address} className="w-full">
                {saving ? 'Gemmer...' : 'Opret kunde'}
              </Button>
              {!addr.address && <p className="text-xs text-slate-400 text-center">Søg en adresse først</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}