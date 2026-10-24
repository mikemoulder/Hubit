"""PR B's tests for "Shop with your agent" (PRD F7), written before the feature.

Run with:  python3 test/testsprite/agent-plans.py  > writes test/testsprite/agent-plans/*.json
Each file is a full TestSprite plan for `testsprite test create --plan-from`.
"""

import json
from pathlib import Path

PROJECT = "2b4a992f-4b37-4f77-ad75-8e74ca05c358"
A, V = "action", "assertion"
OPEN = "Click the 'Your agent' button at the bottom right of the page"
AJ5 = "Air Jordan 5 Retro Mens Shoes"


def plan(slug, name, description, steps, priority="p0"):
    return slug, {"projectId": PROJECT, "type": "frontend", "name": name, "description": description,
                  "priority": priority, "planSteps": [{"type": k, "description": d} for k, d in steps]}


PLANS = [
    plan("agent-finds-and-adds", "Your agent finds a product and adds it to your cart",
         "The demo agent calls the page's real tools in order and the item lands in the shopper's own cart, marked as the agent's.",
         [(A, "Open the home page of this site"),
          (A, OPEN),
          (V, "Verify a panel headed 'Your agent' lists the tools Search catalog, Get product, Add to cart, Remove from cart and View cart"),
          (V, "Verify the panel states 'No payment tool. Paying stays with you.'"),
          (A, "Under 'Give the demo agent a task', click 'Find the Air Jordan 5 in size 9 and add it' and wait for the agent's reply"),
          (V, "Verify 'Tool calls' shows, in this order, Search catalog, Get product, Add to cart and View cart"),
          (V, f"Verify the reply reads 'Added {AJ5}, size 9. Your cart total is $225.75.'"),
          (V, "Verify the header cart button shows 1"),
          (A, "Close the panel and open /cart"),
          (V, f"Verify the line '{AJ5}' shows 'Option: 9', is marked 'Added by your agent', and the Total reads '$225.75'")]),
    plan("agent-cannot-pay", "Your agent cannot pay",
         "Asked to pay, the agent finds no payment tool; nothing is charged and the cart is untouched.",
         [(A, "Open the home page of this site"),
          (A, OPEN),
          (A, "Click the task 'Find the Air Jordan 5 in size 9 and add it' and wait for its reply"),
          (A, "Click the task 'Pay for the cart' and wait for its reply"),
          (V, "Verify 'Tool calls' shows Pay with the result 'Refused: this page offers agents no payment tool.'"),
          (V, "Verify the reply reads 'I can't pay. This page gives agents no payment tool; paying stays with you at checkout.'"),
          (V, "Verify the header cart button still shows 1"),
          (A, "Close the panel and open /cart"),
          (V, f"Verify the cart still holds only '{AJ5}', size 9, with Total '$225.75', and no order page was opened")]),
    plan("agent-and-shopper-share-one-cart", "You and your agent fill one cart",
         "Lines the shopper adds and lines the agent adds share one cart and one total; only the agent's are marked.",
         [(A, "Open /p/nalgene-740315 on this site and click 'Add to cart'"),
          (A, OPEN),
          (A, "Click the task 'Add two of the cheapest wide-mouth bottles' and wait for its reply"),
          (V, "Verify 'Tool calls' shows Search catalog, then Add to cart, then View cart"),
          (V, "Verify the reply says 'Added 2 × 32oz Wide Mouth Ultralite Bottle at $11.99 each.' and gives the cart total '$36.57'"),
          (V, "Verify the header cart button shows 3"),
          (A, "Close the panel and open /cart"),
          (V, "Verify the '32oz Wide Mouth Ultralite Bottle' line has quantity 2 and is marked 'Added by your agent'"),
          (V, "Verify the '8oz Storage Jar – Blue Lid' line is not marked 'Added by your agent'"),
          (V, "Verify Items '$28.17', Shipping '$6.99', Service fee (5%) '$1.41' and Total '$36.57'")]),
    plan("agent-sees-your-changes", "Your agent sees what you change",
         "The shopper removes the agent's line; the agent's next look at the cart reflects it.",
         [(A, "Open the home page of this site"),
          (A, OPEN),
          (A, "Click the task 'Find the Air Jordan 5 in size 9 and add it' and wait for its reply"),
          (A, "Close the panel, open /cart and click 'Remove' on the Air Jordan 5 line"),
          (V, "Verify the cart shows 'Your cart is empty'"),
          (A, OPEN),
          (A, "Click the task 'Read me the cart' and wait for its reply"),
          (V, "Verify 'Tool calls' ends with View cart and the reply reads 'Your cart is empty.'")], "p1"),
]

out = Path(__file__).with_name("agent-plans")
out.mkdir(exist_ok=True)
for slug, p in PLANS:
    (out / f"{slug}.json").write_text(json.dumps(p, indent=1, ensure_ascii=False) + "\n")
print(f"{len(PLANS)} plans, {sum(len(p['planSteps']) for _, p in PLANS)} steps, "
      f"{sum(1 for _, p in PLANS for s in p['planSteps'] if s['type'] == 'assertion')} assertions")
