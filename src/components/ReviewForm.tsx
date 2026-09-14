import { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/imageUpload';
import { useI18n } from '../lib/i18n';

/** Verified-review submission (migration 20260914000013): a shopper proves
 * they can review by supplying the phone number on an actual completed
 * order/booking at this business — there is no login to derive that from,
 * so this looks it up directly rather than trusting a claimed identity.
 * The `reviews_verified_insert` RLS policy is the real enforcement point;
 * this form just finds a valid order/booking id to attach to. */
export default function ReviewForm({ businessId, onSubmitted }: { businessId: string; onSubmitted: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setError('Enter the phone number you ordered with.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_phone', phone.trim())
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let orderId: string | null = (order?.id as string) ?? null;
    let bookingId: string | null = null;

    if (!orderId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('business_id', businessId)
        .eq('customer_phone', phone.trim())
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      bookingId = (booking?.id as string) ?? null;
    }

    if (!orderId && !bookingId) {
      setSubmitting(false);
      setError("We couldn't find a completed order or booking with that phone number at this business.");
      return;
    }

    let photoUrl: string | null = null;
    if (photo) {
      const compressed = await compressImage(photo);
      const path = `${businessId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('review-photos').upload(path, compressed);
      if (!uploadError) {
        photoUrl = supabase.storage.from('review-photos').getPublicUrl(path).data.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('reviews').insert({
      business_id: businessId,
      order_id: orderId,
      booking_id: bookingId,
      customer_name: name.trim() || null,
      customer_phone: phone.trim(),
      rating,
      comment: comment.trim() || null,
      photo_url: photoUrl,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setOpen(false);
    onSubmitted();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-blue-400 hover:text-blue-300">
        {t('storefront.leaveReview')}
      </button>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} type="button">
            <Star className={`w-5 h-5 ${n <= rating ? 'text-amber-400 fill-current' : 'text-slate-700'}`} />
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone you ordered with *"
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was it?"
        rows={2}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
      />
      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-xs text-slate-400" />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300 px-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
