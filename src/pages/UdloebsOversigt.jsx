import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Award, RefreshCw, CalendarClock, Loader2, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

export default function UdloebsOversigt() {
  const [certificates, setCertificates] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(90);

  useEffect(() => {
    (async () => {
      try {
        const [cert, agree] = await Promise.all([
          base44.entities.Certificate.list(),
          base44.entities.ServiceAgreement.list(),
        ]);
        setCertificates(cert);
        setAgreements(agree);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  const certItems = certificates
    .map((c) => ({ ...c, _days: daysUntil(c.expiry_date), _label: 'Certifikat', _field: c.expiry_date, _icon: Award, _name: c.employee_name ? `${c.employee_name} – ${c.title}` : c.title }))
    .filter((c) => c._days !== null && c._days <= daysAhead);

  const agreeItems = agreements
    .map((a) => {
      const dateField = a.end_date || a.next_service_date;
      return { ...a, _days: daysUntil(dateField), _label: a.end_date ? 'Serviceaftale' : 'Serviceeftersyn', _field: dateField, _icon: RefreshCw, _name: a.title };
    })
    .filter((a) => a._days !== null && a._days <= daysAhead);

  const allItems = [...certItems, ...agreeItems].sort((a, b) => (a._days ?? 9999) - (b._days ?? 9999));

  const expired = allItems.filter((i) => i._days < 0);
  const soon = allItems.filter((i) => i._days >= 0 && i._days <= 30);
  const later = allItems.filter((i) => i._days > 30);

  const severityClass = (days) => {
    if (days < 0) return 'border-red-500 bg-red-50';
    if (days <= 14) return 'border-orange-400 bg-orange-50';
    if (days <= 30) return 'border-amber-400 bg-amber-50';
    return 'border-slate-200 bg-white';
  };

  const badgeClass = (days) => {
    if (days < 0) return 'bg-red-500 text-white';
    if (days <= 14) return 'bg-orange-500 text-white';
    if (days <= 30) return 'bg-amber-400 text-slate-900';
    return 'bg-slate-200 text-slate-700';
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><CalendarClock className="w-6 h-6 text-amber-500" /> Udløbsoversigt</h1>
          <p className="text-sm text-slate-500 mt-1">Kommende udløb for certifikater og serviceaftaler</p>
        </div>
        <div className="flex gap-2">
          {[30, 60, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setDaysAhead(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${daysAhead === d ? 'bg-slate-950 text-amber-400' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
            >
              {d} dage
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600 text-xs mb-1"><AlertTriangle className="w-4 h-4" /> Udløbet</div>
          <div className="text-2xl font-bold text-red-600">{expired.length}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-600 text-xs mb-1"><CalendarClock className="w-4 h-4" /> Snart (≤30 d)</div>
          <div className="text-2xl font-bold text-orange-600">{soon.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><CheckCircle2 className="w-4 h-4" /> Senere</div>
          <div className="text-2xl font-bold text-slate-700">{later.length}</div>
        </Card>
      </div>

      <div className="space-y-3">
        {allItems.map((item, idx) => (
          <Card key={idx} className={`p-4 border-l-4 ${severityClass(item._days)}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <item._icon className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="font-semibold text-slate-900">{item._name}</div>
                  <div className="text-xs text-slate-500">
                    {item._label}
                    {item.employee_name && ` • ${item.employee_name}`}
                    {item.customer_name && ` • ${item.customer_name}`}
                    {item._field && ` • Udløber ${formatDate(item._field)}`}
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass(item._days)}`}>
                {item._days < 0 ? `${Math.abs(item._days)} dage siden` : `${item._days} dage`}
              </div>
            </div>
          </Card>
        ))}
        {allItems.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            Ingen udløb inden for {daysAhead} dage
          </div>
        )}
      </div>
    </div>
  );
}