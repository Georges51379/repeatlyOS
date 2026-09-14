import { supabase } from './supabase';
import type { CartGroup } from '../context/MarketplaceCartContext';

export interface CheckoutInput {
  cityId: string | null;
  name: string;
  phone: string;
  deliveryMethod: 'pickup' | 'delivery';
  address: string;
  groups: CartGroup[];
  redeemDiscount: number;
}

export interface CheckoutResult {
  ok: boolean;
  error?: string;
}

/** The actual checkout logic — extracted out of Cart.tsx so the offline
 * queue (src/lib/offlineQueue.ts) can replay a queued checkout through
 * exactly the same code path once connectivity returns, instead of a second
 * copy of this logic drifting out of sync with what the live checkout does. */
export async function submitCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const { cityId, name, phone, deliveryMethod, address, groups, redeemDiscount } = input;
  let deliveryGroupId: string | null = null;

  if (groups.length > 1 && cityId) {
    const { data: groupRow, error: groupError } = await supabase
      .from('delivery_groups')
      .insert({
        city_id: cityId,
        customer_name: name,
        customer_phone: phone,
        delivery_address: deliveryMethod === 'delivery' ? address : null,
      })
      .select('id')
      .single();
    if (groupError) return { ok: false, error: groupError.message };
    deliveryGroupId = groupRow.id as string;
  }

  let remainingRedeem = redeemDiscount;

  for (const group of groups) {
    const orderId = crypto.randomUUID();
    const groupShare = Math.min(remainingRedeem, Math.floor(group.subtotal));
    remainingRedeem -= groupShare;

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      business_id: group.businessId,
      customer_name: name,
      customer_phone: phone,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? address : null,
      total_amount: group.subtotal - groupShare,
      delivery_group_id: deliveryGroupId,
    });
    if (orderError) return { ok: false, error: orderError.message };

    const { error: itemsError } = await supabase.from('order_items').insert(
      group.items.map((i) => ({
        order_id: orderId,
        product_id: i.productId,
        product_name: i.name,
        unit_price: i.unitPrice,
        quantity: i.quantity,
      })),
    );
    if (itemsError) return { ok: false, error: itemsError.message };

    if (groupShare > 0 && cityId) {
      await supabase.rpc('redeem_loyalty_points', {
        p_city_id: cityId,
        p_phone: phone,
        p_points: groupShare,
        p_business_id: group.businessId,
        p_order_id: orderId,
      });
    }
  }

  return { ok: true };
}
