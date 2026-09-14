import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Lightweight, dependency-free i18n (no react-i18next/react-intl) — this
// project deliberately avoids adding libraries for things a small, fixed
// dictionary can do directly (same reasoning as smartSearch.ts avoiding an
// LLM dependency). Scoped to the PUBLIC marketplace surface first (the
// pages a shopper anywhere in Lebanon actually lands on) rather than the
// merchant back-office, which stays English for now — a shop owner running
// their own dashboard is a much smaller, more consistently comfortable-in-
// English audience than "every shopper in every city".
//
// Arabic is 'ar' and right-to-left; the provider below flips `dir` on
// <html> automatically so layout mirrors correctly without every page
// needing to know about it.

export type Lang = 'en' | 'ar' | 'fr';

export const RTL_LANGS: Lang[] = ['ar'];

type Dict = Record<string, string>;

const en: Dict = {
  'nav.buyCity': 'Buy {city}',
  'nav.cart': 'Cart',
  'search.placeholder': 'Search products, services, or businesses…',
  'search.discoverPlaceholder': 'Try: "nike basketball shoes in shekka"',
  'search.discoverHint': "Describe what you want and where — we'll match it against real listings.",
  'search.useMyLocation': 'Use my location',
  'search.nearMe': 'Near me',
  'browse.noBusinesses': 'No businesses found yet.',
  'browse.categories': 'Categories',
  'storefront.services': 'Services',
  'storefront.products': 'Products',
  'storefront.nothingYet': 'Nothing available yet.',
  'storefront.verified': 'Verified business',
  'storefront.deliveryPool': 'Delivery via city pool',
  'storefront.reviews': 'Reviews',
  'storefront.noReviews': 'No reviews yet.',
  'storefront.leaveReview': 'Leave a review',
  'availability.closedPowerCut': 'Currently closed — power cut',
  'availability.cashOnly': 'Cash only right now',
  'availability.closedTemporary': 'Temporarily closed',
  'cart.title': 'Your cart',
  'cart.empty': 'Your cart is empty.',
  'cart.browse': 'Browse businesses →',
  'cart.total': 'Total',
  'cart.name': 'Your name *',
  'cart.phone': 'Phone / WhatsApp *',
  'cart.pickup': 'Pickup',
  'cart.delivery': 'Delivery',
  'cart.address': 'Delivery address *',
  'cart.placeOrder': 'Place order (Cash / Whish / OMT on delivery)',
  'cart.placing': 'Placing order…',
  'cart.placed': 'Order placed!',
  'cart.loyaltyBalance': 'Your loyalty points in this city: {points}',
  'cart.redeemPoints': 'Redeem {points} points (-${amount})',
  'cart.sharedDelivery': 'Items from {count} businesses will be grouped into one delivery run where possible.',
};

const ar: Dict = {
  'nav.buyCity': 'تسوّق في {city}',
  'nav.cart': 'السلة',
  'search.placeholder': 'ابحث عن منتجات أو خدمات أو محلات…',
  'search.discoverPlaceholder': 'مثال: "حذاء نايك رياضي في شكا"',
  'search.discoverHint': 'صف ما تريده وأين — سنطابقه مع العروض الحقيقية.',
  'search.useMyLocation': 'استخدم موقعي',
  'search.nearMe': 'بالقرب مني',
  'browse.noBusinesses': 'لا يوجد محلات بعد.',
  'browse.categories': 'الفئات',
  'storefront.services': 'الخدمات',
  'storefront.products': 'المنتجات',
  'storefront.nothingYet': 'لا يوجد شيء متاح بعد.',
  'storefront.verified': 'محل موثّق',
  'storefront.deliveryPool': 'توصيل عبر شبكة المدينة',
  'storefront.reviews': 'التقييمات',
  'storefront.noReviews': 'لا يوجد تقييمات بعد.',
  'storefront.leaveReview': 'أضف تقييم',
  'availability.closedPowerCut': 'مغلق حالياً — انقطاع كهرباء',
  'availability.cashOnly': 'نقداً فقط حالياً',
  'availability.closedTemporary': 'مغلق مؤقتاً',
  'cart.title': 'سلتك',
  'cart.empty': 'سلتك فارغة.',
  'cart.browse': 'تصفح المحلات ←',
  'cart.total': 'المجموع',
  'cart.name': 'اسمك *',
  'cart.phone': 'رقم الهاتف / واتساب *',
  'cart.pickup': 'استلام',
  'cart.delivery': 'توصيل',
  'cart.address': 'عنوان التوصيل *',
  'cart.placeOrder': 'إرسال الطلب (نقداً / Whish / OMT عند التوصيل)',
  'cart.placing': 'جارٍ إرسال الطلب…',
  'cart.placed': 'تم إرسال الطلب!',
  'cart.loyaltyBalance': 'نقاط الولاء في هذه المدينة: {points}',
  'cart.redeemPoints': 'استخدم {points} نقطة (-${amount})',
  'cart.sharedDelivery': 'سيتم تجميع العناصر من {count} محلات ضمن توصيلة واحدة قدر الإمكان.',
};

const fr: Dict = {
  'nav.buyCity': 'Acheter à {city}',
  'nav.cart': 'Panier',
  'search.placeholder': 'Rechercher des produits, services ou commerces…',
  'search.discoverPlaceholder': 'Essayez : "chaussures nike basketball à shekka"',
  'search.discoverHint': 'Décrivez ce que vous cherchez et où — nous le comparerons aux annonces réelles.',
  'search.useMyLocation': 'Utiliser ma position',
  'search.nearMe': 'Près de moi',
  'browse.noBusinesses': 'Aucun commerce trouvé pour le moment.',
  'browse.categories': 'Catégories',
  'storefront.services': 'Services',
  'storefront.products': 'Produits',
  'storefront.nothingYet': 'Rien de disponible pour le moment.',
  'storefront.verified': 'Commerce vérifié',
  'storefront.deliveryPool': 'Livraison via le réseau de la ville',
  'storefront.reviews': 'Avis',
  'storefront.noReviews': "Pas encore d'avis.",
  'storefront.leaveReview': 'Laisser un avis',
  'availability.closedPowerCut': 'Actuellement fermé — coupure de courant',
  'availability.cashOnly': 'Espèces uniquement pour le moment',
  'availability.closedTemporary': 'Fermé temporairement',
  'cart.title': 'Votre panier',
  'cart.empty': 'Votre panier est vide.',
  'cart.browse': 'Parcourir les commerces →',
  'cart.total': 'Total',
  'cart.name': 'Votre nom *',
  'cart.phone': 'Téléphone / WhatsApp *',
  'cart.pickup': 'Retrait',
  'cart.delivery': 'Livraison',
  'cart.address': 'Adresse de livraison *',
  'cart.placeOrder': 'Passer la commande (Cash / Whish / OMT à la livraison)',
  'cart.placing': 'Commande en cours…',
  'cart.placed': 'Commande passée !',
  'cart.loyaltyBalance': 'Vos points de fidélité dans cette ville : {points}',
  'cart.redeemPoints': 'Utiliser {points} points (-${amount})',
  'cart.sharedDelivery': "Les articles de {count} commerces seront regroupés en une seule livraison si possible.",
};

const DICTS: Record<Lang, Dict> = { en, ar, fr };

const STORAGE_KEY = 'repeatlyos_lang';

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), template);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored && DICTS[stored]) return stored;
    } catch {
      // Ignore — falls back to English.
    }
    return 'en';
  });

  const dir: 'ltr' | 'rtl' = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore — per-session only in this browsing mode.
    }
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const template = DICTS[lang][key] ?? DICTS.en[key] ?? key;
    return interpolate(template, vars);
  };

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
