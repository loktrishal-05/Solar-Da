import React, { useCallback, useEffect, useState } from 'react';
import { useAuth, type Role, type User } from '../auth';
import { Card, EmptyState, PageHeader } from '../ui';

const ROLES: Array<[Role, string]> = [
  ['farmer', 'Farmer: sees the farm, runs the agent, cannot approve'],
  ['agronomist', 'Agronomist: approves or rejects treatments'],
  ['admin', 'Admin: everything, plus this page'],
];

export const Admin: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/users');
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setUsers(b.users);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || 'Could not load users' });
      setUsers([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const change = async (u: User, role: Role) => {
    setSaving(u.id); setMsg(null);
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error ?? `Could not change the role (HTTP ${r.status})`);
      setUsers((list) => list?.map((x) => (x.id === u.id ? b.user : x)) ?? null);
      setMsg({ ok: true, text: `${u.name} is now ${role === 'admin' ? 'an admin' : `a ${role}`}.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  if (me?.role !== 'admin') return <EmptyState title="Admins only" body="Sign in with an admin account to manage users." />;

  return (
    <>
      <PageHeader title="Users" subtitle="Everyone who signs up starts as a farmer. Give the agronomist role only to people qualified to approve treatments." />
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mb-4 rounded-lg border px-4 py-2 text-sm ${msg.ok ? 'border-leaf-200 bg-leaf-50 text-leaf-900' : 'border-veto/30 bg-red-50 text-veto'}`}>{msg.text}</p>}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[15px]">
          <thead className="bg-leaf-50 text-sm text-ink/65">
            <tr><th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Email</th><th className="px-5 py-3 font-medium">Role</th></tr>
          </thead>
          <tbody>
            {users === null && <tr><td colSpan={3} className="px-5 py-6 text-ink/60">Loading users…</td></tr>}
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-leaf-100">
                <td className="px-5 py-3 font-semibold">{u.name}{u.id === me.id && <span className="ml-2 text-sm font-normal text-ink/50">(you)</span>}</td>
                <td className="px-5 py-3 text-ink/70">{u.email}</td>
                <td className="px-5 py-3">
                  <select aria-label={`Role for ${u.name}`} value={u.role} disabled={saving === u.id} onChange={(e) => change(u, e.target.value as Role)}
                          className="rounded-lg border border-leaf-200 bg-white px-2 py-1.5 text-sm focus:border-leaf-600 focus:outline-none">
                    {ROLES.map(([r, label]) => <option key={r} value={r}>{label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
};
