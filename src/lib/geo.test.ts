import { describe, expect, it } from 'vitest';
import { distanceKm, formatDistance } from './geo';

describe('distanceKm', () => {
  it('returns ~0 for the same point', () => {
    expect(distanceKm(34.25, 35.65, 34.25, 35.65)).toBeCloseTo(0, 5);
  });

  it('matches the known real-world distance between Batroun and Shekka (~7km apart)', () => {
    // Batroun ~34.2554N 35.6581E, Shekka/Chekka ~34.3186N 35.7014E
    const km = distanceKm(34.2554, 35.6581, 34.3186, 35.7014);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(12);
  });

  it('handles antipodal-ish / precision edge cases without NaN', () => {
    expect(Number.isNaN(distanceKm(90, 0, -90, 0))).toBe(false);
    expect(distanceKm(90, 0, -90, 0)).toBeCloseTo(20015, -1); // half the Earth's circumference
  });
});

describe('formatDistance', () => {
  it('renders sub-km distances in meters', () => {
    expect(formatDistance(0.42)).toBe('420 m');
  });

  it('renders larger distances in km with reasonable precision', () => {
    expect(formatDistance(7.2)).toBe('7.2 km');
    expect(formatDistance(23)).toBe('23 km');
  });
});
