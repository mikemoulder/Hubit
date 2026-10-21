# Hubit

**A storefront where an AI agent can fill your cart but cannot buy until you approve that exact basket. On every pull request, TestSprite's own AI agent tries to break that promise, and the merge waits until it cannot.**

[Live app](https://hubit-store.vercel.app) · [A red to green PR](https://github.com/MikeMoulder/Hubit/pull/2) · [Another, four tests red then green](https://github.com/MikeMoulder/Hubit/pull/3) · [Every run, every fix](docs/testsprite.md)

![The demo shopper has built a $1,185 desk setup, filled delivery, and tried to check out. The call log shows checkout refused, the checkout tool reads NOT REGISTERED, and the shopper waits for the human to approve.](assets/screenshots/gate-refused.png)

Built for **TestSprite Hackathon Season 4** on the TestSprite 3.0 web portal, the TestSprite GitHub App and the TestSprite CLI.

## The loop

1. **The spec lives in the repo.** TestSprite planned the suite from [`docs/PRD.md`](docs/PRD.md), and a feature PR changes it first.
2. **Red first.** That commit adds tests for behaviour that does not exist yet. Vercel builds a preview, the GitHub App fires on the deployment, and TestSprite runs all 41 tests against that PR's own URL. It fails, as intended.
3. **Fix from the failure bundle.** `testsprite test failure summary` gives the failing step, the DOM and what the agent saw. The next commit implements the feature.
4. **Green, then merge.** The run repeats on its own, and `main` requires the `TestSprite V3` check, so nothing merges red.

| PR | Red commit | Green commit |
|---|---|---|
| [#2](https://github.com/MikeMoulder/Hubit/pull/2) exact cents | 36/37: TestSprite saw "$15" and "over by $1" | all 37 passed |
| [#3](https://github.com/MikeMoulder/Hubit/pull/3) demo shopper | 37/41: exactly the 4 new tests failed | all 41 passed, first run |
| [#1](https://github.com/MikeMoulder/Hubit/pull/1) the PRD | 35/36 twice, flaky generated tests | all 36 passed |

## What the suite covers

41 tests: 36 curated from 54 TestSprite proposals, plus 5 we wrote as plan files through the CLI. The ones that matter attack the gate: approval must vanish when the cart, budget, owned items, address or delivery speed changes, and survive browsing. The demo shopper must be refused before approval, order only after it, and order nothing if approval is lost while it waits. [Full table](docs/testsprite.md#2-building-the-suite).

## What TestSprite caught

- **A money bug we specified.** Prices rounded to the dollar while the budget was checked in cents, so express ($14.99) showed as "$15" and a cart $0.99 over read "over by $1".
- **A bug we had not specified.** In the failure bundle for that test, TestSprite noted the rules bar reading "$1,056 of $1,071" with express selected. The bar metered goods while the gate counted delivery. Fixed in the same PR.
- **Seven flaky generated tests** that failed while the app was right: a skipped reload, carts left to chance, an empty cart expected to be approvable. Each was diagnosed from the step log and rewritten with `test plan put` ([details](docs/testsprite.md#5-generated-tests-we-had-to-fix)).

## The product

People let an agent research a purchase but rarely let one finish it, because "it can look but cannot buy" has only been a promise. In Hubit it is structural: `checkout` is not on the agent's tool surface until the cart is inside your rules, delivery is complete, and you approved this exact basket. Change the basket and the tool is withdrawn.

Hubit began at the WebMCP Challenge ([write-up](docs/webmcp.md)), where agents reach the page through Chrome's WebMCP API. Most browsers lack it, TestSprite's included, so no order could ever be placed there. For this hackathon we added a **demo shopper**: a scripted agent that calls the same registered tools through a new registry-only `host.call()`, so an unregistered `checkout` refuses it exactly as it refuses a real agent. The whole promise became testable end to end.

![After approval the shopper placed the order for $1,185; checkout is withdrawn again and get_order is registered.](assets/screenshots/order-placed.png)

## TestSprite in this repo

| Piece | Role | Where |
|---|---|---|
| Web portal project | Explored the live app from the PRD, generated and runs the suite | [docs/testsprite.md §1](docs/testsprite.md#1-the-wiring) |
| GitHub App, PR trigger | Runs on each Vercel preview deployment, comments, reports `TestSprite V3` | any [PR](https://github.com/MikeMoulder/Hubit/pulls?q=is%3Apr) |
| Merge gate + branch protection | A red run blocks the merge | `main` branch rules |
| CLI | Plan curation, our 5 plan-file tests, single runs, failure bundles, cancelling a hung run | [docs/testsprite.md §5, §6](docs/testsprite.md#5-generated-tests-we-had-to-fix) |
| PRD | The test source, versioned with the code | [docs/PRD.md](docs/PRD.md) |

## Run it

```bash
git clone https://github.com/MikeMoulder/Hubit && cd Hubit
npm install
npm run dev        # http://localhost:3000, no keys or env needed
```

Open the cart, approve a basket, or press **Run the demo shopper** in the right column.

## What is real, what is not

**Real:** every run linked above, the gate, the tool surface, the shopper's refusal. **Simulated:** the store; nothing ships and no card is charged. **Not a model:** the demo shopper follows a fixed script so tests can assert exact totals; a real agent needs Chrome with WebMCP ([how](docs/webmcp.md)).

## Limitations and next

**Built:** the suite, the PR loop, three merged PRs. **Next:** a stock limit and a shareable receipt, each red first; scheduled runs on production. **Known:** TestSprite runs occasionally hang in `running` (we cancel them), and its root-cause guesses blamed hosting for every test-design failure, so we trust its observations over its hypotheses.
