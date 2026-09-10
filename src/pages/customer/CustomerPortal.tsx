import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Package, RefreshCw, CreditCard, Clock, MessageCircle,
  Upload, ArrowLeft, CheckCircle, CheckCircle2, X, Star,
  Zap, Home, User, Gift, History, ChevronRight
} from 'lucide-react';
import Toast from '../../components/Toast';

const customer = { name: 'Rami Haddad', phone: '+961 70 123 456', area: 'Beirut', avatar: 'R', business: 'Elite Auto Spa', businessEmoji: '🚗', since: 'March 2023' };
const upcomingBooking = { service: 'Full Wash', date: 'Tuesday, June 11', time: '09:00 AM', staff: 'Tony', status: 'Confirmed' };
const activePackage = { name: '8 Washes / Month', total: 8, used: 5, remaining: 3, expiry: 'June 30, 2024' };
const subscription = { name: 'Monthly Premium Care', price: 99, renewal: 'June 30, 2024', status: 'Active' };
const history = [
  { date: 'June 8', service: 'Full Wash', staff: 'Tony', status: 'Completed', amount: 15 },
  { date: 'June 1', service: 'Interior Deep Clean', staff: 'Sarah', status: 'Completed', amount: 35 },
  { date: 'May 25', service: 'Exterior Wash', staff: 'Elie', status: 'Completed', amount: 8 },
  { date: 'May 18', service: 'Full Wash', staff: 'Tony', status: 'Completed', amount: 15 },
];

function SlideUpSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) { setClosing(false); setTimeout(() => setVisible(true), 10); }
    else { setVisible(false); }
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!open && !closing) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div className={`relative bg-slate-900 border border-slate-700 border-b-0 rounded-t-3xl w-full max-w-sm pb-10 transition-transform duration-280 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible && !closing ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <p className="text-white font-semibold">{title}</p>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1.5 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SuccessSheet({ open, onClose, title, message, emoji }: { open: boolean; onClose: () => void; title: string; message: string; emoji: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (open) setTimeout(() => setVisible(true), 10); else setVisible(false); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`relative bg-slate-900 border border-slate-700 border-b-0 rounded-t-3xl w-full max-w-sm pb-10 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-center pt-3 pb-4">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <div className={`text-5xl mb-4 transition-all delay-150 duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>{emoji}</div>
        <div className={`transition-all delay-200 duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-white font-bold text-lg mb-2">{title}</p>
          <p className="text-slate-400 text-sm px-6 mb-1">{message}</p>
          <p className="text-slate-600 text-xs mb-6">Demo only — no backend connected</p>
          <div className="px-5">
            <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition-colors">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPortal() {
  const [toast, setToast] = useState('');
  const [proofUploaded, setProofUploaded] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduled, setRescheduled] = useState(false);
  const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleReschedule = () => {
    if (!newDate || !newTime) { setToast('Please select a date and time.'); return; }
    setRescheduled(true);
    setShowReschedule(false);
    setTimeout(() => setShowRescheduleSuccess(true), 200);
  };

  const cardDelay = (i: number) => ({ transitionDelay: `${i * 60}ms` });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Demo banner */}
      <div className="bg-blue-600/20 border-b border-blue-500/20 text-center py-1.5 px-4">
        <p className="text-xs text-blue-300">Customer Portal Demo — RepeatlyOS · No backend connected</p>
      </div>

      <div className="max-w-sm mx-auto px-4 pb-28">
        {/* Breadcrumb nav */}
        <div className="flex items-center justify-between py-3">
          <nav className="flex items-center gap-1.5 text-xs min-w-0">
            <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors group">
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Home</span>
            </Link>
            <ChevronRight size={11} className="text-slate-700 shrink-0" />
            <span className="text-slate-400">{customer.business}</span>
            <ChevronRight size={11} className="text-slate-700 shrink-0" />
            <span className="text-white font-semibold capitalize">
              {activeTab === 'home' ? 'My Account' : activeTab === 'history' ? 'Service History' : 'Profile'}
            </span>
          </nav>
          <div className="flex items-center gap-1"><Zap size={10} className="text-blue-400" /><span className="text-slate-600 text-xs">RepeatlyOS</span></div>
        </div>

        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Business hero */}
            <div
              className={`relative bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-3xl p-6 text-center overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="orb w-32 h-32 bg-blue-500 -top-8 -right-8 opacity-20" />
                <div className="orb w-24 h-24 bg-purple-500 -bottom-6 -left-6 opacity-15" />
              </div>
              <div className={`text-5xl mb-3 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>{customer.businessEmoji}</div>
              <p className="text-white font-bold text-lg">{customer.business}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
                <span className="text-slate-400 text-xs ml-1.5">4.9 · 247 reviews</span>
              </div>
            </div>

            {/* Greeting card */}
            <div
              className={`flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-500 delay-[80ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/25">
                  {customer.avatar}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Hello, {customer.name.split(' ')[0]}! 👋</p>
                <p className="text-slate-400 text-xs mt-0.5">{customer.phone} · {customer.area}</p>
                <p className="text-slate-600 text-xs mt-0.5">Member since {customer.since}</p>
              </div>
            </div>

            {/* Upcoming booking */}
            {[
              <div
                key="booking"
                style={cardDelay(1)}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" />
                    <p className="text-white font-semibold text-sm">Upcoming Booking</p>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                    {rescheduled ? 'Rescheduled ✓' : upcomingBooking.status}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-blue-600/15 to-transparent border border-blue-500/20 rounded-xl p-3 mb-3">
                  <p className="text-white font-semibold">{upcomingBooking.service}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-sm">
                    <Clock size={12} />
                    <span>{rescheduled ? `${newDate} at ${newTime}` : `${upcomingBooking.date} at ${upcomingBooking.time}`}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Staff: {upcomingBooking.staff}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowReschedule(true)} className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium py-2.5 rounded-xl transition-all hover:scale-[1.02] press">
                    <Clock size={12} /> Reschedule
                  </button>
                  <button onClick={() => setToast('WhatsApp opened. Demo only.')} className="flex items-center justify-center gap-1.5 bg-green-600/15 hover:bg-green-600/25 border border-green-600/30 text-green-400 text-xs font-medium py-2.5 rounded-xl transition-all hover:scale-[1.02] press">
                    <MessageCircle size={12} /> Contact Us
                  </button>
                </div>
              </div>,

              /* Active package */
              <div
                key="package"
                style={cardDelay(2)}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Package size={14} className="text-purple-400" />
                  <p className="text-white font-semibold text-sm">Active Package</p>
                  <span className="ml-auto text-purple-400 text-xs font-bold">{activePackage.remaining} left</span>
                </div>
                <p className="text-slate-300 font-medium text-sm mb-3">{activePackage.name}</p>
                <div className="relative bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
                  <div className="absolute inset-0 bg-slate-700 rounded-full" />
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-700" style={{ width: `${(activePackage.remaining / activePackage.total) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{activePackage.used} sessions used</span>
                  <span>Expires {activePackage.expiry}</span>
                </div>
              </div>,

              /* Subscription */
              <div
                key="sub"
                style={cardDelay(3)}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-emerald-400" />
                    <p className="text-white font-semibold text-sm">Subscription</p>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium">{subscription.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 font-medium text-sm">{subscription.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Renews {subscription.renewal}</p>
                  </div>
                  <p className="text-white font-bold text-lg">${subscription.price}<span className="text-slate-500 text-xs font-normal">/mo</span></p>
                </div>
              </div>,

              /* Payment */
              <div
                key="payment"
                style={cardDelay(4)}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-emerald-400" />
                    <p className="text-white font-semibold text-sm">Payment Status</p>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">Settled</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span className="text-sm">All payments up to date</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Upload Payment Proof</p>
                  {proofUploaded ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs animate-in">
                      <CheckCircle size={13} /><span>proof_payment_june.jpg uploaded</span>
                    </div>
                  ) : (
                    <button onClick={() => { setProofUploaded(true); setToast('Payment proof uploaded. Demo only.'); }} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-xl transition-colors w-full press">
                      <Upload size={12} /> Tap to upload proof screenshot
                    </button>
                  )}
                </div>
              </div>,
            ]}

            {/* WhatsApp CTA */}
            <button
              onClick={() => setToast('Opening WhatsApp. Demo only.')}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.01] press ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={cardDelay(5)}
            >
              <MessageCircle size={18} /> Chat with {customer.business}
            </button>

            <p className="text-center text-slate-700 text-xs pb-2">
              Powered by <span className="text-blue-500">RepeatlyOS</span> · Customer Portal
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 mb-4">
              <History size={15} className="text-blue-400" />
              <h2 className="text-white font-bold">Service History</h2>
            </div>
            {history.map((h, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{h.service}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{h.date} · {h.staff}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">${h.amount}</p>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 pt-2 animate-in">
            <div className="flex items-center gap-2 mb-4">
              <User size={15} className="text-blue-400" />
              <h2 className="text-white font-bold">Your Profile</h2>
            </div>
            <div className="text-center py-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-lg shadow-blue-500/25">{customer.avatar}</div>
              <p className="text-white font-bold text-lg">{customer.name}</p>
              <p className="text-slate-400 text-sm mt-0.5">{customer.phone}</p>
              <p className="text-slate-500 text-xs mt-0.5">{customer.area} · Member since {customer.since}</p>
            </div>
            {[
              { icon: Gift, label: 'Loyalty Points', value: '340 pts', color: 'text-amber-400' },
              { icon: Package, label: 'Total Sessions Used', value: '18 sessions', color: 'text-purple-400' },
              { icon: CheckCircle2, label: 'Payments On Time', value: '100%', color: 'text-emerald-400' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <r.icon size={16} className={r.color} />
                  <span className="text-slate-300 text-sm">{r.label}</span>
                </div>
                <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
            <button onClick={() => setToast('Profile edit — demo only.')} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-3 rounded-2xl text-sm transition-colors press">Edit Profile</button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 z-40 safe-area-bottom">
        <div className="max-w-sm mx-auto grid grid-cols-3">
          {[
            { key: 'home' as const, icon: Home, label: 'Home' },
            { key: 'history' as const, icon: History, label: 'History' },
            { key: 'profile' as const, icon: User, label: 'Profile' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-col items-center gap-1 py-3.5 transition-all duration-200 relative ${activeTab === t.key ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === t.key && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />}
              <t.icon size={19} className={activeTab === t.key ? 'scale-110' : ''} style={{ transition: 'transform 0.2s' }} />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reschedule bottom sheet */}
      <SlideUpSheet open={showReschedule} onClose={() => setShowReschedule(false)} title="Reschedule Booking">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">New Date</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Preferred Time</label>
            <select value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
              <option value="">Select time...</option>
              {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleReschedule} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-2xl transition-colors mt-1 press">
            Request Reschedule
          </button>
        </div>
      </SlideUpSheet>

      {/* Reschedule success bottom sheet */}
      <SuccessSheet
        open={showRescheduleSuccess}
        onClose={() => setShowRescheduleSuccess(false)}
        title="Reschedule Requested!"
        message="Your request has been sent. Elite Auto Spa will confirm via WhatsApp."
        emoji="✅"
      />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
