import { formatLbp, formatUsd, usdToLbp, useUsdToLbpRate } from '../lib/currency';

/** Renders a USD price with its LBP equivalent alongside it — used
 * everywhere a shopper-facing price appears (storefront, product detail,
 * cart, search results). Falls back to USD-only if the rate hasn't loaded
 * yet rather than blocking the whole price render on it. */
export default function PriceTag({ usd, className = '' }: { usd: number; className?: string }) {
  const rate = useUsdToLbpRate();
  return (
    <span className={className}>
      {formatUsd(usd)}
      {rate != null && <span className="text-slate-500 text-xs ml-1.5">({formatLbp(usdToLbp(usd, rate))})</span>}
    </span>
  );
}
