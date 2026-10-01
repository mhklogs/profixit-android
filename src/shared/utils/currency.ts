export function dollarsToCents(usd: number): number {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new Error(`Invalid dollar amount: ${usd}`);
  }
  return Math.round(usd * 100);
}

export function centsToDollars(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`Invalid cent amount: ${cents}`);
  }
  return cents / 100;
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(centsToDollars(cents));
}

export function formatUSD(dollars: number): string {
  return formatCents(dollarsToCents(dollars));
}

export function computeCommission(amountCents: number, bps = 400): number {
  return Math.round((amountCents * bps) / 10000);
}

export function computeContractorShare(amountCents: number, bps = 400): number {
  return amountCents - computeCommission(amountCents, bps);
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}