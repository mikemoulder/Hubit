"""PR #12's tests for stores and price history (PRD F8), written before the feature.

Run with:  python3 test/testsprite/stores-plans.py  > writes test/testsprite/stores-plans/*.json
"""

import json
from pathlib import Path

PROJECT = "2b4a992f-4b37-4f77-ad75-8e74ca05c358"
A, V = "action", "assertion"
CASE = "Headings are displayed in capitals by the stylesheet; compare text without regard to case."


def plan(slug, name, description, steps, priority="p1"):
    return slug, {"projectId": PROJECT, "type": "frontend", "name": name, "description": description,
                  "priority": priority, "planSteps": [{"type": k, "description": d} for k, d in steps]}


PLANS = [
    plan("stores-page", "See every store Hubit sources from",
         "The Stores page lists the 28 shops with what they sell, their platform, product counts and when each was last read.",
         [(A, "Open the home page of this site and click 'Stores' in the header"),
          (V, f"Verify the heading reads '28 stores' and the text says '28 of 28 answered at their last reading.' {CASE}"),
          (V, "Verify the table has the columns Store, Sells, Runs on, Products on Hubit, Ships from, Last read and Status, and 28 store rows"),
          (V, "Verify the Allbirds row reads Footwear, Shopify, 40, US, '23 Oct 2026', Answered"),
          (V, "Verify the Nalgene row reads Outdoor, WooCommerce, 40, US and the JOCO Cups row reads Kitchen, WooCommerce, 39, AU"),
          (A, "Click 'Nalgene' in the Store column"),
          (V, "Verify a search for 'Nalgene' opens with Nalgene products")]),
    plan("price-history-catalogue", "A product's price history starts at the store catalogue",
         "Every product page shows when its stores were read and what Hubit charged then.",
         [(A, "Open /p/nalgene-740315 on this site"),
          (V, f"Verify a section headed 'Price history' is shown. {CASE}"),
          (V, "Verify the newest reading shows '$4.19'"),
          (V, "Verify the oldest reading shows '$4.19 · Store catalogue' dated '23 Oct'")]),
    plan("price-history-recheck", "A price change seen at checkout appears in the price history",
         "The checkout re-check is recorded: the product's history shows the new reading and says the price moved.",
         [(A, "Open /p/nalgene-789703 on this site, click 'Add to cart', then open /checkout"),
          (V, "Verify a notice says '32oz Wide Mouth Surrealist Bottles went up from $18.99 to $21.99 since you added it.'"),
          (A, "Open /p/nalgene-789703 again"),
          (V, f"Verify a section headed 'Price history' is shown and its newest reading is '$21.99 · Checked at checkout'. {CASE}"),
          (V, "Verify a note reads 'Latest store reading: $21.99' and says you'll see the up-to-date price at checkout"),
          (V, "Verify the oldest reading is '$18.99 · Store catalogue' dated '23 Oct'"),
          (V, "Verify the product's price at the top of the page still reads '$18.99'")]),
]

out = Path(__file__).with_name("stores-plans")
out.mkdir(exist_ok=True)
for slug, p in PLANS:
    (out / f"{slug}.json").write_text(json.dumps(p, indent=1, ensure_ascii=False) + "\n")
print(f"{len(PLANS)} plans, {sum(len(p['planSteps']) for _, p in PLANS)} steps, "
      f"{sum(1 for _, p in PLANS for s in p['planSteps'] if s['type'] == 'assertion')} assertions")
