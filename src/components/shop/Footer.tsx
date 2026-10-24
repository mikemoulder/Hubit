import Link from "next/link";
import { sized } from "@/lib/format";
import { photo } from "@/server/editorial";

const MENU = [
  { href: "/shop", label: "Shop everything" },
  { href: "/shop?dept=footwear", label: "Footwear" },
  { href: "/shop?dept=apparel", label: "Clothing" },
  { href: "/shop?dept=home", label: "Home" },
  { href: "/shop?sort=rating", label: "Best reviewed" },
  { href: "/cart", label: "Your cart" },
];

/** Half photograph, half menu: the close of every page. */
export function Footer({ storeCount, takenAt }: { storeCount: number; takenAt: string }) {
  const pic = photo("footer");
  return (
    <footer className="mt-40 grid bg-[var(--color-ink)] text-[var(--color-ink-fg)] md:min-h-svh md:grid-cols-2">
      <Link href={pic.href} className="relative block h-[50svh] overflow-hidden md:h-auto" aria-label={pic.title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sized(pic.src, 1600)} alt={pic.alt} loading="lazy" width={1600} height={2000} className="absolute inset-0 size-full object-cover object-[50%_20%]" />
      </Link>
      <div className="flex flex-col gap-16 px-[var(--margin)] py-16 md:px-[8%] md:py-20">
        <p className="display text-lg">Hubit</p>
        <nav aria-label="Footer">
          <ul className="space-y-5">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="footer-link block text-[8vw] font-semibold leading-none tracking-[-0.02em] md:text-[2.6vw]">
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-8 text-[15px] sm:grid-cols-2">
          <p>
            One shop over {storeCount} independent stores. Prices are each store&rsquo;s own, read on{" "}
            {new Date(takenAt).toUTCString().slice(5, 16)}.
          </p>
          <p>
            Built for TestSprite Season 4. Every pull request is tested before it merges.{" "}
            <a href="https://github.com/MikeMoulder/Hubit" className="link-line underline">
              Source on GitHub
            </a>
          </p>
        </div>
        <p className="mt-auto text-[13px]">Payments run in Stripe test mode. Nothing ships and no real card is charged.</p>
      </div>
    </footer>
  );
}
