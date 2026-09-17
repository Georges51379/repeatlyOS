import { useEffect } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Zap, ShoppingCart } from 'lucide-react';
import { useMarketplaceCart } from '../context/MarketplaceCartContext';
import { I18nProvider, useI18n } from '../lib/i18n';
import { registerOfflineQueueFlush } from '../lib/offlineQueue';
import LanguageSwitcher from './LanguageSwitcher';

// Deliberately a completely separate layout from BusinessLayout (the
// merchant dashboard shell) — master-prompt §32: "Consumer marketplace
// must have a DIFFERENT layout than internal dashboard. Do not mix admin
// UI and marketplace UI." No sidebar, no module gating, no auth required.
//
// I18nProvider is scoped to this layout (not the whole app) — see
// src/lib/i18n.tsx's header note on why localization starts with the
// public marketplace rather than the merchant dashboard.
function MarketplaceLayoutInner() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { items } = useMarketplaceCart();
  const { t } = useI18n();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    registerOfflineQueueFlush();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to={`/${citySlug}`} className="flex items-center gap-2 min-w-0">
            <Zap className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="text-white font-semibold text-sm capitalize truncate">
              {t('nav.buyCity', { city: citySlug ?? '' })}
            </span>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <Link to={`/${citySlug}/cart`} className="relative text-slate-300 hover:text-white">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-xs text-slate-600">
        Powered by RepeatlyOS ·{' '}
        <Link to="/city-admin-login" className="hover:text-slate-400">
          City Admin
        </Link>
      </footer>
    </div>
  );
}

export default function MarketplaceLayout() {
  return (
    <I18nProvider>
      <MarketplaceLayoutInner />
    </I18nProvider>
  );
}
