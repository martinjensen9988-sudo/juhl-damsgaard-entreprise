import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Clock, Package, Plus, Trash2, ClipboardList } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

const TASK_TYPES = ['Gravearbejde', 'Kørsel', 'Maskinarbejde', 'Håndarbejde', 'Møde', 'Andet'];

export default function ArbejdsseddelDialog({ project, onClose }) {
  const [timeEntries, setTimeEntries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [timeForm, setTimeForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    user_name: '',
    hours: '',
    task_type: 'Håndarbejde',
    description: '',
  });
  const [addingTime, setAddingTime] = useState(false);

  const [matForm, setMatForm] = useState({
    name: '',
    quantity: '',
    unit: 'stk',
    unit_price: '',
  });
  const [addingMat, setAddingMat] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, m, e] = await Promise.all([
        base44.entities.TimeEntry.filter({ project_id: project.id }, '-date', 200),
        base44.entities.Material.filter({ project_id: project.id }, '-created_date', 200),
        base44.entities.Employee.list('-created_date', 200),
      ]);
      setTimeEntries(t);
      setMaterials(m);
      setEmployees(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) load();
  }, [project]);

  const addTime = async () => {
    if (!timeForm.hours || !timeForm.user_name) return;
    setAddingTime(true);
    try {
      await base44.entities.TimeEntry.create({
        project_id: project.id,
        project_name: project.name,
        user_name: timeForm.user_name,
        date: timeForm.date,
        hours: Number(timeForm.hours),
        description: timeForm.description,
        task_type: timeForm.task_type,
      });
      setTimeForm({ date: new Date().toISOString().slice(0, 10), user_name: '', hours: '', task_type: 'Håndarbejde', description: '' });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingTime(false);
    }
  };

  const deleteTime = async (id) => {
    await base44.entities.TimeEntry.delete(id);
    load();
  };

  const addMaterial = async () => {
    if (!matForm.name || !matForm.quantity) return;
    setAddingMat(true);
    try {
      await base44.entities.Material.create({
        project_id: project.id,
        project_name: project.name,
        name: matForm.name,
        quantity: Number(matForm.quantity),
        unit: matForm.unit,
        unit_price: Number(matForm.unit_price) || 0,
      });
      setMatForm({ name: '', quantity: '', unit: 'stk', unit_price: '' });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingMat(false);
    }
  };

  const deleteMaterial = async (id) => {
    await base44.entities.Material.delete(id);
    load();
  };

  const totalHours = timeEntries.reduce((s, t) => s + (t.hours || 0), 0);
  const materialCost = materials.reduce((s, m) => s + (m.quantity || 0) * (m.unit_price || 0), 0);

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-400" />
            Arbejdsseddel – {project?.name}
          </DialogTitle>
        </DialogHeader>

        {!project ? null : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Time section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Tidsregistrering</h3>
                <span className="ml-auto text-sm text-slate-400">{totalHours} timer</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 bg-slate-50 p-3 rounded-lg">
                <Input type="date" value={timeForm.date} onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })} />
                <Select value={timeForm.user_name} onValueChange={(v) => setTimeForm({ ...timeForm, user_name: v })}>
                  <SelectTrigger><SelectValue placeholder="Medarbejder" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.5" value={timeForm.hours} onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })} placeholder="Timer" />
                <Select value={timeForm.task_type} onValueChange={(v) => setTimeForm({ ...timeForm, task_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={addTime} disabled={addingTime || !timeForm.hours || !timeForm.user_name} size="sm" className="bg-slate-950 hover:bg-slate-800">
                  <Plus className="w-4 h-4" /> Tilføj
                </Button>
                <Input className="col-span-2 sm:col-span-5" value={timeForm.description} onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })} placeholder="Beskrivelse (valgfrit)" />
              </div>

              {timeEntries.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-3 py-2">Dato</th>
                        <th className="px-3 py-2">Medarbejder</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2 text-right">Timer</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {timeEntries.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-600">{formatDate(t.date)}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{t.user_name}</td>
                          <td className="px-3 py-2 text-slate-500">{t.task_type}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{t.hours}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => deleteTime(t.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Materials section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Materialer</h3>
                <span className="ml-auto text-sm text-slate-400">{formatDKK(materialCost)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 bg-slate-50 p-3 rounded-lg">
                <Input value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} placeholder="Materiale" />
                <Input type="number" step="0.01" value={matForm.quantity} onChange={(e) => setMatForm({ ...matForm, quantity: e.target.value })} placeholder="Antal" />
                <Input value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} placeholder="Enhed" />
                <Input type="number" value={matForm.unit_price} onChange={(e) => setMatForm({ ...matForm, unit_price: e.target.value })} placeholder="Stk. pris" />
                <Button onClick={addMaterial} disabled={addingMat || !matForm.name || !matForm.quantity} size="sm" className="bg-slate-950 hover:bg-slate-800">
                  <Plus className="w-4 h-4" /> Tilføj
                </Button>
              </div>

              {materials.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-3 py-2">Materiale</th>
                        <th className="px-3 py-2 text-right">Antal</th>
                        <th className="px-3 py-2 text-right">Pris</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {materials.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{m.name}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{m.quantity} {m.unit}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{formatDKK(m.unit_price || 0)}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{formatDKK((m.quantity || 0) * (m.unit_price || 0))}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => deleteMaterial(m.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}