# How Hubit is verified by TestSprite

Everything here happened on 21 Oct 2026 between 08:05 and 13:20 UTC, in this repo and one TestSprite 3.0 project. Every result below links to the commit it ran on. The TestSprite dashboard links need access to our TestSprite workspace (sharing is by workspace invite). The same results are public on each pull request, in TestSprite's comment and its `TestSprite V3` check.

## 1. The wiring

| Piece | Setting | Why |
|---|---|---|
| TestSprite project | Frontend UI project `hubit`, environment `default` = https://hubit-store.vercel.app, no sign-in | Hubit has no accounts; every flow works for an anonymous visitor |
| Test source | [`docs/PRD.md`](PRD.md), uploaded at project creation and kept in the repo | The PRD is what TestSprite plans from, so it changes in the same PR as the behaviour it describes |
| GitHub App | Installed on `MikeMoulder/Hubit`, Pull Request trigger | Every PR is tested, not just `main` |
| Trigger event | `Preview` (the GitHub deployment Vercel creates for each PR) | Fires once the preview exists. Vercel's commit status fires twice, once while still building |
| Target URL | `https://hubit-git-{branch-slug}-mikes-projects-7ac9bd1b.vercel.app` | Vercel's branch alias, so each PR is tested against its own build, never production |
| Merge gate | On: results are reported as the `TestSprite V3` status check | A failing run marks the PR red |
| Branch protection | `main` requires `TestSprite V3` to pass | GitHub refuses the merge until it is green |
| Vercel Deployment Protection | Off for previews | With it on, the preview answers with Vercel's login page and TestSprite tests that instead |
| CLI | `@testsprite/testsprite-cli` 0.15.0 with an API key | Plan edits, single-test runs and failure bundles from the terminal, alongside the portal |

## 2. Building the suite

1. **Exploration.** The portal's agent explored the live app with the PRD as its source and mapped its features, among them "approval gate and agent checkout registration".
2. **Plan.** `testsprite test plan generate` staged **54** proposals (2 credits).
3. **Curation.** About a third were duplicates: "approval is withdrawn after a delivery edit" appeared four times (#25, #36, #43, #50 in the generated table). Every PR run replays the whole suite at 0.5 credits a test, so each duplicate is paid for on every push. We accepted **36**, one per distinct scenario, with `test plan accept --only <ids>`.
4. **Baseline.** `test run --all` against production: **34/36**. Both failures were flaws in generated tests, not the app (section 5).
5. **Our own tests.** We wrote more as plan files and created them with `test create --plan-from`: exact cents, four demo-shopper tests, the first screen, and a rebuilt empty-cart test. That makes **42**: 35 curated plus 7 ours.
6. **Deeper plans.** A hostile review of our own suite counted 84 assertion steps across 41 tests, nine of them checking a single thing, several of those gate tests. We rewrote 14 plans so each asserts the state before and after the change in the app's exact words (gate pill, `checkout` REGISTERED or NOT REGISTERED, the Approve button, totals to the cent) and ends on the strongest check, because the step log records the final one. The suite now has **134** assertion steps. All 14 passed against production before any PR used them.

| Category | Tests | Examples |
|---|---:|---|
| Budget rule enforcement | 12 | over budget blocks approval; express pushes a cart over; raising the budget clears it |
| Catalog browsing | 7 | category, search, both price sorts, combined filters, empty search |
| Cart management | 5 | add, repeat add, steppers, remove, empty state |
| Ours: demo shopper, cents, first screen | 6 | refused at the gate; orders only after approval; cannot order after approval is lost; stop; $14.99 not $15; the first screen explains and starts the shopper |
| Approval gate | 3 | approve a valid basket; Prioritise never withdraws approval; an empty cart cannot be approved (rebuilt by us) |
| Delivery details | 3 | approval withdrawn by an address edit or a speed change |
| Ownership rules | 3 | "I already have" blocks a matching item; clearing it restores approval |
| Quick view | 3 | open from image and from name; add from the dialog |

## 3. The red-first pull requests

Each feature PR starts with a commit that changes only the PRD and adds the tests for the new behaviour. TestSprite runs and goes red, because the behaviour is not there yet. The next commit implements it from the failure bundle, and the check goes green.

| PR | Commit | What it contained | TestSprite |
|---|---|---|---|
| [#1 PRD](https://github.com/MikeMoulder/Hubit/pull/1) | `73e3d15` | the PRD | could not start: the project had no tests yet |
| | `9bde33d` | empty, re-trigger | could not start (same) |
| | `413e3e3` | re-trigger after the suite existed | [35/36](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/db331dcb-58b5-4173-86eb-ab4c80151843): a generated test let the agent pick any cart |
| | `736c12f` | re-trigger after pinning four budget tests | [35/36](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/c1ee571c-bfe5-447e-bbd2-31601277c845): the agent skipped a page reload |
| | `fadcad8` | re-trigger after making the reload explicit | [**all 36 passed**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/92d1caef-45a1-4ba0-bd52-50b95e58e626) |
| [#2 exact cents](https://github.com/MikeMoulder/Hubit/pull/2) | `0c0c9bc` | PRD journey 10 + test "Express delivery is shown and budgeted to the exact cent" | [**36/37, red as intended**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/5ae8fc17-747f-48c2-86c2-f3facb510753): it saw "$15" and "over by $1" |
| | `a6b8547` | the fix | [35/36](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/4e6aa0e7-6c51-49ff-ba7c-27932ed95cb3): the cents test passed; one hung run, one misread test (section 6) |
| | `b670f3d` | re-trigger after clarifying that test | [**all 37 passed**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/41fa8e6b-b3c4-43f0-bed1-1df82389cae5) |
| [#3 demo shopper](https://github.com/MikeMoulder/Hubit/pull/3) | `468a926` | PRD F9 + four demo-shopper tests | [**37/41, red as intended**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/0110035e-03d7-462b-ba94-7330dc33822b): exactly the four new tests failed |
| | `fa5aca4` | the feature | [**all 41 passed**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/840dd35c-a81f-462e-8537-8d067676a102) on the first run |

| [#4 README](https://github.com/MikeMoulder/Hubit/pull/4) | `e42bd55` | this documentation | [all 41 passed](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/c26d99ba-43db-4da1-9d66-5ba0ff2d104b): docs-only PRs are held too |
| [#5 first screen](https://github.com/MikeMoulder/Hubit/pull/5) | `708d1dc` | PRD F10 + first-screen test + empty-cart wording | [**39/42, red as intended**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/36a6ece3-ef56-4745-8693-56f1947b670a): the 2 new checks failed; 1 blocked (the agent missed the drawer's close button) |
| | `0791b86` | the feature | [41/42](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/f31135d5-b185-4198-bdbe-daef2bca6570): both new checks passed; the reload test's agent skipped the reload again |
| | `9fdf63d` | re-trigger after the reload test loads `/?reload=1` | [**all 42 passed**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/29981950-34fb-4e59-b4e4-d48149772df4) |
| [#6 docs](https://github.com/MikeMoulder/Hubit/pull/6) | `1447f73` | this ledger, deeper plans | [41/42, 1 blocked](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/8254e449-8cc1-4033-be7d-ed974738bac0): the replay lost two form fills (section 6) |
| | `f4e24fe` | empty rerun, no change | [**all 42 passed**](https://www.testsprite.com/dashboard-v3/o/246d5e7a-a6f9-5509-a518-effce4212ccf/projects/2b4a992f-4b37-4f77-ad75-8e74ca05c358/execution/0d80db65-aaf9-482b-8946-4202d1cddc82) |

Each PR was squash-merged once its check was green, so `main` reads as three commits while every red and green run stays on the PR page.

## 4. Bugs TestSprite found in the app

- **Money was rounded to the dollar.** The budget was checked in cents, but `money()` showed express ($14.99) as "$15". A cart $0.99 over budget read "over by $1", and the agent's own tool text could read "Total: $1,200 of $1,200" while over. We wrote the requirement first and TestSprite failed on it, as the PR intended.
- **The rules bar metered goods, not the order.** We had not specified this one. In the failure bundle for the cents test, TestSprite's observations included "the rules bar displayed $1,056 of $1,071" with express selected, while the gate counts delivery. The bar could say "$1,056 of $1,070, over by $1". The fix commit in #2 makes the bar meter the order total ([`src/components/RulesBar.tsx`](../src/components/RulesBar.tsx)).

## 5. Generated tests we had to fix

Each of these failed while the app was correct. We read the step log and the failure bundle (`test failure summary <id>`, `test steps <id>`), confirmed the app's behaviour in the code, and rewrote the plan with `test plan put`.

| Test | What went wrong | Fix |
|---|---|---|
| Reload resets budget, cart and approval | The recorded steps had no reload at all: approve, then assert the cart is empty | First, "navigate to the same URL again". That held for three runs, then the agent skipped it on PR #5, treating it as a no-op. Now it loads `/?reload=1`, a different URL that forces a full load: two passes on the preview with both navigations recorded |
| Clear ownership violation by removing the item | Only one monitor in the cart; removing it left an empty cart, which can never be approved | A keyboard stays in the cart |
| Delivery express fee counts toward budget | "Add items so the cart is near budget" let the agent pick $1,056, and $1,056 + express never reaches $1,200 | Fixed cart, budget set to 1065 |
| Removing an item restores budget compliance | "Remove one item" from an arbitrary over-budget cart is not always enough | The PRD's $1,205 cart; remove the $149 keyboard |
| Budget overage blocks approval | "Set the budget below the cart total" with an empty cart | One $319 monitor, budget 300 |
| Budget increase clears overage | Arbitrary cart | The $1,205 cart, budget 1300 |
| Approval is withdrawn after adding an owned item (PR #5, blocked) | The run video's last frame shows the cart drawer still open: the agent's close click missed, so its click on the Monitor toggle hit the overlay. The drawer's close button works (checked by hand) | Every plan now says to close the drawer with the X in its top-right corner and confirm it has gone |
| Clear ownership violation (again, on PR #2) | The agent read the rules summary "You have a monitor" (the shopper's own setting, correctly still on) as the violation "You already have a monitor" | The step names the violation exactly and says the summary is expected to remain |

What generalised: **a generated plan that leaves a quantity to the agent is a coin toss.** Every test that touches a total now names its products and its budget.

## 6. TestSprite issues we hit

- **A run that never finished.** On `a6b8547`, "Sort catalog by price low to high" passed all 4 steps but stayed `running` for over an hour, so the GitHub status sat on "37 tests queued". `testsprite test cancel <run-id>` released it (0.5 credits refunded), and the check then reported the real result.
- **Diagnoses that blame hosting.** For every test-design failure in section 5, the failure bundle's root-cause hypothesis pointed at hosting, caching, localStorage or a stale build. Hubit keeps state in memory only. The observations in the bundle were accurate every time. The hypothesis was the part to distrust.
- **The first PR runs "could not start".** A PR run replays the existing suite, so a project with no tests yet fails before it starts. The GitHub integration docs say this. The status message does not.
- **Vercel Deployment Protection.** With it on, previews answer with Vercel's SSO page. TestSprite would test that page and charge for it (also reported upstream as testsprite-cli #620).

- **Exported code keeps only the final assertion.** A plan with seven assertion steps exports as Python with one or two `expect` calls; the AI judge evaluates the plan during the run, but the Code tab shows little of it. We order plans so the strongest check is last.
- **Hand-written code is never retargeted.** `test code put` stores code that is replayed verbatim ("code you wrote yourself is never re-authored"), which sounded like the way to deep, deterministic assertions. We probed it first: code that navigated to production and asserted it had landed on the PR preview failed with `origin not retargeted: https://hubit-store.vercel.app/`, and the replay process receives only the code, a deadline and a video directory. Only agent-authored code follows the PR's target URL, so hand-written tests would silently check production on every PR. We kept the suite agent-authored and made the plans deep instead.

- **A replay that lost input.** On PR #6, "Invalid email keeps delivery form incomplete" was blocked: the step log records six delivery fills as passed within 300 ms, but the run video shows Postcode and Country still empty, so Approve never appeared. The same fill sequence in headless Chrome against the same build kept every value in 5 runs out of 5. A rerun passed.

## 7. Reproduce

```bash
npm i -g @testsprite/testsprite-cli
testsprite setup --api-key <key> --no-agent
testsprite test list --project 2b4a992f-4b37-4f77-ad75-8e74ca05c358
testsprite test run <test-id> --wait --target-url https://hubit-store.vercel.app
testsprite test failure summary <test-id>
```

Credits: 545.5 at the start, 277 after five PRs, the plan rewrites and their validation runs. A full PR run of 42 tests costs about 21.
