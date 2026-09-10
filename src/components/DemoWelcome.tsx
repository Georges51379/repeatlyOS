import { useState, useEffect } from 'react';
import { X, Zap, ArrowRight, BarChart3, Users, CreditCard, Bell, Smartphone, Lightbulb, Building2, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';

const highlights = [
  { icon: '🔀', title: 'Switch businesses', desc: 'Top bar → business dropdown. Switch between 5 demo businesses instantly.' },
  { icon: '💡', title: 'Sales Guide', desc: "Click 'Guide' in topbar for a step-by-step sales script on every page." },
  { icon: '⌘K', title: 'Command palette', desc: 'Press Cmd+K to search customers, bookings, packages — anything.' },
  { icon: '🔔', title: 'Notifications', desc: 'Bell icon → live alerts about expiring subs, unpaid customers, and issues.' },
];

const demoLinks = [
  { icon: BarChart3, label: 'Dashboard', sub: 'Live business overview', to: '/dashboard', color: 'text-blue-400' },
  { icon: Users, label: 'Customers', sub: 'Click any row for profile', to: '/dashboard/customers', color: 'text-purple-400' },
  { icon: Warehouse, label: 'Inventory', sub: 'Stock, suppliers, purchase orders', to: '/dashboard/inventory', color: 'text-orange-400' },
  { icon: CreditCard, label: 'Payments', sub: 'Mark paid, upload proof', to: '/dashboard/payments', color: 'text-emerald-400' },
  { icon: Bell, label: 'Reminders', sub: 'WhatsApp message center', to: '/dashboard/reminders', color: 'text-amber-400' },
  { icon: Smartphone, label: 'Customer Portal', sub: 'Mobile view for customers', to: '/customer/portal', color: 'text-cyan-400' },
  { icon: Zap, label: 'Pitch Deck', sub: 'Full sales presentation', to: '/demo/pitch', color: 'text-pink-400' },
  { icon: Building2, label: 'Multi-Branch', sub: 'Enterprise tier view', to: '/dashboard/branches', color: 'text-purple-400' },
];

export default function DemoWelcome() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('demo-welcome-seen');
    if (!seen) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('demo-welcome-seen', '1');
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/10 border-b border-slate-800 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Welcome to RepeatlyOS</h2>
              <p className="text-slate-400 text-sm">Frontend demo — no backend · Full interactive walkthrough</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-slate-500 hover:text-slate-300 transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Tip grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {highlights.map(h => (
              <div key={h.title} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-start gap-3">
                <span className="text-xl shrink-0">{h.icon}</span>
                <div>
                  <p className="text-white text-xs font-semibold">{h.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick nav */}
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Lightbulb size={11} /> Jump to any demo page
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {demoLinks.map(d => (
              <Link key={d.label} to={d.to} onClick={dismiss} className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2.5 transition-colors group">
                <d.icon size={14} className={d.color} />
                <div className="min-w-0">
                  <p className="text-slate-200 text-xs font-medium">{d.label}</p>
                  <p className="text-slate-500 text-xs truncate">{d.sub}</p>
                </div>
                <ArrowRight size={11} className="text-slate-600 ml-auto shrink-0 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={dismiss} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Start Exploring <ArrowRight size={15} />
            </button>
            <Link to="/demo/pitch" onClick={dismiss} className="border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-3 px-4 rounded-xl text-sm transition-colors text-center">
              Sales Pitch →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
