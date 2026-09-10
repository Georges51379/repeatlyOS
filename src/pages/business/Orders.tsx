import { useCallback, useEffect, useState } from 'react';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import type { Customer, Order, OrderItem, OrderStatus, Product } from '../../types/domain';

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'refunded'];
const STATUS_STYLES: Record<OrderStatus, string> = {
  new: 'bg-slate-700/40 text-slate-300',
  confirmed: 'bg-blue-500/15 text-blue-400',
  preparing: 'bg-amber-500/15 text-amber-400',
  ready: 'bg-purple-500/15 text-purple-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
  refunded: 'bg-red-500/15 text-red-400',
};

interface LineItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export default function Orders() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = business ? hasBusinessPermission(memberships, business.id, 'orders.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const [{ data: orderRows }, { data: itemRows }, { data: productRows }, { data: customerRows }] =
      await Promise.all([
        supabase.from('orders').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
        supabase
          .from('order_items')
          .select('*, orders!inner(business_id)')
          .eq('orders.business_id', business.id),
        supabase.from('products').select('*').eq('business_id', business.id).eq('active', true),
        supabase.from('customers').select('*').eq('business_id', business.id),
      ]);
    setOrders((orderRows ?? []) as Order[]);
    const grouped: Record<string, OrderItem[]> = {};
    for (const item of (itemRows ?? []) as OrderItem[]) {
      (grouped[item.order_id] ??= []).push(item);
    }
    setItemsByOrder(grouped);
    setProducts((productRows ?? []) as Product[]);
    setCustomers((customerRows ?? []) as Customer[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  if (!business) return null;

  const customerName = (id: string | null) => customers.find((c) => c.id === id)?.full_name ?? 'Walk-in';

  const addLineItem = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    setLineItems((prev) => [
      ...prev,
      { product_id: product.id, product_name: product.name, unit_price: product.sale_price ?? product.price, quantity: 1 },
    ]);
    setSelectedProduct('');
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = lineItems.reduce((sum, li) => sum + li.unit_price * li.quantity, 0);

  const handleCreate = async () => {
    if (lineItems.length === 0) {
      setError('Add at least one product.');
      return;
    }
    setSaving(true);
    setError(null);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        business_id: business.id,
        customer_id: customerId || null,
        total_amount: total,
      })
      .select()
      .single();

    if (orderError || !order) {
      setSaving(false);
      setError(orderError?.message ?? 'Failed to create order.');
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      lineItems.map((li) => ({
        order_id: order.id,
        product_id: li.product_id,
        product_name: li.product_name,
        unit_price: li.unit_price,
        quantity: li.quantity,
      })),
    );

    setSaving(false);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }
    setShowAdd(false);
    setCustomerId('');
    setLineItems([]);
    await load();
  };

  const setStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    await load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Orders</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New order
          </button>
        )}
      </div>

      {loading ? null : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <ShoppingCart className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No orders yet.</p>
          {products.length === 0 && (
            <p className="text-slate-500 text-sm">Add products first, then record your first order.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-medium text-sm">{customerName(o.customer_id)}</p>
                  <p className="text-xs text-slate-500">{o.created_at.slice(0, 16).replace('T', ' ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">${Number(o.total_amount).toFixed(2)}</span>
                  {canManage ? (
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                      className={`text-xs px-2 py-0.5 rounded-full border-0 focus:outline-none ${STATUS_STYLES[o.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                {(itemsByOrder[o.id] ?? []).map((item) => (
                  <p key={item.id}>
                    {item.quantity} × {item.product_name} — ${(item.unit_price * item.quantity).toFixed(2)}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">New order</h2>
            <div className="space-y-3">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Walk-in (no customer)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.sale_price ?? p.price}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addLineItem}
                  disabled={!selectedProduct}
                  className="px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {lineItems.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  {lineItems.map((li, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">
                        {li.quantity} × {li.product_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">${(li.unit_price * li.quantity).toFixed(2)}</span>
                        <button onClick={() => removeLineItem(i)} className="text-slate-600 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-slate-800">
                    <span className="text-white">Total</span>
                    <span className="text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setLineItems([]);
                  setError(null);
                }}
                className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || lineItems.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Creating…' : 'Create order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
