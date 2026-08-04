import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Award, Check } from 'lucide-react';

export default function KompetenceMatrix() {
  const [employees, setEmployees] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [e, c] = await Promise.all([
      base44.entities.Employee.list('-created_date', 200).catch(() => []),
      base44.entities.Certificate.list('-created_date', 500).catch(() => []),
    ]);
    setEmployees(e || []); setCerts(c || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const types = Array.from(new Set(certs.map((c) => c.type).filter(Boolean)));

  const hasCert = (empName, type) => certs.some((c) => c.employee_name === empName && c.type === type);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Kompetence Matrix</h1>
        <p className="text-sm text-muted-foreground">Oversigt over medarbejdernes certifikater og færdigheder.</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Indlæser…</p>}

      {!loading && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium sticky left-0 bg-muted">Medarbejder</th>
                {types.map((t) => <th key={t} className="text-center p-3 font-medium whitespace-nowrap">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && <tr><td colSpan={types.length + 1} className="p-6 text-center text-muted-foreground">Ingen medarbejdere.</td></tr>}
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="p-3 sticky left-0 bg-card">
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.trade || ''}</div>
                  </td>
                  {types.map((t) => (
                    <td key={t} className="p-3 text-center">
                      {hasCert(emp.name, t) ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700"><Check className="w-4 h-4" /></span>
                      ) : (
                        <span className="inline-block w-6 h-6 rounded-full bg-slate-100" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && types.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Ingen certifikater registreret endnu. Tilføj certifikater under Kursusoversigt eller Certifikatkontrollen.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Matrix bygger på Certificate-entiteten. Tilføj/fjern certifikater for at opdatere kompetenceoversigten.</p>
    </div>
  );
}