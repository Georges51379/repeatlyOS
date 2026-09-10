import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export default function Modal({ title, onClose, children, size = 'md', icon }: ModalProps) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 160);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${closing ? 'animate-fade [animation-direction:reverse]' : 'animate-backdrop-in'}`}
        onClick={handleClose}
      />
      <div
        className={`relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full ${sizes[size]} shadow-2xl shadow-black/50 ${closing ? 'opacity-0 scale-95 transition-all duration-150' : 'animate-modal-in'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-semibold flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1 transition-colors focus-ring">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
