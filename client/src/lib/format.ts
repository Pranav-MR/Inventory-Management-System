/** Neutral display rounding for current-state quantities (remaining stock, rates, chart values). */
export function roundQty(value: number): number {
  return Math.round(value);
}

/** Round-up display for risk/recommendation quantities, so the user never under-estimates. */
export function ceilQty(value: number): number {
  return Math.ceil(value);
}
