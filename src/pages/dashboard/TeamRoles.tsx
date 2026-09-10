import { useState } from 'react';
import { Shield, Plus, Check, X, Eye, Lock, Unlock, Key } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo, canAccess } from '../../context/DemoContext';
import type { AppUser, UserRole } from '../../context/DemoContext';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; badge: string; desc: string; icon: typeof Shield }> = {
  owner:   { label: 'Owner',   color: 'text-amber-400',   badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',   desc: 'Full access to everything', icon: Key },
  manager: { label: 'Manager', color: 'text-blue-400',    badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400',     desc: 'All except settings & users', icon: Shield },
  staff:   { label: 'Staff',   color: 'text-emerald-400', badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', desc: 'Bookings, tasks & customers only', icon: Eye },
  viewer:  { label: 'Viewer',  color: 'text-slate-400',   badge: 'bg-slate-500/15 border-slate-500/30 text-slate-400',  desc: 'Reports & analytics only', icon: Eye },
};

const PAGE_PERMISSIONS: { page: string; label: string }[] = [
  { page:'bookings',      label:'📅 Bookings' },
  { page:'customers',     label:'👥 Customers' },
  { page:'payments',      label:'💵 Payments' },
  { page:'invoices',      label:'🧾 Invoices' },
  { page:'tasks',         label:'✅ Tasks' },
  { page:'staff',         label:'⭐ Staff' },
  { page:'commissions',   label:'💰 Commissions' },
  { page:'expenses',      label:'📉 Expenses' },
  { page:'reports',       label:'📊 Reports' },
  { page:'broadcast',     label:'📢 Broadcast' },
  { page:'settings',      label:'⚙️ Settings' },
  { page:'users',         label:'🔒 Team & Roles' },
];

export default function TeamRolesPage() {
  const { users, setUsers, currentUser, setCurrentUser, business } = useDemo();
  const [showAdd, setShowAdd] = useState(false);
  const [showPerms, setShowPerms] = useState(false);
  
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'staff' as UserRole, staffName: '', twoFA: false });

  const addUser = () => {
    if (!form.name || !form.email) { setToast('Name and email are required.'); return; }
    const newUser: AppUser = {
      id: users.length + 1, name: form.name, email: form.email, role: form.role,
      staffName: form.staffName || undefined, avatar: form.name[0].toUpperCase(),
      lastLogin: 'Never', twoFA: form.twoFA, active: true,
    };
    setUsers([...users, newUser]);
    setShowAdd(false);
    setForm({ name: '', email: '', role: 'staff', staffName: '', twoFA: false });
    setToast(`${form.name} invited as ${form.role}.`);
  };

  const toggleActive = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));
    const u = users.find(u => u.id === id);
    setToast(`${u?.name} ${u?.active ? 'deactivated' : 'activated'}.`);
  };

  const toggle2FA = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, twoFA: !u.twoFA } : u));
  };

  const switchRole = (user: AppUser) => {
    setCurrentUser(user);
    setToast(`Switched to ${user.name} (${user.role}) — access changes immediately.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><Shield size={18} className="text-blue-400" /> Team & Roles</h2>
          <p className="text-slate-500 text-sm">Role-based access control — {users.length} team members · {business.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPerms(true)} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Eye size={12} /> Permission Matrix
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Invite Member
          </button>
        </div>
      </div>

      {/* Current session banner */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center text-white font-bold">{currentUser.avatar}</div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Logged in as: <span className="text-blue-400">{currentUser.name}</span></p>
          <p className="text-slate-400 text-xs">Role: {ROLE_CONFIG[currentUser.role].label} · {ROLE_CONFIG[currentUser.role].desc}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_CONFIG[currentUser.role].badge}`}>{ROLE_CONFIG[currentUser.role].label}</span>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, cfg]) => {
          const count = users.filter(u => u.role === role).length;
          const Icon = cfg.icon;
          return (
            <div key={role} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <Icon size={16} className={`${cfg.color} mb-2`} />
              <p className="text-white font-bold text-sm">{cfg.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{cfg.desc}</p>
              <p className={`font-black text-xl mt-2 ${cfg.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Team Members</h3>
          <p className="text-slate-500 text-xs">{users.filter(u => u.active).length} active</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {users.map(u => {
            const cfg = ROLE_CONFIG[u.role];
            const RoleIcon = cfg.icon;
            const isCurrent = u.id === currentUser.id;
            return (
              <div key={u.id} className={`flex items-center gap-4 px-5 py-4 ${isCurrent ? 'bg-blue-500/5' : 'hover:bg-slate-800/20'} transition-colors`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${u.active ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-slate-800 opacity-50'}`}>
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{u.name}</p>
                    {isCurrent && <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">You</span>}
                    {!u.active && <span className="text-xs text-slate-600">Deactivated</span>}
                  </div>
                  <p className="text-slate-500 text-xs">{u.email} · Last login: {u.lastLogin}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shrink-0 ${cfg.badge}`}>
                  <RoleIcon size={10} /> {cfg.label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 2FA toggle */}
                  <button onClick={() => toggle2FA(u.id)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${u.twoFA ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 hover:border-slate-600'}`} title={u.twoFA ? '2FA enabled' : 'Enable 2FA'}>
                    {u.twoFA ? <Lock size={11} /> : <Unlock size={11} />}
                    <span className="hidden sm:block">2FA</span>
                  </button>
                  {/* Switch to this user (demo) */}
                  {!isCurrent && (
                    <button onClick={() => switchRole(u)} className="text-xs text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg transition-colors">
                      Switch
                    </button>
                  )}
                  {/* Toggle active */}
                  {u.id !== 1 && (
                    <button onClick={() => toggleActive(u.id)} className={`p-1.5 rounded-lg border transition-colors ${u.active ? 'text-slate-500 hover:text-red-400 hover:border-red-500/30 border-slate-700' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                      {u.active ? <X size={13} /> : <Check size={13} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <Modal title="Invite Team Member" onClose={() => setShowAdd(false)} icon={<Plus size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Hana Khoury" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="hana@yourbusiness.lb" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Linked Staff Member</label>
                <select value={form.staffName} onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">None</option>
                  {business.staff.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {form.role !== 'viewer' && (
              <div className={`rounded-xl p-3 border ${ROLE_CONFIG[form.role].badge}`}>
                <p className="text-xs font-semibold mb-0.5">{ROLE_CONFIG[form.role].label} Access</p>
                <p className="text-xs opacity-80">{ROLE_CONFIG[form.role].desc}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addUser} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Send Invite</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Permission matrix modal */}
      {showPerms && (
        <Modal title="Permission Matrix" onClose={() => setShowPerms(false)}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-500 py-2 pr-4">Page</th>
                  {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => (
                    <th key={r} className={`text-center py-2 px-3 ${ROLE_CONFIG[r].color}`}>{ROLE_CONFIG[r].label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAGE_PERMISSIONS.map(({ page, label }) => (
                  <tr key={page} className="border-b border-slate-800/40">
                    <td className="text-slate-400 py-2 pr-4">{label}</td>
                    {(Object.keys(ROLE_CONFIG) as UserRole[]).map(role => (
                      <td key={role} className="text-center py-2 px-3">
                        {canAccess(role, page)
                          ? <Check size={14} className="text-emerald-400 mx-auto" />
                          : <X size={14} className="text-slate-700 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
