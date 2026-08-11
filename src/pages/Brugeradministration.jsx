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
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, Mail, Search, Shield, Trash2, UserPlus } from 'lucide-react';

const useSimplyApi = import.meta.env.VITE_API_MODE === 'simply';

export default function Brugeradministration() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = base44.users?.listUsers
        ? await base44.users.listUsers()
        : await base44.entities.User.list('-created_date', 200);
      setUsers(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAdmin]);

  const filtered = users.filter((u) =>
    `${u.full_name || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;

  if (!isAdmin) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start gap-3">
          <Shield className="mt-1 h-5 w-5 text-amber-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Kun administrator</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Brugeradministration er låst til administratorer. Medarbejderadgang oprettes kun af admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (useSimplyApi) {
        await base44.users.createUser({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          password: invitePassword,
          role: inviteRole,
        });
        toast({ title: 'Bruger oprettet', description: `${inviteEmail} kan nu logge ind` });
      } else {
        await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
        toast({ title: 'Invitation sendt', description: `Invitation sendt til ${inviteEmail}` });
      }
      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
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
      if (base44.users?.updateUserRole) await base44.users.updateUserRole(user.id, role);
      else await base44.entities.User.update(user.id, { role });
      toast({ title: 'Rolle opdateret', description: `${user.email} er nu ${role}` });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Fjern bruger ${user.email}? Dette kan ikke fortrydes.`)) return;
    try {
      if (base44.users?.deleteUser) await base44.users.deleteUser(user.id);
      else await base44.entities.User.delete(user.id);
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
              {useSimplyApi
                ? 'Opret medarbejderadgang direkte. Brugeren kan ændre adgangskode senere via glemt adgangskode.'
                : 'Brugeren modtager en email med invitation og opretter selv sin adgangskode.'}
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
            {useSimplyApi && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Navn</Label>
                  <Input
                    id="name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Medarbejdernavn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Midlertidig adgangskode</Label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      className="pl-9"
                      placeholder="Mindst 8 tegn"
                    />
                  </div>
                </div>
              </>
            )}
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
