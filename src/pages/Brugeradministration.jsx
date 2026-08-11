import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { PERMISSION_MODULES, normalizePermissions } from '@/lib/permissions';
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
  const [invitePermissions, setInvitePermissions] = useState(PERMISSION_MODULES.map((p) => p.id));
  const [permissionUser, setPermissionUser] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState([]);
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
  const customerCount = users.filter((u) => u.role === 'customer').length;
  const employeeCount = users.filter((u) => u.role === 'user').length;

  const togglePermission = (current, permission, checked) => (
    checked
      ? Array.from(new Set([...current, permission]))
      : current.filter((entry) => entry !== permission)
  );

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
          permissions: inviteRole === 'user' ? invitePermissions : [],
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
      setInvitePermissions(PERMISSION_MODULES.map((p) => p.id));
      await load();
    } catch (err) {
      setError(err.message || 'Kunne ikke sende invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const changeRole = async (user, role) => {
    try {
      const permissions = role === 'user' ? normalizePermissions(user.permissions) : [];
      if (base44.users?.updateUser) await base44.users.updateUser(user.id, { role, permissions });
      else if (base44.users?.updateUserRole) await base44.users.updateUserRole(user.id, role);
      else await base44.entities.User.update(user.id, { role });
      toast({ title: 'Rolle opdateret', description: `${user.email} er nu ${role}` });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const openPermissions = (target) => {
    setPermissionUser(target);
    setPermissionDraft(normalizePermissions(target.permissions));
  };

  const savePermissions = async () => {
    if (!permissionUser) return;
    setSubmitting(true);
    try {
      await base44.users.updateUser(permissionUser.id, {
        role: 'user',
        permissions: permissionDraft,
      });
      toast({ title: 'Adgange opdateret', description: permissionUser.email });
      setPermissionUser(null);
      setPermissionDraft([]);
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
          <div className="text-sm text-slate-500">Medarbejdere / kunder</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{employeeCount} / {customerCount}</div>
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
                <th className="px-4 py-3 font-medium">Adgange</th>
                <th className="px-4 py-3 font-medium">Oprettet</th>
                <th className="px-4 py-3 font-medium text-right">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Indlæser…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Ingen brugere fundet</td></tr>
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
                        {useSimplyApi && <SelectItem value="customer">Kundeportal</SelectItem>}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="text-xs font-medium text-amber-700">Alle adgange</span>
                    ) : u.role === 'customer' ? (
                      <span className="text-xs font-medium text-slate-500">Kundeportal</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openPermissions(u)}>
                        Vælg adgange ({u.permissions == null ? 'alle' : normalizePermissions(u.permissions).length})
                      </Button>
                    )}
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
                ? 'Opret medarbejder- eller kundeadgang direkte. Brugeren kan ændre adgangskode senere via glemt adgangskode.'
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
                  {useSimplyApi && <SelectItem value="customer">Kundeportal</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Administrator har fuld adgang. Bruger kan begrænses med adgange herunder. Kundeportal kan kun bruge kundeportalen.
              </p>
            </div>
            {useSimplyApi && inviteRole === 'user' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Adgange</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setInvitePermissions(PERMISSION_MODULES.map((p) => p.id))}>Alle</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setInvitePermissions([])}>Ingen</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3">
                  {PERMISSION_MODULES.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={invitePermissions.includes(permission.id)}
                        onCheckedChange={(checked) => setInvitePermissions((current) => togglePermission(current, permission.id, checked === true))}
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
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

      <Dialog open={!!permissionUser} onOpenChange={(open) => !open && setPermissionUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vælg adgange</DialogTitle>
            <DialogDescription>
              {permissionUser?.email} kan kun se de moduler, der er valgt her.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPermissionDraft(PERMISSION_MODULES.map((p) => p.id))}>Alle</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPermissionDraft([])}>Ingen</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3">
              {PERMISSION_MODULES.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={permissionDraft.includes(permission.id)}
                    onCheckedChange={(checked) => setPermissionDraft((current) => togglePermission(current, permission.id, checked === true))}
                  />
                  {permission.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Hvis ingen adgange er valgt, kan brugeren kun se dashboard og egen profil.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPermissionUser(null)}>Annuller</Button>
            <Button type="button" onClick={savePermissions} disabled={submitting}>
              {submitting ? 'Gemmer…' : 'Gem adgange'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
