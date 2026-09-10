import { useState, useMemo } from 'react';
import { AlertTriangle, Package, Check, Plus, Zap, ShoppingCart, Bell } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useDemo } from '../../context/DemoContext';
import { supplierPool } from '../../data/inventoryData';

type AutoPO = { id: string; product: string; qty: number; supplier: string; cost: number; status: 'Draft' | 'Sent' | 'Confirmed'; createdAt: string };

export default function ReorderPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [autoPOs, setAutoPOs] = useState<AutoPO[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [thresholdMult, setThresholdMult] = useState(3); // reorder qty = lowStockAt * multiplier
  const [autoSend, setAutoSend] = useState(false);
  const [preferredSupplier, setPreferredSupplier] = useState(supplierPool[0].name);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const lowProducts = useMemo(() =>
    business.products.filter(p => p.stock <= p.lowStockAt && !dismissed.includes(p.id)),
    [business.products, dismissed]
  );

  const outProducts = useMemo(() =>
    business.products.filter(p => p.stock === 0 && !dismissed.includes(p.id)),
    [business.products, dismissed]
  );

  const allAlerts = useMemo(() =>
    business.products
      .filter(p => p.stock <= p.lowStockAt && !dismissed.includes(p.id))
      .sort((a, b) => a.stock - b.stock),
    [business.products, dismissed]
  );

  const createPO = (product: typeof business.products[0]) => {
    const qty = product.lowStockAt * thresholdMult;
    const newPO: AutoPO = {
      id: `APO-${Date.now().toString().slice(-4)}`,
      product: product.name,
      qty,
      supplier: preferredSupplier,
      cost: product.cost * qty,
      status: autoSend ? 'Sent' : 'Draft',
      createdAt: 'Just now',
    };
    setAutoPOs(prev => [newPO, ...prev]);
    setToast(`Purchase order ${newPO.id} created for ${product.name} — ${qty} ${product.unit}${autoSend ? ' and sent to supplier' : ' (draft)'}.`);
  };

  const createAllPOs = () => {
    allAlerts.forEach(p => createPO(p));
    setToast(`${allAlerts.length} purchase orders created automatically!`);
  };

  const advancePO = (id: string) => {
    setAutoPOs(prev => prev.map(po => {
      if (po.id !== id) return po;
      const next = po.status === 'Draft' ? 'Sent' : 'Confirmed';
      return { ...po, status: next };
    }));
  };

  const totalAlerts = allAlerts.length;
  const totalCostIfOrdered = allAlerts.reduce((a, p) => a + p.cost * p.lowStockAt * thresholdMult, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> Smart Reorder Alerts
          </h2>
          <p className="text-slate-500 text-sm">Auto-detect low stock and generate purchase orders instantly</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            ⚙️ Settings
          </button>
          {allAlerts.length > 0 && (
            <button onClick={createAllPOs} className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors shadow-lg shadow-amber-500/20">
              <Zap size={14} /> Auto-Order All ({allAlerts.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Alerts Active" value={totalAlerts} icon={AlertTriangle} accent="amber" />
        <StatCard title="Out of Stock" value={outProducts.length} icon={Package} accent="red" />
        <StatCard title="Low Stock" value={lowProducts.length - outProducts.length} icon={Bell} accent="orange" />
        <StatCard title="Est. Reorder Cost" value={`$${Math.round(totalCostIfOrdered).toLocaleString()}`} icon={ShoppingCart} accent="blue" />
      </div>

      {/* Alert banner */}
      {totalAlerts > 0 ? (
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-4 flex items-center gap-4">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-400 font-bold text-sm">{totalAlerts} product{totalAlerts !== 1 ? 's' : ''} need restocking</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {outProducts.length > 0 && `${outProducts.length} completely out of stock · `}
              Click "Auto-Order All" to generate purchase orders instantly
            </p>
          </div>
          <button onClick={createAllPOs} className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            <Zap size={12} /> Create All POs
          </button>
        </div>
      ) : (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
          <Check size={20} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-400 font-bold text-sm">All products well stocked</p>
            <p className="text-slate-400 text-xs mt-0.5">No reorder alerts at this time · You're good to go!</p>
          </div>
        </div>
      )}

      {/* Product alert cards */}
      {allAlerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allAlerts.map(p => {
            const isOut = p.stock === 0;
            const reorderQty = p.lowStockAt * thresholdMult;
            const existingPO = autoPOs.find(po => po.product === p.name);
            return (
              <div key={p.id} className={`bg-slate-900 border rounded-2xl p-4 ${isOut ? 'border-red-500/30' : 'border-amber-500/25'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{p.image}</span>
                    <div>
                      <p className="text-white font-semibold text-sm leading-snug">{p.name}</p>
                      <p className="text-slate-500 text-xs">{p.category} · {p.sku}</p>
                    </div>
                  </div>
                  <StatusBadge status={isOut ? 'Out of Stock' : 'Low Stock'} />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-800 rounded-xl py-2">
                    <p className={`font-black text-lg ${isOut ? 'text-red-400' : 'text-amber-400'}`}>{p.stock}</p>
                    <p className="text-slate-500 text-xs">In stock</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl py-2">
                    <p className="font-bold text-slate-300 text-lg">{p.lowStockAt}</p>
                    <p className="text-slate-500 text-xs">Min level</p>
                  </div>
                  <div className="bg-blue-600/15 rounded-xl py-2">
                    <p className="font-black text-blue-400 text-lg">{reorderQty}</p>
                    <p className="text-slate-500 text-xs">To order</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-slate-500">Est. cost: <strong className="text-slate-300">${(p.cost * reorderQty).toFixed(0)}</strong></span>
                  <span className="text-slate-500">Supplier: <strong className="text-slate-400">{preferredSupplier.split(' ')[0]}</strong></span>
                </div>

                {existingPO ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <Check size={12} /> PO {existingPO.id} — {existingPO.status}
                    </span>
                    {existingPO.status !== 'Confirmed' && (
                      <button onClick={() => advancePO(existingPO.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        {existingPO.status === 'Draft' ? 'Send →' : 'Confirm →'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => createPO(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                      <Plus size={12} /> Create PO
                    </button>
                    <button onClick={() => setDismissed(d => [...d, p.id])} className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-500 rounded-xl transition-colors" title="Dismiss alert">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-generated POs */}
      {autoPOs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <ShoppingCart size={15} className="text-blue-400" />
            <h3 className="text-white font-semibold text-sm">Auto-Generated Purchase Orders</h3>
            <span className="ml-auto text-slate-500 text-xs">{autoPOs.length} orders</span>
          </div>
          <div className="divide-y divide-slate-800/50">
            {autoPOs.map(po => (
              <div key={po.id} className="flex items-center gap-4 px-5 py-3.5">
                <div>
                  <p className="text-blue-400 text-xs font-mono font-bold">{po.id}</p>
                  <p className="text-white text-sm font-semibold">{po.product}</p>
                  <p className="text-slate-500 text-xs">{po.qty} units · {po.supplier} · {po.createdAt}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-slate-300 font-bold">${po.cost.toFixed(0)}</span>
                  <StatusBadge status={po.status === 'Draft' ? 'Pending' : po.status === 'Sent' ? 'Scheduled' : 'Confirmed'} />
                  {po.status !== 'Confirmed' && (
                    <button onClick={() => advancePO(po.id)} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">
                      {po.status === 'Draft' ? 'Send' : 'Confirm'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <Modal title="Reorder Settings" onClose={() => setShowSettings(false)} size="sm" icon={<Zap size={15} className="text-amber-400" />}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Preferred Supplier</label>
              <select value={preferredSupplier} onChange={e => setPreferredSupplier(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                {supplierPool.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reorder Quantity = Reorder Point × <strong className="text-white">{thresholdMult}×</strong></label>
              <input type="range" min={1} max={10} value={thresholdMult} onChange={e => setThresholdMult(Number(e.target.value))} className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1× (conservative)</span><span>10× (bulk)</span></div>
            </div>
            <div className="flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-slate-200 text-sm font-medium">Auto-send to supplier</p>
                <p className="text-slate-500 text-xs">POs go straight to Sent when created</p>
              </div>
              <button onClick={() => setAutoSend(v => !v)} className={`w-11 h-6 rounded-full transition-colors ${autoSend ? 'bg-blue-600' : 'bg-slate-600'} relative shrink-0`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSend ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <button onClick={() => { setShowSettings(false); setToast('Reorder settings saved.'); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Save Settings</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
