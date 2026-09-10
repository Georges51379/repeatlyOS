import { useState } from 'react';
import { QrCode, Download, Check, ExternalLink, Smartphone } from 'lucide-react';
import Toast from './Toast';

interface Props {
  invoiceId: string;
  customer: string;
  amount: number;
  businessName: string;
  method?: string;
}

// Minimal QR-like visual using SVG squares (real QR patterns — not a real encoder, purely visual for demo)
function QRVisual({ data, size = 140 }: { data: string; size?: number }) {
  // Generate deterministic pseudo-random grid based on data string
  const cells = 21;
  const cellSize = size / cells;

  const bits: boolean[][] = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      // finder patterns (corners)
      const inFinder = (r: number, c: number) =>
        (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      if (inFinder(row, col)) {
        const inner = (r: number, c: number) =>
          (r >= 1 && r <= 5 && c >= 1 && c <= 5) || (r >= 1 && r <= 5 && c >= cells - 6 && c <= cells - 2) || (r >= cells - 6 && r <= cells - 2 && c >= 1 && c <= 5);
        const core = (r: number, c: number) =>
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) || (r >= 2 && r <= 4 && c >= cells - 5 && c <= cells - 3) || (r >= cells - 5 && r <= cells - 3 && c >= 2 && c <= 4);
        if (core(row, col)) return true;
        if (inner(row, col)) return false;
        return true;
      }
      // timing pattern
      if (row === 6 || col === 6) return (row + col) % 2 === 0;
      // data area — pseudo-random from string hash
      let hash = 0;
      const key = data + row * cells + col;
      for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff;
      return (hash >>> 0) % 3 !== 0;
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      <rect width={size} height={size} fill="white" rx={4} />
      {bits.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#0f172a" /> : null
        )
      )}
    </svg>
  );
}

export default function InvoiceQR({ invoiceId, customer, amount, businessName, method }: Props) {
  const [shown, setShown] = useState(false);
  const [toast, setToast] = useState('');
  const [scanDemo, setScanDemo] = useState(false);
  const payUrl = `https://pay.repeatlyos.app/${invoiceId}`;
  const qrData  = `${payUrl}|${customer}|${amount}|${businessName}`;

  const download = () => {
    setToast('QR code downloaded. Demo only.');
  };

  return (
    <div>
      <button
        onClick={() => setShown(v => !v)}
        className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium px-3 py-2 rounded-xl transition-all w-full justify-center"
      >
        <QrCode size={13} className="text-blue-400" />
        {shown ? 'Hide QR Code' : 'Generate QR Code'}
      </button>

      {shown && (
        <div className="mt-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 animate-in">
          <div className="text-center mb-4">
            <p className="text-white font-semibold text-sm">{businessName} — Payment QR</p>
            <p className="text-slate-500 text-xs mt-0.5">Customer scans to view invoice and pay</p>
          </div>

          {/* QR visual */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-2xl p-3 shadow-xl shadow-black/30">
              <QRVisual data={qrData} size={150} />
            </div>
          </div>

          {/* Invoice details */}
          <div className="bg-slate-900 rounded-xl p-3 mb-4 space-y-1.5 text-xs">
            {[
              ['Invoice', invoiceId],
              ['Customer', customer],
              ['Amount', `$${amount}`],
              ['Method', method || 'Any'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-200 font-medium">{v}</span>
              </div>
            ))}
          </div>

          {/* Payment link */}
          <div className="bg-slate-800 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
            <span className="text-slate-400 text-xs truncate flex-1 font-mono">{payUrl}</span>
            <button onClick={() => { navigator.clipboard.writeText(payUrl).catch(() => {}); setToast('Link copied!'); }} className="text-blue-400 hover:text-blue-300 shrink-0 transition-colors">
              <ExternalLink size={13} />
            </button>
          </div>

          {/* Scan demo */}
          <button
            onClick={() => { setScanDemo(true); setTimeout(() => setScanDemo(false), 2500); setToast('Demo: customer would see payment page!'); }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 font-medium py-2.5 rounded-xl text-xs transition-colors mb-2"
          >
            <Smartphone size={13} />
            {scanDemo ? <><Check size={12} className="text-emerald-400" /> Customer view demo!</> : 'Preview customer scan experience'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={download} className="flex items-center justify-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-medium py-2 rounded-xl transition-colors">
              <Download size={12} /> Download
            </button>
            <button onClick={() => setToast('QR sent to customer via WhatsApp. Demo only.')} className="flex items-center justify-center gap-1.5 text-xs bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-medium py-2 rounded-xl transition-colors">
              📲 Send via WA
            </button>
          </div>

          <p className="text-slate-700 text-xs text-center mt-3">Demo QR — not functional in production</p>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
