import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Search, Trash2, Shield, Mail } from 'lucide-react';

export default function Brugeradministration() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.User.list('-created_date', 200);
      setUsers(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    `${u.full_name || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      toast({ title: 'Invitation sendt', description: `Invitation sendt til ${inviteEmail}` });
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('user');
      await load();
    } catch (err) {
      setError(err.message || 'Kunne ikke sende invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const changeRole = async (user, role) => {
    try {
      await base44.entities.User.update(user.id, { role });
      toast({ title: 'Rolle opdateret', description: `${user.email} er nu ${role}` });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Fjern bruger ${user.email}? Dette kan ikke fortrydes.`)) return;
    try {
      await base44.entities.User.delete(user.id);
      toast({ title: 'Bruger fjernet' });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brugeradministration</h1>
          <p className="text-slate-500 text-sm mt-1">
            Opret brugere, tildel roller og styre adgangsniveauer.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="w-4 h-4" />
          Inviter bruger
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">Brugere i alt</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{users.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">Administratorer</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{adminCount}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">Almindelige brugere</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{users.length - adminCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Søg på navn eller email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Bruger</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rolle</th>
                <th className="px-4 py-3 font-medium">Oprettet</th>
                <th className="px-4 py-3 font-medium text-right">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Indlæser…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Ingen brugere fundet</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      {u.full_name || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {u.email || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={u.role || 'user'} onValueChange={(role) => changeRole(u, role)}>
                      <SelectTrigger className={`w-36 ${u.role === 'admin' ? 'text-amber-600 font-medium' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="user">Bruger</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString('da-DK') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeUser(u)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter ny bruger</DialogTitle>
            <DialogDescription>
              Brugeren modtager en email med invitation og opretter selv sin adgangskode.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="navn@firma.dk"
              />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Administrator</span>
                  </SelectItem>
                  <SelectItem value="user">Bruger</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Administrator har fuld adgang. Bruger har begrænset adgang.
              </p>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Annuller</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sender…' : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}