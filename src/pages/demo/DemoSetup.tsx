import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Zap, Calendar, Package, RefreshCw, Truck, Wrench, Briefcase, Plus, X, ChevronRight } from 'lucide-react';

type Step = 0 | 1 | 2 | 3;

const bizTypes = [
  { id: 'appointments', icon: Calendar, label: 'Appointments', desc: 'Salons, clinics, tutors, trainers' },
  { id: 'packages', icon: Package, label: 'Packages', desc: 'Sessions, washes, classes, credits' },
  { id: 'subscriptions', icon: RefreshCw, label: 'Subscriptions', desc: 'Monthly memberships, plans' },
  { id: 'delivery', icon: Truck, label: 'Recurring Delivery', desc: 'Water, laundry, gas, supplies' },
  { id: 'maintenance', icon: Wrench, label: 'Maintenance Contracts', desc: 'AC, plumbing, electrical visits' },
  { id: 'service', icon: Briefcase, label: 'Service Jobs', desc: 'One-time or repeat service jobs' },
];

const mockServices = [
  { id: 1, name: 'Full Wash', price: '15', duration: '45 min' },
  { id: 2, name: 'Interior Deep Clean', price: '35', duration: '90 min' },
  { id: 3, name: 'Exterior Wash', price: '8', duration: '30 min' },
];

const mockCustomers = ['Rami Haddad', 'Maya Saliba', 'Karim Nassar', 'Nour Khoury', 'Elie Khoury'];
const mockStaff = ['Tony', 'Sarah', 'Elie'];

export default function DemoSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [selectedType, setSelectedType] = useState('');
  const [bizName, setBizName] = useState('My Business');
  const [services, setServices] = useState(mockServices);
  const [customers, setCustomers] = useState(mockCustomers);
  const [staff, setStaff] = useState(mockStaff);
  const [newCustomer, setNewCustomer] = useState('');
  const [newStaff, setNewStaff] = useState('');

  const slug = bizName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const steps = [
    { n: 1, label: 'Business Type' },
    { n: 2, label: 'Services & Plans' },
    { n: 3, label: 'Team & Customers' },
    { n: 4, label: 'Go Live' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header with breadcrumb */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
        <nav className="flex items-center gap-1.5 text-xs">
          <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Home</span>
          </Link>
          <ChevronRight size={11} className="text-slate-700" />
          <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center"><Zap size={8} className="text-white" /></div>
            <span>RepeatlyOS</span>
          </Link>
          <ChevronRight size={11} className="text-slate-700" />
          <span className="text-white font-semibold">Demo Setup</span>
          {step > 0 && (
            <>
              <ChevronRight size={11} className="text-slate-700" />
              <span className="text-blue-400 font-medium">Step {step + 1} of 4</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-all hidden sm:block">Skip to Dashboard →</Link>
          <div className="text-xs text-slate-600 bg-slate-800/60 border border-slate-700 rounded-full px-3 py-1 hidden md:block">No backend</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${step >= i ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {step > i ? <Check size={13} /> : s.n}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-medium ${step >= i ? 'text-slate-200' : 'text-slate-600'}`}>{s.label}</p>
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 max-w-8 ${step > i ? 'bg-blue-500' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0 — Choose business type */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">What type of business are you?</h1>
            <p className="text-slate-400 text-sm mb-6">RepeatlyOS adapts to your business model.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {bizTypes.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedType(b.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${selectedType === b.id ? 'border-blue-500 bg-blue-600/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}`}
                >
                  {selectedType === b.id && <Check size={12} className="text-blue-400 absolute" />}
                  <b.icon size={20} className={selectedType === b.id ? 'text-blue-400' : 'text-slate-400'} />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{b.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Business Name</label>
              <input value={bizName} onChange={e => setBizName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={() => selectedType && setStep(1)} disabled={!selectedType} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1 — Services */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Add your services & packages</h1>
            <p className="text-slate-400 text-sm mb-6">These will appear on your public booking page.</p>
            <div className="space-y-3 mb-5">
              {services.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input defaultValue={s.name} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" placeholder="Service name" />
                    <input defaultValue={s.price} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" placeholder="Price $" />
                    <input defaultValue={s.duration} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" placeholder="Duration" />
                  </div>
                  <button onClick={() => setServices(sv => sv.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-400 transition-colors shrink-0"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setServices(sv => [...sv, { id: Date.now(), name: '', price: '', duration: '' }])} className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-slate-600 text-slate-500 hover:text-slate-300 rounded-xl py-2.5 text-sm transition-colors">
                <Plus size={14} /> Add Service
              </button>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mb-5">
              <p className="text-blue-400 text-xs font-medium mb-1">💡 Auto-configured</p>
              <p className="text-slate-300 text-sm">RepeatlyOS will set up package tracking, subscription plans, and a booking engine based on your business type: <strong>{bizTypes.find(b => b.id === selectedType)?.label}</strong></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-3 rounded-xl text-sm transition-colors"><ArrowLeft size={14} /> Back</button>
              <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 2 — Customers & Staff */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Add your team & customers</h1>
            <p className="text-slate-400 text-sm mb-6">You can import or add them individually. Demo shows sample data.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-3">Customers ({customers.length})</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {customers.map(c => (
                    <span key={c} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-xs text-slate-300">
                      {c}
                      <button onClick={() => setCustomers(cs => cs.filter(x => x !== c))} className="text-slate-600 hover:text-red-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCustomer} onChange={e => setNewCustomer(e.target.value)} placeholder="Add customer..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" onKeyDown={e => { if (e.key === 'Enter' && newCustomer.trim()) { setCustomers(cs => [...cs, newCustomer.trim()]); setNewCustomer(''); }}} />
                  <button onClick={() => { if (newCustomer.trim()) { setCustomers(cs => [...cs, newCustomer.trim()]); setNewCustomer(''); }}} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs transition-colors">Add</button>
                </div>
              </div>
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-3">Staff Members ({staff.length})</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {staff.map(s => (
                    <span key={s} className="flex items-center gap-1.5 bg-blue-600/15 border border-blue-500/30 rounded-full px-3 py-1 text-xs text-blue-300">
                      {s}
                      <button onClick={() => setStaff(st => st.filter(x => x !== s))} className="text-blue-600 hover:text-red-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newStaff} onChange={e => setNewStaff(e.target.value)} placeholder="Add staff member..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" onKeyDown={e => { if (e.key === 'Enter' && newStaff.trim()) { setStaff(st => [...st, newStaff.trim()]); setNewStaff(''); }}} />
                  <button onClick={() => { if (newStaff.trim()) { setStaff(st => [...st, newStaff.trim()]); setNewStaff(''); }}} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs transition-colors">Add</button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-3 rounded-xl text-sm transition-colors"><ArrowLeft size={14} /> Back</button>
              <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 3 — Publish */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your business is ready!</h1>
            <p className="text-slate-400 text-sm mb-8">Share your booking page with customers. Manage everything from your dashboard.</p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-5 text-left">
              <p className="text-xs text-slate-500 mb-2 font-medium">Your Public Booking Page</p>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2.5">
                <span className="text-slate-400 text-sm">repeatlyos.app/</span>
                <span className="text-blue-400 font-semibold text-sm">{slug}</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">Demo only — no real page is created</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              {[
                { label: 'Business Name', value: bizName },
                { label: 'Type', value: bizTypes.find(b => b.id === selectedType)?.label || '' },
                { label: 'Services', value: `${services.length} services configured` },
                { label: 'Team', value: `${staff.length} staff members` },
                { label: 'Customers', value: `${customers.length} initial customers` },
                { label: 'Status', value: '✓ Ready to go live' },
              ].map(item => (
                <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">{item.label}</p>
                  <p className="text-slate-200 text-sm font-medium mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-base transition-colors">
              Open Demo Dashboard <ArrowRight size={18} />
            </button>
            <p className="text-slate-600 text-xs mt-3">No backend connected — this is a frontend demo</p>
          </div>
        )}
      </div>
    </div>
  );
}
