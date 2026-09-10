import { useState, useMemo } from 'react';
import { Search, X, Phone, MapPin, Calendar, Download, Upload, Plus, MessageCircle, CreditCard, Star, TrendingUp, Users, Tag, Settings2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import QuickReply from '../../components/QuickReply';
import CustomerJourney from '../../components/CustomerJourney';
import ChurnBadge, { calcChurnScore } from '../../components/ChurnBadge';
import EmptyState from '../../components/EmptyState';
import CSVImport from '../../components/CSVImport';
import { useDemo } from '../../context/DemoContext';

const BASE_FILTERS = ['All','Active','Package','Subscription','Unpaid','Expiring Soon'];

export default function CustomersPage() {
  const { business, tags, customerTags, setCustomerTags, customFields, customerFieldValues, setCustomerFieldValues } = useDemo();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [filter, setFilter] = useState('All');
  
  const [fieldEditId, setFieldEditId] = useState<number | null>(null);
  const [fieldEditValues, setFieldEditValues] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<typeof business.customers[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState('');
  const [addForm, setAddForm] = useState({ name: '', phone: '', area: '', type: 'Subscription', notes: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => business.customers.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const mf = filter === 'All' ? true : filter === 'Active' ? c.status === 'Active' : filter === 'Package' ? c.type === 'Package' : filter === 'Subscription' ? c.type === 'Subscription' : filter === 'Unpaid' ? c.balance < 0 : c.status === 'Expiring Soon';
    const mt = tagFilter === null ? true : (customerTags[c.id] || []).includes(tagFilter);
    return ms && mf && mt;
  }), [business.customers, search, filter]);

  const stats = useMemo(() => ({
    total: business.customers.length,
    active: business.customers.filter(c => c.status === 'Active').length,
    unpaid: business.customers.filter(c => c.balance < 0).length,
    expiring: business.customers.filter(c => c.status === 'Expiring Soon').length,
  }), [business.customers]);

  const openProfile = (c: typeof business.customers[0]) => {
    setSelected(c);
    setDrawerOpen(false);
    setTimeout(() => setDrawerOpen(true), 10);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 300);
  };

  const customerBookings = selected ? business.bookings.filter(b => b.customer === selected.name) : [];
  const totalSpent = customerBookings.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Customers</h2>
          <p className="text-slate-500 text-sm">{business.customers.length} customers · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setToast('Export generated. Demo only.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export CSV
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Upload size={12} /> Import CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Customers" value={stats.total} icon={Users} accent="blue" />
        <StatCard title="Active" value={stats.active} icon={TrendingUp} accent="emerald" />
        <StatCard title="Unpaid Balances" value={stats.unpaid} icon={CreditCard} accent="red" />
        <StatCard title="Expiring Soon" value={stats.expiring} icon={Star} accent="amber" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {BASE_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{f}</button>
          ))}
          <span className="text-slate-700 text-xs px-1">|</span>
          {tags.map(t => (
            <button key={t.id} onClick={() => setTagFilter(tagFilter === t.id ? null : t.id)} className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${tagFilter === t.id ? t.color + ' ring-1 ring-current ring-opacity-40' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'}`}>
              <Tag size={9} className="inline mr-1" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                {['Customer','Phone','Type','Plan','Last Visit','Balance','Status','Risk'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => openProfile(c)} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/40 to-blue-700/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0 group-hover:from-blue-600/60 transition-all">{c.name[0]}</div>
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{c.name}</p>
                        <p className="text-slate-600 text-xs">{c.area}</p>
                        {(customerTags[c.id] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(customerTags[c.id] || []).map(tid => {
                              const tag = tags.find(t => t.id === tid);
                              return tag ? <span key={tid} className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${tag.color}`}>{tag.label}</span> : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.phone}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${c.type === 'Subscription' ? 'text-cyan-400' : c.type === 'Package' ? 'text-purple-400' : 'text-slate-400'}`}>{c.type}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{c.plan}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.lastVisit}</td>
                  <td className="px-4 py-3">
                    {c.balance < 0 ? <span className="text-red-400 text-xs font-bold">-${Math.abs(c.balance)}</span> : <span className="text-emerald-400 text-xs font-medium">✓ Settled</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    {(() => { const cs = calcChurnScore(c); return <span className={`text-xs font-bold ${cs.color}`}>{cs.label}</span>; })()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <EmptyState type="customers" search={search} onClear={() => { setSearch(''); setFilter('All'); setTagFilter(null); }} onCreate={() => setShowAdd(true)} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 border-t border-slate-800">
          <p className="text-slate-600 text-xs">{filtered.length} of {business.customers.length} customers shown</p>
        </div>
      </div>

      {/* Profile Drawer */}
      {selected && (
        <>
          <div className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeDrawer} />
          <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-slate-950 border-l border-slate-800 z-50 overflow-y-auto scrollbar-thin transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
              <h3 className="text-white font-bold">Customer Profile</h3>
              <button onClick={closeDrawer} className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/40 to-blue-700/20 flex items-center justify-center text-blue-400 text-2xl font-black shadow-lg">{selected.name[0]}</div>
                <div>
                  <h4 className="text-white font-bold text-lg">{selected.name}</h4>
                  <div className="flex items-center gap-2 mt-1"><StatusBadge status={selected.status} /></div>
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-sm"><Phone size={13} className="text-slate-500" />{selected.phone}</div>
                  <button onClick={() => setToast(`WhatsApp opened. Demo only.`)} className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-1.5 rounded-lg transition-colors"><MessageCircle size={15} /></button>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm"><MapPin size={13} className="text-slate-500" />{selected.area}</div>
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Calendar size={13} className="text-slate-500" />Last visit: {selected.lastVisit}</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{customerBookings.length}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Total bookings</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 font-bold text-lg">${totalSpent}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Total spent</p>
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-400 font-medium mb-1">📌 Staff Notes</p>
                  <p className="text-slate-300 text-sm">{selected.notes}</p>
                </div>
              )}

              {/* Plan */}
              {selected.plan !== '—' && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs text-blue-400 font-medium mb-0.5">{selected.type}</p>
                  <p className="text-white font-semibold">{selected.plan}</p>
                </div>
              )}

              {/* Balance */}
              <div className={`rounded-xl p-3 flex items-center justify-between ${selected.balance < 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                <span className="text-slate-300 text-sm font-medium">Outstanding Balance</span>
                {selected.balance < 0 ? <span className="text-red-400 font-bold">-${Math.abs(selected.balance)}</span> : <span className="text-emerald-400 font-bold">✓ Settled</span>}
              </div>

              {/* Booking history */}
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Booking History</p>
                <div className="space-y-2">
                  {customerBookings.length > 0 ? customerBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 hover:border-slate-700 transition-colors">
                      <div>
                        <p className="text-slate-300 text-xs font-medium">{b.service}</p>
                        <p className="text-slate-500 text-xs">{b.date} · {b.time} · {b.staff}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-600 text-sm">No bookings on record.</div>
                  )}
                </div>
              </div>

              {/* Churn Risk */}
              <ChurnBadge score={calcChurnScore(selected)} showReasons />

              {/* Tags */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tags</p>
                  <button onClick={() => selected && setCustomerTags({ ...customerTags, [selected.id]: [] })} className="text-slate-600 hover:text-red-400 text-xs transition-colors">Clear</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => {
                    const active = (customerTags[selected.id] || []).includes(t.id);
                    return (
                      <button key={t.id} onClick={() => {
                        const cur = customerTags[selected.id] || [];
                        setCustomerTags({ ...customerTags, [selected.id]: active ? cur.filter(id => id !== t.id) : [...cur, t.id] });
                      }} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${active ? t.color + ' ring-1 ring-current ring-opacity-30' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'}`}>
                        {active ? '✓ ' : ''}{t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Custom Fields</p>
                  <div className="space-y-2">
                    {customFields.map(f => {
                      const val = (customerFieldValues[selected.id] || {})[f.id] || '';
                      const isEditing = fieldEditId === f.id;
                      return (
                        <div key={f.id} className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 text-xs w-32 shrink-0">{f.label}</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1">
                              {f.type === 'select' && f.options ? (
                                <select value={fieldEditValues[f.id] || val} onChange={e => setFieldEditValues(v => ({ ...v, [f.id]: e.target.value }))}
                                  className="flex-1 bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                                  <option value="">—</option>
                                  {f.options.map(o => <option key={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                  value={fieldEditValues[f.id] ?? val}
                                  onChange={e => setFieldEditValues(v => ({ ...v, [f.id]: e.target.value }))}
                                  className="flex-1 bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                                  autoFocus />
                              )}
                              <button onClick={() => {
                                const newVal = fieldEditValues[f.id] ?? val;
                                setCustomerFieldValues({ ...customerFieldValues, [selected.id]: { ...(customerFieldValues[selected.id] || {}), [f.id]: newVal } });
                                setFieldEditId(null);
                              }} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Settings2 size={12}/></button>
                            </div>
                          ) : (
                            <button onClick={() => { setFieldEditId(f.id); setFieldEditValues({ [f.id]: val }); }}
                              className="flex-1 text-right text-slate-300 text-xs hover:text-blue-400 transition-colors truncate">
                              {val || <span className="text-slate-700 italic">tap to set</span>}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* WhatsApp Quick Replies */}
              <QuickReply
                customer={{ name: selected.name, phone: selected.phone, plan: selected.plan, balance: selected.balance, lastVisit: selected.lastVisit, status: selected.status }}
                businessName={business.name}
                subscriptionPrice={business.subscription.price}
              />

              {/* Customer Journey Timeline */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <CustomerJourney
                  customer={{ name: selected.name, type: selected.type, plan: selected.plan, status: selected.status, balance: selected.balance, lastVisit: selected.lastVisit }}
                  bookings={customerBookings}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setToast(`WhatsApp reminder sent to ${selected.name}. Demo only.`)} className="flex items-center justify-center gap-1.5 bg-green-600/15 hover:bg-green-600/25 border border-green-600/30 text-green-400 font-medium py-2.5 rounded-xl text-xs transition-colors">
                    <MessageCircle size={13} /> Send Reminder
                  </button>
                  <button onClick={() => setToast(`Payment marked as received for ${selected.name}. Demo only.`)} className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-xs transition-colors">
                    <CreditCard size={13} /> Mark Paid
                  </button>
                </div>
                <button onClick={() => setToast(`Edit customer profile — demo only.`)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-xs transition-colors text-center">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      {showAdd && (
        <Modal title="Add New Customer" onClose={() => setShowAdd(false)} icon={<Users size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Layla Hamdan" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone *</label>
                <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+961 70 ..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Area</label>
                <input value={addForm.area} onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Beirut" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Customer Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Subscription','Package','Walk-in'].map(t => (
                    <button key={t} onClick={() => setAddForm(f => ({ ...f, type: t }))} className={`py-2 rounded-lg text-xs font-medium transition-colors border ${addForm.type === t ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Preferences, access info, special instructions..." rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={() => { if (!addForm.name || !addForm.phone) { setToast('Name and phone are required.'); return; } setShowAdd(false); setToast(`${addForm.name} added. Demo only.`); setAddForm({ name: '', phone: '', area: '', type: 'Subscription', notes: '' }); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Add Customer</button>
            </div>
          </div>
        </Modal>
      )}

      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onImport={(imported) => {
            setToast(`${imported.length} customers imported successfully!`);
            setShowImport(false);
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
