// Client-side mirror of supabase/migrations/20260914000005_geo_distance_search.sql's
// `distance_km` function — used for quick client-side sorting/labelling
// without a round trip, and unit-tested directly (see geo.test.ts) since the
// SQL version can't be exercised without a live database. Both
// implementations must be kept in sync; the SQL one is the actual
// enforcement point for `products_near`, this one is a display/UX helper.
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cosArg =
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2) - toRad(lng1)) +
    Math.sin(toRad(lat1)) * Math.sin(toRad(lat2));
  // Guard the same [-1, 1] clamp the SQL version applies — floating-point
  // error can otherwise push `cosArg` fractionally past 1 for two points
  // that are (near-)identical, which would make `acos` return NaN.
  const clamped = Math.min(1, Math.max(-1, cosArg));
  return 6371 * Math.acos(clamped);
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

/** Wraps the browser Geolocation API in a promise; resolves to `null`
 * (rather than throwing) on any failure — denied permission, unsupported
 * browser, timeout — since "no location available" is an expected, common
 * outcome here, not an error condition the caller needs to branch on
 * specially. */
export function getCurrentPosition(timeoutMs = 8000): Promise<GeoPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
