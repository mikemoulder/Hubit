import { getCatalog } from "./catalog/index.ts";
import type { Product } from "./catalog/catalog.ts";

// Hand-picked photographs for the home page. Every one is a real product's own
// picture from its store, and every one links to that product.

type Pick = { productId: string; image: number; alt: string };

export const PICKS = {
  hero: { productId: "taylorstitch-7759505621069", image: 1, alt: "A man in a wool beanie and check overshirt on wet coastal rocks" },
  showcase: { productId: "hq7978-001", image: 0, alt: "Air Jordan 5 Retro 'Halloween' in black nubuck with Picante Red flames" },
  search: { productId: "allbirds-6826299392080", image: 1, alt: "A woman mid-jump in a blue knit and white skirt against a blue sky" },
  pick: { productId: "rothys-7616329875550", image: 1, alt: "A foot in a yellow striped knit d'Orsay flat" },
  route: { productId: "taylorstitch-7759505522765", image: 1, alt: "A man walking across a harbour bridge in ripstop pants" },
  pay: { productId: "brooklinen-8158162911322", image: 1, alt: "Cream sherpa throw blanket in close-up" },
  agent: { productId: "taylorstitch-7759505588301", image: 1, alt: "A man in a natural wool beanie looking off to the side" },
  sizes: { productId: "rothys-7524439064670", image: 1, alt: "A red pointed flat stepping out from white trousers" },
  checked: { productId: "taylorstitch-7759505981517", image: 1, alt: "A man in an espresso merino sweater polo" },
  reviews: { productId: "cotopaxi-7958387621949", image: 1, alt: "A man in a Cotopaxi hoodie and denim walking" },
  footer: { productId: "taylorstitch-7759504080973", image: 1, alt: "A man in a navy corduroy sportcoat and grey knit" },
} satisfies Record<string, Pick>;

export type Photo = { src: string; alt: string; href: string; title: string };

export function photo(key: keyof typeof PICKS): Photo {
  const pick: Pick = PICKS[key];
  const p: Product | undefined = getCatalog().byId.get(pick.productId);
  if (!p) throw new Error(`Editorial pick ${key} points at missing product ${pick.productId}`);
  return { src: p.images[pick.image] ?? p.images[0], alt: pick.alt, href: `/p/${p.id}`, title: p.title };
}
