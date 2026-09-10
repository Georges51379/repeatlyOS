import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Plus, Trash2, Check, ShoppingBag, Warehouse, DollarSign, Globe, Smartphone } from 'lucide-react';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

const sections = ['Business Profile','Services','Products','Packages','Subscription Plans','Staff Members','Payment Methods','Reminder Templates','Appearance','Finance & Tax','Public Page','Demo Controls'];

export default function SettingsPage() {
  const { business, theme, setTheme, currency, setCurrency, vatRate, setVatRate, exchangeRate, setExchangeRate, sidebarCollapsed, setSidebarCollapsed } = useDemo();
  const [activeSection, setActiveSection] = useState('Business Profile');
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState(false);
  const [vatInput, setVatInput] = useState(String(vatRate));
  const [rateInput, setRateInput] = useState(String(exchangeRate));

  const save = () => {
    setVatRate(Number(vatInput) || 0);
    setExchangeRate(Number(rateInput) || 89500);
    setSaved(true);
    setToast('Settings saved. Demo only — no backend connected.');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-lg">Settings</h2>
        <p className="text-slate-500 text-sm">Configure {business.name}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-48 shrink-0">
          <nav className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {sections.map(s => (
              <button key={s} onClick={() => setActiveSection(s)} className={`w-full text-left px-4 py-2.5 text-xs transition-colors border-b border-slate-800/60 last:border-0 ${activeSection === s ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                {s}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          {activeSection === 'Business Profile' && (
            <div className="space-y-5">
              <h3 className="text-white font-semibold">Business Profile</h3>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-3xl">{business.emoji}</div>
                <div>
                  <button className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors">Change Logo</button>
                  <p className="text-slate-500 text-xs mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label:'Business Name', value: business.name },
                  { label:'Category', value: business.category },
                  { label:'Phone Number', value:'+961 1 234 567' },
                  { label:'WhatsApp Number', value:'+961 70 234 567' },
                  { label:'Area / City', value: business.area },
                  { label:'Working Hours', value:'8:00 AM – 7:00 PM' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-slate-400 mb-1 block font-medium">{f.label}</label>
                    <input defaultValue={f.value} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block font-medium">Description</label>
                  <textarea rows={2} defaultValue={business.tagline} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
              </div>
            </div>
          )}
          {activeSection === 'Services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Services</h3>
                <button className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors"><Plus size={12} /> Add Service</button>
              </div>
              {business.services.map(s => (
                <div key={s.name} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input defaultValue={s.name} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                    <input defaultValue={`$${s.price}`} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                    <input defaultValue={s.duration} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                  <button className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          {activeSection === 'Products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Products & Inventory</h3>
                <div className="flex items-center gap-2">
                  <Link to="/dashboard/products" className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    <ShoppingBag size={12} /> Products
                  </Link>
                  <Link to="/dashboard/inventory" className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    <Warehouse size={12} /> Inventory
                  </Link>
                </div>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Sell physical items alongside your services — drinks, snacks, retail goods, electronics, parts, or anything specific to your business. Manage catalog and pricing on the Products page, or go deeper with full stock control, purchase orders, and suppliers on the Inventory page.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {business.products.slice(0, 6).map(p => (
                  <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-2.5">
                    <span className="text-lg shrink-0">{p.image}</span>
                    <div className="min-w-0">
                      <p className="text-slate-200 text-xs font-medium truncate">{p.name}</p>
                      <p className="text-slate-500 text-xs">${p.price} · {p.stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/dashboard/products" className="block text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">
                  Manage Catalog ({business.products.length}) →
                </Link>
                <Link to="/dashboard/inventory" className="block text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                  Full Inventory →
                </Link>
              </div>
            </div>
          )}
          {activeSection === 'Staff Members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Staff Members</h3>
                <button className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors"><Plus size={12} /> Add Staff</button>
              </div>
              {business.staff.map(s => (
                <div key={s} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">{s[0]}</div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input defaultValue={s} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                    <input defaultValue="Senior Technician" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                    <input defaultValue="+961 70 000 000" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                  <button className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          {activeSection === 'Payment Methods' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Accepted Payment Methods</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Cash','Bank Transfer','Whish','OMT','Card Later','Cheque'].map(m => (
                  <label key={m} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer hover:border-slate-600 transition-colors">
                    <input type="checkbox" defaultChecked={['Cash','Bank Transfer','Whish','OMT','Card Later'].includes(m)} className="w-4 h-4 accent-blue-500" />
                    <span className="text-slate-300 text-sm">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {activeSection === 'Reminder Templates' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Reminder Templates</h3>
              {[
                { type:'Booking Confirmation', msg:`Hello {customer_name}, your {service} is confirmed for {date} at {time}. — ${business.name}.` },
                { type:'Renewal Reminder', msg:`Hello {customer_name}, your {plan} renews on {renewal_date}. Amount: ${business.subscription.price}. — ${business.name}.` },
                { type:'Unpaid Payment', msg:`Hello {customer_name}, your balance of ${'{amount}'} is overdue. Please settle soon. — ${business.name}.` },
                { type:'Package Expiry', msg:`Hello {customer_name}, your {package_name} expires on {expiry_date}. — ${business.name}.` },
              ].map(t => (
                <div key={t.type} className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">{t.type}</label>
                  <textarea rows={2} defaultValue={t.msg} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
              ))}
            </div>
          )}
          {activeSection === 'Appearance' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Appearance</h3>
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {([['dark','Dark','🌙'],['light','Light','☀️'],['auto','Auto','🖥️']] as const).map(([val,label,icon]) => (
                    <button key={val} onClick={() => setTheme(val)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === val ? 'border-blue-500 bg-blue-600/15 text-blue-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}>
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-slate-600 text-xs mt-2">Auto follows your device's system preference.</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Sidebar</p>
                <label className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer hover:border-slate-600 transition-colors">
                  <div>
                    <p className="text-slate-200 text-sm font-medium">Compact sidebar</p>
                    <p className="text-slate-500 text-xs">Collapse to icon-only mode to save space</p>
                  </div>
                  <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`w-11 h-6 rounded-full transition-colors relative ${sidebarCollapsed ? 'bg-blue-600' : 'bg-slate-600'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sidebarCollapsed ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                  </button>
                </label>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">PWA / Install App</p>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shrink-0">⚡</div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Install RepeatlyOS</p>
                    <p className="text-slate-500 text-xs mt-0.5">Add to home screen for instant access, offline support, and a native app experience.</p>
                  </div>
                  <button onClick={() => setToast('PWA install prompt triggered. Demo only — use "Add to Home Screen" in your browser.')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0">
                    <Smartphone size={13}/> Install
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'Finance & Tax' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Finance & Tax Settings</h3>
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Display Currency</p>
                <div className="grid grid-cols-3 gap-2">
                  {([['USD','USD $','🇺🇸'],['LBP','LBP LL','🇱🇧'],['BOTH','Both','🔄']] as const).map(([val,label,flag]) => (
                    <button key={val} onClick={() => setCurrency(val)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-sm font-semibold ${currency === val ? 'border-blue-500 bg-blue-600/15 text-blue-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}>
                      <span className="text-xl">{flag}</span>{label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><Globe size={11}/> USD → LBP Exchange Rate</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"/>
                    <span className="text-slate-500 text-xs">LL</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">1 USD = LL {Number(rateInput).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><DollarSign size={11}/> VAT / TVA Rate (%)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" value={vatInput} onChange={e => setVatInput(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"/>
                    <span className="text-slate-500 text-xs">%</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">{vatInput === '0' ? 'No VAT applied' : `${vatInput}% added to all invoices`}</p>
                </div>
              </div>
              {Number(vatInput) > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
                  💡 VAT of {vatInput}% will be shown on invoices and partial payment plans. Example: $100 service → ${(100 * (1 + Number(vatInput)/100)).toFixed(2)} with VAT.
                </div>
              )}
            </div>
          )}

          {activeSection === 'Public Page' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Public Page Settings</h3>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-2">
                <p className="text-xs text-slate-500 mb-2 font-medium">Your Public Booking URL</p>
                <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2.5">
                  <span className="text-slate-400 text-sm">repeatlyos.app/</span>
                  <span className="text-blue-400 font-semibold text-sm">{business.name.toLowerCase().replace(/\s+/g,'-')}</span>
                </div>
                <p className="text-slate-600 text-xs mt-2">Demo only — not a real URL</p>
              </div>
              {[{label:'Show Reviews',val:true},{label:'Show Packages',val:true},{label:'Show Subscription Plans',val:true},{label:'Allow Direct Booking',val:true},{label:'Show WhatsApp Button',val:true},{label:'Show Business Hours',val:false}].map(s => (
                <label key={s.label} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer hover:border-slate-600 transition-colors">
                  <span className="text-slate-300 text-sm">{s.label}</span>
                  <input type="checkbox" defaultChecked={s.val} className="w-4 h-4 accent-blue-500" />
                </label>
              ))}
            </div>
          )}
          {activeSection === 'Demo Controls' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Demo Controls</h3>
              <p className="text-slate-500 text-xs">Tools for presenting this demo to clients — none of these affect real data.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => setToast('Demo data reset. Refresh the page to start clean.')} className="text-left bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-colors">
                  <p className="text-white text-sm font-medium mb-1">🔄 Reset Demo Data</p>
                  <p className="text-slate-500 text-xs">Restore all values to their original demo state.</p>
                </button>
                <button onClick={() => { sessionStorage.removeItem('demo-welcome-seen'); setToast('Welcome screen will show again on next dashboard visit.'); }} className="text-left bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-colors">
                  <p className="text-white text-sm font-medium mb-1">👋 Replay Welcome Screen</p>
                  <p className="text-slate-500 text-xs">Show the onboarding overlay again.</p>
                </button>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <p className="text-white text-sm font-medium mb-1">⌨️ Keyboard Shortcuts</p>
                  <p className="text-slate-500 text-xs">Press <kbd className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs">?</kbd> anywhere in the dashboard.</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <p className="text-white text-sm font-medium mb-1">🔀 Switch Businesses</p>
                  <p className="text-slate-500 text-xs">Use the dropdown in the top bar to demo other industries.</p>
                </div>
              </div>
            </div>
          )}
          {!['Business Profile','Services','Products','Staff Members','Payment Methods','Reminder Templates','Appearance','Finance & Tax','Public Page','Demo Controls'].includes(activeSection) && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">{activeSection}</p>
              <p className="text-slate-600 text-xs mt-1">Configuration options will appear here.</p>
            </div>
          )}
          <div className="mt-6 pt-5 border-t border-slate-800 flex justify-end">
            <button onClick={save} className={`flex items-center gap-2 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
              {saved ? <Check size={14} /> : <Save size={14} />} {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
