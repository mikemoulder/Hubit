import type { Department, Source } from "./types.ts";

// Every store Hubit sources from. Each one was probed on 23 Oct 2026 and answered
// its platform's public catalogue endpoint without a key. (Ridge was dropped the
// same day: it began answering 403.)
export const SOURCES: Source[] = [
  { id: "allbirds", name: "Allbirds", platform: "shopify", domain: "allbirds.com", department: "footwear", country: "US" },
  { id: "rothys", name: "Rothy's", platform: "shopify", domain: "rothys.com", department: "footwear", country: "US" },
  { id: "kith", name: "Kith", platform: "shopify", domain: "kith.com", department: "apparel", country: "US" },
  { id: "taylorstitch", name: "Taylor Stitch", platform: "shopify", domain: "taylorstitch.com", department: "apparel", country: "US" },
  { id: "outdoorvoices", name: "Outdoor Voices", platform: "shopify", domain: "outdoorvoices.com", department: "apparel", country: "US" },
  { id: "tentree", name: "tentree", platform: "shopify", domain: "tentree.com", department: "apparel", country: "CA" },
  { id: "superstitch", name: "Superstitch MFG", platform: "woocommerce", domain: "superstitchmfg.com", department: "apparel", country: "NL" },
  // Multi-brand sneaker and streetwear shops. They stock the same Nike, Jordan and
  // Oakley products, identified by the manufacturer's style code, so one Hubit
  // product can have several sources to fulfil it from.
  { id: "undefeated", name: "Undefeated", platform: "shopify", domain: "undefeated.com", department: "footwear", country: "US", limit: 120 },
  { id: "cncpts", name: "Concepts", platform: "shopify", domain: "cncpts.com", department: "footwear", country: "US", limit: 120 },
  { id: "bodega", name: "Bodega", platform: "shopify", domain: "bdgastore.com", department: "footwear", country: "US", limit: 120 },
  { id: "extrabutter", name: "Extra Butter", platform: "shopify", domain: "extrabutterny.com", department: "footwear", country: "US", limit: 120 },
  { id: "shoepalace", name: "Shoe Palace", platform: "shopify", domain: "shoepalace.com", department: "footwear", country: "US", limit: 120 },
  { id: "feature", name: "Feature", platform: "shopify", domain: "feature.com", department: "footwear", country: "US", limit: 120 },
  { id: "sneakerpolitics", name: "Sneaker Politics", platform: "shopify", domain: "sneakerpolitics.com", department: "footwear", country: "US", limit: 120 },
  { id: "amamaniere", name: "A Ma Maniére", platform: "shopify", domain: "a-ma-maniere.com", department: "footwear", country: "US", limit: 120 },
  { id: "colourpop", name: "ColourPop", platform: "shopify", domain: "colourpop.com", department: "beauty", country: "US" },
  { id: "native", name: "Native", platform: "shopify", domain: "nativecos.com", department: "beauty", country: "US" },
  { id: "brooklinen", name: "Brooklinen", platform: "shopify", domain: "brooklinen.com", department: "home", country: "US" },
  { id: "fellow", name: "Fellow", platform: "shopify", domain: "fellowproducts.com", department: "kitchen", country: "US" },
  { id: "joco", name: "JOCO Cups", platform: "woocommerce", domain: "jococups.com", department: "kitchen", country: "AU" },
  { id: "mvmt", name: "MVMT", platform: "shopify", domain: "mvmt.com", department: "accessories", country: "US" },
  { id: "puravida", name: "Pura Vida", platform: "shopify", domain: "puravidabracelets.com", department: "accessories", country: "US" },
  { id: "skullcandy", name: "Skullcandy", platform: "shopify", domain: "skullcandy.com", department: "audio-tech", country: "US" },
  { id: "cotopaxi", name: "Cotopaxi", platform: "shopify", domain: "cotopaxi.com", department: "outdoor", country: "US" },
  { id: "nalgene", name: "Nalgene", platform: "woocommerce", domain: "nalgene.com", department: "outdoor", country: "US" },
  { id: "princetontec", name: "Princeton Tec", platform: "woocommerce", domain: "princetontec.com", department: "outdoor", country: "US" },
  { id: "ugmonk", name: "Ugmonk", platform: "shopify", domain: "ugmonk.com", department: "desk", country: "US" },
  { id: "deathwish", name: "Death Wish Coffee", platform: "shopify", domain: "deathwishcoffee.com", department: "food-drink", country: "US" },
];

export const DEPARTMENTS: { id: Department; label: string }[] = [
  { id: "footwear", label: "Footwear" },
  { id: "apparel", label: "Clothing" },
  { id: "beauty", label: "Beauty" },
  { id: "home", label: "Home" },
  { id: "kitchen", label: "Kitchen" },
  { id: "accessories", label: "Accessories" },
  { id: "audio-tech", label: "Audio & tech" },
  { id: "outdoor", label: "Outdoor" },
  { id: "desk", label: "Desk" },
  { id: "food-drink", label: "Food & drink" },
];

// A source's own category can move a listing out of the store's default department,
// e.g. Death Wish apparel is clothing, not food.
const DEPARTMENT_HINTS: [RegExp, Department][] = [
  [/\b(shoe|sneaker|runner|loafer|boot|sandal|slipper|flat)s?\b/i, "footwear"],
  [/\b(apparel|shirt|tee|hoodie|jacket|pant|short|sweater|knit|woven|denim|jean|bra|legging|outerwear|sportswear|mens|womens)s?\b/i, "apparel"],
  [/\b(mug|cup|tumbler|glass|kettle|brewer|grinder|carafe|drinkware)s?\b/i, "kitchen"],
  [/\b(bag|backpack|pack|duffel|headlamp|lantern|bottle)s?\b/i, "outdoor"],
  [/\b(watch|bracelet|necklace|ring|wallet|charm|keycase|sunglass)(es|s)?\b/i, "accessories"],
  [/\b(earbud|headphone|speaker|charger|power bank|phone case)s?\b/i, "audio-tech"],
];

export function departmentFor(source: Source, sourceType: string, title: string): Department {
  // The store's own category wins over the title: a "Coffee" mug is still kitchen.
  for (const text of [sourceType, title]) {
    for (const [pattern, dept] of DEPARTMENT_HINTS) if (pattern.test(text)) return dept;
  }
  return source.department;
}
