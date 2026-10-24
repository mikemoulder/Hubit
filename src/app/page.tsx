import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Departments, type DeptRow } from "@/components/home/Departments";
import { Showcase, type SizeRoute } from "@/components/home/Showcase";
import { money, sized } from "@/lib/format";
import { getCatalog, sourceName } from "@/server/catalog";
import { FEES } from "@/server/catalog/pricing";
import { search } from "@/server/catalog/search";
import { DEPARTMENTS } from "@/server/catalog/sources";
import { photo } from "@/server/editorial";
import "./home.css";

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export default function Home() {
  const catalog = getCatalog();
  const storeCount = catalog.sources.length;
  const productCount = catalog.products.length.toLocaleString("en-US");
  const reviewCount = catalog.products.reduce((n, p) => n + p.reviews.length, 0);

  // The showcase shoe and, per size, every store that lists it.
  const shoePhoto = photo("showcase");
  const shoe = catalog.byId.get("hq7978-001")!;
  const sizes: SizeRoute[] = shoe.options.map(({ option }) => ({
    option,
    stores: shoe.offers.flatMap((o) => {
      const v = o.variants.find((x) => x.option === option);
      return v ? [{ name: sourceName(o.sourceId), priceCents: v.priceCents, available: v.available }] : [];
    }),
  }));
  const shoeStores = list(shoe.offers.map((o) => sourceName(o.sourceId)));

  const depts: DeptRow[] = DEPARTMENTS.map((d) => {
    const all = search(catalog, { department: d.id, pageSize: 96 });
    const lead = search(catalog, { department: d.id, inStock: true, sort: "rating", pageSize: 1 }).items[0] ?? all.items[0];
    const brands = all.facets.brands.slice(0, 4).map((b) => b.label);
    const from = Math.min(...catalog.products.filter((p) => p.department === d.id).map((p) => p.priceCents));
    return {
      id: d.id,
      label: d.label,
      count: all.total,
      fromCents: money(from),
      blurb: `${list(brands)}, and more, from ${new Set(catalog.products.filter((p) => p.department === d.id).flatMap((p) => p.offers.map((o) => o.sourceId))).size} stores.`,
      image: lead.images[0],
    };
  });

  const hero = photo("hero");
  const verbs = [
    { word: "Search", pic: photo("search"), ink: "#351a2b", line: `Search ${productCount} products from ${storeCount} stores at once, by name, brand or style code.` },
    { word: "Pick", pic: photo("pick"), ink: "#351a2b", line: "Choose your size. When one shop has sold out of it, another often still has it." },
    { word: "Route", pic: photo("route"), ink: "#edccbe", line: "Hubit checks stock and price at the source, then sends each line to the store that has it." },
    { word: "Pay", pic: photo("pay"), ink: "#351a2b", line: "One payment and one receipt, with two fees you can read before you pay." },
  ];
  const sheets = [
    { title: "Shop with your agent", pic: photo("agent"), body: "Your AI agent reaches Hubit through tools on this page, so it searches, compares and fills the cart beside you without scraping a thing. Everything it adds is marked as its own. Paying stays with you." },
    { title: "Every size, every store", pic: photo("sizes"), body: `Sizes are pooled from every store that lists a product. ${shoe.title} comes in ${shoe.options.length} sizes across ${shoe.offers.length} shops; you pick one, Hubit finds who has it.` },
    { title: "Checked before you pay", pic: photo("checked"), body: "Prices and stock move. Before payment, Hubit reads each item from its store again and tells you if anything changed, before a cent is taken." },
    { title: "Reviews from real buyers", pic: photo("reviews"), body: `${reviewCount} reviews written by the stores' own customers, shown on each product as they were written. Hubit adds none of its own.` },
  ];

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__stage">
          <div className="hero__picture">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sized(hero.src, 2000)} alt={hero.alt} width={2000} height={2500} fetchPriority="high" />
            <div className="hero__scrim" />
          </div>
          <div className="hero__copy">
            <h1 id="hero-title" className="hero__title display">
              <span>{storeCount} stores</span>
              <span>One cart</span>
            </h1>
            <div className="hero__side">
              <p>
                {productCount} products from independent shops, bought in one payment. Hubit sources each size
                from the store that has it.
              </p>
              <Link href="/shop" className="btn" data-testid="hero-shop">
                Shop everything <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Showcase
        first="Same shoe"
        last="Five stores"
        image={sized(shoePhoto.src, 1200)}
        alt={shoePhoto.alt}
        productHref={shoePhoto.href}
        caption={`${shoeStores} all stock the ${shoe.title}. You see one price, ${money(shoe.priceCents)}, and Hubit picks the store for your size.`}
        sizes={sizes}
      />

      {verbs.map((v) => (
        <section key={v.word} className="verb" aria-label={v.word}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sized(v.pic.src, 2000)} alt={v.pic.alt} loading="lazy" width={2000} height={2500} />
          <h2>
            <span className="verb__word display" style={{ color: v.ink, display: "block" }}>
              {v.word}
            </span>
          </h2>
          <p className="verb__line">{v.line}</p>
        </section>
      ))}

      <Departments rows={depts} />

      <section className="sheets" aria-labelledby="sheets-title">
        <h2 id="sheets-title" className="wrap display" data-reveal>
          Shop together
        </h2>
        <div>
          {sheets.map((s, n) => (
            <article key={s.title} className="sheet" style={{ ["--n" as string]: n }}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sized(s.pic.src, 1400)} alt={s.pic.alt} loading="lazy" width={1400} height={1750} />
              </figure>
            </article>
          ))}
        </div>
      </section>

      <section className="ticket-strip wrap" aria-labelledby="fees-title">
        <h2 id="fees-title" className="font-semibold tracking-[-0.02em]" data-reveal>
          Two fees, printed
        </h2>
        <div className="ticket" data-reveal>
          <div className="ticket__main">
            <h3 className="display">One Hubit order</h3>
            <ul className="ticket__terms">
              <li>Items at each store&rsquo;s own price</li>
              <li>Shipping {money(FEES.shippingCents)}, free from {money(FEES.freeShippingFromCents)}</li>
              <li>Service fee {FEES.serviceFeeBps / 100}% of the items</li>
              <li>One payment, one receipt</li>
            </ul>
          </div>
          <div className="ticket__stub">
            <p className="ticket__price display">{FEES.serviceFeeBps / 100}%</p>
            <Link href="/shop" className="btn">
              Start shopping
            </Link>
          </div>
          <span className="ticket__notch ticket__notch--top" aria-hidden />
          <span className="ticket__notch ticket__notch--bottom" aria-hidden />
          <span className="ticket__perf" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </div>
      </section>
    </main>
  );
}
