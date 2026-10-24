# Hubit: what it is and why it matters

Working notes for the README and the submission. Every number here comes from the build or from TestSprite and is kept current.

## One line

**Hubit is one shop over many independent stores, built for two shoppers at once: you, and your AI agent.** One cart, one payment, one order to follow. Agents use it through tools the page hands them, not by scraping it, and they can never pay.

## 1. The problem for shoppers: one purchase, many stores

Shopping for one thing usually means shopping in several places. The trainers are on one Shopify store, the bottle on a WooCommerce shop, the jacket on eBay, the rest on Amazon. Each store is its own small silo, and the cost of that lands on the shopper:

- **Many carts, many checkouts.** The same name, address and card typed in again and again, one account per store.
- **Shipping charged again and again.** Every store adds its own fee and its own free-shipping minimum, so a $20 item can cost $27 delivered, and splitting an order across stores makes it worse.
- **Deliveries on different days,** with different tracking pages, carriers and return policies.
- **Stock is uneven.** The size you want is sold out at one store and sitting on the shelf at another, and you only find out by checking each one. In Hubit's own catalogue the Air Jordan 5 "Halloween" is sold by **5 stores**, and they don't all have the same sizes.
- **Prices drift.** What you saw yesterday is not always what you pay today, and most shops only tell you at the last step.

## 2. What Hubit does for shoppers

**Hubit is the store you buy from.** It stocks products from independent shops and takes care of sourcing behind the scenes.

- **One catalogue across stores.** Real products, prices, stock, photos and reviews read from **28 stores** (Shopify and WooCommerce), normalised into one shape: **1,695 products** in **10 departments**.
- **The same product from several stores is one product.** Matched on the manufacturer's style code (for example `HQ7978-001`), so you see one listing and one price, not five near-duplicates. **33 products** are sold by more than one store.
- **Sizes pooled across stores.** You choose a size; Hubit finds a store that has it. A size that one store has sold out of is still buyable if another has it.
- **Routing per item, per size.** Each line goes to the store that has it in stock at the best price. You never pick a store.
- **One cart, one payment, one receipt.** A single invoice for everything, whatever the number of stores behind it.
- **Plain fees, the same everywhere.** Items at each store's own price, plus **$6.99 shipping (free from $75)** and a **5% service fee**, shown before you pay. No per-store shipping stacking.
- **Checked again before you pay.** At checkout Hubit reads every item from its store again. A price rise is shown and must be accepted; a sell-out blocks payment until removed; if the cheapest store sold out of your size but another has it, Hubit re-routes silently at the same price. Nothing is charged on a total you did not see.
- **One order to follow.** The order page shows everything you bought, which store is sending each part, and the invoice.
- **Reviews from real buyers,** taken from the stores' own customers (118 in the catalogue), never written by Hubit.

**Delivery, honestly.** Today one order can arrive as more than one parcel, because each store ships its part; Hubit gives you one order, one receipt and one place to track it. Consolidating parcels into a single delivery (a Hubit hub that re-ships them together) is the natural next step, not something the demo claims to do.

## 3. The problem for agents: websites are built for eyes

AI agents that shop for people today mostly drive a website the way a person would: read the screen, scrape the DOM, guess which button is which, click, and hope the page did not change.

- **Brittle.** A redesign, a renamed class or a pop-up breaks the agent.
- **Slow and expensive.** Every step means reading a whole page to find one number.
- **Ambiguous.** "Add to cart" might be a button, a link or an icon; a price might be the sale price or the old one.
- **Unsafe around money.** If an agent can click any button, it can click "Pay". The only thing stopping it is the agent's own judgement.

## 4. What Hubit does for agents: tools, not scraping (WebMCP)

Hubit adopts **WebMCP**, the emerging browser standard that lets a web page register **tools** with the agent built into the browser: named actions with a description and a typed input schema. The agent calls them like functions instead of scraping the page.

- **Five tools, registered by the page itself:** Search catalog, Get product, Add to cart, Remove from cart, View cart. They return exact data (prices to the cent, sizes with stock), and they use the same server APIs the pages use.
- **The same page, the same cart.** The agent works inside the shopper's own session. What it adds lands in the shopper's cart at once, marked **"Added by your agent"**; what the shopper changes, the agent sees on its next look. There is no second store for machines, no separate API to integrate and keep in sync.
- **No payment tool, by design.** The agent can search, compare and fill the cart. It cannot pay, check out or see card details, because no such tool exists on the page. That is a structural limit, not an instruction the agent might ignore. Asked to pay, it is refused and says so. **Paying stays with the human.**
- **Works without WebMCP too.** In browsers that don't support it yet, the "Your agent" panel shows the same tools and a demo agent that calls them exactly as a real agent would, step by step, so anyone (and any test runner) can watch it work.

## 5. Why now

- **Agents are starting to shop.** Assistants that browse and buy for people are moving from demos into products, and stores need a way to serve them that is fast, reliable and safe.
- **WebMCP is arriving in browsers** as a standard way for a page to offer tools to an agent, in place of screen-scraping.
- **Independent stores expose their catalogues** through platform endpoints (Shopify, WooCommerce), which makes an aggregator possible without a deal with each one.

## 6. What is technically deep here

- **Source adapters** for Shopify and WooCommerce, normalised into one listing shape; failing stores are recorded and skipped, never fatal.
- **Real-world data problems solved:** Shopify prices for the requester's country unless pinned to the US market (a shoe showed $240 instead of $215 from a European server); store base currencies read from the shop, not the visitor's locale; AUD and EUR converted at the day's rate; junk listings (gift cards, samples, CMS entries) filtered out.
- **Matching** on manufacturer style codes; **routing** per size to the cheapest in-stock store.
- **Server-side money.** The browser holds only choices; every price, fee and total is worked out by the server, to the cent.
- **Pre-payment re-check** against the live stores in production, and against a committed snapshot plus a "drift" file on previews, so tests are exact and repeatable.
- **Real Stripe test-mode payments:** an invoice per order, paid with Stripe's own test cards, declines included.
- **WebMCP tool surface** with a single registry the demo agent also goes through, so it can never reach anything a real agent couldn't.

## 7. How it is tested (fill in for the README)

- **TestSprite, wired into every pull request:** the GitHub App runs the suite on each PR's Vercel preview, reports on the PR, and branch protection holds the merge until it is green.
- **The suite grew with the product.** The 42 tests from v1 were rewritten in place for v2 (same ids, run history kept); 4 agent tests were added before the agent existed. **46 tests.**
- **Tests first, on the PR:** PR #11 opened with only the spec and the 4 agent tests, and went red on exactly those 4 (42/46) before the feature landed.
- **Real bugs caught before merge:** search matching descriptions ("mug" listing coffees and a suncatcher); a reviewer shown as a bare initial; per-review ratings not readable. Each was fixed and re-verified.
- **Local tests:** `npm test`, 13/13.
- Runs, ids and results: [`testsprite.md`](testsprite.md).
