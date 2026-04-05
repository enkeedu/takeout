# AGENTS.md

This file provides guidance to Codex and other coding agents working in this
repository.

## Project Direction

Chinese Takeout is not just a directory. The near-term product is a
directory-assisted website activation flow for restaurants:

1. owner finds an existing listing or submits business info if not listed
2. owner claims or creates the listing
3. owner enters a private workspace
4. owner confirms business info, adds lightweight branding/content, and
   publishes a web presence
5. later upgrades can add online ordering, reservations, voice agents, domain
   help, and other business tooling

The directory does not need full restaurant coverage to be useful. Partial
coverage plus a low-friction self-serve fallback is acceptable for MVP.

## Source Of Truth

Use `plan/owner_activation_next_steps.md` as the current product and
implementation reference.

Do not rely on older handoff notes or superseded plan files if they reappear.
If product direction changes, update `plan/owner_activation_next_steps.md`
instead of creating competing resume docs.

## Current Product Scope

Phase 1 focuses on web presence:
- searchable directory pages
- claim flow for existing listings
- fallback path for restaurants not yet listed
- private owner workspace
- lightweight website customization
- publish owner-controlled website details onto public listing pages

Current customization supports:
- confirming business info
- short description overrides
- logo URL
- photo URLs
- menu image URLs
- template/style selection
- hours overrides

## Not Yet Core MVP

These may come later, but should not distort the current workflow:
- online ordering rollout
- reservations
- voice agent ordering or reservations
- full domain registration automation
- broad restaurant indexing across every market

## Immediate Implementation Priority

Make website ownership and website management the default owner lifecycle.

That means:
- approved owners should land in the owner workspace by default
- owner-facing copy should describe website activation, not launch operations
- admin wording should emphasize ownership verification and website activation
- launch/payment infrastructure can remain in code for future upgrades, but it
  should not be the primary MVP narrative

## Practical Rule

When deciding between broad directory ingestion and owner self-serve flows,
prefer the path that gets a restaurant to a claimed, publishable website
faster.
