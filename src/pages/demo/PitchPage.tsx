import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ChevronRight, Zap, AlertTriangle, CheckCircle, Calendar, Package, RefreshCw, CreditCard, Bell, Users, Smartphone, Car, Home, Dumbbell, Shirt, Wrench, GraduationCap, Truck, Briefcase } from 'lucide-react';

const problems = [
  { icon: '📱', title: 'WhatsApp chaos', desc: 'Bookings, payments, and follow-ups buried in chat threads' },
  { icon: '📊', title: 'Excel tracking', desc: 'Manual spreadsheets with no customer history or alerts' },
  { icon: '📓', title: 'Paper notebooks', desc: 'Package balances counted by hand, staff tasks untracked' },
  { icon: '🔔', title: 'Missed renewals', desc: 'Subscriptions expire silently — revenue walks out the door' },
  { icon: '💸', title: 'Unpaid customers', desc: 'No system to track who owes what and since when' },
  { icon: '👥', title: 'Staff blind spots', desc: 'No daily task visibility — managers can\'t hold staff accountable' },
];

const engines = [
  { icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Booking Engine', desc: 'Customer-facing booking page + staff dashboard' },
  { icon: Package, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Package Engine', desc: 'Session tracking per customer with balance progress' },
  { icon: RefreshCw, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Subscription Engine', desc: 'Renewal tracking, expiry alerts, MRR dashboard' },
  { icon: CreditCard, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Payment Engine', desc: 'Cash, Whish, OMT, Bank Transfer — all tracked manually' },
  { icon: Bell, color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Reminder Engine', desc: 'WhatsApp-ready messages for renewals, unpaid, expiry' },
];

const beforeAfter = [
  { before: 'WhatsApp messages everywhere', after: 'One organized dashboard' },
  { before: 'No customer history or profile', after: 'Full customer profiles + history' },
  { before: 'Manual payment tracking in notes', after: 'Payment ledger — all methods tracked' },
  { before: 'Forgotten renewals = lost revenue', after: 'Automatic expiry alerts + reminders' },
  { before: 'No staff accountability', after: 'Daily task board with status tracking' },
  { before: 'Package balances on paper', after: 'Real-time session balance per customer' },
];

const businesses = [
  { icon: Car, name: 'Car Wash', engines: ['Booking', 'Package', 'Subscription'] },
  { icon: Home, name: 'Cleaning', engines: ['Booking', 'Subscription', 'Payment'] },
  { icon: Dumbbell, name: 'Gym / Academy', engines: ['Package', 'Subscription', 'Reminder'] },
  { icon: Shirt, name: 'Laundry', engines: ['Booking', 'Package', 'Payment'] },
  { icon: Wrench, name: 'Maintenance', engines: ['Subscription', 'Tasks', 'Reminder'] },
  { icon: GraduationCap, name: 'Training Center', engines: ['Package', 'Booking', 'Payment'] },
  { icon: Truck, name: 'Delivery', engines: ['Subscription', 'Tasks', 'Reminder'] },
  { icon: Briefcase, name: 'Consulting', engines: ['Booking', 'Subscription', 'Payment'] },
];

const pricing = [
  { name: 'Starter', price: 19, desc: 'Small businesses getting organized', features: ['Booking engine', 'Up to 50 customers', 'WhatsApp reminders', 'Basic reports'], highlight: false },
  { name: 'Growth', price: 49, desc: 'Teams managing packages & subscriptions', features: ['Everything in Starter', 'Package tracking', 'Subscription renewals', 'Payment ledger', 'Staff tasks'], highlight: true },
  { name: 'Pro', price: 99, desc: 'Full operational control', features: ['Everything in Growth', 'Advanced reports', 'Customer portal', 'Multi-staff management', 'Priority support'], highlight: false },
  { name: 'Enterprise', price: null, desc: 'Multi-branch businesses', features: ['Custom setup', 'Multi-location dashboard', 'Dedicated support', 'Custom integrations'], highlight: false },
];

const flow = [
  { n: '1', title: 'Customer visits business page', desc: 'Sees services, packages, subscriptions → books online' },
  { n: '2', title: 'Booking lands in dashboard', desc: 'Staff gets assigned, task appears on Kanban board' },
  { n: '3', title: 'Service completed → session logged', desc: 'Package balance auto-reduces, payment tracked' },
  { n: '4', title: 'Renewal approaching', desc: 'WhatsApp reminder prepared and sent to customer' },
  { n: '5', title: 'Customer renews', desc: 'Revenue captured, subscription extended, cycle repeats' },
];

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav with breadcrumb */}
      <nav className="border-b border-slate-800 px-6 lg:px-12 h-14 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
        <nav className="flex items-center gap-1.5 text-xs">
          <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Home</span>
          </Link>
          <ChevronRight size={11} className="text-slate-700" />
          <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center"><Zap size={8} className="text-white" /></div>
            <span className="hidden sm:block font-bold text-sm text-white">RepeatlyOS</span>
          </Link>
          <ChevronRight size={11} className="text-slate-700" />
          <span className="text-white font-semibold">Sales Pitch Deck</span>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-all hidden sm:block">Dashboard</Link>
          <Link to="/customer/portal" className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-all hidden sm:block">Customer View</Link>
          <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Open Demo →</Link>
        </div>
      </nav>

      {/* Slide 1 — Hero */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 lg:px-12 py-16">
        <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/25 rounded-full px-4 py-1.5 mb-6">
          <Zap size={12} className="text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">RepeatlyOS — Sales Pitch Deck</span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
          The operating system<br />
          <span className="text-blue-400">for repeat-service businesses.</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl leading-relaxed mb-10">
          Bookings, packages, subscriptions, payments, staff tasks, and WhatsApp reminders — all from one dashboard. Built for Lebanon and Gulf service businesses.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
            View Live Demo <ArrowRight size={18} />
          </Link>
          <Link to="/customer/portal" className="flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-8 py-4 rounded-xl transition-colors">
            <Smartphone size={16} /> Customer View
          </Link>
        </div>
      </section>

      {/* Slide 2 — The Problem */}
      <section className="px-6 lg:px-12 py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-red-400 text-sm font-semibold uppercase tracking-wider">The Problem</p>
          </div>
          <h2 className="text-4xl font-black mb-3">Businesses are losing repeat revenue<br className="hidden lg:block" /> in WhatsApp, Excel, and notebooks.</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl">Every missed renewal, forgotten follow-up, and uncollected balance is money left on the table.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map(p => (
              <div key={p.title} className="bg-slate-900 border border-red-500/15 rounded-xl p-5 hover:border-red-500/30 transition-colors">
                <span className="text-2xl mb-3 block">{p.icon}</span>
                <h3 className="text-white font-bold mb-1.5">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 3 — The Solution */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-emerald-400" />
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">The Solution</p>
          </div>
          <h2 className="text-4xl font-black mb-3">One system for every repeat customer.</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl">5 integrated engines working together to run your business operations end-to-end.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {engines.map(e => (
              <div key={e.label} className={`bg-slate-900 border rounded-xl p-4 ${e.color.split(' ').filter(c => c.startsWith('border')).join(' ')}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 border ${e.color.split(' ').filter(c => !c.startsWith('text-')).join(' ')}`}>
                  <e.icon size={16} className={e.color.split(' ').find(c => c.startsWith('text-'))} />
                </div>
                <p className="text-white font-bold text-sm mb-1">{e.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 4 — Before vs After */}
      <section className="px-6 lg:px-12 py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black mb-10 text-center">Before RepeatlyOS vs After</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <p className="text-red-400 font-bold text-sm uppercase tracking-wider">Before RepeatlyOS</p>
              </div>
              <div className="space-y-2.5">
                {beforeAfter.map(b => (
                  <div key={b.before} className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-3">
                    <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-sm">{b.before}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider">After RepeatlyOS</p>
              </div>
              <div className="space-y-2.5">
                {beforeAfter.map(b => (
                  <div key={b.after} className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-4 py-3">
                    <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-sm">{b.after}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 5 — Who can use it */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-blue-400" />
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Who Can Use It</p>
          </div>
          <h2 className="text-4xl font-black mb-3">Built for every repeat-service business.</h2>
          <p className="text-slate-400 text-lg mb-10">If your customers come back regularly, RepeatlyOS is your operating system.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {businesses.map(b => (
              <div key={b.name} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                  <b.icon size={18} className="text-slate-400" />
                </div>
                <p className="text-white font-semibold text-sm mb-2">{b.name}</p>
                <div className="flex flex-wrap gap-1">
                  {b.engines.map(e => (
                    <span key={e} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 6 — Business flow */}
      <section className="px-6 lg:px-12 py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black mb-3 text-center">How a typical business works with RepeatlyOS</h2>
          <p className="text-slate-400 text-center mb-12">The full repeat-customer lifecycle — from first booking to long-term retention.</p>
          <div className="space-y-4">
            {flow.map((f, i) => (
              <div key={f.n} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">{f.n}</div>
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className="text-white font-bold mb-1">{f.title}</p>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
                {i < flow.length - 1 && (
                  <div className="absolute left-[calc(2.25rem/2)] mt-10 h-4 w-0.5 bg-blue-600/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 7 — Dashboard preview callout */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black mb-3 text-center">Live dashboard preview</h2>
          <p className="text-slate-400 text-center mb-10">Everything the business owner needs visible in one screen.</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Today\'s Bookings', value: '18', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Active Subscriptions', value: '126', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Expiring This Week', value: '14', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Unpaid Customers', value: '22', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              { label: 'Revenue This Month', value: '$8,420', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Sessions Remaining', value: '312', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            ].map(k => (
              <div key={k.label} className={`rounded-xl border p-4 text-center ${k.bg}`}>
                <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                <p className="text-slate-400 text-xs mt-1">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              Open Live Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Slide 8 — Customer portal preview */}
      <section className="px-6 lg:px-12 py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Smartphone size={16} className="text-blue-400" />
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Customer Portal</p>
          </div>
          <h2 className="text-4xl font-black mb-3">What your customers see on their phone.</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">Customers get a mobile-first portal with their booking, package balance, subscription status, and payment history — shared via WhatsApp link.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {['Upcoming booking', 'Package sessions left', 'Subscription renewal date', 'Payment status', 'Service history', 'Reschedule request', 'WhatsApp contact', 'Payment proof upload'].map(f => (
              <div key={f} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                <p className="text-slate-300 text-xs">{f}</p>
              </div>
            ))}
          </div>
          <Link to="/customer/portal" className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-8 py-3.5 rounded-xl transition-colors">
            <Smartphone size={16} /> Open Customer Portal Demo
          </Link>
        </div>
      </section>

      {/* Slide 9 — Pricing */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black mb-3 text-center">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-center mb-12">Start with a demo. No credit card required.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricing.map(p => (
              <div key={p.name} className={`rounded-2xl p-5 border relative ${p.highlight ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-800'}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
                )}
                <p className={`font-bold text-lg mb-1 ${p.highlight ? 'text-white' : 'text-white'}`}>{p.name}</p>
                <div className="mb-2">
                  {p.price ? (
                    <span className={`text-3xl font-black ${p.highlight ? 'text-white' : 'text-white'}`}>${p.price}<span className={`text-sm font-normal ${p.highlight ? 'text-blue-200' : 'text-slate-400'}`}>/mo</span></span>
                  ) : (
                    <span className="text-2xl font-black text-white">Custom</span>
                  )}
                </div>
                <p className={`text-xs mb-4 ${p.highlight ? 'text-blue-200' : 'text-slate-400'}`}>{p.desc}</p>
                <div className="space-y-2">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={12} className={p.highlight ? 'text-blue-200' : 'text-emerald-400'} />
                      <span className={`text-xs ${p.highlight ? 'text-blue-100' : 'text-slate-300'}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to={p.name === 'Enterprise' ? '/dashboard/branches' : '/dashboard'} className={`mt-4 block text-center text-xs font-semibold py-2 rounded-lg transition-colors ${p.highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                  {p.name === 'Enterprise' ? 'See multi-branch demo' : 'View demo'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 10 — Final CTA */}
      <section className="px-6 lg:px-12 py-24 text-center border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={24} className="text-blue-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            Show clients a professional system,<br className="hidden sm:block" />
            <span className="text-blue-400"> not a WhatsApp mess.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">RepeatlyOS gives your business the structure, visibility, and automation it needs to grow repeat revenue.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl transition-colors text-lg">
              Open Dashboard Demo <ArrowRight size={18} />
            </Link>
            <Link to="/demo/setup" className="w-full sm:w-auto border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-10 py-4 rounded-xl transition-colors text-center">
              Try Setup Flow
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 mt-8">
            {['Frontend demo only', 'No login required', 'No backend needed'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-slate-600 text-xs">
                <CheckCircle size={11} className="text-emerald-600" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility bar */}
      <div className="border-t border-slate-800 px-6 lg:px-12 py-6 bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-500 text-xs text-center mb-4 uppercase tracking-wider font-medium">Built for local business reality</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['💵 Cash payments', '📲 Whish / OMT tracking', '💬 WhatsApp reminders', '📄 Manual payment proof', '🇱🇧 Lebanese business flows', '🌍 Gulf market ready', '📋 Multi-service templates', '📱 Mobile-first customer portal'].map(f => (
              <span key={f} className="text-slate-400 text-sm">{f}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 px-6 py-4 text-center">
        <p className="text-slate-600 text-xs">RepeatlyOS · Frontend-only demo · No backend connected</p>
      </footer>
    </div>
  );
}
