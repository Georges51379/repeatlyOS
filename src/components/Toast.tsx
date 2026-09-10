import { useEffect, useState } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  onClose: () => void;
}

const config = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', ring: 'border-emerald-500/25', bar: 'bg-emerald-500' },
  info:    { icon: Info,         color: 'text-blue-400',    ring: 'border-blue-500/25',    bar: 'bg-blue-500' },
  warning: { icon: AlertCircle,  color: 'text-amber-400',   ring: 'border-amber-500/25',   bar: 'bg-amber-500' },
};

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [closing, setClosing] = useState(false);
  const { icon: Icon, color, ring, bar } = config[type];

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const t = setTimeout(handleClose, 3800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] ${closing ? 'animate-toast-out' : 'animate-toast-in'}`}>
      <div className={`relative flex items-center gap-3 bg-slate-800/95 backdrop-blur border ${ring} rounded-xl pl-4 pr-3 py-3 shadow-2xl shadow-black/40 max-w-sm overflow-hidden`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
        <Icon size={18} className={`${color} shrink-0 animate-check-pop`} />
        <p className="text-sm text-slate-200 flex-1 leading-snug">{message}</p>
        <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-md p-1 transition-colors shrink-0">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
