import { describe, expect, it } from 'vitest';
import { formatLbp, formatUsd, usdToLbp } from './currency';

describe('currency formatting', () => {
  it('formats USD with two decimal places', () => {
    expect(formatUsd(4)).toBe('$4.00');
    expect(formatUsd(4.5)).toBe('$4.50');
  });

  it('formats LBP as a rounded, thousands-separated integer', () => {
    expect(formatLbp(89500)).toBe('89,500 LBP');
    expect(formatLbp(1234567.8)).toBe('1,234,568 LBP');
  });

  it('converts USD to LBP at the given rate', () => {
    expect(usdToLbp(10, 89500)).toBe(895000);
  });
});
