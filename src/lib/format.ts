const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Always to the cent: $14.99 is never shown as $15. */
export function money(cents: number): string {
  return usd.format(cents / 100);
}

/**
 * Asks the source's image CDN for a smaller file where it can resize: Shopify's
 * CDN takes a width parameter. Other hosts get the original.
 */
export function sized(url: string, width: number): string {
  if (/cdn\.shopify\.com|\/cdn\/shop\//.test(url)) {
    return `${url}${url.includes("?") ? "&" : "?"}width=${width}`;
  }
  return url;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}
