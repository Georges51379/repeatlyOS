import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Plus, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMarketplaceCart } from '../../context/MarketplaceCartContext';
import { useI18n } from '../../lib/i18n';
import PriceTag from '../../components/PriceTag';
import VerifiedBadge from '../../components/VerifiedBadge';
import AvailabilityBanner from '../../components/AvailabilityBanner';
import LazyImage from '../../components/LazyImage';
import { placeholderImage, businessTypeToImageKind } from '../../lib/placeholderImage';
import ReviewsList from '../../components/ReviewsList';
import ReviewForm from '../../components/ReviewForm';
import type { Business, Product, Service } from '../../types/domain';

export default function BusinessStorefront() {
  const { citySlug, businessSlug } = useParams<{ citySlug: string; businessSlug: string }>();
  const { addItem } = useMarketplaceCart();
  const { t } = useI18n();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inDeliveryPool, setInDeliveryPool] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0);

  useEffect(() => {
    if (!citySlug || !businessSlug) return;
    (async () => {
      const { data: cityRow } = await supabase.from('cities').select('id').eq('slug', citySlug).maybeSingle();
      if (!cityRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: businessRow } = await supabase
        .from('businesses')
        .select('*')
        .eq('city_id', cityRow.id)
        .eq('slug', businessSlug)
        .eq('status', 'active')
        .eq('marketplace_visible', true)
        .maybeSingle();
      if (!businessRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBusiness(businessRow as Business);

      const [{ data: productRows }, { data: serviceRows }, { data: poolRow }] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('business_id', businessRow.id)
          .eq('active', true)
          .eq('marketplace_visible', true)
          .order('name'),
        supabase
          .from('services')
          .select('*')
          .eq('business_id', businessRow.id)
          .eq('active', true)
          .eq('booking_enabled', true)
          .order('name'),
        supabase
          .from('delivery_pool_members')
          .select('id')
          .eq('business_id', businessRow.id)
          .eq('active', true)
          .maybeSingle(),
      ]);
      setProducts((productRows ?? []) as Product[]);
      setServices((serviceRows ?? []) as Service[]);
      setInDeliveryPool(Boolean(poolRow));
      setLoading(false);
    })();
  }, [citySlug, businessSlug]);

  if (loading) return null;
  if (notFound || !business) {
    return <p className="text-slate-400 text-center py-20">This business isn't available.</p>;
  }

  return (
    <div>
      <div className="w-full aspect-[3/1] bg-slate-900 rounded-xl mb-4 overflow-hidden border border-slate-800">
        <LazyImage
          src={business.cover_image_url || placeholderImage(businessTypeToImageKind(business.business_type_key), business.id, { w: 1200, h: 400 })}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <AvailabilityBanner status={business.availability_override} note={business.availability_note} />

      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h1 className="text-white font-bold text-xl">{business.name}</h1>
        {business.verified && <VerifiedBadge />}
        {inDeliveryPool && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
            <Truck className="w-3.5 h-3.5" />
            {t('storefront.deliveryPool')}
          </span>
        )}
      </div>
      {business.description && <p className="text-slate-400 text-sm mb-3">{business.description}</p>}

      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-8">
        {business.address && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {business.address}
          </span>
        )}
        {business.phone && (
          <a href={`tel:${business.phone}`} className="flex items-center gap-1 hover:text-slate-300">
            <Phone className="w-3.5 h-3.5" /> {business.phone}
          </a>
        )}
        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-slate-300"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        )}
      </div>

      {services.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white font-medium text-sm mb-3">{t('storefront.services')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <Link
                key={s.id}
                to={`/${citySlug}/business/${businessSlug}/service/${s.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                  <LazyImage src={placeholderImage('service', s.id, { w: 80, h: 80 })} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {s.duration_minutes} min{s.price != null ? <> · <PriceTag usd={s.price} /></> : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white font-medium text-sm mb-3">{t('storefront.products')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <Link to={`/${citySlug}/business/${businessSlug}/product/${p.id}`}>
                  <div className="w-full aspect-square bg-slate-800 rounded-lg mb-2 overflow-hidden">
                    <LazyImage src={p.image_url || placeholderImage('product', p.id, { w: 300, h: 300 })} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-white text-xs truncate">{p.name}</p>
                </Link>
                <div className="flex items-center justify-between mt-1">
                  <PriceTag usd={p.sale_price ?? p.price} className="text-slate-400 text-xs" />
                  <button
                    onClick={() =>
                      addItem(business.id, business.name, {
                        productId: p.id,
                        name: p.name,
                        unitPrice: p.sale_price ?? p.price,
                      })
                    }
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && services.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-10">{t('storefront.nothingYet')}</p>
      )}

      <div className="border-t border-slate-800 pt-6">
        <ReviewsList key={reviewsKey} businessId={business.id} />
        <div className="mt-3">
          <ReviewForm businessId={business.id} onSubmitted={() => setReviewsKey((k) => k + 1)} />
        </div>
      </div>
    </div>
  );
}
