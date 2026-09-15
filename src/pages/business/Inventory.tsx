import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Minus, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/Skeletons';
import type { InventoryItem, Product } from '../../types/domain';

export default function Inventory() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canAdjust = business ? hasBusinessPermission(memberships, business.id, 'inventory.adjust') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const [{ data: productRows }, { data: itemRows }] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business.id).order('name'),
      supabase.from('inventory_items').select('*').eq('business_id', business.id),
    ]);
    setProducts((productRows ?? []) as Product[]);
    setItems((itemRows ?? []) as InventoryItem[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const itemFor = useCallback((productId: string) => items.find((i) => i.product_id === productId), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(() => {
    let tracked = 0, low = 0, out = 0;
    for (const p of products) {
      const item = itemFor(p.id);
      if (!item) continue;
      tracked++;
      if (item.quantity === 0) out++;
      else if (item.quantity <= item.low_stock_threshold) low++;
    }
    return { tracked, low, out };
  }, [products, itemFor]);

  if (!business) return null;

  const startTracking = async (productId: string) => {
    if (!canAdjust) return;
    const { error: insertError } = await supabase
      .from('inventory_items')
      .insert({ business_id: business.id, product_id: productId, quantity: 0 });
    if (insertError) {
      setToast({ message: insertError.message, type: 'error' });
      return;
    }
    await load();
  };

  const adjust = async (item: InventoryItem, delta: number, reason: string) => {
    if (!canAdjust) return;
    setAdjusting(item.id);
    const { error: movementError } = await supabase.from('inventory_movements').insert({
      business_id: business.id,
      inventory_item_id: item.id,
      change_amount: delta,
      reason,
    });
    setAdjusting(null);
    if (movementError) {
      setToast({ message: movementError.message, type: 'error' });
      return;
    }
    await load();
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Inventory" subtitle={business.name} />

      {stats.tracked > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
          <StatCard title="Tracked" value={stats.tracked} icon={PackageCheck} accent="blue" />
          <StatCard title="Low stock" value={stats.low} icon={AlertTriangle} accent="amber" />
          <StatCard title="Out of stock" value={stats.out} icon={PackageX} accent="red" />
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by product or SKU…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canAdjust && <th className="px-4 py-3 font-medium text-right">Adjust</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={canAdjust ? 5 : 4} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canAdjust ? 5 : 4}>
                  {products.length === 0 ? (
                    <EmptyState type="inventory" />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const item = itemFor(p.id);
                const low = item != null && item.quantity <= item.low_stock_threshold;
                const status = !item ? null : item.quantity === 0 ? 'out_of_stock' : low ? 'low_stock' : 'in_stock';
                return (
                  <tr key={p.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                    <td className="px-4 py-3 text-white">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {item ? item.quantity : <span className="text-slate-700">not tracked</span>}
                    </td>
                    <td className="px-4 py-3">
                      {status ? <StatusBadge status={status} dot /> : '—'}
                    </td>
                    {canAdjust && (
                      <td className="px-4 py-3 text-right">
                        {item ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => adjust(item, -1, 'adjustment')}
                              disabled={adjusting === item.id || item.quantity === 0}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 focus-ring"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => adjust(item, 1, 'restock')}
                              disabled={adjusting === item.id}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 focus-ring"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startTracking(p.id)} className="text-xs text-blue-400 hover:text-blue-300">
                            Start tracking
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
