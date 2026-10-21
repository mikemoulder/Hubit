# Hubit: Product Requirements Document

**Live URL:** https://hubit-store.vercel.app
**Type:** Frontend web app (Next.js, single page, no backend, no login)
**Version:** 1.1 (exact cents)

## 1. What Hubit is

Hubit is a demonstration storefront for desk setups: monitors, keyboards, mice, desks and chairs. Its purpose is to let a shopper hand the shopping to an AI agent without handing over permission to pay.

The shopper sets **rules** (a budget and "things I already have"). The agent may browse and fill the cart. **Checkout is withheld until three conditions all hold:**

1. the cart is inside the shopper's rules,
2. the delivery form is complete, and
3. the shopper has approved this exact basket.

Any change to the cart, the rules or the delivery address withdraws approval.

Nothing is charged and nothing ships. There is no account and no sign-in. All state lives in the page and resets on reload.

## 2. Users

- **Shopper (human):** browses, edits the cart, sets rules, fills delivery details, approves or withdraws approval.
- **Agent:** reaches the page through the WebMCP browser API, which is not available in standard browsers. Without it, the page shows the runtime as `local`. Every flow in this document works by hand in a standard browser.

## 3. Page layout

From top to bottom, the page shows:

- **Header (sticky):**
  - the Hubit logo
  - category navigation: All plus one link each for monitors, keyboards, mice, desks and chairs
  - a "Search the shelf" field
  - a cart button showing the item count and, when the cart is not empty, the cart total
- **Rules bar (sticky, under the header), labelled "Your rules":**
  - a Budget input in dollars, default **1200**
  - a spend meter (progress bar labelled "Cart total against budget")
  - a "$X of $Y" line
  - an Edit rules toggle that opens "I already have" and "Prioritise"
  - a gate status pill
  - an approval button when one is allowed
- **Catalog grid:** 40 products, 8 per category, each with:
  - a photo
  - a name and price
  - a rating
  - optional badges (Best seller, New, Sale, Low stock)
  - a struck-through "was" price on Sale items
  - an Add to cart button
- **Agent tool surface panel** (right column on desktop):
  - the runtime label (`local` in normal browsers)
  - a highlighted `checkout` slot
  - a collapsible list of the other tools
  - a call log
- **Cart drawer:** opens from the cart button.
- **Quick view dialog:** opens from a product's image or name.
- **Footer:** shop links and the line "Hubit is a demonstration shop. Nothing ships and no card is charged."

Money is displayed in US dollars, **exact to the cent**. Whole-dollar amounts show no cents (`$1,200`, `$319`). Any other amount shows two decimals (`$14.99`, `$1,070.99`, `$0.99`). An amount is never rounded, so the figures on screen always agree with the budget check.

## 4. Features and acceptance criteria

### F1. Browse the catalog
- The default view lists all 40 products.
- Choosing a category shows only that category's 8 products.
- Search matches product name or description (case-insensitive). With no matches, the grid shows "Nothing on the shelf matches that".
- The sort control offers Featured, Price low to high, Price high to low, and Rating. The two price sorts order the grid by price.

### F2. Quick view
- Clicking a product's image or name opens a dialog with the name, price, description, specs and an "Add to cart" button.
- When the product is already in the cart, the button reads "Add another (N in cart)".
- When the shopper's rules say they already have that category, the dialog warns: "Your rules say you already have a {category}. Adding this puts the cart outside them."
- The dialog closes with its Close control.

### F3. Cart
- Add to cart adds one unit. Adding the same product again increases its quantity.
- The header cart button shows the total item count and the cart total.
- The cart drawer lists each line, with:
  - −/+ quantity steppers (the + stepper stops at 10; reducing to 0 removes the line)
  - a remove control
  - an empty state: "Nothing in the cart yet"
- The drawer footer shows Subtotal, Delivery ("Free" for standard, the express charge for express), Total, and "Against a budget of $X".

### F4. Budget rule
- Changing the budget updates the spend meter and the "$X of $Y" line immediately.
- The **order total** (goods plus delivery) is compared with the budget.
- When the total exceeds the budget:
  - the meter turns red
  - the rules bar shows "over by $N"
  - the gate pill reads "Rules not met, checkout withheld"
  - the drawer lists "Cart is over budget by $N"
- **Worked example** (default budget $1,200): add the 34" Ultrawide 165Hz ($319), Standing desk 160cm ($349), Ergonomic mesh adjustable ($388) and Mechanical TKL tactile ($149). The total is $1,205, so the cart is over by $5. Removing the keyboard brings it to $1,056, within budget.
- Raising the budget to 1300 with the $1,205 cart clears the violation.

### F5. "I already have" rule
- Under Edit rules, the shopper toggles the categories they already own. The summary reads "You have a {category}…" or "You have nothing yet".
- A cart containing a product from an owned category is outside the rules. The rules bar lists "You already have a {category}", and checkout is withheld.
- Untoggling the category, or removing the product, clears the violation.
- "Prioritise" (Quality or Price) is a preference only. It never creates a violation and never withdraws approval.

### F6. Delivery details
- The drawer shows the delivery form when the cart is not empty.
- Required fields: Full name, Email, Address, City, Postcode, Country.
- Optional fields: Phone; Flat, unit, building; Delivery notes.
- The email must look like an address (something@domain.tld). Otherwise the form is incomplete.
- Delivery speed is Standard (free) or Express, shown as exactly `$14.99`, which counts against the budget. With Express selected, the drawer's Delivery line reads `$14.99`.
- While required fields are missing, the gate pill reads "No delivery address, checkout withheld". The drawer says "Delivery needs {missing fields} before you can approve."

### F7. Approval gate (core feature)
- The **Approve this basket** button appears only when all of these hold:
  - the cart is not empty
  - there are no rule violations
  - the delivery form is complete
  - the basket is not already approved
- With an empty cart, the drawer says "Add something before you can approve a basket." With violations, it says "Bring the cart inside your rules, then approve it."
- Clicking Approve:
  - turns the gate pill to "Checkout is open to the agent"
  - shows "Approved. The agent has a checkout tool for this exact basket." in the drawer
  - turns the `checkout` slot in the tool panel from "NOT REGISTERED, nothing for the agent to call" to "REGISTERED, the shopper approved this basket"
- **Approval is withdrawn automatically** by any of these:
  - adding, removing or changing the quantity of an item
  - changing the budget
  - toggling "I already have"
  - editing any delivery field or the delivery speed

  After any of these, `checkout` returns to NOT REGISTERED and the shopper must approve again.
- **Approval is NOT withdrawn** by browsing:
  - changing category
  - searching
  - sorting
  - opening or closing quick view or the cart
  - changing Prioritise
- **Withdraw approval** (shown while approved) withdraws it manually.
- Before approval, the `checkout` slot is NOT REGISTERED in every state.

### F8. Persistence
- The cart, rules and approval are not persisted. Reloading the page returns to an empty cart, budget $1,200, nothing owned, not approved.

## 5. Out of scope for testing

- Placing an order. In a standard browser there is no human checkout button: checkout is a tool offered only to a connected WebMCP agent.
- Payment, accounts, email, real shipping.

## 6. Key user journeys to cover

1. Browse → filter by category → search → sort → quick view → add to cart.
2. Build the $1,205 cart → see "over by $5" → remove the keyboard → within budget.
3. Fill the cart, fill delivery, approve → `checkout` REGISTERED → add one more item → approval withdrawn → `checkout` NOT REGISTERED.
4. Approve → change the budget → approval withdrawn.
5. Approve → edit the city → approval withdrawn.
6. Approve → change category, search, open quick view, switch Prioritise → still approved.
7. Mark "I already have a chair" → add a chair → violation → Approve not offered.
8. Choose Express on a cart $10 under budget → now over budget → Approve not offered.
9. Invalid email "ada@" → the form is incomplete and Approve is not offered.
10. **Exact cents:** cart of 34" Ultrawide 165Hz + Standing desk 160cm + Ergonomic mesh adjustable ($1,056), budget 1070, choose Express → the rules bar reads `$1,070.99 of $1,070` and `over by $0.99`, the drawer total reads `$1,070.99`, and Approve is not offered. Raising the budget to 1071 clears the violation.
