import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, DollarSign, AlertTriangle, XCircle, Trash2, Edit2, TrendingUp, ShoppingBag, Warehouse } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

type Product = {
  id: number; name: string; category: string; price: number; cost: number;
  stock: number; lowStockAt: number; unit: string; sku: string; image: string; status: string;
};

const emptyForm = { name: '', category: '', price: '', cost: '', stock: '', lowStockAt: '', unit: 'pcs', sku: '', image: '📦' };

const emojiPicker = ['📦','🥤','💧','🍫','🧴','🧽','🧺','👕','👔','💡','⚡','🧊','🔧','✏️','🪝','🌸','🌺','🌲','✨','🏋️','🧤','💎','🖥️','💻','📱','🎧','🔌','🍽️','☕','🧃'];

export default function ProductsPage() {
  const { business } = useDemo();
  const [products, setProducts] = useState<Product[]>(business.products);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [toast, setToast] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  // Reset product list when business switches
  useState(() => { setProducts(business.products); });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const getStatus = (p: { stock: number; lowStockAt: number }) =>
    p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockAt ? 'Low Stock' : 'Active';

  const filtered = products.filter(p => {
    const ms = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const mc = categoryFilter === 'All' || p.category === categoryFilter;
    return ms && mc;
  });

  const totalValue = products.reduce((a, p) => a + p.price * p.stock, 0);
  const lowStock = products.filter(p => getStatus(p) === 'Low Stock').length;
  const outOfStock = products.filter(p => getStatus(p) === 'Out of Stock').length;
  const avgMargin = Math.round(products.reduce((a, p) => a + ((p.price - p.cost) / p.price) * 100, 0) / Math.max(products.length, 1));

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), cost: String(p.cost), stock: String(p.stock), lowStockAt: String(p.lowStockAt), unit: p.unit, sku: p.sku, image: p.image });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name || !form.price || !form.category) { setToast('Please fill in product name, category, and price.'); return; }
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? {
        ...p, name: form.name, category: form.category, price: Number(form.price) || 0, cost: Number(form.cost) || 0,
        stock: Number(form.stock) || 0, lowStockAt: Number(form.lowStockAt) || 5, unit: form.unit, sku: form.sku || p.sku, image: form.image,
        status: getStatus({ stock: Number(form.stock) || 0, lowStockAt: Number(form.lowStockAt) || 5 }),
      } : p));
      setToast(`"${form.name}" updated successfully.`);
    } else {
      const newProduct: Product = {
        id: Math.max(0, ...products.map(p => p.id)) + 1,
        name: form.name, category: form.category, price: Number(form.price) || 0, cost: Number(form.cost) || 0,
        stock: Number(form.stock) || 0, lowStockAt: Number(form.lowStockAt) || 5, unit: form.unit || 'pcs',
        sku: form.sku || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`, image: form.image,
        status: getStatus({ stock: Number(form.stock) || 0, lowStockAt: Number(form.lowStockAt) || 5 }),
      };
      setProducts(prev => [newProduct, ...prev]);
      setToast(`"${form.name}" added to your product catalog.`);
    }
    setShowModal(false);
  };

  const deleteProduct = () => {
    if (!confirmDelete) return;
    setProducts(prev => prev.filter(p => p.id !== confirmDelete.id));
    setToast(`"${confirmDelete.name}" removed from catalog.`);
    setConfirmDelete(null);
  };

  const adjustStock = (id: number, delta: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const newStock = Math.max(0, p.stock + delta);
      return { ...p, stock: newStock, status: getStatus({ stock: newStock, lowStockAt: p.lowStockAt }) };
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Products</h2>
          <p className="text-slate-500 text-sm">Sell physical items alongside your services · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/inventory" className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2.5 rounded-xl transition-colors">
            <Warehouse size={13} /> Full Inventory
          </Link>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Inventory Value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} accent="emerald" />
        <StatCard title="Total Products" value={products.length} icon={Package} accent="blue" />
        <StatCard title="Low Stock" value={lowStock} icon={AlertTriangle} accent="amber" />
        <StatCard title="Out of Stock" value={outOfStock} icon={XCircle} accent="red" />
      </div>

      {/* Margin insight banner */}
      <div className="bg-gradient-to-r from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-9 h-9 bg-emerald-500/15 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-emerald-400 font-semibold text-sm">~{avgMargin}% average profit margin across your catalog</p>
          <p className="text-slate-400 text-xs mt-0.5">Selling products alongside services is a simple way to increase revenue per visit.</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p, idx) => {
            const status = getStatus(p);
            const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
            return (
              <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 card-hover transition-colors animate-in" style={{ animationDelay: `${idx * 35}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl">{p.image}</div>
                  <StatusBadge status={status} />
                </div>
                <p className="text-white font-semibold text-sm leading-snug mb-0.5">{p.name}</p>
                <p className="text-slate-500 text-xs mb-3">{p.category} · {p.sku}</p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-white font-bold text-lg">${p.price}</span>
                    <span className="text-slate-500 text-xs"> / {p.unit.replace(/s$/, '')}</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">{margin}% margin</span>
                </div>

                {/* Stock control */}
                <div className="bg-slate-800 rounded-lg px-3 py-2 mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500 text-xs">Stock</span>
                    <span className={`text-xs font-bold ${status === 'Out of Stock' ? 'text-red-400' : status === 'Low Stock' ? 'text-amber-400' : 'text-emerald-400'}`}>{p.stock} {p.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustStock(p.id, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-xs font-bold transition-colors">−</button>
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${status === 'Out of Stock' ? 'bg-red-500' : status === 'Low Stock' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (p.stock / Math.max(p.lowStockAt * 3, 1)) * 100)}%` }} />
                    </div>
                    <button onClick={() => adjustStock(p.id, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-xs font-bold transition-colors">+</button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 text-blue-400 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    <Edit2 size={11} /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(p)} className="px-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-lg transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag size={36} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No products found</p>
          <p className="text-slate-600 text-sm mt-1">Try a different search or category, or add your first product.</p>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)} size="md">
          <div className="space-y-4">
            {/* Icon picker */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Icon</label>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">{form.image}</div>
                <p className="text-slate-500 text-xs">Pick an icon that represents this product</p>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-thin">
                {emojiPicker.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, image: e }))} className={`w-8 h-8 flex items-center justify-center rounded-lg text-base transition-colors ${form.image === e ? 'bg-blue-600/30 border border-blue-500' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Soft Drink Can, Laptop, Menu Item..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category *</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Drinks, Electronics" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">SKU</label>
                <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Auto-generated if empty" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sell Price ($) *</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cost Price ($)</label>
                <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Stock Quantity</label>
                <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Unit</label>
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                  {['pcs','bottles','cans','boxes','packs','kg','bags','sets','tubs','rolls'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Low Stock Alert Threshold</label>
                <input type="number" value={form.lowStockAt} onChange={e => setForm(f => ({ ...f, lowStockAt: e.target.value }))} placeholder="e.g. 10 — alert when stock drops below this" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {editing ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal title="Remove Product" onClose={() => setConfirmDelete(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-xl">{confirmDelete.image}</div>
              <div>
                <p className="text-white text-sm font-medium">{confirmDelete.name}</p>
                <p className="text-slate-500 text-xs">{confirmDelete.category} · {confirmDelete.sku}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">This will remove the product from your catalog. This action can't be undone in this demo session.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={deleteProduct} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">Remove</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
