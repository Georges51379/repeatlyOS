import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Cross-shop cart (new feature): a shopper can add items from MULTIPLE
// businesses in the same city cart and check out once — each business still
// gets its own `orders` row at checkout (see Cart.tsx), linked under a
// shared `delivery_groups` row (migration 20260914000007) so participating
// merchants can coordinate one delivery run instead of the shopper placing
// N separate orders with N separate delivery fees.
//
// This replaces the earlier single-merchant-only cart (which cleared itself
// and asked the shopper to confirm whenever they tried to add a second
// business's item) — `addItem`'s call signature is UNCHANGED so existing
// call sites (BusinessStorefront.tsx, ProductDetail.tsx, ServiceDetail.tsx)
// need no changes; only the internal shape and Cart.tsx's checkout/grouping
// logic changed.

export interface CartItem {
  productId: string;
  businessId: string;
  businessName: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

export interface CartGroup {
  businessId: string;
  businessName: string;
  items: CartItem[];
  subtotal: number;
}

interface MarketplaceCartContextType {
  items: CartItem[];
  addItem: (businessId: string, businessName: string, item: Omit<CartItem, 'quantity' | 'businessId' | 'businessName'>) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  groupedByBusiness: CartGroup[];
}

const STORAGE_KEY = 'repeatlyos_marketplace_cart';

const MarketplaceCartContext = createContext<MarketplaceCartContextType | null>(null);

function loadInitial(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate the old single-business shape ({businessId, businessName,
      // items: [{productId, name, unitPrice, quantity}]}) transparently —
      // a shopper with an existing cart from before this change shouldn't
      // lose it.
      if (Array.isArray(parsed.items) && parsed.businessId && parsed.items.length > 0 && !parsed.items[0].businessId) {
        return {
          items: parsed.items.map((i: Omit<CartItem, 'businessId' | 'businessName'>) => ({
            ...i,
            businessId: parsed.businessId,
            businessName: parsed.businessName,
          })),
        };
      }
      if (Array.isArray(parsed.items)) return { items: parsed.items };
    }
  } catch {
    // Ignore — private browsing / storage disabled falls back to an empty cart.
  }
  return { items: [] };
}

export function MarketplaceCartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore — nothing to persist to in this browsing mode.
    }
  }, [state]);

  const addItem: MarketplaceCartContextType['addItem'] = (businessId, businessName, item) => {
    setState((prev) => {
      const existing = prev.items.find((i) => i.productId === item.productId && i.businessId === businessId);
      const items = existing
        ? prev.items.map((i) =>
            i.productId === item.productId && i.businessId === businessId ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev.items, { ...item, businessId, businessName, quantity: 1 }];
      return { items };
    });
  };

  const removeItem = (productId: string) => {
    setState((prev) => ({ items: prev.items.filter((i) => i.productId !== productId) }));
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setState((prev) => ({
      items: prev.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    }));
  };

  const clearCart = () => setState({ items: [] });

  const total = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const groupedByBusiness: CartGroup[] = Object.values(
    state.items.reduce<Record<string, CartGroup>>((acc, item) => {
      if (!acc[item.businessId]) {
        acc[item.businessId] = { businessId: item.businessId, businessName: item.businessName, items: [], subtotal: 0 };
      }
      acc[item.businessId].items.push(item);
      acc[item.businessId].subtotal += item.unitPrice * item.quantity;
      return acc;
    }, {}),
  );

  return (
    <MarketplaceCartContext.Provider
      value={{ items: state.items, addItem, removeItem, setQuantity, clearCart, total, groupedByBusiness }}
    >
      {children}
    </MarketplaceCartContext.Provider>
  );
}

export function useMarketplaceCart() {
  const ctx = useContext(MarketplaceCartContext);
  if (!ctx) throw new Error('useMarketplaceCart must be used within MarketplaceCartProvider');
  return ctx;
}
