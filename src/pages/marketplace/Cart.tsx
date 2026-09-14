import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMarketplaceCart } from '../../context/MarketplaceCartContext';
import { useI18n } from '../../lib/i18n';
import PriceTag from '../../components/PriceTag';
import { submitCheckout } from '../../lib/checkout';
import { queueCheckout } from '../../lib/offlineQueue';

export default function Cart() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { items, setQuantity, removeItem, clearCart, total, groupedByBusiness } = useMarketplaceCart();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [cityId, setCityId] = useState<string | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState(0);

  useEffect(() => {
    if (!citySlug) return;
    supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .maybeSingle()
      .then(({ data }) => setCityId((data?.id as string) ?? null));
  }, [citySlug]);

  // Loyalty balance is looked up once a phone number has been typed —
  // there's no account to read it from otherwise (migration
  // 20260914000006's wallets are keyed by phone, not a user id).
  useEffect(() => {
    if (!cityId || phone.trim().length < 6) {
      setLoyaltyBalance(0);
      return;
    }
    const handle = setTimeout(() => {
      supabase
        .rpc('get_loyalty_balance', { p_city_id: cityId, p_phone: phone.trim() })
        .then(({ data }) => setLoyaltyBalance((data as number) ?? 0));
    }, 400);
    return () => clearTimeout(handle);
  }, [cityId, phone]);

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h1 className="text-white font-semibold text-lg mb-1">{t('cart.placed')}</h1>
        {queuedOffline && (
          <p className="text-amber-400 text-xs mb-4">
            You're offline — this will be sent automatically as soon as you're back online.
          </p>
        )}
        <button onClick={() => navigate(`/${citySlug}`)} className="text-sm text-blue-400 hover:text-blue-300">
          ← {t('cart.browse')}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 mb-4">{t('cart.empty')}</p>
        <button onClick={() => navigate(`/${citySlug}`)} className="text-sm text-blue-400 hover:text-blue-300">
          {t('cart.browse')}
        </button>
      </div>
    );
  }

  const maxRedeemable = Math.min(loyaltyBalance, Math.floor(total));
  const redeemDiscount = Math.min(redeemPoints, maxRedeemable);

  const handleCheckout = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    if (deliveryMethod === 'delivery' && !address.trim()) {
      setError('Delivery address is required.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const checkoutInput = {
      cityId,
      name: name.trim(),
      phone: phone.trim(),
      deliveryMethod,
      address: address.trim(),
      groups: groupedByBusiness,
      redeemDiscount,
    };

    // Offline-tolerant checkout (new feature): a weak/dropped connection no
    // longer just fails the order outright — it's queued and replayed
    // automatically once the browser is back online (src/lib/offlineQueue.ts).
    if (!navigator.onLine) {
      queueCheckout(checkoutInput);
      setSubmitting(false);
      clearCart();
      setQueuedOffline(true);
      setDone(true);
      return;
    }

    let result;
    try {
      result = await submitCheckout(checkoutInput);
    } catch {
      queueCheckout(checkoutInput);
      setSubmitting(false);
      clearCart();
      setQueuedOffline(true);
      setDone(true);
      return;
    }

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong placing your order.');
      return;
    }
    clearCart();
    setDone(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-white font-semibold text-lg mb-1">{t('cart.title')}</h1>
      {groupedByBusiness.length > 1 && (
        <p className="text-slate-500 text-xs mb-4">{t('cart.sharedDelivery', { count: groupedByBusiness.length })}</p>
      )}

      <div className="space-y-4 mb-6">
        {groupedByBusiness.map((group) => (
          <div key={group.businessId}>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{group.businessName}</p>
            <div className="space-y-2">
              {group.items.map((i) => (
                <div
                  key={i.productId}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm">{i.name}</p>
                    <PriceTag usd={i.unitPrice} className="text-xs text-slate-500" />
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
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-white font-semibold mb-6 pb-4 border-b border-slate-800">
        <span>{t('cart.total')}</span>
        <PriceTag usd={total - redeemDiscount} />
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('cart.name')}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('cart.phone')}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />

        {maxRedeemable > 0 && (
          <label className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={redeemPoints > 0}
              onChange={(e) => setRedeemPoints(e.target.checked ? maxRedeemable : 0)}
              className="accent-emerald-500"
            />
            {t('cart.redeemPoints', { points: maxRedeemable, amount: maxRedeemable })}
          </label>
        )}
        {loyaltyBalance > 0 && redeemPoints === 0 && (
          <p className="text-xs text-slate-500">{t('cart.loyaltyBalance', { points: loyaltyBalance })}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setDeliveryMethod('pickup')}
            className={`flex-1 text-sm py-2 rounded-lg border ${
              deliveryMethod === 'pickup' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-slate-800 text-slate-400'
            }`}
          >
            {t('cart.pickup')}
          </button>
          <button
            onClick={() => setDeliveryMethod('delivery')}
            className={`flex-1 text-sm py-2 rounded-lg border ${
              deliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-slate-800 text-slate-400'
            }`}
          >
            {t('cart.delivery')}
          </button>
        </div>
        {deliveryMethod === 'delivery' && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('cart.address')}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {submitting ? t('cart.placing') : t('cart.placeOrder')}
        </button>
      </div>
    </div>
  );
}
