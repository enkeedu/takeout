# Owner Activation Next Steps

This is the current working plan for the restaurant owner web presence MVP.
Older handoff and superseded plan documents were removed to keep resume context
anchored to a single source of truth.

## Product Goal

The product is a directory-assisted website activation flow for restaurants.

Primary goal:
- help restaurants establish and improve a web presence that supports SEO,
  discoverability, and lightweight website management

Owner actions should include:
- claiming an existing listing
- creating or requesting a listing if the restaurant is not already indexed
- confirming restaurant information
- adding branding and photos
- selecting or changing a website template/style
- publishing updates to the public website page
- later requesting help with domain-related setup or management when relevant

Longer-term business path:
1. website claim or listing creation
2. owner website activation and lightweight customization
3. upsell into online ordering
4. later upsell into reservations, voice agents, and other products

## Product Boundaries For MVP

The directory does not need complete restaurant coverage to make the MVP work.

Acceptable MVP model:
- partial directory coverage for discovery and SEO
- self-serve fallback for owners whose restaurant is not listed
- owner-provided information becoming the authoritative source once claimed

This means "index every restaurant" is not a prerequisite for shipping the
website claim product.

## Current State

The product now has the core MVP building blocks:

- public discovery funnel reframed around claiming and publishing a restaurant website
- public restaurant pages behaving like website-presence pages
- unlisted-owner fallback intake
- claim submission and manual review foundation
- owner site-profile persistence
- private owner workspace for draft save and publish
- published owner overrides flowing onto the public restaurant page

The main remaining gap is operational:

- claim approval still conceptually leads into the old launch flow
- admin review still carries launch-oriented semantics
- owner notifications and post-approval links still center the launch page
- the MVP website owner path is not yet the default lifecycle

## What Already Matches The Goal

- a searchable directory exists
- claim flow exists for listed restaurants
- an unlisted-owner fallback exists
- a private owner workspace exists
- lightweight website customization exists
- published owner overrides already affect the public restaurant page

## What Does Not Fully Match Yet

- the default post-approval path is still framed as launch operations
- operational copy still emphasizes deposits, kickoff, and launch readiness
- media support is URL-based today rather than true uploads
- domain support is not yet a first-class owner workflow
- ordering, reservations, and voice are future expansion paths, not current MVP

## Most Valuable Next Tranche

Make owner approval lead into website management, not launch operations.

Target lifecycle:

1. owner submits claim
2. admin reviews ownership
3. approved owner gets private owner workspace link
4. owner confirms details and publishes website
5. launch/order workflow remains preserved as a later upgrade path

## Why This Is Next

This is the narrowest remaining gap between the current implementation and the MVP promise.

What already works:
- owner can find and claim
- owner can edit website details
- owner can publish website details

What still feels wrong:
- the system still narrates approval as a launch/payment milestone
- the default post-approval experience is not yet "manage your website"

## Phased Strategy

### Phase 1: Web Presence MVP

- searchable restaurant pages
- claim existing listing
- submit business info if not listed
- owner workspace for website edits
- publish owner-approved website details
- SEO-safe public pages

### Phase 1.5: Operational Hardening

- make owner workspace the default approved-owner destination
- re-scope admin and owner copy toward website activation
- improve media handling
- add clearer domain-help workflow where needed

### Phase 2: Monetization And Upgrade Path

- online ordering onboarding and rollout
- preserve existing launch/payment infrastructure only where it helps this
  future upgrade path

### Phase 3: Expanded Product Surface

- reservations
- voice agent ordering or reservations
- other restaurant growth and operations products

## Next Session Implementation Plan

### Workstream 1: Repoint owner approval to the owner workspace

Goal:
- treat the owner workspace as the primary post-approval destination

Likely changes:
- update owner notification helpers in `apps/api/app/services/claim.py`
- introduce an owner-workspace URL builder alongside or instead of launch URL for website-claim events
- review claim approval response payloads and any redirect logic in web
- update any CTA or confirmation screens that should point to `/owner/[claimRequestId]?access=...`

Acceptance criteria:
- an approved owner is sent to the owner workspace by default
- owner-facing copy describes website access, not launch readiness

### Workstream 2: Re-scope claim/admin language

Goal:
- keep backend structures intact while making user-visible workflow website-oriented

Likely changes:
- admin labels and panels under `apps/web/src/app/admin/*`
- visible status labels in `apps/api/app/services/claim.py`
- launch-centric wording in owner-facing status/detail strings

Keep:
- existing payment, kickoff, review, and launch infrastructure in code

Do not do yet:
- destructive schema/state removal
- ordering backend cleanup

Acceptance criteria:
- public/admin owner-review language reads as ownership verification and website activation
- launch/deposit language is no longer the primary website MVP narrative

### Workstream 3: Decide whether website approval should bypass payment entirely

This is the main product decision still affecting implementation shape.

Two viable options:

- Option A: website MVP approval unlocks owner workspace immediately with no deposit requirement
- Option B: owner workspace is available immediately, but later launch/ordering upgrades still require deposit and kickoff

Recommended:
- Option A for the website MVP path
- preserve deposit/kickoff only for a later ordering upgrade path

## Exact Files To Inspect First Next Time

Backend:
- `apps/api/app/services/claim.py`
- `apps/api/app/routers/claim.py`
- `apps/api/app/schemas/claim.py`

Web:
- `apps/web/src/app/launch/[claimRequestId]/page.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/admin/LaunchQueuePanel.tsx`
- `apps/web/src/app/owner/[claimRequestId]/page.tsx`
- `apps/web/src/lib/claim.ts`

## Known Verified State

These are already working:

- `GET /claim/requests/{claimRequestId}/site-profile`
- `POST /claim/requests/{claimRequestId}/site-profile`
- `POST /claim/requests/{claimRequestId}/site-profile/publish`
- owner workspace route renders in browser
- published owner profile updates public restaurant payload and UI

## Known Residual Issues

- `apps/web/src/app/launch/[claimRequestId]/LiveLaunchToolkit.tsx` still hits the existing `qrcode` module problem on the launch route
- local test data was written onto `abc-seafood-restaurant` during verification and should be cleaned if a pristine demo state is needed

## Resume Checklist

Start the next session with:

1. confirm whether the published test data on `abc-seafood-restaurant` should be cleared
2. decide that approved website owners should enter the owner workspace directly
3. update claim approval notifications and links to use the owner workspace
4. narrow visible admin/claim wording from launch to website activation
5. re-test the flow end to end:
   - submit claim
   - approve claim
   - open owner workspace link
   - edit and publish
   - verify public page reflects changes
