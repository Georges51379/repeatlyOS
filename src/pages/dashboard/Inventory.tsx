import { useState, useMemo } from 'react';
import {
  Warehouse, TrendingDown, TrendingUp, AlertTriangle, DollarSign, Package,
  Search, Plus, ArrowUpRight, ArrowDownRight, RotateCcw, Truck, Users2,
  Download, X, Check, ChevronRight, BarChart3, ClipboardList, History
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';
import { supplierPool, generateMovements, generatePurchaseOrders, type StockMovement, type PurchaseOrder } from '../../data/inventoryData';

type View = 'overview' | 'ledger' | 'orders' | 'suppliers' | 'reports';

const movementIcons: Record<StockMovement['type'], { icon: typeof ArrowUpRight; color: string }> = {
  Received: { icon: ArrowDownRight, color: 'text-emerald-400 bg-emerald-500/10' },
  Sold: { icon: ArrowUpRight, color: 'text-blue-400 bg-blue-500/10' },
  Adjusted: { icon: RotateCcw, color: 'text-purple-400 bg-purple-500/10' },
  Returned: { icon: ArrowDownRight, color: 'text-cyan-400 bg-cyan-500/10' },
  Damaged: { icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
  Transferred: { icon: Truck, color: 'text-amber-400 bg-amber-500/10' },
};

const poStatusToBadge: Record<PurchaseOrder['status'], string> = {
  Draft: 'Pending', Sent: 'Scheduled', Confirmed: 'Confirmed', Received: 'Completed', Cancelled: 'Cancelled',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

export default function InventoryPage() {
  const { business } = useDemo();
  const [view, setView] = useState<View>('overview');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState<{ id: number; name: string; stock: number } | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock count correction');
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'remove'>('add');
  const [showNewPO, setShowNewPO] = useState(false);
  const [poSupplier, setPoSupplier] = useState(supplierPool[0].name);
  const [poItems, setPoItems] = useState<{ productId: number; qty: string }[]>([{ productId: business.products[0]?.id || 0, qty: '' }]);
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => generatePurchaseOrders(business.products, supplierPool));
  const [stockOverrides, setStockOverrides] = useState<Record<number, number>>({});

  const products = useMemo(() => business.products.map(p => ({
    ...p,
    stock: stockOverrides[p.id] !== undefined ? stockOverrides[p.id] : p.stock,
  })), [business.products, stockOverrides]);

  const movements = useMemo(() => generateMovements(business.products), [business.key]);

  // Derived metrics
  const totalValue = products.reduce((a, p) => a + p.price * p.stock, 0);
  const totalCostValue = products.reduce((a, p) => a + p.cost * p.stock, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.lowStockAt);
  const outOfStock = products.filter(p => p.stock === 0);
  const totalUnits = products.reduce((a, p) => a + p.stock, 0);
  const potentialProfit = totalValue - totalCostValue;

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.category] = (map[p.category] || 0) + p.price * p.stock; });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [products]);

  const turnoverData = products.slice(0, 6).map(p => {
    const sold = movements.filter(m => m.productId === p.id && m.type === 'Sold').reduce((a, m) => a + Math.abs(m.qty), 0);
    return { name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name, sold };
  });

  const filteredMovements = movements.filter(m =>
    search === '' || m.productName.toLowerCase().includes(search.toLowerCase()) || m.reference.toLowerCase().includes(search.toLowerCase())
  );

  const views: { key: View; label: string; icon: typeof Warehouse }[] = [
    { key: 'overview', label: 'Overview', icon: Warehouse },
    { key: 'ledger', label: 'Stock Ledger', icon: History },
    { key: 'orders', label: 'Purchase Orders', icon: ClipboardList },
    { key: 'suppliers', label: 'Suppliers', icon: Users2 },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const openAdjust = (p: { id: number; name: string; stock: number }) => {
    setAdjustModal(p);
    setAdjustQty('');
    setAdjustReason('Stock count correction');
    setAdjustDirection('add');
  };

  const submitAdjust = () => {
    if (!adjustModal || !adjustQty || Number(adjustQty) <= 0) { setToast('Enter a valid quantity.'); return; }
    const delta = adjustDirection === 'add' ? Number(adjustQty) : -Number(adjustQty);
    const newStock = Math.max(0, adjustModal.stock + delta);
    setStockOverrides(prev => ({ ...prev, [adjustModal.id]: newStock }));
    setToast(`Stock adjusted for "${adjustModal.name}" — ${adjustDirection === 'add' ? '+' : '−'}${adjustQty} units. Reason: ${adjustReason}.`);
    setAdjustModal(null);
  };

  const submitPO = () => {
    const validItems = poItems.filter(i => i.productId && i.qty && Number(i.qty) > 0);
    if (validItems.length === 0) { setToast('Add at least one product with a quantity.'); return; }
    const items = validItems.map(i => {
      const product = business.products.find(p => p.id === i.productId)!;
      return { productId: product.id, productName: product.name, qty: Number(i.qty), unitCost: product.cost };
    });
    const newPO: PurchaseOrder = {
      id: `PO-2024-0${15 + orders.length}`,
      supplier: poSupplier,
      items,
      total: items.reduce((a, i) => a + i.qty * i.unitCost, 0),
      status: 'Draft',
      orderedDate: '—',
      expectedDate: '—',
    };
    setOrders(prev => [newPO, ...prev]);
    setShowNewPO(false);
    setPoItems([{ productId: business.products[0]?.id || 0, qty: '' }]);
    setToast(`Purchase order ${newPO.id} created for ${poSupplier}.`);
  };

  const advancePOStatus = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const flow: PurchaseOrder['status'][] = ['Draft', 'Sent', 'Confirmed', 'Received'];
      const idx = flow.indexOf(o.status);
      if (idx === -1 || idx === flow.length - 1) return o;
      const next = flow[idx + 1];
      if (next === 'Received') {
        setStockOverrides(prevStock => {
          const updated = { ...prevStock };
          o.items.forEach(item => {
            const current = updated[item.productId] !== undefined ? updated[item.productId] : (business.products.find(p => p.id === item.productId)?.stock || 0);
            updated[item.productId] = current + item.qty;
          });
          return updated;
        });
        setToast(`${o.id} received — stock levels updated automatically.`);
      } else {
        setToast(`${o.id} status updated to "${next}".`);
      }
      return { ...o, status: next, orderedDate: next === 'Sent' ? '2024-06-11' : o.orderedDate, expectedDate: next === 'Sent' ? '2024-06-16' : o.expectedDate };
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Warehouse size={18} className="text-blue-400" /> Inventory Management
          </h2>
          <p className="text-slate-500 text-sm">Full stock control for {business.name} — products, purchase orders, suppliers</p>
        </div>
        <button onClick={() => setToast('Inventory report exported. No backend connected.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
          <Download size={12} /> Export Report
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${view === v.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <v.icon size={13} /> {v.label}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW ============ */}
      {view === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Inventory Value (Retail)" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} accent="emerald" />
            <StatCard title="Total Units in Stock" value={totalUnits.toLocaleString()} icon={Package} accent="blue" />
            <StatCard title="Low Stock Items" value={lowStock.length} icon={AlertTriangle} accent="amber" />
            <StatCard title="Out of Stock" value={outOfStock.length} icon={TrendingDown} accent="red" />
          </div>

          <div className="bg-gradient-to-r from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-9 h-9 bg-emerald-500/15 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-400 font-semibold text-sm">${potentialProfit.toLocaleString()} potential profit locked in current inventory</p>
              <p className="text-slate-400 text-xs mt-0.5">Cost value: ${totalCostValue.toLocaleString()} · Retail value: ${totalValue.toLocaleString()}</p>
            </div>
          </div>

          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" /> Reorder Suggestions
                </h3>
                <button onClick={() => setShowNewPO(true)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                  <Plus size={11} /> Create Purchase Order
                </button>
              </div>
              <div className="divide-y divide-slate-800/60">
                {[...outOfStock, ...lowStock].slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xl shrink-0">{p.image}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{p.name}</p>
                      <p className="text-slate-500 text-xs">{p.stock === 0 ? 'Out of stock' : `${p.stock} ${p.unit} remaining`} · Reorder at {p.lowStockAt}</p>
                    </div>
                    <StatusBadge status={p.stock === 0 ? 'Out of Stock' : 'Low Stock'} />
                    <button onClick={() => openAdjust(p)} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                      Adjust
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-1">Inventory Value by Category</h3>
              <p className="text-slate-500 text-xs mb-4">Retail value distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [`$${v}`, 'Value']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {categoryBreakdown.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-400 text-xs truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl">
              <div className="px-5 py-3.5 border-b border-slate-800">
                <h3 className="text-white font-semibold text-sm">Recent Stock Activity</h3>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-[280px] overflow-y-auto scrollbar-thin">
                {movements.slice(0, 6).map(m => {
                  const { icon: Icon, color } = movementIcons[m.type];
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-xs font-medium truncate">{m.productName}</p>
                        <p className="text-slate-500 text-xs">{m.type} · {m.date} {m.time}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${m.qty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{m.qty > 0 ? '+' : ''}{m.qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-white font-semibold text-sm">All Products — Stock Levels</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Product', 'SKU', 'Category', 'In Stock', 'Reorder Point', 'Unit Cost', 'Retail Value', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const status = p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockAt ? 'Low Stock' : 'Active';
                    return (
                      <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{p.image}</span>
                            <span className="text-slate-200 text-sm font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs font-mono">{p.sku}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{p.category}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${status === 'Out of Stock' ? 'text-red-400' : status === 'Low Stock' ? 'text-amber-400' : 'text-emerald-400'}`}>{p.stock}</span>
                          <span className="text-slate-500 text-xs"> {p.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{p.lowStockAt} {p.unit}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">${p.cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-200 text-sm font-medium">${(p.price * p.stock).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={status} /></td>
                        <td className="px-4 py-3">
                          <button onClick={() => openAdjust(p)} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ STOCK LEDGER ============ */}
      {view === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product or reference..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <p className="text-slate-500 text-xs">{filteredMovements.length} movements recorded</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Date', 'Product', 'Type', 'Quantity', 'Reason', 'Reference', 'By'].map(h => (
                      <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map(m => {
                    const { icon: Icon, color } = movementIcons[m.type];
                    return (
                      <tr key={m.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-xs">{m.date}<br /><span className="text-slate-600">{m.time}</span></td>
                        <td className="px-4 py-3 text-slate-200 text-sm font-medium">{m.productName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${color}`}>
                            <Icon size={11} /> {m.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${m.qty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{m.qty > 0 ? '+' : ''}{m.qty}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{m.reason}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs font-mono">{m.reference}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <span className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">{m.by[0]}</span>
                            {m.by}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-500 text-sm">No movements match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ PURCHASE ORDERS ============ */}
      {view === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm">{orders.length} purchase orders</p>
            <button onClick={() => setShowNewPO(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors">
              <Plus size={13} /> New Purchase Order
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orders.map(o => (
              <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-blue-400 font-mono text-xs font-medium">{o.id}</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{o.supplier}</p>
                  </div>
                  <StatusBadge status={poStatusToBadge[o.status]} />
                </div>
                <div className="space-y-1.5 mb-3">
                  {o.items.slice(0, 3).map(item => (
                    <div key={item.productId} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate">{item.productName}</span>
                      <span className="text-slate-300 font-medium shrink-0 ml-2">{item.qty} × ${item.unitCost.toFixed(2)}</span>
                    </div>
                  ))}
                  {o.items.length > 3 && <p className="text-slate-600 text-xs">+{o.items.length - 3} more items</p>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <p className="text-slate-500 text-xs">Total</p>
                    <p className="text-white font-bold">${o.total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">Expected</p>
                    <p className="text-slate-300 text-xs font-medium">{o.expectedDate}</p>
                  </div>
                </div>
                {o.status !== 'Received' && o.status !== 'Cancelled' && (
                  <button onClick={() => advancePOStatus(o.id)} className="w-full mt-3 flex items-center justify-center gap-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-xs font-medium py-2 rounded-lg transition-colors">
                    {o.status === 'Draft' ? 'Send to Supplier' : o.status === 'Sent' ? 'Mark as Confirmed' : 'Mark as Received'} <ChevronRight size={12} />
                  </button>
                )}
                {o.status === 'Received' && (
                  <div className="w-full mt-3 flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-medium py-2">
                    <Check size={12} /> Stock updated automatically
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ SUPPLIERS ============ */}
      {view === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm">{supplierPool.length} suppliers on file</p>
            <button onClick={() => setToast('Add supplier form — demo only.')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Add Supplier
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierPool.map(s => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <Truck size={16} className="text-slate-400" />
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-white font-semibold text-sm">{s.name}</p>
                <p className="text-slate-500 text-xs mb-3">{s.category}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="text-slate-300">{s.contact}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-slate-300">{s.phone}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Lead time</span><span className="text-slate-300">{s.leadTime}</span></div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xs ${i < Math.round(s.rating) ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                    ))}
                    <span className="text-slate-500 text-xs ml-1">{s.rating}</span>
                  </div>
                  <button onClick={() => { setPoSupplier(s.name); setShowNewPO(true); }} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ REPORTS ============ */}
      {view === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-1">Top Selling Products</h3>
              <p className="text-slate-500 text-xs mb-4">Units sold — last 7 days</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={turnoverData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="sold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-1">Inventory Valuation Summary</h3>
              <p className="text-slate-500 text-xs mb-4">Cost vs retail breakdown</p>
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Total Cost Value', value: totalCostValue, color: 'bg-slate-500' },
                  { label: 'Total Retail Value', value: totalValue, color: 'bg-blue-500' },
                  { label: 'Potential Profit', value: potentialProfit, color: 'bg-emerald-500' },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="text-slate-200 font-medium">${row.value.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${Math.min(100, (row.value / Math.max(totalValue, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-800">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-white font-bold text-lg">{products.length}</p>
                  <p className="text-slate-500 text-xs mt-0.5">SKUs tracked</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-white font-bold text-lg">{Math.round((potentialProfit / Math.max(totalCostValue, 1)) * 100)}%</p>
                  <p className="text-slate-500 text-xs mt-0.5">Markup</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Stock Movement Summary (This Week)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-5">
              {Object.entries(movementIcons).map(([type, { icon: Icon, color }]) => {
                const count = movements.filter(m => m.type === type).length;
                return (
                  <div key={type} className="bg-slate-800 rounded-xl p-3 text-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <p className="text-white font-bold">{count}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{type}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============ ADJUST STOCK MODAL ============ */}
      {adjustModal && (
        <Modal title="Adjust Stock" onClose={() => setAdjustModal(null)} size="sm">
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-300 text-sm font-medium">{adjustModal.name}</span>
              <span className="text-slate-400 text-xs">Current: <strong className="text-white">{adjustModal.stock}</strong></span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjustDirection('add')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${adjustDirection === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                <ArrowDownRight size={13} /> Add Stock
              </button>
              <button onClick={() => setAdjustDirection('remove')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${adjustDirection === 'remove' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                <ArrowUpRight size={13} /> Remove Stock
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reason</label>
              <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                {adjustDirection === 'add'
                  ? ['Stock count correction', 'Purchase order delivery', 'Customer return', 'Internal transfer in'].map(r => <option key={r}>{r}</option>)
                  : ['Stock count correction', 'Damaged / expired', 'Customer purchase', 'Internal transfer out', 'Staff use'].map(r => <option key={r}>{r}</option>)
                }
              </select>
            </div>
            {adjustQty && Number(adjustQty) > 0 && (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs">New stock level</p>
                <p className="text-white font-bold text-lg">{Math.max(0, adjustModal.stock + (adjustDirection === 'add' ? Number(adjustQty) : -Number(adjustQty)))}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setAdjustModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={submitAdjust} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">Confirm Adjustment</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============ NEW PURCHASE ORDER MODAL ============ */}
      {showNewPO && (
        <Modal title="New Purchase Order" onClose={() => setShowNewPO(false)} size="lg">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Supplier</label>
              <select value={poSupplier} onChange={e => setPoSupplier(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                {supplierPool.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.name}>{s.name} — {s.category}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Items</label>
                <button onClick={() => setPoItems(prev => [...prev, { productId: business.products[0]?.id || 0, qty: '' }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Plus size={11} /> Add line
                </button>
              </div>
              <div className="space-y-2">
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={e => setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: Number(e.target.value) } : it))}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {business.products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.cost.toFixed(2)} cost)</option>)}
                    </select>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={e => setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: e.target.value } : it))}
                      placeholder="Qty"
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    {poItems.length > 1 && (
                      <button onClick={() => setPoItems(prev => prev.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const total = poItems.reduce((a, it) => {
                const product = business.products.find(p => p.id === it.productId);
                return a + (product && it.qty ? product.cost * Number(it.qty) : 0);
              }, 0);
              return total > 0 ? (
                <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Estimated total cost</span>
                  <span className="text-white font-bold">${total.toLocaleString()}</span>
                </div>
              ) : null;
            })()}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNewPO(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={submitPO} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">Create Order</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
