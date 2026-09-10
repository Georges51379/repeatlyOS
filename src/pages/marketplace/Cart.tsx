import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMarketplaceCart } from '../../context/MarketplaceCartContext';

export default function Cart() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { businessId, businessName, items, setQuantity, removeItem, clearCart, total } = useMarketplaceCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h1 className="text-white font-semibold text-lg mb-1">Order placed!</h1>
        <p className="text-slate-400 text-sm mb-6">{businessName} will confirm your order shortly.</p>
        <button
          onClick={() => navigate(`/${citySlug}`)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to marketplace
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 mb-4">Your cart is empty.</p>
        <button onClick={() => navigate(`/${citySlug}`)} className="text-sm text-blue-400 hover:text-blue-300">
          Browse businesses →
        </button>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!name.trim() || !phone.trim() || !businessId) {
      setError('Name and phone are required.');
      return;
    }
    if (deliveryMethod === 'delivery' && !address.trim()) {
      setError('Delivery address is required.');
      return;
    }
    setSubmitting(true);
    setError(null);

    // Generate the id client-side and don't request the row back at all:
    // orders_member_read requires business membership, which a guest
    // shopper never has, so INSERT ... RETURNING would fail the same way
    // businesses' bootstrap insert once did (Phase 1) — except a guest has
    // no stable identity for a created_by-style fix. Since the client
    // already knows every value it's inserting, there's nothing to read
    // back; this sidesteps the problem entirely instead of working around it.
    const orderId = crypto.randomUUID();
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      business_id: businessId,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? address.trim() : null,
      total_amount: total,
    });

    if (orderError) {
      setSubmitting(false);
      setError(orderError.message);
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((i) => ({
        order_id: orderId,
        product_id: i.productId,
        product_name: i.name,
        unit_price: i.unitPrice,
        quantity: i.quantity,
      })),
    );

    setSubmitting(false);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }
    clearCart();
    setDone(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-white font-semibold text-lg mb-1">Your cart</h1>
      <p className="text-slate-500 text-sm mb-6">{businessName}</p>

      <div className="space-y-2 mb-6">
        {items.map((i) => (
          <div key={i.productId} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">{i.name}</p>
              <p className="text-xs text-slate-500">${i.unitPrice} each</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={i.quantity}
                onChange={(e) => setQuantity(i.productId, Number(e.target.value))}
                className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-center"
              />
              <button onClick={() => removeItem(i.productId)} className="text-slate-600 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-white font-semibold mb-6 pb-4 border-b border-slate-800">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name *"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone / WhatsApp *"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setDeliveryMethod('pickup')}
            className={`flex-1 text-sm py-2 rounded-lg border ${
              deliveryMethod === 'pickup' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-slate-800 text-slate-400'
            }`}
          >
            Pickup
          </button>
          <button
            onClick={() => setDeliveryMethod('delivery')}
            className={`flex-1 text-sm py-2 rounded-lg border ${
              deliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-slate-800 text-slate-400'
            }`}
          >
            Delivery
          </button>
        </div>
        {deliveryMethod === 'delivery' && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Delivery address *"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {submitting ? 'Placing order…' : 'Place order (Cash / Whish / OMT on delivery)'}
        </button>
      </div>
    </div>
  );
}
