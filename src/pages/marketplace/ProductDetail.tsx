import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMarketplaceCart } from '../../context/MarketplaceCartContext';
import type { Business, Product } from '../../types/domain';

const STOCK_LABEL: Record<string, { text: string; className: string }> = {
  in_stock: { text: 'In stock', className: 'bg-emerald-500/15 text-emerald-400' },
  low_stock: { text: 'Low stock', className: 'bg-amber-500/15 text-amber-400' },
  out_of_stock: { text: 'Out of stock', className: 'bg-red-500/15 text-red-400' },
  not_tracked: { text: 'Available', className: 'bg-slate-700/40 text-slate-300' },
};

export default function ProductDetail() {
  const { citySlug, businessSlug, productId } = useParams<{
    citySlug: string;
    businessSlug: string;
    productId: string;
  }>();
  const navigate = useNavigate();
  const { addItem } = useMarketplaceCart();
  const [business, setBusiness] = useState<Business | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [stockStatus, setStockStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!citySlug || !businessSlug || !productId) return;
    (async () => {
      const { data: cityRow } = await supabase.from('cities').select('id').eq('slug', citySlug).maybeSingle();
      if (!cityRow) {
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
        setLoading(false);
        return;
      }
      setBusiness(businessRow as Business);

      const { data: productRow } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('business_id', businessRow.id)
        .eq('active', true)
        .eq('marketplace_visible', true)
        .maybeSingle();
      setProduct((productRow as Product) ?? null);

      if (productRow) {
        const { data: status } = await supabase.rpc('product_stock_status', { target_product_id: productId });
        setStockStatus((status as string) ?? 'not_tracked');
      }
      setLoading(false);
    })();
  }, [citySlug, businessSlug, productId]);

  if (loading) return null;
  if (!business || !product) {
    return <p className="text-slate-400 text-center py-20">This product isn't available.</p>;
  }

  const status = STOCK_LABEL[stockStatus ?? 'not_tracked'];
  const canAdd = stockStatus !== 'out_of_stock';

  return (
    <div className="max-w-lg mx-auto">
      <div className="w-full aspect-square bg-slate-900 border border-slate-800 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-slate-700" />
        )}
      </div>

      <p className="text-xs text-slate-500 mb-1">{business.name}</p>
      <h1 className="text-white font-bold text-xl mb-2">{product.name}</h1>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-white font-semibold text-lg">
          ${product.sale_price ?? product.price}
          {product.sale_price != null && (
            <span className="text-slate-600 text-sm line-through ml-2">${product.price}</span>
          )}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.text}</span>
      </div>

      {product.description && <p className="text-slate-400 text-sm mb-6">{product.description}</p>}

      <button
        onClick={() => {
          addItem(business.id, business.name, {
            productId: product.id,
            name: product.name,
            unitPrice: product.sale_price ?? product.price,
          });
          setAdded(true);
        }}
        disabled={!canAdd}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors"
      >
        <ShoppingCart className="w-4 h-4" />
        {canAdd ? 'Add to cart' : 'Out of stock'}
      </button>

      {added && (
        <button
          onClick={() => navigate(`/${citySlug}/cart`)}
          className="w-full text-center text-sm text-blue-400 hover:text-blue-300 mt-3"
        >
          Added — view cart →
        </button>
      )}
    </div>
  );
}
