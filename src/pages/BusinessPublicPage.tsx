import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Phone, MessageCircle, Clock, CheckCircle, Zap, ArrowLeft, X, ChevronRight } from 'lucide-react';
import Toast from '../components/Toast';
import { useDemo } from '../context/DemoContext';
import { reviews } from '../data/mockData';

type Tab = 'services' | 'packages' | 'subscriptions' | 'shop' | 'reviews';

export default function BusinessPublicPage() {
  const { business } = useDemo();
  const [tab, setTab] = useState<Tab>('services');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleBook = () => {
    if (!selected || !date || !time || !name || !phone) { setToast('Please fill in all required fields.'); return; }
    setShowSuccess(true);
    setSelected(''); setDate(''); setTime(''); setName(''); setPhone(''); setNotes('');
  };

  const updateCart = (id: number, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (!existing) return delta > 0 ? [...prev, { id, qty: 1 }] : prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, qty: newQty } : c);
    });
  };

  const cartTotal = cart.reduce((sum, c) => {
    const product = business.products.find(p => p.id === c.id);
    return sum + (product ? product.price * c.qty : 0);
  }, 0);

  const handleOrderProducts = () => {
    setOrderPlaced(true);
    setCart([]);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'services', label: 'Services' },
    { key: 'packages', label: 'Packages' },
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'shop', label: 'Shop' },
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-blue-600/20 border-b border-blue-500/20 text-center py-2 px-4">
        <p className="text-xs text-blue-300">Frontend demo — no backend connected · Public booking page powered by RepeatlyOS</p>
      </div>

      <div className="px-4 lg:px-8 py-2.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between gap-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 min-w-0">
          <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium transition-colors group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Home</span>
          </Link>
          <ChevronRight size={11} className="text-slate-700 shrink-0" />
          <Link to="/business/elite-carwash" className="text-xs text-slate-400 hover:text-white transition-colors truncate max-w-[100px] sm:max-w-none">
            {business.name}
          </Link>
          {tab !== 'services' && (
            <>
              <ChevronRight size={11} className="text-slate-700 shrink-0" />
              <span className="text-xs text-white font-semibold capitalize">{tab === 'shop' ? 'Shop' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-all hidden sm:block">Dashboard →</Link>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center"><Zap size={10} className="text-white"/></div>
            <span className="text-slate-500 text-xs hidden sm:block">Powered by RepeatlyOS</span>
          </div>
        </div>
      </div>

      {/* Cover */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border-b border-slate-800 overflow-hidden">
        {/* Ambient orbs */}
        <div className="orb w-64 h-64 bg-blue-600 top-0 right-0 opacity-[0.12] animate-float-slow" />
        <div className="orb w-48 h-48 bg-purple-600 bottom-0 left-0 opacity-[0.08] animate-float" />

        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div key={business.key} className="w-24 h-24 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center text-5xl shrink-0 shadow-xl shadow-blue-500/10 animate-scale-in">
              {business.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-2xl lg:text-3xl font-black">{business.name}</h1>
                <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold dot-live">Open</span>
              </div>
              <p className="text-slate-400 mb-3">{business.category}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-blue-400"/> {business.area}</span>
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="text-amber-400 fill-amber-400"/>
                  <strong className="text-white">{business.rating}</strong>
                  <span>({business.reviewCount} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5"><Clock size={13} className="text-slate-500"/> 8:00 AM – 7:00 PM</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] press">
                <Phone size={13}/> Call
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-green-500/20 hover:scale-[1.02] press">
                <MessageCircle size={13}/> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — tabs */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'services' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {business.services.map(s => (
                <button key={s.name} onClick={() => setSelected(s.name)} className={`text-left bg-slate-900 border rounded-xl p-4 hover:border-blue-500/50 transition-all ${selected === s.name ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">{s.name}</h3>
                    {selected === s.name && <CheckCircle size={14} className="text-blue-400 shrink-0"/>}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-bold">${s.price}</span>
                    <span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={10}/> {s.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === 'packages' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {business.packages.map(p => (
                <button key={p.name} onClick={() => setSelected(p.name)} className={`text-left bg-slate-900 border rounded-xl p-4 hover:border-blue-500/50 transition-all ${selected === p.name ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800'}`}>
                  {selected === p.name && <CheckCircle size={13} className="text-blue-400 mb-2"/>}
                  <h3 className="text-white font-semibold text-sm mb-1">{p.name}</h3>
                  <p className="text-slate-400 text-xs mb-2">{p.description}</p>
                  <p className="text-slate-500 text-xs mb-3">{p.sessions} sessions</p>
                  <p className="text-blue-400 font-bold text-lg">${p.price}</p>
                </button>
              ))}
            </div>
          )}

          {tab === 'subscriptions' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{business.subscription.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{business.subscription.description}</p>
                </div>
                <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-4">Monthly</span>
              </div>
              <div className="mb-5 space-y-1.5">
                {business.subscription.includes.map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-400 shrink-0"/>
                    <span className="text-slate-300 text-sm">{i}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <span className="text-white text-3xl font-black">${business.subscription.price}</span>
                  <span className="text-slate-400 text-sm"> / month</span>
                </div>
                <button onClick={() => { setSelected(business.subscription.name); setToast('Plan selected! Fill in the booking form.'); }} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Subscribe Now
                </button>
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm">Browse and order products directly — no appointment needed.</p>
                {cart.length > 0 && (
                  <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                    {cart.reduce((a, c) => a + c.qty, 0)} in cart · ${cartTotal.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {business.products.filter(p => p.status !== 'Out of Stock').map(p => {
                  const inCart = cart.find(c => c.id === p.id);
                  return (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xl">{p.image}</div>
                        {p.status === 'Low Stock' && <span className="text-amber-400 text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">Low stock</span>}
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-0.5">{p.name}</h3>
                      <p className="text-slate-500 text-xs mb-3">{p.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-bold">${p.price}</span>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCart(p.id, -1)} className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-bold transition-colors">−</button>
                            <span className="text-slate-200 text-xs font-medium w-4 text-center">{inCart.qty}</span>
                            <button onClick={() => updateCart(p.id, 1)} className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-bold transition-colors">+</button>
                          </div>
                        ) : (
                          <button onClick={() => updateCart(p.id, 1)} className="bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {business.products.filter(p => p.status === 'Out of Stock').length > 0 && (
                  <div className="sm:col-span-2 text-center py-2">
                    <p className="text-slate-600 text-xs">{business.products.filter(p => p.status === 'Out of Stock').length} item(s) currently out of stock and hidden from shop.</p>
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <button onClick={handleOrderProducts} className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  Place Order — ${cartTotal.toFixed(2)} ({cart.reduce((a, c) => a + c.qty, 0)} items)
                </button>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3">
                <div className="text-center">
                  <p className="text-white text-4xl font-black">{business.rating}</p>
                  <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_,i)=><Star key={i} size={11} className="text-amber-400 fill-amber-400"/>)}</div>
                  <p className="text-slate-500 text-xs mt-1">{business.reviewCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5,4,3,2,1].map(n=>(
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs w-2">{n}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                        <div className="bg-amber-400 h-1.5 rounded-full" style={{width: n===5?'78%':n===4?'15%':'7%'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {reviews.map(r=>(
                <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{r.name}</span>
                    <span className="text-slate-500 text-xs">{r.date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">{[...Array(r.rating)].map((_,i)=><Star key={i} size={10} className="text-amber-400 fill-amber-400"/>)}</div>
                  <p className="text-slate-400 text-sm leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — booking form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-6">
            <h2 className="text-white font-bold mb-4 text-sm">Request a Booking</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Service / Package *</label>
                <select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                  <option value="">Select...</option>
                  <optgroup label="Services">
                    {business.services.map(s=><option key={s.name} value={s.name}>{s.name} — ${s.price}</option>)}
                  </optgroup>
                  <optgroup label="Packages">
                    {business.packages.map(p=><option key={p.name} value={p.name}>{p.name} — ${p.price}</option>)}
                  </optgroup>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Date *</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Time *</label>
                  <select value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="">Pick</option>
                    {['08:00','09:00','10:00','10:30','11:00','12:00','13:00','14:00','15:00','16:00'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Your Name *</label>
                <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Phone Number *</label>
                <input placeholder="+961 70 ..." value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Notes</label>
                <textarea placeholder="Any special requests..." value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"/>
              </div>
              <button onClick={handleBook} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Request Booking
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-green-600/15 hover:bg-green-600/25 border border-green-600/30 text-green-400 font-medium py-2.5 rounded-xl text-sm transition-colors">
                <MessageCircle size={13}/> Send via WhatsApp
              </button>
            </div>
            <p className="text-center text-slate-700 text-xs mt-3">Powered by RepeatlyOS</p>
          </div>
        </div>
      </div>

      {/* Booking success modal */}
      {showSuccess && (() => {
        const [vis, setVis] = useState(false);
        useEffect(() => { setTimeout(() => setVis(true), 20); }, []);
        const close = () => setShowSuccess(false);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-200 ${vis ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
            <div className={`relative bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${vis ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}`}>
              <button onClick={close} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1.5 transition-colors"><X size={16}/></button>
              <div className={`text-6xl mb-4 transition-all duration-400 delay-100 ${vis ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>✅</div>
              <h3 className="text-white font-black text-xl mb-2">Booking Requested!</h3>
              <p className="text-slate-400 text-sm mb-1">Sent to <strong className="text-white">{business.name}</strong>.</p>
              <p className="text-slate-500 text-xs mb-1">You'll receive a WhatsApp confirmation shortly.</p>
              <p className="text-slate-600 text-xs mb-6">Demo only — no backend connected.</p>
              <button onClick={close} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-all w-full hover:scale-[1.01] press">Done</button>
            </div>
          </div>
        );
      })()}

      {/* Order placed modal */}
      {orderPlaced && (() => {
        const [vis, setVis] = useState(false);
        useEffect(() => { setTimeout(() => setVis(true), 20); }, []);
        const close = () => setOrderPlaced(false);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-200 ${vis ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
            <div className={`relative bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${vis ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}`}>
              <button onClick={close} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1.5 transition-colors"><X size={16}/></button>
              <div className={`text-6xl mb-4 transition-all duration-400 delay-100 ${vis ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>🛍️</div>
              <h3 className="text-white font-black text-xl mb-2">Order Placed!</h3>
              <p className="text-slate-400 text-sm mb-1">Sent to <strong className="text-white">{business.name}</strong>.</p>
              <p className="text-slate-500 text-xs mb-1">They'll confirm via WhatsApp shortly.</p>
              <p className="text-slate-600 text-xs mb-6">Demo only — no backend connected.</p>
              <button onClick={close} className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-all w-full hover:scale-[1.01] press">Done</button>
            </div>
          </div>
        );
      })()}

      {toast && <Toast message={toast} onClose={()=>setToast('')} type="info"/>}
    </div>
  );
}
