import { useCallback, useEffect, useState } from 'react';
import { Warehouse, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import type { InventoryItem, Product } from '../../types/domain';

export default function Inventory() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<string | null>(null);

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

  if (!business) return null;

  const itemFor = (productId: string) => items.find((i) => i.product_id === productId);

  const startTracking = async (productId: string) => {
    if (!canAdjust) return;
    setError(null);
    const { error: insertError } = await supabase
      .from('inventory_items')
      .insert({ business_id: business.id, product_id: productId, quantity: 0 });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await load();
  };

  const adjust = async (item: InventoryItem, delta: number, reason: string) => {
    if (!canAdjust) return;
    setAdjusting(item.id);
    setError(null);
    const { error: movementError } = await supabase.from('inventory_movements').insert({
      business_id: business.id,
      inventory_item_id: item.id,
      change_amount: delta,
      reason,
    });
    setAdjusting(null);
    if (movementError) {
      setError(movementError.message);
      return;
    }
    await load();
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-lg">Inventory</h1>
        <p className="text-slate-500 text-sm">{business.name}</p>
      </div>

      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      {loading ? null : products.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Warehouse className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No products yet.</p>
          <p className="text-slate-500 text-sm">Add products first, then track their stock here.</p>
        </div>
      ) : (
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
              {products.map((p) => {
                const item = itemFor(p.id);
                const low = item != null && item.quantity <= item.low_stock_threshold;
                return (
                  <tr key={p.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-4 py-3 text-white">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {item ? item.quantity : <span className="text-slate-700">not tracked</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            item.quantity === 0
                              ? 'bg-red-500/15 text-red-400'
                              : low
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {item.quantity === 0 ? 'Out of stock' : low ? 'Low stock' : 'In stock'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    {canAdjust && (
                      <td className="px-4 py-3 text-right">
                        {item ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => adjust(item, -1, 'adjustment')}
                              disabled={adjusting === item.id || item.quantity === 0}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => adjust(item, 1, 'restock')}
                              disabled={adjusting === item.id}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startTracking(p.id)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Start tracking
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
