import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Master-prompt §18: a cart belongs to ONE merchant. Multi-merchant
// checkout is explicitly out of MVP scope (payments/delivery/refunds/
// settlements/taxes all get much harder). Pure client-side state,
// localStorage-persisted per browser — there's no server-side "cart" table,
// matching how carts work on virtually every e-commerce site (a cart is a
// draft; only the final order needs to be a real, permanent DB row).

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartState {
  businessId: string | null;
  businessName: string | null;
  items: CartItem[];
}

interface MarketplaceCartContextType extends CartState {
  addItem: (businessId: string, businessName: string, item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const STORAGE_KEY = 'repeatlyos_marketplace_cart';

const MarketplaceCartContext = createContext<MarketplaceCartContextType | null>(null);

function loadInitial(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartState;
  } catch {
    // Ignore — private browsing / storage disabled falls back to an empty cart.
  }
  return { businessId: null, businessName: null, items: [] };
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
      if (prev.businessId && prev.businessId !== businessId) {
        const proceed = confirm(
          `Your cart has items from ${prev.businessName}. Adding this will clear it and start a new cart for ${businessName}. Continue?`,
        );
        if (!proceed) return prev;
        return { businessId, businessName, items: [{ ...item, quantity: 1 }] };
      }
      const existing = prev.items.find((i) => i.productId === item.productId);
      const items = existing
        ? prev.items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev.items, { ...item, quantity: 1 }];
      return { businessId, businessName, items };
    });
  };

  const removeItem = (productId: string) => {
    setState((prev) => {
      const items = prev.items.filter((i) => i.productId !== productId);
      return items.length === 0 ? { businessId: null, businessName: null, items: [] } : { ...prev, items };
    });
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    }));
  };

  const clearCart = () => setState({ businessId: null, businessName: null, items: [] });

  const total = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <MarketplaceCartContext.Provider value={{ ...state, addItem, removeItem, setQuantity, clearCart, total }}>
      {children}
    </MarketplaceCartContext.Provider>
  );
}

export function useMarketplaceCart() {
  const ctx = useContext(MarketplaceCartContext);
  if (!ctx) throw new Error('useMarketplaceCart must be used within MarketplaceCartProvider');
  return ctx;
}
