import { X, Download, Printer, CheckCircle } from 'lucide-react';
import InvoiceQR from './InvoiceQR';

interface InvoiceItem { name: string; qty: number; price: number; }
interface Invoice {
  id: string; customer: string; items: InvoiceItem[];
  total: number; status: string; date: string; dueDate: string; method: string;
}

interface Props { invoice: Invoice; onClose: () => void; onToast: (msg: string) => void; businessName: string; }

const statusColors: Record<string, string> = {
  Paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Overdue: 'text-red-400 bg-red-500/10 border-red-500/30',
  Partial: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

export default function InvoiceModal({ invoice, onClose, onToast, businessName }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <p className="text-white font-bold">Invoice</p>
            <p className="text-blue-400 text-sm font-mono">{invoice.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onToast('Invoice downloaded. Demo only — no backend.')} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"><Download size={15} /></button>
            <button onClick={() => onToast('Print dialog opened. Demo only.')} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"><Printer size={15} /></button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"><X size={15} /></button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-6">
          {/* Business + customer */}
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-white font-bold text-sm">{businessName}</p>
              <p className="text-slate-500 text-xs mt-0.5">Beirut, Lebanon</p>
              <p className="text-slate-500 text-xs">repeatlyos.app</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs font-medium">Billed to</p>
              <p className="text-white font-semibold text-sm mt-0.5">{invoice.customer}</p>
              <p className="text-slate-500 text-xs">Due: {invoice.dueDate}</p>
            </div>
          </div>

          {/* Dates row */}
          <div className="flex gap-4 mb-5">
            <div className="flex-1 bg-slate-800 rounded-lg px-3 py-2">
              <p className="text-slate-500 text-xs">Issue Date</p>
              <p className="text-slate-200 text-sm font-medium">{invoice.date}</p>
            </div>
            <div className="flex-1 bg-slate-800 rounded-lg px-3 py-2">
              <p className="text-slate-500 text-xs">Due Date</p>
              <p className="text-slate-200 text-sm font-medium">{invoice.dueDate}</p>
            </div>
            <div className="flex-1 bg-slate-800 rounded-lg px-3 py-2">
              <p className="text-slate-500 text-xs">Method</p>
              <p className="text-slate-200 text-sm font-medium">{invoice.method}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="border border-slate-800 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800">
                  <th className="text-left text-slate-500 text-xs font-medium px-4 py-2.5">Item</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-3 py-2.5">Qty</th>
                  <th className="text-right text-slate-500 text-xs font-medium px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-3 text-slate-200 text-xs">{item.name}</td>
                    <td className="px-3 py-3 text-slate-400 text-xs text-center">{item.qty}</td>
                    <td className="px-4 py-3 text-slate-200 text-xs text-right font-medium">${(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[invoice.status]}`}>
                {invoice.status === 'Paid' && <CheckCircle size={11} />}
                {invoice.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Total Due</p>
              <p className="text-white text-2xl font-black">${invoice.total.toFixed(2)}</p>
            </div>
          </div>

          {/* QR Code */}
          <InvoiceQR
            invoiceId={invoice.id}
            customer={invoice.customer}
            amount={invoice.total}
            businessName={businessName}
            method={invoice.method}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => onToast('Payment link copied. Demo only.')} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
              Copy Link
            </button>
            <button onClick={() => onToast('Invoice downloaded as PDF. Demo only.')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Download size={14} /> Download PDF
            </button>
          </div>

          <p className="text-center text-slate-700 text-xs mt-3">Demo invoice — no real PDF generated</p>
        </div>
      </div>
    </div>
  );
}
