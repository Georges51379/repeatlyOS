import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n';
import type { Review } from '../types/domain';

export default function ReviewsList({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data ?? []) as Review[]);
        setLoading(false);
      });
  }, [businessId]);

  if (loading) return null;

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-white font-medium text-sm">{t('storefront.reviews')}</h2>
        {average != null && (
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            {average.toFixed(1)} ({reviews.length})
          </span>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="text-slate-500 text-sm">{t('storefront.noReviews')}</p>
      ) : (
        <div className="space-y-2">
          {reviews.slice(0, 10).map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm">{r.customer_name ?? 'Verified customer'}</span>
                <span className="flex items-center gap-0.5 text-amber-400 text-xs">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </span>
              </div>
              {r.comment && <p className="text-slate-400 text-sm">{r.comment}</p>}
              {r.photo_url && (
                <img src={r.photo_url} alt="" loading="lazy" className="mt-2 max-h-32 rounded-lg object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
