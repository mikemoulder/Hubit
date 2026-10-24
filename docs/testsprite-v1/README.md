# The v1 suite, as it stood on 23 Oct 2026

These 42 tests verified Hubit v1, the single-page desk shop, on PRs #2, #3 and #5. For v2 each one was rewritten in place in the same TestSprite project, keeping its id and its run history. This file keeps the v1 plans word for word.

### Demo shopper cannot check out after approval conditions are lost
`64b3c4e4-cfbd-47fb-8970-86e468eaad7f` · passed · Medium



1. **action**: Navigate to the storefront home page
2. **action**: In the right-hand column, find the 'Demo shopper' panel and click its 'Run the demo shopper' button
3. **action**: Wait (up to 30 seconds) until the Demo shopper panel shows 'Waiting for you to approve this basket'
4. **action**: Close the cart drawer if it is open. In the 'Your rules' bar, clear the Budget input, type 1100, and click elsewhere
5. **assertion**: Verify the rules bar shows 'over by' text, the gate status reads 'Rules not met, checkout withheld', no 'Approve this basket' button is shown, and no 'Order placed' banner is shown
6. **action**: Wait 5 seconds
7. **assertion**: Verify there is still no 'Order placed' banner and the Demo shopper panel still shows 'Waiting for you to approve this basket'
8. **action**: Change the Budget input back to 1200, click elsewhere, then click 'Approve this basket' in the 'Your rules' bar
9. **assertion**: Verify within 15 seconds the page shows the banner 'Order placed for $1,185'

### Demo shopper checks out only after the shopper approves
`2749dad3-fc80-45d8-9fcd-8131727cb9ad` · passed · Medium



1. **action**: Navigate to the storefront home page
2. **action**: In the right-hand column, find the 'Demo shopper' panel and click its 'Run the demo shopper' button
3. **action**: Wait (up to 30 seconds) until the Demo shopper panel shows 'Waiting for you to approve this basket'
4. **action**: Click 'Approve this basket': use the button at the bottom of the open cart drawer if the drawer is open, otherwise the one in the 'Your rules' bar
5. **action**: Wait (up to 15 seconds) until the Demo shopper narration shows 'Order placed for $1,185'
6. **assertion**: Verify the page shows the banner 'Order placed for $1,185' (close the cart drawer first if it covers the rules bar)
7. **assertion**: Verify the agent tool panel shows get_order as 'REGISTERED, there is an order to read back' and checkout as 'NOT REGISTERED'
8. **action**: Click 'Start over' in the order banner
9. **assertion**: Verify the header cart button shows 0 items

### Demo shopper is refused at the gate until the basket is approved
`79d8ec7b-91a8-4429-96c0-e83012cc19be` · passed · Medium



1. **action**: Navigate to the storefront home page
2. **action**: In the right-hand column, find the 'Demo shopper' panel and click its 'Run the demo shopper' button
3. **action**: Wait (up to 30 seconds) until the Demo shopper panel shows 'Waiting for you to approve this basket'
4. **assertion**: Verify the Demo shopper narration includes 'Swapping the Mechanical TKL, tactile for the Low profile mechanical, which saves $20.' and 'Refused: checkout is not on my tool surface'
5. **assertion**: Verify the cart drawer's Total reads '$1,185' and the delivery fields are filled with 'Ada Lovelace', 'ada@example.com' and '12 Marconi Road'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the rules bar reads '$1,185 of $1,200' and the gate status pill reads 'Checkout withheld until you approve'
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call', and its Calls list contains a checkout entry marked as failed
9. **assertion**: Verify no 'Order placed' banner is shown anywhere on the page

### Demo shopper stops when told to
`f7e5a0e4-4929-4b66-a5ac-f5dfa2ad74cf` · passed · Medium



1. **action**: Navigate to the storefront home page
2. **action**: In the right-hand column, find the 'Demo shopper' panel and click its 'Run the demo shopper' button
3. **action**: Immediately click the 'Stop' button in the Demo shopper panel
4. **assertion**: Verify the Demo shopper narration ends with 'Stopped. Nothing else was done.' and the panel offers a 'Run again' button
5. **assertion**: Verify no 'Order placed' banner is shown

### Express delivery is shown and budgeted to the exact cent
`4eedd0f8-16ee-468c-ade9-0b78db9e6581` · passed · Medium



1. **action**: Navigate to the storefront home page
2. **action**: Add these three products to the cart once each using their Add to cart buttons: '34" Ultrawide 165Hz' ($319), 'Standing desk, 160cm' ($349) and 'Ergonomic mesh, adjustable' ($388)
3. **action**: In the 'Your rules' bar, clear the Budget input and type 1070, then click elsewhere on the page
4. **action**: Open the cart with the cart button in the header, and under 'Delivery speed' choose Express
5. **assertion**: Verify the cart drawer's Delivery line shows exactly '$14.99' (not '$15')
6. **assertion**: Verify the cart drawer's Total shows exactly '$1,070.99' (not '$1,071')
7. **assertion**: Verify the rules bar reads '$1,070.99 of $1,070' and shows 'over by $0.99' (not 'over by $1')
8. **assertion**: Verify no 'Approve this basket' button is shown anywhere on the page
9. **action**: Change the Budget input to 1071 and click elsewhere
10. **assertion**: Verify the rules bar no longer shows any 'over by' text

### First screen says what Hubit is and starts the demo shopper
`694eb4d6-e5da-4b24-84e7-3cd95f965346` · passed · Medium



1. **action**: Navigate to the storefront home page and do not scroll
2. **assertion**: Verify that, without scrolling, the page shows the line 'An agent can fill this cart. It cannot buy until you approve this exact basket.' near the top, above the 'Everything on the shelf' heading
3. **assertion**: Verify a 'Run the demo shopper' button is shown next to that line, above the 'Everything on the shelf' heading
4. **action**: Click the 'Run the demo shopper' button that sits next to that intro line (not the one inside the Demo shopper panel)
5. **action**: Wait (up to 30 seconds) until the Demo shopper panel shows 'Waiting for you to approve this basket'
6. **assertion**: Verify the Demo shopper panel narration starts with 'Reading your rules.' and includes 'Refused: checkout is not on my tool surface'

### Withhold approval on an empty cart
`e46137f1-c3d0-410b-9992-30b8a80b8a1f` · passed · Medium



1. **action**: Navigate to the storefront home page
2. **assertion**: Verify the header cart button shows 0 items, the rules bar reads '$0 of $1,200', and the gate status pill reads 'Empty cart, checkout withheld'
3. **action**: Open the cart with the header cart button
4. **assertion**: Verify the cart drawer shows 'Nothing in the cart yet' and 'Add something before you can approve a basket.', with no 'Approve this basket' button and no delivery form
5. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away
6. **assertion**: Verify no 'Approve this basket' button is shown in the 'Your rules' bar
7. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'


## Approval Gate

### Approve a valid basket
`f75a9cea-0310-49f8-ae02-b67fdedee8d3` · passed · High

Validates that approving a basket updates the checkout status and confirmation state for the exact basket.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **assertion**: Verify the gate status pill reads 'No delivery address, checkout withheld' and no 'Approve this basket' button is shown
4. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
5. **assertion**: Verify the cart drawer shows an 'Approve this basket' button and the Total reads '$319'
6. **action**: Click 'Approve this basket' at the bottom of the cart drawer
7. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
8. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
9. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
10. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'

### Keep approval after changing prioritisation
`9a0d8d3e-8097-4566-9b5f-c888f0f8c3db` · passed · Medium

Validates that changing the prioritisation preference does not withdraw approval from an already approved basket.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: In the 'Your rules' bar under 'Prioritise', click 'Price', then click 'Quality'
10. **assertion**: Verify the gate status pill still reads 'Checkout is open to the agent'
11. **assertion**: Verify the 'Agent tool surface' panel still shows checkout as 'REGISTERED, the shopper approved this basket'


## Budget Rule Enforcement

### Approved basket loses approval after budget change
`886bdf61-0988-4ccf-af48-1ae3cae32122` · passed · High

Verify changing the budget withdraws approval from an already approved basket.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: In the 'Your rules' bar, clear the Budget input, type 1300, and click elsewhere
10. **assertion**: Verify the rules bar reads '$319 of $1,300' and an 'Approve this basket' button is offered again
11. **assertion**: Verify the gate status pill no longer reads 'Checkout is open to the agent'
12. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'

### Approved basket loses approval after cart change
`0e2f62a2-d399-4c7d-9616-9dfcb711e507` · passed · High

Verify any cart edit withdraws approval after the basket has been approved.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: Add 'Mechanical TKL, tactile' ($149) to the cart with its Add to cart button
10. **assertion**: Verify the header cart button shows 2 items and $468, and an 'Approve this basket' button is offered again
11. **assertion**: Verify the gate status pill no longer reads 'Checkout is open to the agent'
12. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'

### Browsing changes do not withdraw approval
`f127f140-6b54-4da6-808f-3813988ad49d` · passed · Medium

Verify browsing actions such as switching categories, searching, sorting, opening quick view, and changing prioritisation do not withdraw approval once the basket is approved.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: Click the 'Desks' category, type 'standing' in 'Search the shelf', choose 'Price, low to high' in the Sort control, then open the quick view of 'Standing desk, 140cm' and close it
10. **assertion**: Verify the gate status pill still reads 'Checkout is open to the agent'
11. **assertion**: Verify the 'Agent tool surface' panel still shows checkout as 'REGISTERED, the shopper approved this basket'
12. **assertion**: Verify a 'Withdraw approval' button is still shown and no 'Approve this basket' button is shown

### Budget increase clears overage
`fb67e764-702d-40ca-b781-722a81124d69` · passed · High

Verify increasing the budget after an over-budget cart immediately restores budget compliance.

1. **action**: Navigate to the storefront home page
2. **action**: Add exactly these four products to the cart once each: '34" Ultrawide 165Hz', 'Standing desk, 160cm', 'Ergonomic mesh, adjustable' and 'Mechanical TKL, tactile' (goods total $1,205, against the default $1,200 budget)
3. **assertion**: Verify the rules bar shows 'over by' text and the gate status reads 'Rules not met, checkout withheld'
4. **action**: In the 'Your rules' bar, clear the Budget input, type 1300, and click elsewhere
5. **assertion**: Verify the rules bar no longer shows any 'over by' text and the gate status no longer reads 'Rules not met, checkout withheld'

### Budget overage blocks approval
`7d9e5926-0778-49a8-8504-abb145b70c5f` · passed · High

Verify the basket is flagged when the cart total exceeds the shopper budget and approval is withheld.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart
3. **action**: Open the cart and fill the delivery form with Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **assertion**: Verify an 'Approve this basket' button is shown while the cart is within budget
5. **action**: In the 'Your rules' bar, clear the Budget input, type 300, and click elsewhere
6. **assertion**: Verify the drawer lists 'Cart is over budget', the gate status reads 'Rules not met, checkout withheld', and no 'Approve this basket' button is shown

### Cart can be approved after clearing ownership rule
`a2a17b9a-e687-4850-ab51-e487d387b4ec` · passed · Medium

Verify removing the ownership constraint or removing the conflicting item restores approval eligibility.

1. **action**: Navigate to the storefront home page
2. **action**: In the 'Your rules' bar under 'I already have', toggle Chair on
3. **action**: Add 'Ergonomic mesh, adjustable' ($388) to the cart with its Add to cart button
4. **assertion**: Verify the gate status pill reads 'Rules not met, checkout withheld'
5. **action**: Toggle Chair off under 'I already have'
6. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
7. **assertion**: Verify the violation 'You already have a chair' is gone and the cart drawer shows an 'Approve this basket' button
8. **action**: Click 'Approve this basket' at the bottom of the cart drawer
9. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'

### Delivery express fee counts toward budget
`039669d0-3f20-4e8c-a98b-92e058194cf6` · passed · High

Verify selecting express delivery increases the total and can push a near-budget cart over the limit.

1. **action**: Navigate to the storefront home page
2. **action**: Add exactly these three products to the cart once each: '34" Ultrawide 165Hz', 'Standing desk, 160cm' and 'Ergonomic mesh, adjustable' (goods total $1,056)
3. **action**: In the 'Your rules' bar, clear the Budget input, type 1065, and click elsewhere
4. **assertion**: Verify the rules bar shows no 'over by' text, so the cart is within the $1,065 budget with standard delivery
5. **action**: Open the cart with the header cart button and under 'Delivery speed' choose Express
6. **assertion**: Verify the cart drawer's Delivery line now shows a non-zero express charge instead of 'Free', and the Total is greater than the subtotal
7. **assertion**: Verify the rules bar now shows 'over by' text and the gate status reads 'Rules not met, checkout withheld'
8. **action**: Under 'Delivery speed' choose Standard again
9. **assertion**: Verify the 'over by' text is gone from the rules bar

### Incomplete delivery details withhold approval
`cca21256-2294-492c-bde7-7e449d83747e` · passed · High

Verify missing required delivery details prevent approval from being offered.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart and fill only Full name 'Ada Lovelace', Email 'ada@example.com' and Address '12 Marconi Road', leaving City, Postcode and Country empty
4. **assertion**: Verify the cart drawer says 'Delivery needs city, postcode, country before you can approve.' and shows no 'Approve this basket' button
5. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
6. **assertion**: Verify the gate status pill reads 'No delivery address, checkout withheld'
7. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'

### Invalid email keeps delivery form incomplete
`a11399ad-ad47-4571-9e4e-67a37060124a` · passed · High

Verify an invalid email format prevents the delivery form from becoming complete and approval remains withheld.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **assertion**: Verify the cart drawer says 'Delivery needs a valid email before you can approve.' and shows no 'Approve this basket' button
5. **action**: Change the Email field to 'ada@example.com'
6. **assertion**: Verify an 'Approve this basket' button now appears in the cart drawer

### Reload resets budget cart and approval state
`ba619de4-642a-4cd0-8aec-e5e9d25a0507` · passed · Medium

Verify reloading the page clears cart contents, resets the budget, and removes approval state.

1. **action**: Navigate to the storefront home page
2. **action**: Change the Budget input in the 'Your rules' bar to 1500 and click elsewhere
3. **action**: Add '34" Ultrawide 165Hz' to the cart, open the cart, fill the delivery form with Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria', then click 'Approve this basket'
4. **assertion**: Verify the page shows 'Checkout is open to the agent' before the fresh load
5. **action**: Load the storefront fresh by navigating to the current site's home page with '?reload=1' appended to the URL (for example https://<this host>/?reload=1). This full page load replaces the reload and must happen before the next checks
6. **assertion**: Verify the header cart button shows 0 items and opening the cart shows 'Nothing in the cart yet'
7. **assertion**: Verify the Budget input shows 1200 again
8. **assertion**: Verify the page no longer shows 'Checkout is open to the agent' and the agent tool panel shows checkout as 'NOT REGISTERED'

### Removing an item restores budget compliance
`cc51e538-afb4-419e-935a-6ff883b468ed` · passed · High

Verify removing an item from an over-budget basket brings the cart back within the allowed spend limit.

1. **action**: Navigate to the storefront home page
2. **action**: Add exactly these four products to the cart once each: '34" Ultrawide 165Hz', 'Standing desk, 160cm', 'Ergonomic mesh, adjustable' and 'Mechanical TKL, tactile' (goods total $1,205, against the default $1,200 budget)
3. **assertion**: Verify the rules bar shows 'over by' text and the gate status reads 'Rules not met, checkout withheld'
4. **action**: Open the cart and remove the 'Mechanical TKL, tactile' line
5. **assertion**: Verify the cart still contains the other three products, the rules bar shows no 'over by' text, and the drawer lists no 'Cart is over budget' message

### Search browse and add item from filtered results
`2f10d7fc-a5ef-42c9-9358-4b6149487d41` · passed · Medium

Verify a shopper can search the catalog, view filtered products, and add one to the cart.

1. **action**: Navigate to the storefront
2. **action**: Search for a product by name
3. **action**: Verify matching results are shown
4. **action**: Open a product quick view from the results
5. **action**: Add the product to the cart from quick view
6. **assertion**: Verify the cart contains the added product


## Cart Management

### Add an item to an empty cart
`3ac8fc34-e96a-4efd-a0ce-ea4992ed0ae5` · passed · High

Verify a product can be added to the cart from the catalog and the cart reflects the item.

1. **action**: Navigate to the storefront
2. **action**: Click an add to cart control for a product
3. **action**: Open the cart drawer
4. **assertion**: Verify the cart shows one item with the selected product listed
5. **assertion**: Verify the cart total is displayed

### Adjust item quantity with steppers
`28fcb8b3-fed2-4618-91ce-af306ee62bac` · passed · High

Verify the cart quantity controls increase and decrease the selected item count while keeping the line in the cart.

1. **action**: Navigate to the storefront
2. **action**: Add a product to the cart
3. **action**: Open the cart drawer
4. **action**: Increase the item quantity using the cart quantity control
5. **action**: Decrease the item quantity using the cart quantity control
6. **assertion**: Verify the cart line remains present after quantity adjustments
7. **assertion**: Verify the quantity shown for the item reflects the final stepper state

### Increase cart quantity by adding the same product again
`20e3b308-c654-4781-9737-38963c85959f` · passed · High

Verify adding the same product twice increases its quantity and updates the cart total.

1. **action**: Navigate to the storefront
2. **action**: Add a product to the cart
3. **action**: Add the same product to the cart again
4. **action**: Open the cart drawer
5. **assertion**: Verify the product quantity in the cart has increased
6. **assertion**: Verify the cart total reflects the increased quantity

### Remove an item from the cart
`341f3ebe-0d02-42ae-9b6d-97993768c71f` · passed · High

Verify removing a cart line clears it from the cart and updates the cart to empty when it was the only item.

1. **action**: Navigate to the storefront
2. **action**: Add a product to the cart
3. **action**: Open the cart drawer
4. **action**: Remove the product from the cart
5. **assertion**: Verify the cart is empty
6. **assertion**: Verify the empty state message is shown

### Show the cart empty state after clearing all items
`0a5d4171-8861-49a0-be40-997bf431f1a4` · passed · Medium

Verify the cart drawer shows its empty-state behavior when all items have been removed.

1. **action**: Navigate to the storefront
2. **action**: Add a product to the cart
3. **action**: Open the cart drawer
4. **action**: Remove the only item from the cart
5. **assertion**: Verify the cart drawer shows an empty cart state
6. **assertion**: Verify no cart items are listed


## Catalog Browsing

### Browse all catalog products
`af5d1075-54da-4c67-ae33-90680e0507b2` · passed · High

Validates that the default catalog view shows the full desk setup product grid.

1. **action**: Navigate to the store homepage
2. **assertion**: Verify the full product catalog is displayed
3. **assertion**: Verify the default view shows all catalog categories available for browsing

### Combine category, search, and sort filters
`a3bd599b-463e-41de-9d4e-c515d74647d6` · passed · Medium

Validates that category filtering, search, and sorting work together to narrow and organize the catalog.

1. **action**: Navigate to the store homepage
2. **action**: Select a product category from the catalog navigation
3. **action**: Fill in the search field with a product keyword
4. **action**: Select a price sort option
5. **assertion**: Verify only matching products from the selected category are displayed
6. **assertion**: Verify the visible results follow the selected sort order

### Filter products by category
`40b60f93-0300-4359-9f4e-0396f24d6c42` · passed · High

Validates that selecting a category narrows the catalog to products from that category only.

1. **action**: Navigate to the store homepage
2. **action**: Select a product category from the catalog navigation
3. **assertion**: Verify only products from the selected category are displayed
4. **assertion**: Verify products from other categories are no longer shown

### Search the catalog by product name or description
`d13ab0c8-ae13-4217-b0c9-ad48d84b152f` · passed · High

Validates that search narrows the catalog using case-insensitive matching across product names and descriptions.

1. **action**: Navigate to the store homepage
2. **action**: Fill in the search field with a product keyword
3. **assertion**: Verify only matching products are displayed in the catalog
4. **assertion**: Verify non-matching products are hidden from the results

### Show empty state for unmatched search
`2070affc-7960-4337-a528-2b9744595131` · passed · Medium

Validates that the catalog shows the empty state when no products match the current search.

1. **action**: Navigate to the store homepage
2. **action**: Fill in the search field with a keyword that matches no products
3. **assertion**: Verify an empty state message is displayed
4. **assertion**: Verify no product cards are shown in the catalog grid

### Sort catalog by price high to low
`09832094-770d-4b51-b2e2-6263abdf090b` · passed · High

Validates that the price high to low sort orders the catalog from the most expensive product to the cheapest.

1. **action**: Navigate to the store homepage
2. **action**: Select the price high to low sort option
3. **assertion**: Verify the catalog products are ordered by descending price
4. **assertion**: Verify each product price is greater than or equal to the one after it

### Sort catalog by price low to high
`bd87077d-6209-47f8-aa87-fa8893a79ee3` · passed · High

Validates that the price low to high sort orders the catalog from the cheapest product to the most expensive.

1. **action**: Navigate to the store homepage
2. **action**: Select the price low to high sort option
3. **assertion**: Verify the catalog products are ordered by ascending price
4. **assertion**: Verify each product price is less than or equal to the one after it


## Delivery Details

### Approval is withdrawn after changing the delivery speed
`53ba5655-f97f-4127-9f24-b66147cdb9e9` · passed · Medium

Validate that switching delivery speed after approval withdraws approval for the exact basket.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: Open the cart and under 'Delivery speed' choose Express
10. **assertion**: Verify the cart drawer's Delivery line now shows '$14.99' and the Total reads '$333.99'
11. **assertion**: Verify the cart drawer shows an 'Approve this basket' button again instead of the 'Approved.' message
12. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
13. **assertion**: Verify the gate status pill no longer reads 'Checkout is open to the agent'
14. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'

### Approval is withdrawn after editing delivery details
`d02e460b-8807-4bd8-9dc3-3ea118bb4162` · passed · High

Validate that changing a completed delivery form after approval withdraws the basket approval state.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: Open the cart and change the City field from 'Lagos' to 'Abuja'
10. **assertion**: Verify the cart drawer no longer shows 'Approved. The agent has a checkout tool for this exact basket.' and shows an 'Approve this basket' button again
11. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
12. **assertion**: Verify the gate status pill no longer reads 'Checkout is open to the agent'
13. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'

### Complete delivery details with standard shipping
`1d95e89a-8906-44c1-a78c-90359f7ae358` · passed · High

Validate that a shopper can enter all required delivery details with standard shipping and reach the approved basket state.

1. **action**: Navigate to the store homepage
2. **action**: Add a product to the cart
3. **action**: Open the cart
4. **action**: Fill in the full name field with "Explore Test"
5. **action**: Fill in the email field with "explore-test@example.com"
6. **action**: Fill in the address field with "123 Test Street"
7. **action**: Fill in the city field with "Test City"
8. **action**: Fill in the postcode field with "10101"
9. **action**: Fill in the country field with "Nigeria"
10. **action**: Select standard delivery
11. **action**: Submit the basket approval
12. **assertion**: Verify the basket is approved for this exact cart
13. **assertion**: Verify the checkout gate indicates approval is open


## Ownership Rules

### Approval is withdrawn after adding an owned-category item
`0b1cd034-6ab9-4514-a1dd-31a252a2ad30` · passed · High

Validates that adding a product after approval removes checkout approval and returns the basket to not registered.

1. **action**: Navigate to the storefront home page
2. **action**: Add '34" Ultrawide 165Hz' ($319) to the cart with its Add to cart button
3. **action**: Open the cart with the header cart button and fill the delivery form: Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
4. **action**: Click 'Approve this basket' at the bottom of the cart drawer
5. **assertion**: Verify the cart drawer shows 'Approved. The agent has a checkout tool for this exact basket.'
6. **action**: Close the cart drawer by clicking the X button in its top-right corner, then confirm the drawer has slid away and the 'Your rules' bar is no longer dimmed before continuing
7. **assertion**: Verify the gate status pill in the 'Your rules' bar reads 'Checkout is open to the agent' and a 'Withdraw approval' button is shown
8. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'REGISTERED, the shopper approved this basket'
9. **action**: In the 'Your rules' bar under 'I already have', toggle Monitor on
10. **assertion**: Verify the rules bar shows 'You already have a monitor' and the gate status pill reads 'Rules not met, checkout withheld'
11. **assertion**: Verify the gate status pill no longer reads 'Checkout is open to the agent'
12. **assertion**: Verify the 'Agent tool surface' panel shows checkout as 'NOT REGISTERED, nothing for the agent to call'
13. **assertion**: Verify no 'Approve this basket' button is shown

### Block cart items from an owned category
`f5f96133-8c35-42d1-b898-00d8a5fa254e` · passed · High

Validates that marking a category as already owned prevents matching products from being approved in the cart.

1. **action**: Navigate to the storefront home page
2. **action**: In the 'Your rules' bar under 'I already have', toggle Chair on
3. **assertion**: Verify the rules summary reads 'You have a chair'
4. **action**: Add 'Ergonomic mesh, adjustable' ($388) to the cart with its Add to cart button
5. **assertion**: Verify the rules bar shows the violation 'You already have a chair' and the gate status pill reads 'Rules not met, checkout withheld'
6. **assertion**: Open the cart and verify it says 'Bring the cart inside your rules, then approve it.' and shows no 'Approve this basket' button

### Clear ownership violation by removing the owned-category item
`84dd5e9e-a035-457f-bd24-0fe7a344631e` · passed · High

Validates that removing the product from an owned category returns the cart to a rules-compliant state.

1. **action**: Navigate to the storefront home page
2. **action**: In the 'Your rules' bar under 'I already have', toggle Monitor on
3. **action**: Add 'Mechanical TKL, tactile' (a keyboard) and '34" Ultrawide 165Hz' (a monitor) to the cart
4. **assertion**: Verify the rules bar shows 'You already have a monitor' and the gate status reads 'Rules not met, checkout withheld'
5. **action**: Open the cart and remove the '34" Ultrawide 165Hz' line, leaving only the keyboard
6. **assertion**: Verify the red rule-violation message 'You already have a monitor' is gone and the gate status no longer reads 'Rules not met, checkout withheld', and that the cart still contains 'Mechanical TKL, tactile'. Note: the separate rules summary 'You have a monitor' is the shopper's own setting and is EXPECTED to remain, because Monitor is still toggled on
7. **action**: Fill the delivery form with Full name 'Ada Lovelace', Email 'ada@example.com', Address '12 Marconi Road', City 'Lagos', Postcode '101233', Country 'Nigeria'
8. **assertion**: Verify an 'Approve this basket' button is now shown (in the cart drawer or the rules bar)


## Quick View Product Details

### Add a product to the cart from quick view
`82b5d512-c5f7-4bc4-84e5-9eb7c0bf3626` · passed · High

Validate that a shopper can open quick view and add the product to the cart from the dialog.

1. **action**: Navigate to the store home page
2. **action**: Open quick view for a product from its image or name
3. **action**: Add the product to the cart from the quick view dialog
4. **assertion**: Verify the cart reflects the added product
5. **assertion**: Verify the quick view action updates to indicate the product is already in the cart

### Close quick view dialog
`2ad4a327-e4d2-4b64-bd1b-41e2fff86e3c` · passed · Medium

Validate that the quick view dialog can be closed after inspecting a product.

1. **action**: Navigate to the store home page
2. **action**: Open quick view for a product from its image or name
3. **action**: Close the quick view dialog
4. **assertion**: Verify the catalog view is shown again
5. **assertion**: Verify the quick view dialog is no longer displayed

### Open quick view from a product image
`d5cbd7ec-f6bb-4c9e-8b07-272e28e072e2` · passed · High

Validate that selecting a product image opens the quick view dialog with the product’s details and add-to-cart action.

1. **action**: Navigate to the store home page
2. **action**: Click the image for a product in the catalog
3. **assertion**: Verify a product quick view dialog is displayed
4. **assertion**: Verify the dialog shows the product name, price, description, and add-to-cart action

