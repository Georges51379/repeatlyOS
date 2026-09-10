import { useState } from 'react';
import { MessageCircle, Copy, Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import Toast from './Toast';

interface Customer {
  name: string;
  phone: string;
  plan?: string;
  balance?: number;
  lastVisit?: string;
  status?: string;
}

interface Props {
  customer: Customer;
  businessName: string;
  subscriptionPrice?: number;
  sessionBalance?: number;
}

export default function QuickReply({ customer, businessName, subscriptionPrice, sessionBalance }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const firstName = customer.name.split(' ')[0];
  const overdue   = (customer.balance || 0) < 0 ? Math.abs(customer.balance || 0) : 0;

  const templates = [
    {
      label: '📅 Booking Confirmation',
      body: `Hi ${firstName}! ✅ Your booking at ${businessName} is confirmed. We look forward to seeing you! — ${businessName}`,
      when: 'After creating a booking',
    },
    {
      label: '🔄 Renewal Reminder',
      body: `Hello ${firstName}! Your ${customer.plan && customer.plan !== '—' ? customer.plan : 'subscription'} is coming up for renewal. Renew now to avoid any interruption. Amount: $${subscriptionPrice || 0}. — ${businessName} 💙`,
      when: 'When subscription expiring',
    },
    overdue > 0 && {
      label: '💸 Payment Reminder',
      body: `Dear ${firstName}, we noticed an outstanding balance of $${overdue} on your account. Please settle at your earliest convenience. Thank you! — ${businessName}`,
      when: 'When balance overdue',
    },
    sessionBalance !== undefined && sessionBalance <= 2 && {
      label: '📦 Low Sessions Alert',
      body: `Hi ${firstName}! You only have ${sessionBalance} session${sessionBalance !== 1 ? 's' : ''} left on your package. Renew now to keep going! — ${businessName} 🔥`,
      when: 'When sessions running low',
    },
    {
      label: '👋 Follow-up After Visit',
      body: `Hi ${firstName}! Thank you for visiting ${businessName}. We hope you had a great experience. See you next time! 😊`,
      when: 'After service completed',
    },
    {
      label: '🎂 Birthday Wish',
      body: `🎂 Happy Birthday ${firstName}! Wishing you a wonderful day from everyone at ${businessName}. Enjoy a special treat on your next visit! 🎉`,
      when: 'On customer birthday',
    },
    customer.lastVisit && {
      label: '💤 Win-Back Message',
      body: `Hey ${firstName}! We miss you at ${businessName}. 😊 It's been a while since your last visit on ${customer.lastVisit}. Come back soon — we'd love to see you!`,
      when: 'If customer went inactive',
    },
  ].filter(Boolean) as { label: string; body: string; when: string }[];

  const handleCopy = (body: string, i: number) => {
    navigator.clipboard.writeText(body).catch(() => {});
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
    setToast('Message copied!');
  };

  const openWhatsApp = (body: string, i: number) => {
    const phone = (customer.phone || '').replace(/[^0-9]/g, '');
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, '_blank');
    handleCopy(body, i);
  };

  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-900 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 flex items-center justify-center">
            <MessageCircle size={14} className="text-[#25D366]" />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-semibold">Quick Reply Templates</p>
            <p className="text-slate-500 text-xs">{templates.length} contextual messages · tap to send</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 rounded-full px-2 py-0.5">
            <Zap size={9} className="text-[#25D366]" />
            <span className="text-[#25D366] text-xs font-medium">Smart</span>
          </div>
          {open ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="bg-slate-950/40 divide-y divide-slate-800/60">
          {templates.map((t, i) => (
            <div key={i} className="px-4 py-3.5 hover:bg-slate-900/60 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-slate-200 text-xs font-semibold">{t.label}</p>
                  <p className="text-slate-600 text-xs mt-0.5 italic">{t.when}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(t.body, i)}
                    className={`p-1.5 rounded-lg border transition-colors ${copied === i ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 hover:text-slate-300 hover:bg-slate-800'}`}
                    title="Copy message"
                  >
                    {copied === i ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => openWhatsApp(t.body, i)}
                    className="flex items-center gap-1 text-xs bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <MessageCircle size={11} /> Send
                  </button>
                </div>
              </div>
              {/* WhatsApp-style message preview */}
              <div className="bg-[#025144] rounded-xl rounded-tl-sm px-3 py-2">
                <p className="text-white text-xs leading-relaxed">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
