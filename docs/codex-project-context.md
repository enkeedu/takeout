# Codex Project Context

## Why This File Exists
New Codex sessions do not remember old chat history.

This file is the stable project memory:
- what the product is
- how the user wants Codex to work
- which benchmark companies to study
- what should and should not change

The session-specific state lives in `docs/codex-handoff.md`.

## Product Summary
`takeout` is a Chinese restaurant owner-conversion product.

It is not just a directory. It is a concierge-style owner funnel:
- find listing
- preview generated website
- claim ownership
- pay setup deposit
- kickoff/build/review
- launch direct-order website

## Core Product Model
This is currently a done-for-you service, not a self-serve website builder.

That means:
- the owner should feel guided
- the product should explain what happens next clearly
- Codex should optimize for trust, clarity, and conversion
- the owner does not need a giant dashboard to get value

## Non-Negotiables
- Keep the existing visual style unless something is clearly broken.
- Do not redesign the brand just to mimic competitors.
- Adapt competitor structure, hierarchy, trust patterns, and flow logic more than their branding.
- Preserve flows that are already working unless they are clearly wrong.
- Use browser/MCP tools to inspect the live local site before and after meaningful changes.
- Validate desktop and mobile when UI changes matter.

## User Preferences
- The user prefers Codex to drive the work and make reasonable assumptions.
- The user does not want to micromanage implementation details.
- The user wants Codex to use MCP/browser tools often so work stays grounded in the actual UI.
- The user likes the current site's vibe and wants benchmark influence without losing the product's own look.
- The user is less comfortable with external ops setup, so Codex should break outside-Codex tasks into very small steps.

## Benchmark Operating Model
Use current official sites as the process reference, especially for multi-screen product changes.

### `Owner.com`
Use for:
- sales framing
- onboarding expectations
- done-for-you setup language
- what-happens-next clarity
- public explanation of what the owner must provide

### `Yelp for Business`
Use for:
- ultra-simple claim/search first step
- low-friction entry into the funnel

### `Google Business Profile`
Use for:
- ownership-state clarity
- verification fallback logic
- approved / denied / no-response language
- expectation-setting around verification

### `Square`
Use for:
- activation simplicity
- post-claim handoff
- live-link / QR / share patterns
- practical post-launch owner actions

### `Toast`
Use for:
- direct-ordering product depth
- guest ownership story
- upsells / loyalty / commission-free framing

### `BentoBox`
Use for:
- checkout monetization ideas
- mobile-first ordering
- repeat-order / diner follow-up ideas

## Benchmark Research Rule
Before major product changes:
1. inspect the relevant local routes with MCP/browser tools
2. inspect only the relevant benchmark sites/pages with MCP/browser tools
3. compare structure and messaging
4. adapt the strongest patterns into the current visual system

Do not rely only on memory for benchmark pages when the exact pattern matters.

Important split:
- for owner-facing funnel work, benchmark owner-facing product pages
- for template and ordering UX work, benchmark live diner-facing ordering UIs first

See:
- `docs/benchmark-playbook.md` for the full project benchmark stack by route and task
- `docs/template-benchmark-matrix.md` for the template-specific benchmark mapping

## Current Quality Bar
- Homepage, search, state, city, and restaurant pages should feel owner-first.
- Claim should remain preview-first.
- Launch flow should feel like a real concierge service, not a dead-end form.
- Local Order is the strongest template and current quality bar.
- Copy should reduce owner anxiety and remove ambiguity.

## Current Template Lane Map
- `Local Order`
  - safest default for most launches
  - strongest broad-fit option for search, Google/Yelp, and standard direct ordering
  - benchmark mix: `Toast` menu flow + `Square` simplicity + `ChowNow` direct-order framing
- `Storefront`
  - brand-forward restaurant-site feel
  - best when restaurant identity should lead before the menu
  - benchmark mix: `DoorDash Branded Websites` + `Owner` + `Square`
- `Express`
  - public fast-pickup lane
  - best for speed, compact scanning, and tighter cart awareness when the owner wants a more app-like ordering feel
  - benchmark mix: `Toast` ordering density + `Square` simplicity
- `Feast`
  - reserve large-order lane
  - best for party trays, family bundles, office lunch, and advance pickup planning if we decide to push a larger-order template later
  - benchmark mix: live `Toast` tray-ordering flows + `BentoBox` / `Toast` catering references

Public owner-facing choices should stay simple:
- `Local Order`
- `Storefront`
- `Express`

Operator lanes should stay available behind the scenes, not as standard choosers for low-tech owners:
- `Feast`

## Template #4 Status
The next non-overlapping template lane is built, but currently deprioritized:
- `Feast`
  - catering / party trays / office lunch / family-style large-order lane

Why this is the right lane:
- it solves a real business use case that the current three templates do not cover
- it increases the chance of larger average order value instead of adding another cosmetic variant
- it matches common Chinese restaurant strengths like party trays, family bundles, office lunches, and advance orders

Primary benchmark references for this lane:
- live `Toast` tray-ordering flows
- `BentoBox Online Catering`
- `Toast Catering & Events`

Current implementation status:
- `Feast` renders through direct preview links
- it stays on the shared `Local Order` ordering chassis
- it is deployable as an operator-picked default when we intentionally choose it
- it does not appear in the standard owner-facing chooser or claim flow
- it is not the current active template focus

What `Feast` should emphasize:
- party trays and bundles above the standard menu
- large-order lead times and advance scheduling
- pickup and delivery rules for big orders
- minimums, servings, and event-friendly quantity guidance
- faster path into higher-ticket order packages

What `Feast` should not be:
- not another general-purpose default template
- not another brand-story storefront
- not another compact fast-casual/mobile-first shell

## Codex Workflow Default
When starting a new session:
1. read this file
2. read `docs/codex-handoff.md`
3. launch the app if needed
4. inspect the main local routes with MCP/browser tools
5. inspect benchmark pages relevant to the current task
6. continue from the next best step

When ending a session:
- update `docs/codex-handoff.md`

## Definition Of "Finished Enough To Sell"
This product is "finished enough to sell" when:
- an owner can really verify ownership, claim, and pay
- the launched site can actually hand diner orders off to the restaurant
- the site can launch on a real production URL
- owner emails actually send
- the owner can review and approve
- monthly billing can start after launch
- the operator can run the process without guessing
