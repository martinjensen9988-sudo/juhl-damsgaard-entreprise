import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Smartphone } from 'lucide-react';

export default function AppDownloadSection() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.AppRelease.filter({ platform: 'android' }, '-updated_date', 1);
        if (res.length > 0) setRelease(res[0]);
      } catch (e) {
        /* public read — ignore if unavailable */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !release || !release.file_url) return null;

  return (
    <section className="py-16 bg-slate-950">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-8 h-8 text-slate-950" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Hent vores app til Android</h2>
            <p className="text-slate-300 mt-2">
              Ansatte kan downloade APK-filen og installere den direkte på telefonen.
              {release.version && <span className="text-slate-400"> Version {release.version}.</span>}
            </p>
          </div>
          <a
            href={release.file_url}
            download
            className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-400/20 shrink-0"
          >
            <Download className="w-5 h-5" /> Download APK
          </a>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          På Android: tillad "Installér fra ukendte kilder" i indstillingerne, før du åbner filen.
        </p>
      </div>
    </section>
  );
}