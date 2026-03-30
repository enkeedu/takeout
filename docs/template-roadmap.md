# Template Roadmap

Use `docs/template-benchmark-matrix.md` alongside this file so template decisions stay grounded in live diner ordering UIs, not just product marketing pages.

## Current Buyer-Facing Template Set

### `Local Order`
- Role: safest default for most launches
- Best for:
  - most Chinese takeout restaurants
  - search / directory / Google / Yelp traffic
  - owners who want the strongest broad-fit direct-order default
- Protect:
  - category-first browsing
  - clear search + cart behavior
  - fast path from listing to launch

### `Storefront`
- Role: brand-forward restaurant-site feel
- Best for:
  - restaurants that need a stronger first impression
  - social / map / link-in-bio traffic
  - owners who want more restaurant identity above the fold
- Protect:
  - stronger hero presence
  - fast picks / merchandising
  - quicker story-to-menu handoff

### `Express`
- Role: fast-pickup, app-like ordering feel
- Best for:
  - owners who want a tighter phone-first ordering experience
  - restaurants with strong pickup volume or lunch-rush traffic
  - guests who are likely to reorder from mobile
- Protect:
  - denser layout
  - stronger cart awareness
  - fastest menu handoff of the public set

## Operator Lanes

### `Feast`
- Role: reserve large-order lane
- Keep out of the standard owner-facing chooser.
- Use when:
  - the restaurant has strong party-tray, family-bundle, or office-lunch demand
  - we want to frame ordering around larger groups instead of standard a la carte browsing
  - we are intentionally recommending it instead of asking the owner to pick from more choices
- Protect:
  - tray and bundle-first framing
  - lead-time and service-rule clarity
  - planning-friendly guidance that still feels simple

## Chosen Template #4

### `Feast`
- Role: catering / party trays / office lunch / family-style large-order lane
- Why this is next:
  - the current template system already covers default, brand-first, and phone-first
  - none of those lanes are built around high-ticket multi-person orders
  - Chinese restaurants often have strong party-tray and family-bundle demand
  - this lane can increase order value instead of just adding another aesthetic variation
- Current status:
  - built as an operator lane on top of the shared `Local Order` ordering engine
  - deployable intentionally by the operator
  - hidden from the standard owner-facing chooser for now
  - deprioritized while the public 3-template set is the main focus

## Benchmark Basis For `Feast`

### Live Diner Ordering UIs
- Primary live benchmark used so far:
  - `Toast` large-order / tray-style flow: `https://order.toasttab.com/online/khaosan-thai-2062-curtner-avenue`
- Patterns worth adapting:
  - scheduled-order language
  - tray and platter categories in the main nav
  - larger-format cards that feel distinct from standard entrees
  - pickup timing and operational expectation-setting near the top

### Supporting Catering References
- `BentoBox Online Catering`
  - Reference: `https://www.getbento.com/products/preorder-catering/`
  - Patterns worth adapting:
    - catering-specific hero language
    - advance-order framing
    - lead times / cutoffs / operational controls
    - high-value order workflow
    - easier checkout for large orders
- `Toast Catering & Events`
  - Reference: `https://pos.toasttab.com/products/catering-and-events`
  - Patterns worth adapting:
    - custom lead times and order minimums
    - catering-specific online ordering
    - event / order detail collection
    - prep sheets, pack flow, and operations-first thinking
    - a clearer large-order management story

## What `Feast` Should Feel Like
- more planning-friendly than `Express`
- more bundle- and tray-focused than `Local Order`
- more operationally specific than `Storefront`

It should feel like:
- "build a larger order confidently"
- "pick trays, bundles, and family packs quickly"
- "know the lead time, minimums, and service rules up front"

It should not feel like:
- another standard takeout menu shell
- another pure brand/hero template
- another small-order fast-casual template

## Shell Requirements For `Feast`
- compact hero that immediately frames:
  - party trays
  - office lunch
  - family bundles
  - advance ordering
- utility strip for:
  - lead time
  - minimum order
  - pickup / delivery radius
  - serving guidance
- above-menu modules should prioritize:
  - featured tray packages
  - family meal bundles
  - event / group-order proof
  - quick reorder into larger formats

## Shared Engine Rules
- still build on the shared `Local Order` ordering chassis
- no separate checkout engine
- no separate cart engine
- template differences should mostly live in:
  - shell structure
  - merchandising blocks
  - package / tray presentation
  - large-order guidance

## Likely Shared-Engine Enhancements Needed During `Feast`
- clearer serving-size labels
- lead-time messaging for big orders
- bundle / tray cards that can route into menu groups
- optional notes for event timing / pickup instructions
- only if clearly helpful: larger-format quantity helpers

## What To Avoid
- do not treat `Feast` as just another visual skin
- do not overlap it with `Storefront`
- do not make it a premium/editorial concept unless benchmarks show that is the stronger business gap
- do not add it to the buyer-facing set until the lane clearly earns that promotion

## Recommended Next Build Sequence
1. Keep `Local Order`, `Storefront`, and `Express` as the public template set.
2. Keep `Feast` in reserve unless a real restaurant fit or clear conversion reason brings it back into focus.
3. Use live diner ordering benchmarks to keep improving `Local Order`, `Storefront`, and `Express`.
4. Add only shared engine improvements that clearly help the public 3-template set.
5. Revisit `Feast` later only if large-order demand becomes a real priority.
