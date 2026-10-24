# Hubit: Product Requirements Document

**Live URL:** https://hubit-store.vercel.app (pull requests are tested on their own Vercel preview)
**Type:** Full-stack web app (Next.js App Router, server-rendered catalogue, Stripe test-mode payments)
**Version:** 2.0, the multi-store storefront

## 1. What Hubit is

Hubit is one shop over 28 independent online stores. It stocks **1,695 products** in ten departments. Shoppers buy from Hubit, in **one cart and one payment**; Hubit then sources each item from a store that has it in stock, at the best price, and splits fulfilment between stores behind the scenes. The shopper never chooses a store.

The same product sold by several stores (matched on the manufacturer's style code) is **one Hubit product**. For example the **Air Jordan 5 Retro Mens Shoes** (style code HQ7978-001) is stocked by five stores; Hubit shows one price, **$215.00**, and picks the store per size.

Payments run in **Stripe test mode**. Every charge, decline and invoice is a real Stripe test object; no real card is ever charged and nothing ships.

The catalogue is a frozen snapshot of the stores taken on 23 Oct 2026, so every price below is exact on every deployment.

## 2. Users

- **Shopper:** browses, searches, adds to the cart, checks out and pays with a Stripe test card.
- **AI agent:** the home page describes shopping with an agent. The agent's tools are specified separately and are out of scope for this version.

## 3. Pages

| Path | Page |
|---|---|
| `/` | Home |
| `/shop` | Browse and search, with filters (query string: `q`, `dept`, `brand`, `min`, `max`, `stock`, `sort`, `page`) |
| `/p/<id>` | Product page |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/orders/<invoice id>` | The order, after payment |

Every page has the same header: the **HUBIT** wordmark (links home), a search field labelled "Search Hubit" with the placeholder "Search products, brands, style codes", a **Shop** link, and a cart button showing the number of items in the cart (0 when empty).

Money is always shown in US dollars **to the cent** (for example `$18.99`, `$215.00`).

Large headings are set in capitals by the stylesheet (the text "Footwear" displays as FOOTWEAR); compare headings without regard to case.

## 4. Features and acceptance criteria

### F1. Home
- The first screen's heading reads **"28 stores" / "One cart"**, with the sentence "1,695 products from independent shops, bought in one payment. Hubit sources each size from the store that has it." and a **Shop everything** button that opens `/shop`.
- Further down, the section headed **"Same shoe" / "Five stores"** shows the Air Jordan 5 and a caption naming its five stores (Undefeated, Extra Butter, Shoe Palace, Sneaker Politics and A Ma Maniére).
- **Try a size:** a row of size buttons. Sizes 7, 7.5 and 16 are sold out everywhere and cannot be chosen. Choosing a size shows a line of the form "Size 9: in stock at 5 of 5 stores. Hubit ships it from Undefeated at $215.00."
- A section headed **"Ten departments"** lists every department with its product count and lowest price; each row links to that department in `/shop`.
- A section headed **"Two fees, printed"** states the fees: items at each store's own price, shipping $6.99 (free from $75.00), a 5% service fee.

### F2. Browse and search (`/shop`)
- With no filters the heading reads **"Everything"** and the count reads **"1,695 products"**.
- **Departments** (a row of links above the results, and a filter list beside them) with these counts: Footwear 624, Clothing 545, Outdoor 122, Accessories 110, Kitchen 85, Beauty 79, Audio & tech 38, Home 37, Desk 33, Food & drink 22. Choosing one shows only that department and its name as the heading.
- **Search** matches every word of the query against the product's title, brand, the store's own tags, department and style code (case-insensitive). Descriptions are not searched: a word mentioned in passing ("enjoy with your morning mug") does not make a product a match.
  - "mug" finds 5 products: four mugs and a coffee-and-mug bundle. In Kitchen it finds 4. The heading reads `Results for "<query>"`.
  - "jordan 5" finds 27 products; the first is "Air Jordan 5 Retro Mens Shoes" at $215.00.
  - "HQ7978-001" finds exactly 1 product.
  - A query with no matches (for example "zzzqqq") shows **"Nothing matches that"** and "0 products".
- **Brand** filter, **price** filter (min and max in dollars, applied with **Go**), and **In stock only**.
- Every active filter shows as a removable chip above the results; **Clear all** removes them.
- **Sort:** Featured, Price low to high, Price high to low, Rating. Price low to high starts with "125 mL LDPE Bottle w/Dispensing cap" at $1.99; high to low starts with "Cotton Canvas Jacket" at $3,990.00.
- Results show 24 per page with **Previous** / **Next** links and "Page N of M".

### F3. Product page (`/p/<id>`)
- Shows the brand, the title, the price, photos, a description, and for matched products the style code.
- **Options** (usually sizes) are pooled from every store that stocks the product, listed in size order; an option sold out everywhere is shown struck through and cannot be chosen.
- With more than one option, **Add to cart** reads "Choose an option first" and is disabled until one is chosen. With a single option it is ready at once.
- Adding shows "Added. N in your cart." and a **View cart** link; the header count increases.
- A sourcing note: "Stocked by 5 of our partner stores. Hubit ships each size from whichever has it at the best price…" (or "Sourced from one partner store.").
- **Reviews** come from the stores' own customers, with the reviewer's name, star rating and date. A product without reviews says "No reviews yet for this item."
- An unknown id shows a not-found page.

### F4. Cart (`/cart`)
- Each line shows the photo, brand, title, the chosen option, a quantity stepper (−/+, at most 10) and **Remove**. Quantity 0 removes the line.
- An empty cart says **"Your cart is empty"** with a **Start shopping** button.
- **Order summary:** Items (count), Shipping, Service fee (5%), Total. All prices are worked out by the server.
- **Fees:**
  - Shipping is **$6.99** when the items come to less than $75.00, and **Free** from $75.00.
  - The service fee is **5% of the items**, rounded to the nearest cent.
  - Below $75.00 the summary says "Add $X more for free shipping."
- **Worked examples** (exact):

| Cart | Items | Shipping | Service fee | Total |
|---|---|---|---|---|
| 1 × 8oz Storage Jar – Blue Lid ($4.19) | $4.19 | $6.99 | $0.21 | $11.39 |
| 2 × 32oz Wide Mouth Surrealist Bottles ($18.99) | $37.98 | $6.99 | $1.90 | $46.87 |
| 4 × 32oz Wide Mouth Surrealist Bottles | $75.96 | Free | $3.80 | $79.76 |
| 1 × Air Jordan 5 Retro Mens Shoes, size 9 | $215.00 | Free | $10.75 | $225.75 |

- The cart survives a page reload (it is kept in the browser).
- **Checkout** opens `/checkout`.

### F5. Checkout and the pre-payment re-check (`/checkout`)
- Before payment Hubit **reads every item again from its stores**. The order panel says "Prices and stock checked with the stores just now."
- If a price changed since the item was added, the panel says so, for example: **"32oz Wide Mouth Surrealist Bottles went up from $18.99 to $21.99 since you added it."** The order total uses the new price.
- If an item has sold out at every store, the panel says **"<title> has sold out at every store we source from. Remove it"**, and the pay button reads **"Remove sold-out items to pay"** and is disabled until the item is removed.
- If the cheapest store for a size sold out but another store has it, the shopper sees nothing: the price is unchanged and Hubit ships it from the other store.
- On previews and in tests the stores' changes since the snapshot are fixed:
  - 32oz Wide Mouth Surrealist Bottles: $18.99 → **$21.99**.
  - Analog Archive (Black Aluminum): **sold out** everywhere.
  - Air Jordan 5 Retro Mens Shoes, size 9: sold out at Undefeated only; still $215.00 from the other four.
- **Worked examples at checkout:**
  - 2 × 32oz Wide Mouth Surrealist Bottles: items $43.98, shipping $6.99, service fee $2.20, **total $53.17** (the cart showed $46.87 before the re-check).
  - 1 × Air Jordan 5, size 9: total **$225.75**, no change shown.
- **Contact:** Full name, Email (required; must look like name@example.com, otherwise "Enter an email like name@example.com"), Phone (optional).
- **Delivery address:** Address, City, Postcode (required; otherwise "Required"), Flat/unit (optional), State or region (optional), Country (a list, default United States).
- **Payment:** a choice of Stripe test cards:
  - "Visa ending 4242" pays.
  - "Card that is declined" is refused: **"Your card was declined. Nothing was charged."**
  - "Card with insufficient funds" is refused: "Your card has insufficient funds… Nothing was charged."
- The pay button reads **"Pay $<total>"**. If a store changes again between review and payment, nothing is charged and the page says "Something changed at a store since you looked. Nothing was charged; check the new total and pay again."
- After a successful payment the cart is emptied and the order page opens.

### F6. Order page (`/orders/<id>`)
- Shows **Paid**, the date, the heading **"Order <invoice number>"**, and "Thanks, <first name>."
- **How it ships:** the items grouped by the store that fulfils them, for example "Ships from Extra Butter" and "Ships from Nalgene", each with Paid ✓, Sent to <store> ✓, and "Shipping (test mode: nothing ships)". The heading line says how many stores fulfil the order.
- **Receipt:** Items, Shipping, Service fee (5%), and **Paid** equal to the total charged; the delivery address; **Download invoice (PDF)** and **View invoice on Stripe**.

## 5. Out of scope
- Real payments, real shipping, emails.
- Agent tools (specified in a later version).
- Accounts and sign-in (a later version).

## 6. Key user journeys to cover
1. Home → Shop everything → choose Footwear → 624 products → sort Price high to low.
2. Search "jordan 5" → open "Air Jordan 5 Retro Mens Shoes" → $215.00 → Add to cart is disabled until a size is chosen → choose 9 → add → header count 1.
3. Home → "Try a size" → choose 9 → the line names the store and $215.00; sizes 7 and 16 cannot be chosen.
4. Add 2 × 32oz Wide Mouth Surrealist Bottles → cart: items $37.98, shipping $6.99, fee $1.90, total $46.87 and "Add $37.02 more for free shipping" → raise to 4 → shipping Free, total $79.76.
5. Cart with the bottles → Checkout → the price-rise notice ($18.99 → $21.99) and total $53.17.
6. Cart with Analog Archive (Black Aluminum) and the 8oz Storage Jar → Checkout → sold-out notice, pay disabled → Remove it → pay enabled, total $11.39.
7. Checkout with an invalid email "ada@" and empty address → the field errors, nothing charged.
8. Checkout with "Card that is declined" → "Your card was declined. Nothing was charged." and the cart is kept.
9. Air Jordan 5 size 9 + 2 bottles → pay with Visa → order page: Paid, two "Ships from" groups (Extra Butter, Nalgene), receipt: items $258.98, shipping Free, service fee $12.95, **Paid $271.93**, and an invoice PDF link.
10. Search "zzzqqq" → "Nothing matches that".
