/** Inches as a quilter's ruler reads them: "3 7/8", to the nearest eighth. */
export function inches(value: number): string {
  const eighths = Math.round(value * 8);
  const whole = Math.floor(eighths / 8);
  const rest = eighths % 8;
  if (rest === 0) return `${whole}`;
  const d = rest % 4 === 0 ? 2 : rest % 2 === 0 ? 4 : 8;
  const fraction = `${rest / (8 / d)}/${d}`;
  return whole === 0 ? fraction : `${whole} ${fraction}`;
}

export function isOnRuler(value: number): boolean {
  return Math.abs(value * 8 - Math.round(value * 8)) < 1e-6;
}

/** `inches`, marked "~" when the true value falls between ruler marks. */
export function approxInches(value: number): string {
  return `${isOnRuler(value) ? "" : "~"}${inches(value)}`;
}

/** The smallest eighth of an inch at or above `value`. */
export function ceilToEighth(value: number): number {
  return Math.ceil(value * 8 - 1e-6) / 8;
}
