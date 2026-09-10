import { useState, useRef } from 'react';
import { Upload, Check, X, Download, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Toast from './Toast';

interface ImportedCustomer {
  name: string;
  phone: string;
  area: string;
  type: string;
  plan: string;
  valid: boolean;
  error?: string;
}

interface Props {
  onImport: (customers: ImportedCustomer[]) => void;
  onClose: () => void;
}

const SAMPLE_CSV = `name,phone,area,type,plan
Rami Haddad,+961 70 123 456,Beirut,Subscription,Monthly Premium
Layla Khoury,+961 71 234 567,Jounieh,Package,10 Sessions
Ahmad Nassar,+961 76 345 678,Dbayeh,Subscription,Monthly Basic
Sara Khalil,+961 78 456 789,Hamra,Walk-in,—`;

function parseCSV(text: string): ImportedCustomer[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx  = headers.indexOf('name');
  const phoneIdx = headers.indexOf('phone');
  const areaIdx  = headers.indexOf('area');
  const typeIdx  = headers.indexOf('type');
  const planIdx  = headers.indexOf('plan');

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const name  = nameIdx  >= 0 ? cols[nameIdx]  || '' : '';
    const phone = phoneIdx >= 0 ? cols[phoneIdx] || '' : '';
    const area  = areaIdx  >= 0 ? cols[areaIdx]  || '' : '';
    const type  = typeIdx  >= 0 ? cols[typeIdx]  || 'Walk-in' : 'Walk-in';
    const plan  = planIdx  >= 0 ? cols[planIdx]  || '—' : '—';

    const valid = name.length > 1 && phone.length > 5;
    return { name, phone, area, type, plan, valid, error: !valid ? (!name ? 'Missing name' : 'Missing/invalid phone') : undefined };
  });
}

export default function CSVImport({ onImport, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [customers, setCustomers] = useState<ImportedCustomer[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) { setToast('Please upload a .csv file.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { setToast('No valid rows found. Check your CSV format.'); return; }
      setCustomers(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const validCount = customers.filter(c => c.valid).length;
  const invalidCount = customers.filter(c => !c.valid).length;

  const doImport = () => {
    onImport(customers.filter(c => c.valid));
    setStep('done');
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'repeatlyos-customers-sample.csv';
    a.click();
  };

  return (
    <Modal title="Import Customers from CSV" onClose={onClose} icon={<Upload size={15} className="text-blue-400" />}>
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'}`}
          >
            <Upload size={28} className={`mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-slate-600'}`} />
            <p className="text-slate-300 text-sm font-medium mb-1">Drop your CSV file here</p>
            <p className="text-slate-500 text-xs">or click to browse · .csv files only</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Required columns */}
          <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold mb-2">Required CSV columns</p>
            <div className="flex flex-wrap gap-1.5">
              {['name','phone','area','type','plan'].map(c => (
                <code key={c} className="text-xs bg-slate-700 text-blue-300 px-2 py-0.5 rounded">{c}</code>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-2">Only <code className="text-slate-400">name</code> and <code className="text-slate-400">phone</code> are required. Other columns are optional.</p>
          </div>

          <button onClick={downloadSample} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-medium py-2.5 rounded-xl text-sm transition-colors">
            <Download size={13} /> Download Sample CSV
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-emerald-400 font-black text-2xl">{validCount}</p>
              <p className="text-slate-400 text-xs">Ready to import</p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${invalidCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700'}`}>
              <p className={`font-black text-2xl ${invalidCount > 0 ? 'text-red-400' : 'text-slate-600'}`}>{invalidCount}</p>
              <p className="text-slate-400 text-xs">{invalidCount > 0 ? 'Will be skipped' : 'No errors'}</p>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-500 px-3 py-2">Name</th>
                  <th className="text-left text-slate-500 px-3 py-2">Phone</th>
                  <th className="text-left text-slate-500 px-3 py-2">Type</th>
                  <th className="text-left text-slate-500 px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={i} className={`border-b border-slate-800/40 ${!c.valid ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2 text-slate-200">{c.name || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-3 py-2 text-slate-400">{c.phone || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-3 py-2 text-slate-500">{c.type}</td>
                    <td className="px-3 py-2">
                      {c.valid ? (
                        <span className="flex items-center gap-1 text-emerald-400"><Check size={11} /> Valid</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400"><X size={11} /> {c.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidCount > 0 && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">{invalidCount} row{invalidCount > 1 ? 's' : ''} will be skipped due to missing name or phone. Fix your CSV and re-upload to include them.</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep('upload')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Back</button>
            <button onClick={doImport} disabled={validCount === 0} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Import {validCount} customer{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check size={28} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Import complete!</p>
            <p className="text-slate-400 text-sm mt-1">{validCount} customers added to your list.</p>
          </div>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors">Done</button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </Modal>
  );
}
