# Codex Handoff

Last updated: 2026-03-23

## Current Local Runtime
- Web: `http://localhost:3001`
- API: `http://localhost:8001`
- If ports differ in a future session, trust the current running environment after checking it first.
- If the homepage or claim routes suddenly return 500s, check whether the API is still running on `8001`; this session needed an API restart before browser validation worked again.

## Current Product Position
The product is now much closer to a real concierge service than a prototype.

It is strong at:
- discovery
- preview
- claim initiation
- deposit/payment handoff
- launch tracking
- owner review
- live handoff toolkit

It is still weak at:
- real owner phone verification
- diner payment path clarity
- recurring monthly billing
- production deployment / true go-live readiness

## What Is Working
- Owner-first homepage, search, state, and city flows
- Preview-first claim flow
- Improved Local Order template
- Setup deposit flow with Stripe sandbox
- Private launch-status page
- Kickoff handoff flow
- Owner setup intake after deposit
- Owner review: approve or request changes
- Live launch toolkit with live link, QR, and update checklist
- Admin readiness panel and launch queue
- Terms, privacy, and refund-policy pages

## Most Recent Product Changes
- Paid launch-state polish:
  - clearer post-payment story
  - support-first CTA hierarchy
  - preview de-emphasized after payment
  - setup-intake saved state reads correctly
- Public onboarding clarity pass:
  - what we need from the owner
  - what happens to the current website
  - managed live URL first
  - monthly billing starts only after launch
  - compact FAQ section
- Claim-page fallback clarity pass:
  - clearer verification fallback
  - stronger post-verification expectations
- Template system reset:
  - `Local Order` is now the production base template
  - new buyer-facing `Storefront` variant added on top of the shared Local Order ordering engine
  - `ming`, `ming-slim`, `ming-balanced`, and `ming-full` are archived from buyer-facing flows but still render through direct preview links
  - claim flow now respects valid template query links and normalizes stale `ming-*` links back to `local-order`
- Ordering feedback polish pass on the shared `Local Order` engine:
  - menu search added directly into the sticky ordering rail
  - configurable items now show clearer price and `Required options` / `Optional add-ons` cues before click
  - cart lines now have an explicit `Remove` action instead of relying only on decrement-to-zero
  - removed items now get an `Undo` prompt so the order feels safer
  - customization modal now shows stronger required-group progress and selected-state feedback
  - the same interaction improvements apply anywhere the shared board is used
- Ordering polish round 2:
  - removed the fake `Lunch Specials` fallback so the menu is no longer padded with duplicate dishes just to create another section
  - `Most Popular` is now a smaller curated set with better category variety instead of a long noisy duplicate strip
  - sticky header now surfaces a compact live cart pill on larger screens so item count + subtotal stay visible while browsing
- Shared cart-edit pass on the Local Order ordering engine:
  - customizable cart lines can now be reopened directly from the cart with an `Edit` action
  - the existing customization modal now prefills from the current cart line instead of forcing a remove-and-readd flow
  - edited lines can update quantity, modifiers, and special instructions in place
  - if an edited line matches another existing signature, the cart merges them cleanly instead of duplicating
- `Storefront` benchmark polish pass:
  - tightened the top shell so the page gets into ordering faster without losing the branded restaurant feel
  - shortened the hero copy and repositioned it around direct ordering, quick favorites, and menu handoff instead of broader explanation
  - replaced the larger `Order Direct Today` treatment with a more compact `Storefront Snapshot` block inspired by Square-style simplicity
  - converted the old neighborhood/about area into a denser `Why Locals Order Here` trust block with shorter direct-order reasons, local proof, and same-day specials
  - retuned the best-sellers section into a smaller `Fast Picks` strip with stronger `Start Order` CTAs
  - removed the extra standalone specials band because it was adding height without improving the order path
- `Express` operator-lane pass:
  - built a mobile-first `TemplateLocalExpress` shell with a tighter hero, fast-picks merchandising, and lighter proof layer
  - added an `Express` presentation mode to `LocalOrderBoard` for denser sticky rail, tighter card rhythm, and brighter app-like ordering visuals without changing shared cart/customization logic
  - kept `Express` as an operator-recommended lane instead of a standard owner-facing chooser
  - direct `local-express` preview still works, and claim links using `local-express` normalize back to `local-order`
- Template positioning audit pass:
  - created shared template positioning metadata so `Local Order`, `Storefront`, and `Express` use one consistent role definition across homepage, listing preview, and claim surfaces
  - clarified `Local Order` as the safest broad-fit launch default, `Storefront` as the brand-forward restaurant-site option, and `Express` as the phone-first fast-pickup option
- Template benchmark matrix pass:
  - added `docs/template-benchmark-matrix.md` to separate owner-facing benchmark pages from live diner-facing ordering UI references
  - template work should now default to real ordering flows first, then use owner-facing product pages as support
  - updated context/master-prompt wording away from "copy" toward adapting proven patterns into our own system
- Public template simplification pass:
  - reduced the standard owner-facing template set back to `Local Order` and `Storefront`
  - at that stage, homepage showroom and claim flow presented only the two clearest owner-facing options
- Public `Express` restore pass:
  - promoted `Express` back into the standard owner-facing template set
  - homepage showroom now presents `Local Order`, `Storefront`, and `Express`
  - preview and claim copy now explain `Express` as the faster, more app-like phone-first option instead of an internal lane
  - claim flow now accepts `template=local-express` again
  - `Feast` remains the specialized operator lane and still normalizes back to `local-order` in claim links
  - validated with web build, API schema compile, homepage showroom check, direct `local-express` preview check, direct `local-feast` preview check, `template=local-express` claim check, and `template=local-feast` claim normalization check
- `Feast` deprioritization pass:
  - decided not to make `Feast` the active next template focus
  - keeping it in reserve is cleaner than building product strategy around a specialized large-order lane right now
  - active public template set remains `Local Order`, `Storefront`, and `Express`
  - future template work should focus on improving those three with live diner-ordering benchmarks before revisiting `Feast`
- `Feast` operator-lane build:
  - added `local-feast` as a runtime and deployable operator template on top of the shared `Local Order` ordering engine
  - built a new `TemplateLocalFeast` shell for party trays, family bundles, office lunch, and large-order planning
  - added a warmer large-order theme, `Large-order cart` copy, tray-friendly notes guidance, and matching suggestion/callout styling in the shared ordering board
  - direct preview now supports `local-feast`, and the preview panel treats it as an operator-recommended lane instead of a public owner-facing choice
  - fixed operator-lane save-default behavior so deployable operator templates are no longer blocked just because they are not in the buyer-facing chooser
  - at that stage, homepage showroom still showed only `Local Order` and `Storefront`
  - claim links using `local-feast` now normalize back to `local-order`
  - validated with web build, API schema compile, direct `local-feast` preview on desktop and mobile, homepage check, and claim-link normalization check
- Shared diner-ordering benchmark pass on the main 3 templates:
  - used live diner-facing ordering references, especially Toast and `order.online`, to compare our real menu/cart flow against stronger production patterns
  - identified that live leaders surface fulfillment mode and timing much earlier than we did
  - updated the shared `LocalOrderBoard` so `Local Order`, `Storefront`, and `Express` now show pickup/delivery choice and ETA in the sticky ordering rail before guests interact with the cart
  - the desktop sticky action now helps guests start the order even before any items are in the cart, instead of hiding that action until later
  - the mobile floating cart now reflects the active fulfillment timing, so the order state feels more like a real diner-facing app once items are added
  - validated with web build plus desktop/mobile browser checks on `Local Order`, `Storefront`, and `Express`
- Shared menu-density pass on the main 3 templates:
  - used Toast-style diner-ordering density as the benchmark for how quickly guests can scan categories and dishes
  - tightened the shared board for `Local Order` and `Storefront` with smaller sticky spacing, denser category pills, slimmer section headers, and more compact item cards
  - kept `Express` as the most compact phone-first option instead of flattening all three templates into the same presentation
  - validated with web build, live browser checks on `Local Order` and `Storefront`, and browser console check with no current errors
- Shared cart-hierarchy pass on the main 3 templates:
  - used live diner-ordering cart behavior as the benchmark for keeping checkout primary and upsells secondary once an item is in the cart
  - moved the shared cart flow so subtotal + checkout sit ahead of add-on suggestions instead of being pushed below them
  - added a clearer `Ready to check out?` summary block inside the shared cart for `Local Order`, `Storefront`, and `Express`
  - once checkout details open, optional add-on merchandising now gets out of the way so the handoff into finishing the order feels cleaner
  - validated with web build, live add-to-cart + checkout checks on `Local Order` and `Express`, and browser console check with no current errors
- Shared post-add merchandising pass on the main 3 templates:
  - used live diner-facing post-add recommendation patterns from Toast and `order.online` to keep add-on suggestions lightweight, proof-led, and quick to trust
  - upgraded the shared suggestion cards with dish thumbnails, compact reason chips like `Pairs well next` or `House favorite`, and clearer category context
  - changed the non-Feast suggestion framing from generic extras to `Quick add-ons local diners often pick next`
  - updated quick-add language so simple items now use `Quick Add` while configurable dishes still point guests into customization
  - validated with web build, live add-to-cart browser checks on `Local Order` and `Express`, and browser console check with no current errors
- Shared customizer clarity pass on the main 3 templates:
  - used live diner-facing item customization flows from Toast and `order.online` as the benchmark for required-option clarity, rule labels, and save-state feedback
  - fixed required single-select groups so clicking the already-selected option no longer clears the choice and creates an avoidable dead-end
  - added faster-scanning modifier chips like `Select 1` and `Ready`, plus a clearer running total in the ordering summary card
  - the shared add/update button now reflects incomplete required state before click instead of waiting to show an avoidable error after submit
  - validated with web build, live customizer checks on desktop and mobile, and browser console check with no current errors
- Shared cart-line edit polish pass on the main 3 templates:
  - used the live `order.online` cart as the benchmark for making edit feel like part of the cart line instead of a tiny secondary text action
  - changed editable cart lines so the line details themselves now reopen the customizer, while remove and quantity controls stay separate and obvious
  - added clearer line totals in the cart, plus a small `Tap details to edit` cue so editing customized items is easier to discover
  - kept the underlying shared cart/edit engine intact, so `Local Order`, `Storefront`, and `Express` all inherit the improved line-edit affordance
  - validated with web build, live add/edit/update checks in the local cart on desktop and mobile, and browser console check with no current errors
- Shared checkout clarity pass on the main 3 templates:
  - used the live `order.online` checkout handoff as the benchmark for keeping the last step lightweight while still making fulfillment context and total obvious
  - added a shared checkout summary strip showing fulfillment mode, ETA, item count, and total before the contact fields
  - replaced the bare placeholder-only form with labeled `Name`, `Phone`, and `Notes` fields plus a short helper note explaining why contact details can help
  - updated the final CTA so it includes the order total and feels more explicit at the final submit step
  - validated with web build, live checkout checks on `Local Order` in desktop and mobile view, and browser console check with no current errors
- Benchmark playbook pass:
  - added `docs/benchmark-playbook.md` as the project-wide research stack for homepage, search, claim, templates, checkout, and launch work
  - narrowed the benchmark set to exact official pages and live end-user flows that are actually worth inspecting before changes
  - updated the template benchmark matrix to use stronger exact links for `Square`, `DoorDash Commerce`, `Toast`, `Yelp`, and Google verification references
  - updated project context so future sessions know to use the broader playbook for overall product decisions and the template matrix for template-specific decisions
- Full-product audit pass:
  - re-checked the local homepage, search, claim, template preview, and admin routes against the current benchmark stack instead of assuming templates were still the main bottleneck
  - confirmed the public 3-template set is strong enough for now relative to live Toast and `order.online` ordering references
  - confirmed the owner-facing funnel is much more coherent than earlier sessions, especially on homepage, search, and claim
  - identified operational readiness as the current highest-leverage focus because `/admin` shows Stripe ready but owner email delivery and internal claim alerts still missing
  - next work should prioritize SMTP and end-to-end owner communication before another major template pass
- SMTP readiness/admin diagnostics pass:
  - upgraded `/admin` so the readiness panel reflects the actual email prerequisites more truthfully instead of treating SMTP auth as always required
  - added granular readiness states for SMTP transport, sender identity, launch-link base URL, and the internal claim-alert inbox
  - added a real admin SMTP test endpoint and a matching web proxy route so the operator can verify delivery from the current API environment
  - fixed the admin test-email API route to convert `ClaimServiceError` into clean HTTP responses, so missing SMTP config now returns actionable 400-level details instead of a generic 500
  - tightened the admin UI so the SMTP test button is disabled until obvious prerequisites are present, with inline guidance like `SMTP test is unavailable until SMTP_HOST and SMTP_PORT are set.`
  - validated with API compile, web build, direct API and web-proxy checks, plus a live browser check on `/admin`
- Local Gmail SMTP setup pass:
  - populated the root `.env` with a real Gmail sender, alert inbox, SMTP host/port, and launch-link base URL
  - normalized Gmail-style app passwords in API config so pasted values with display spaces still authenticate correctly
  - restarted the API against the updated env and verified both the direct API test-email endpoint and the `/admin` browser flow
  - successful local result: `/admin` now shows `Owner Email Delivery: Ready`, the SMTP test button is enabled, and the UI reports `SMTP test email sent to foodservice424@gmail.com.`
- Real product email verification pass:
  - ran a full mock-verification claim submission against the live local API for `China Buffet II` using the Gmail inbox as both the internal alert inbox and owner email
  - verified the two expected inbox subjects arrived via Gmail IMAP:
    - `[Takeout] New claim request - China Buffet II (Miami, FL)`
    - `Your launch link is ready`
  - ran a second owner-notification check through the real manual-review + admin-approval flow for `A&W Seafood Restaurant`
  - verified those two expected inbox subjects also arrived:
    - `Your claim is in review`
    - `Ownership approved - setup deposit unlocked`
  - conclusion: internal claim alerts and owner-facing launch emails are both working end to end in the current local Gmail-backed environment
- Full-product checkpoint pass:
  - re-checked the live local homepage, search, claim, launch, and admin routes against `Owner`, `Yelp`, live `Toast`, and live `order.online`
  - confirmed the current public template set is strong enough for now and no longer the main bottleneck
  - identified the next real blockers as live owner-phone verification, real restaurant-side diner-order handoff, diner payment-path clarity, recurring billing, and production readiness
  - updated the project memory so future sessions do not default back to more template polishing before those operational gaps are addressed

## Product Decisions Already Made
- Keep the current visual style.
- Use benchmark leaders for process and UI structure, not branding.
- Managed live URL first.
- Concierge / done-for-you service model first.
- Monthly billing starts only after launch.
- `Local Order` is the main production ordering chassis.
- Future buyer-facing templates should fork from `Local Order`, not from Ming.
- `Storefront` is the first Local-Order-derived buyer-facing variant.
- Public template positioning is now intentionally split:
  - `Local Order` = safest default for most launches
  - `Storefront` = brand-forward restaurant-site feel
- `Express` = fast pickup / fast-casual / tighter phone-first rhythm
- Operator lane:
  - `Feast` = party trays / office lunch / family-style large-order lane

## Current Gaps
- Claim verification still runs in `mock` SMS mode locally; Twilio Verify is coded but not configured or validated end to end.
- Diner ordering still only saves orders in the database; there is no restaurant-side notification or fulfillment handoff yet, and the current order path still uses `tax_cents=0` and `fees_cents=0`.
- Recurring monthly billing is not automated yet.
- Production hosting / production env setup is not finished.
- Real production domain / go-live stack is not finished.
- `Feast` is built, but intentionally deprioritized while the main 3-template set stays the product focus.
- Public default fallback for restaurants already saved to Ming is implemented in code, but was not fully exercised against a real saved-Ming restaurant record during this pass.
- SMTP and product-triggered emails now work in the local environment; the next readiness gap is moving the remaining money/production paths from “works locally” to “ready for real customers.”

## Best Next Steps
1. Turn on real Twilio verification and validate the owner claim flow end to end.
2. Make diner orders operational with a real restaurant-side notification / handoff path.
3. Clarify the diner ordering payment path versus the owner Stripe deposit path before deeper checkout work.
4. Automate recurring monthly billing after launch.
5. Production env / hosting / domain readiness.
6. Tighten the admin/operator playbook for launch actions now that email delivery is real.
7. Only return to deeper template work if a new benchmark pass shows a clear sellability gap.

## If The Next Task Is Product UX
Keep the benchmark formula:
- Owner for onboarding clarity
- Google/Yelp for claim and verification logic
- Square for launch/live handoff
- Toast/Bento for post-launch product depth

If the next task is templates:
- start from `Local Order`
- compare against live diner-facing ordering UIs first
- use DoorDash branded sites, Toast ordering flows, Square storefront simplicity, and Bento/Owner only where they match the task
- keep Ming archived unless a direct style-lab preview is intentionally needed

## Routes To Check Early In A Session
- `/`
- `/search?q=3052663322`
- `/fl/miami`
- `/claim?state=fl&city=miami&slug=china-buffet-ii&template=local-order`
- one paid launch page
- one live launch page
- `/admin`
- one direct template preview for the lane you are working on

## Reminder For The Next Codex Session
Start by reading:
- `docs/codex-project-context.md`
- `docs/codex-handoff.md`

Then:
- inspect local routes with MCP/browser tools
- inspect only the relevant benchmark pages for the current task
- continue from the next best step instead of asking for broad re-explanation
