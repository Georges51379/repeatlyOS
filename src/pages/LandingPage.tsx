import { Link } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle, AlertTriangle, Calendar, Package, RefreshCw, CreditCard, Bell, Car, Home, Dumbbell, Shirt, Wrench, GraduationCap, Truck, Briefcase, Star, Users, BarChart3, Smartphone } from 'lucide-react';

const painPoints = [
  { icon: '📱', title: 'Missed renewals', desc: 'Subscriptions expire silently while revenue walks out the door' },
  { icon: '💬', title: 'Forgotten follow-ups', desc: 'Customer reminders buried in WhatsApp threads' },
  { icon: '💸', title: 'Unpaid customers', desc: 'No system to track who owes what and since when' },
  { icon: '📓', title: 'Lost package balances', desc: 'Session counts managed on paper or memory' },
  { icon: '👥', title: 'No staff visibility', desc: 'Managers can\'t hold team accountable without task tracking' },
  { icon: '🏦', title: 'Manual payment chaos', desc: 'Cash, Whish, OMT, transfers tracked in scattered notes' },
];

const engines = [
  { icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Booking Engine', desc: 'Customer booking page + staff schedule dashboard' },
  { icon: Package, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Package Engine', desc: 'Session balance tracking per customer with auto-alerts' },
  { icon: RefreshCw, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Subscription Engine', desc: 'Renewal tracking, expiry alerts, MRR visibility' },
  { icon: CreditCard, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Payment Engine', desc: 'Cash, Whish, OMT, Bank Transfer — all logged manually' },
  { icon: Bell, color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Reminder Engine', desc: 'WhatsApp-ready messages for renewals, unpaid, expiry' },
];

const beforeAfter = [
  { before: 'WhatsApp messages everywhere', after: 'One organized dashboard' },
  { before: 'No customer history', after: 'Full customer profiles & history' },
  { before: 'Manual payment tracking', after: 'Payment ledger — all methods' },
  { before: 'Forgotten renewals', after: 'Automatic expiry alerts' },
  { before: 'No staff accountability', after: 'Staff task board daily' },
];

const useCases = [
  { icon: Car, name: 'Car Wash', engines: ['Booking','Package','Subscription'] },
  { icon: Home, name: 'Cleaning', engines: ['Booking','Subscription','Reminder'] },
  { icon: Dumbbell, name: 'Gym / Academy', engines: ['Package','Subscription','Reminder'] },
  { icon: Shirt, name: 'Laundry', engines: ['Booking','Package','Payment'] },
  { icon: Wrench, name: 'Maintenance', engines: ['Subscription','Tasks','Reminder'] },
  { icon: GraduationCap, name: 'Training Center', engines: ['Package','Booking','Payment'] },
  { icon: Truck, name: 'Delivery', engines: ['Subscription','Tasks','Reminder'] },
  { icon: Briefcase, name: 'Consulting', engines: ['Booking','Subscription','Payment'] },
];

const steps = [
  { n: '01', title: 'Create your business page', desc: 'Set up services, packages, and subscription plans in minutes.' },
  { n: '02', title: 'Accept bookings online', desc: 'Customers book through your branded page. Staff gets assigned automatically.' },
  { n: '03', title: 'Track customers, payments, renewals', desc: 'Every customer\'s history, balance, and renewal date in one profile.' },
  { n: '04', title: 'Send reminders, manage staff', desc: 'WhatsApp-ready messages and a daily task board for your team.' },
];

const pricing = [
  { name: 'Starter', price: 19, desc: 'For small businesses getting organized', features: ['Booking engine', 'Up to 50 customers', 'WhatsApp reminders', 'Basic reports'], highlight: false },
  { name: 'Growth', price: 49, desc: 'Teams managing packages & subscriptions', features: ['Everything in Starter', 'Package tracking', 'Subscription renewals', 'Payment ledger', 'Staff tasks'], highlight: true },
  { name: 'Pro', price: 99, desc: 'Full operational control', features: ['Everything in Growth', 'Advanced reports', 'Customer portal', 'Multi-staff', 'Priority support'], highlight: false },
  { name: 'Enterprise', price: null, desc: 'Multi-branch businesses', features: ['Custom setup', 'Multi-location dashboard', 'Dedicated support', 'Custom integrations'], highlight: false },
];

const whyUs = [
  'Reduce missed renewals', 'Track customer balances', 'Organize staff daily', 'Sell more packages',
  'Improve follow-up rate', 'Look more professional', 'Replace WhatsApp chaos', 'Track every payment',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Demo banner */}
      <div className="bg-blue-600/20 border-b border-blue-500/20 text-center py-2 px-4">
        <p className="text-xs text-blue-300">Frontend demo — no backend connected · For demonstration purposes only</p>
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 h-14 border-b border-slate-800/60 sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-glow-blue"><Zap size={12} className="text-white" /></div>
          <span className="font-bold text-sm tracking-tight">RepeatlyOS</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/demo/pitch" className="text-xs text-slate-400 hover:text-white transition-colors link-underline">Pitch Deck</Link>
          <Link to="/business/elite-carwash" className="text-xs text-slate-400 hover:text-white transition-colors link-underline">Business Page</Link>
          <Link to="/customer/portal" className="text-xs text-slate-400 hover:text-white transition-colors link-underline">Customer Portal</Link>
          <Link to="/demo/setup" className="text-xs text-slate-400 hover:text-white transition-colors link-underline">Setup Demo</Link>
        </div>
        <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:scale-[1.02] press shadow-lg shadow-blue-500/20">Dashboard →</Link>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-12 pt-24 pb-16 text-center max-w-5xl mx-auto overflow-hidden">
        {/* Ambient orbs */}
        <div className="orb w-[500px] h-[500px] bg-blue-600 -top-40 left-1/2 -translate-x-1/2 opacity-[0.06] animate-float-slow" />
        <div className="orb w-64 h-64 bg-purple-600 top-10 -left-20 opacity-[0.08] animate-float" />
        <div className="orb w-48 h-48 bg-cyan-500 top-20 -right-10 opacity-[0.06] animate-float-slow" style={{ animationDelay: '3s' }} />

        <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 rounded-full px-4 py-1.5 mb-7">
          <Star size={11} className="text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">Built for Lebanon & Gulf service businesses</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight mb-5">
          Sell once.<br />
          <span className="text-blue-400">Manage repeats forever.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Bookings, packages, subscriptions, renewals, payments, staff tasks, and WhatsApp reminders — all from one operating system.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link to="/dashboard" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            View Demo Dashboard <ArrowRight size={16} />
          </Link>
          <Link to="/demo/setup" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-7 py-3.5 rounded-xl transition-colors text-center border border-slate-700">
            Try Setup Flow
          </Link>
          <Link to="/demo/pitch" className="w-full sm:w-auto border border-slate-700 hover:border-slate-600 text-slate-400 font-medium px-7 py-3.5 rounded-xl transition-colors text-center hidden sm:block">
            Sales Pitch →
          </Link>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { value:'126', label:'Active subscriptions' },
            { value:'18', label:'Upcoming bookings' },
            { value:'14', label:'Renewals tracked' },
            { value:'22', label:'Unpaid detected' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-blue-400 text-2xl font-black">{s.value}</p>
              <p className="text-slate-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain Section */}
      <section className="px-6 lg:px-12 py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-400" />
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">The Problem</p>
          </div>
          <h2 className="text-3xl font-black mb-2">Businesses are losing repeat revenue<br className="hidden lg:block" /> in WhatsApp, Excel, and notebooks.</h2>
          <p className="text-slate-400 mb-8 max-w-xl">Every missed renewal, forgotten follow-up, and uncollected balance is money left on the table.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {painPoints.map(p => (
              <div key={p.title} className="bg-slate-900 border border-red-500/10 hover:border-red-500/25 rounded-xl p-4 transition-colors">
                <span className="text-xl mb-2 block">{p.icon}</span>
                <h3 className="text-white font-bold text-sm mb-1">{p.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-emerald-400" />
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">The Solution</p>
          </div>
          <h2 className="text-3xl font-black mb-2">One system for every repeat customer.</h2>
          <p className="text-slate-400 mb-8 max-w-xl">5 integrated engines that work together to run your business end-to-end.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {engines.map(e => (
              <div key={e.label} className={`bg-slate-900 border rounded-xl p-4 ${e.color.split(' ').find(c=>c.startsWith('border'))}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border ${e.color.split(' ').filter(c=>!c.startsWith('text-')).join(' ')}`}>
                  <e.icon size={15} className={e.color.split(' ').find(c=>c.startsWith('text-'))} />
                </div>
                <p className="text-white font-bold text-xs mb-1">{e.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="px-6 lg:px-12 py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black mb-8 text-center">Before RepeatlyOS vs After</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <p className="text-red-400 font-bold text-xs uppercase tracking-wider">Before</p>
              </div>
              <div className="space-y-2">
                {beforeAfter.map(b => (
                  <div key={b.before} className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-2.5">
                    <AlertTriangle size={12} className="text-red-400 shrink-0" />
                    <p className="text-slate-300 text-sm">{b.before}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">After RepeatlyOS</p>
              </div>
              <div className="space-y-2">
                {beforeAfter.map(b => (
                  <div key={b.after} className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-4 py-2.5">
                    <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                    <p className="text-slate-300 text-sm">{b.after}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Templates Section */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-blue-400" />
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Who It's For</p>
          </div>
          <h2 className="text-3xl font-black mb-2">Built for every repeat-service business.</h2>
          <p className="text-slate-400 mb-8">If your customers come back, RepeatlyOS is your operating system.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {useCases.map(({ icon: Icon, name, engines: eng }) => (
              <div key={name} className="bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-xl p-4 transition-colors group">
                <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600/10 transition-colors">
                  <Icon size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-white font-semibold text-sm mb-2">{name}</p>
                <div className="flex flex-wrap gap-1">
                  {eng.map(e => <span key={e} className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{e}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 lg:px-12 py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black mb-2 text-center">Up and running in minutes</h2>
          <p className="text-slate-400 text-center mb-10">4 steps from setup to fully operational.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map(s => (
              <div key={s.n} className="flex gap-4">
                <span className="text-blue-500/40 font-black text-3xl leading-none shrink-0">{s.n}</span>
                <div>
                  <h3 className="text-white font-bold mb-1 text-sm">{s.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility — Built for local reality */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-2">Built for local business reality</h2>
          <p className="text-slate-400 mb-8">Designed for how businesses in Lebanon and the Gulf actually operate.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {['💵 Cash payments tracked','📲 Whish & OMT support','💬 WhatsApp reminders','📄 Manual payment proof','🇱🇧 Lebanese business flows','🌍 Gulf market ready','📱 Mobile-first customer portal','📊 Export-ready reports'].map(f => (
              <div key={f} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-center">
                <p className="text-slate-300 text-xs">{f}</p>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Why businesses use RepeatlyOS</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {whyUs.map(w => (
                <span key={w} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-300">
                  <CheckCircle size={10} className="text-emerald-400" /> {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 lg:px-12 py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black mb-2 text-center">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-center mb-10">Start with a demo. No credit card required.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricing.map(p => (
              <div key={p.name} className={`rounded-2xl p-5 border relative ${p.highlight ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-900 border-slate-800'}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Most Popular</div>}
                <p className="font-bold text-base mb-1 text-white">{p.name}</p>
                <div className="mb-2">
                  {p.price ? <span className={`text-3xl font-black text-white`}>${p.price}<span className={`text-xs font-normal ${p.highlight ? 'text-blue-200' : 'text-slate-400'}`}>/mo</span></span>
                    : <span className="text-2xl font-black text-white">Custom</span>}
                </div>
                <p className={`text-xs mb-4 ${p.highlight ? 'text-blue-200' : 'text-slate-500'}`}>{p.desc}</p>
                <div className="space-y-1.5">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={11} className={p.highlight ? 'text-blue-200' : 'text-emerald-400'} />
                      <span className={`text-xs ${p.highlight ? 'text-blue-100' : 'text-slate-300'}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to={p.name === 'Enterprise' ? '/dashboard/branches' : '/demo/setup'} className={`mt-4 block text-center text-xs font-semibold py-2 rounded-lg transition-colors ${p.highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                  {p.name === 'Enterprise' ? 'See multi-branch demo' : 'Start with a demo'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo links */}
      <section className="px-6 lg:px-12 py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-white font-bold text-center mb-6">Explore the demo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BarChart3, label:'Dashboard', sub:'Business overview', to:'/dashboard' },
              { icon: Users, label:'Business Page', sub:'Customer-facing view', to:'/business/elite-carwash' },
              { icon: Smartphone, label:'Customer Portal', sub:'Mobile portal', to:'/customer/portal' },
              { icon: Zap, label:'Pitch Deck', sub:'Sales presentation', to:'/demo/pitch' },
            ].map(d => (
              <Link key={d.label} to={d.to} className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 text-center transition-colors group">
                <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600/15 transition-colors">
                  <d.icon size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-white font-semibold text-xs">{d.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{d.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-12 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-black mb-3">Show clients a professional system,<br className="hidden sm:block" /> not a WhatsApp mess.</h2>
          <p className="text-slate-400 mb-8">RepeatlyOS gives your business the structure, visibility, and automation it needs to grow repeat revenue.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg">
              Open Dashboard <ArrowRight size={16} />
            </Link>
            <Link to="/demo/setup" className="w-full sm:w-auto border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-8 py-4 rounded-xl transition-colors text-center">
              Try Setup Flow
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8">
            {['No login required','No backend needed','Full demo access'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-slate-600 text-xs">
                <CheckCircle size={11} className="text-emerald-600" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center"><Zap size={10} className="text-white" /></div>
            <span className="text-slate-500 text-xs font-medium">RepeatlyOS</span>
            <span className="text-slate-700 text-xs">· Frontend Demo · No backend</span>
          </div>
          {/* Site map / quick links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-slate-700 text-xs font-medium">Quick Links:</span>
            {[
              { label: '🏠 Home', to: '/' },
              { label: '🚗 Business Page', to: '/business/elite-carwash' },
              { label: '📱 Customer Portal', to: '/customer/portal' },
              { label: '📊 Dashboard', to: '/dashboard' },
              { label: '📋 Pitch Deck', to: '/demo/pitch' },
              { label: '⚙️ Setup', to: '/demo/setup' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-slate-600 hover:text-slate-300 text-xs transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
