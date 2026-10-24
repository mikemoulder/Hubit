// One polite fetch for every adapter: an honest user agent, a timeout, and a
// readable error when a store answers with an HTML block page instead of JSON.

const USER_AGENT = "Mozilla/5.0 (compatible; HubitBot/2.0; +https://hubit-store.vercel.app)";

export async function getJson<T>(url: string, timeoutMs = 20_000): Promise<{ body: T; headers: Headers }> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  const text = await res.text();
  try {
    return { body: JSON.parse(text) as T, headers: res.headers };
  } catch {
    throw new Error(`Non-JSON answer from ${new URL(url).host} (likely a bot wall)`);
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Source descriptions arrive as HTML. Hubit stores plain text only. */
export function htmlToText(html: string | null | undefined, max = 600): string {
  const text = (html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)).trimEnd() + "…";
}

/** "220.00" -> 22000. Avoids float drift by never multiplying a float. */
export function decimalToMinor(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const [whole, frac = ""] = String(value).split(".");
  const minor = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return Number.isFinite(minor) ? minor : null;
}
