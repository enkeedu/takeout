# Owner Activation Next Steps

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
