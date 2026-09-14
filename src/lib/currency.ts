import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// All prices in this schema are stored in USD (see
// supabase/migrations/20260914000011_exchange_rates.sql for why the LBP
// figure is a manually-updated admin rate rather than a live FX API). This
// hook fetches the current rate once and keeps it in memory for the
// session — a shopper doesn't need sub-hour freshness on an exchange rate
// that a human updates by hand.
let cachedRate: number | null = null;

export function useUsdToLbpRate(): number | null {
  const [rate, setRate] = useState<number | null>(cachedRate);

  useEffect(() => {
    if (cachedRate !== null) return;
    let active = true;
    supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'USD')
      .eq('quote_currency', 'LBP')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const value = (data?.rate as number | undefined) ?? null;
        cachedRate = value;
        setRate(value);
      });
    return () => {
      active = false;
    };
  }, []);

  return rate;
}

export function formatUsd(amountUsd: number): string {
  return `$${amountUsd.toFixed(2)}`;
}

export function formatLbp(amountLbp: number): string {
  return `${Math.round(amountLbp).toLocaleString('en-US')} LBP`;
}

export function usdToLbp(amountUsd: number, rate: number): number {
  return amountUsd * rate;
}
