import { useState, useMemo } from 'react';
import { MessageCircle, Users, Send, Copy, Check, Filter, Zap, AlertCircle, RefreshCw, Package, Clock } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';

type Segment = 'all' | 'expiring' | 'overdue' | 'package_low' | 'inactive' | 'new';

const SEGMENTS: { key: Segment; label: string; icon: typeof Users; desc: string; color: string; emoji: string }[] = [
  { key: 'all',         label: 'All Customers',        icon: Users,         desc: 'Send to your entire customer base',              color: 'border-blue-500/30 bg-blue-500/5',   emoji: '👥' },
  { key: 'expiring',    label: 'Expiring Subscriptions',icon: RefreshCw,    desc: 'Subscriptions renewing in the next 7 days',      color: 'border-amber-500/30 bg-amber-500/5', emoji: '⏰' },
  { key: 'overdue',     label: 'Overdue Payments',      icon: AlertCircle,  desc: 'Customers with outstanding balances',            color: 'border-red-500/30 bg-red-500/5',     emoji: '💸' },
  { key: 'package_low', label: 'Low Session Packages',  icon: Package,      desc: 'Customers with 2 or fewer sessions left',        color: 'border-orange-500/30 bg-orange-500/5',emoji: '📦' },
  { key: 'inactive',    label: 'Inactive (30+ days)',   icon: Clock,        desc: 'Haven\'t visited in over 30 days',               color: 'border-purple-500/30 bg-purple-500/5',emoji: '💤' },
  { key: 'new',         label: 'New Customers',         icon: Zap,          desc: 'Joined in the last 14 days — welcome them',      color: 'border-emerald-500/30 bg-emerald-500/5',emoji: '🆕' },
];

const MESSAGE_TEMPLATES: Record<Segment, { label: string; body: string }[]> = {
  all: [
    { label: 'General Update',      body: 'Hello {name}! We have exciting news to share. Visit us soon and enjoy our latest offers. — {business} 🙏' },
    { label: 'Special Offer',       body: 'Hi {name}! 🎉 Special offer just for you this week. Book now and save! Contact us to reserve your spot. — {business}' },
  ],
  expiring: [
    { label: 'Renewal Reminder',    body: 'Hello {name}! Your {plan} subscription is coming up for renewal soon. Renew now to keep enjoying uninterrupted service. — {business} 💙' },
    { label: 'Early Bird Renewal',  body: 'Hi {name}! Renew your subscription before it expires and get priority booking for next month. We appreciate your loyalty! — {business}' },
  ],
  overdue: [
    { label: 'Payment Reminder',    body: 'Dear {name}, we noticed an outstanding balance on your account. Please settle at your earliest convenience. Thank you! — {business}' },
    { label: 'Gentle Follow-up',    body: 'Hello {name}! Just a friendly reminder about your pending payment. Contact us anytime to arrange — we\'re flexible. — {business} 🙏' },
  ],
  package_low: [
    { label: 'Renew Package',       body: 'Hi {name}! You\'re almost out of sessions on your package. Renew now to keep going without interruption. — {business} 🔥' },
    { label: 'Upgrade Offer',       body: 'Hello {name}! Your sessions are running low. Upgrade to our premium package and save more per session. — {business}' },
  ],
  inactive: [
    { label: 'We Miss You',         body: 'Hey {name}! It\'s been a while since your last visit 😊 We miss you! Come back this week — book your slot now. — {business}' },
    { label: 'Win-Back Offer',      body: 'Hi {name}! Haven\'t seen you in a bit. We\'d love to have you back — mention this message for a special discount. — {business}' },
  ],
  new: [
    { label: 'Welcome Message',     body: 'Welcome {name}! 🎉 We\'re so glad to have you with us. If you have any questions or need help booking, we\'re always here. — {business}' },
    { label: 'Onboarding Tips',     body: 'Hi {name}! Thanks for joining {business}. Did you know you can save more with our packages? Ask us for details! 💙' },
  ],
};

export default function BroadcastPage() {
  const { business } = useDemo();
  const [segment, setSegment] = useState<Segment>('expiring');
  const [templateIdx, setTemplateIdx] = useState(0);
  const [customMsg, setCustomMsg] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [preview, setPreview] = useState<typeof business.customers[0] | null>(null);
  const [sent, setSent] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter customers by segment
  const segmentCustomers = useMemo(() => {
    switch (segment) {
      case 'expiring':    return business.customers.filter(c => c.status === 'Expiring Soon');
      case 'overdue':     return business.customers.filter(c => c.balance < 0 || c.status === 'Overdue');
      case 'package_low': return business.customers.filter(c => c.type === 'Package');
      case 'inactive':    return business.customers.filter((_, i) => i % 3 === 2);
      case 'new':         return business.customers.slice(0, 3);
      default:            return business.customers;
    }
  }, [segment, business.customers]);

  const templates = MESSAGE_TEMPLATES[segment];
  const baseMessage = useCustom ? customMsg : templates[templateIdx]?.body || '';

  const buildMessage = (customer: typeof business.customers[0]) =>
    baseMessage
      .replace(/{name}/g, customer.name.split(' ')[0])
      .replace(/{plan}/g, customer.plan !== '—' ? customer.plan : business.subscription.name)
      .replace(/{business}/g, business.name);

  const openWhatsApp = (customer: typeof business.customers[0]) => {
    const msg = buildMessage(customer);
    const phone = customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setSent(p => [...p, customer.id]);
  };

  const copyMessage = (customer: typeof business.customers[0]) => {
    navigator.clipboard.writeText(buildMessage(customer)).catch(() => {});
    setCopied(customer.id);
    setTimeout(() => setCopied(null), 2000);
    setToast('Message copied!');
  };

  const markAllSent = () => {
    setSent(segmentCustomers.map(c => c.id));
    setShowConfirm(false);
    setToast(`${segmentCustomers.length} customers marked as contacted.`);
  };

  const sentCount = segmentCustomers.filter(c => sent.includes(c.id)).length;
  const pendingCount = segmentCustomers.length - sentCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <MessageCircle size={18} className="text-green-400" /> WhatsApp Broadcast
          </h2>
          <p className="text-slate-500 text-sm">Send targeted messages to customer segments · {business.name}</p>
        </div>
        {sentCount > 0 && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
            <Check size={13} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">{sentCount} sent · {pendingCount} remaining</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Customers" value={business.customers.length} icon={Users} accent="blue" />
        <StatCard title="Expiring Soon" value={business.customers.filter(c => c.status === 'Expiring Soon').length} icon={RefreshCw} accent="amber" />
        <StatCard title="Overdue" value={business.customers.filter(c => c.balance < 0).length} icon={AlertCircle} accent="red" />
        <StatCard title="Sent This Session" value={sent.length} icon={Send} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Segment + Template picker */}
        <div className="lg:col-span-1 space-y-4">
          {/* Segment selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Filter size={13} className="text-blue-400" /> Target Segment
            </h3>
            <div className="space-y-2">
              {SEGMENTS.map(s => (
                <button
                  key={s.key}
                  onClick={() => { setSegment(s.key); setTemplateIdx(0); setUseCustom(false); }}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${segment === s.key ? s.color + ' border-opacity-100' : 'border-slate-800 hover:border-slate-700 bg-slate-800/40'}`}
                >
                  <span className="text-xl shrink-0">{s.emoji}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${segment === s.key ? 'text-white' : 'text-slate-300'}`}>{s.label}</p>
                    <p className="text-slate-500 text-xs truncate">{s.desc}</p>
                  </div>
                  <span className={`ml-auto text-xs font-bold shrink-0 ${segment === s.key ? 'text-white' : 'text-slate-600'}`}>
                    {s.key === 'all' ? business.customers.length : s.key === 'expiring' ? business.customers.filter(c => c.status === 'Expiring Soon').length : s.key === 'overdue' ? business.customers.filter(c => c.balance < 0).length : s.key === 'new' ? 3 : s.key === 'package_low' ? business.customers.filter(c => c.type === 'Package').length : Math.ceil(business.customers.length / 3)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Message template picker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Message Template</h3>
            <div className="space-y-2 mb-3">
              {templates.map((t, i) => (
                <button key={i} onClick={() => { setTemplateIdx(i); setUseCustom(false); }} className={`w-full text-left p-3 rounded-xl border transition-colors ${!useCustom && templateIdx === i ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                  <p className="text-slate-200 text-xs font-semibold">{t.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{t.body.replace(/{name}/g, 'Customer').replace(/{plan}/g, 'Plan').replace(/{business}/g, business.name)}</p>
                </button>
              ))}
              <button onClick={() => setUseCustom(true)} className={`w-full text-left p-3 rounded-xl border transition-colors ${useCustom ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                <p className="text-slate-200 text-xs font-semibold">✏️ Custom Message</p>
                <p className="text-slate-500 text-xs mt-0.5">Write your own message</p>
              </button>
            </div>
            {useCustom && (
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="Write your message... Use {name}, {plan}, {business} as placeholders"
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            )}
          </div>
        </div>

        {/* Right: Customer list with individual send buttons */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm font-medium">
              {segmentCustomers.length} customer{segmentCustomers.length !== 1 ? 's' : ''} in segment
            </p>
            {segmentCustomers.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 text-xs bg-green-600/15 hover:bg-green-600/25 border border-green-600/30 text-green-400 font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Check size={12} /> Mark All Sent
              </button>
            )}
          </div>

          {segmentCustomers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <Users size={36} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No customers in this segment</p>
              <p className="text-slate-600 text-xs mt-1">Try selecting a different segment</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {segmentCustomers.map(c => {
                const isSent = sent.includes(c.id);
                const msg = buildMessage(c);
                return (
                  <div key={c.id} className={`bg-slate-900 border rounded-2xl p-4 transition-all ${isSent ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400'}`}>
                          {isSent ? <Check size={16} /> : c.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm">{c.name}</p>
                          <p className="text-slate-500 text-xs">{c.phone} · {c.area}</p>
                        </div>
                      </div>

                      {!isSent ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => setPreview(c)} className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors">
                            Preview
                          </button>
                          <button onClick={() => copyMessage(c)} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${copied === c.id ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                            {copied === c.id ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                          <button onClick={() => openWhatsApp(c)} className="flex items-center gap-1.5 text-xs bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-green-500/20">
                            <MessageCircle size={12} /> WhatsApp
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium shrink-0">
                          <Check size={13} /> Sent
                        </div>
                      )}
                    </div>

                    {/* Message preview strip */}
                    <div className="mt-3 bg-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-400 line-clamp-2 leading-relaxed border border-slate-700/50">
                      {msg}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <Modal title="Message Preview" onClose={() => setPreview(null)} size="sm" icon={<MessageCircle size={15} className="text-green-400" />}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm">{preview.name[0]}</div>
              <div>
                <p className="text-white text-sm font-semibold">{preview.name}</p>
                <p className="text-slate-500 text-xs">{preview.phone}</p>
              </div>
            </div>

            {/* WhatsApp-style bubble */}
            <div className="bg-[#0b1c14] border border-[#25D366]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={14} className="text-[#25D366]" />
                <span className="text-[#25D366] text-xs font-semibold">WhatsApp Preview</span>
              </div>
              <div className="bg-[#025144] rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <p className="text-white text-sm leading-relaxed">{buildMessage(preview)}</p>
                <p className="text-[#25D366]/60 text-xs mt-1.5 text-right">09:00 ✓✓</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => copyMessage(preview)} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">
                <Copy size={13} /> Copy
              </button>
              <button onClick={() => { openWhatsApp(preview); setPreview(null); }} className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                <MessageCircle size={13} /> Open WhatsApp
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk send confirmation */}
      {showConfirm && (
        <Modal title="Mark All as Sent?" onClose={() => setShowConfirm(false)} size="sm">
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">This will mark all {segmentCustomers.length} customers in this segment as contacted. Use this after you've manually sent the messages via WhatsApp.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={markAllSent} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Confirm</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
