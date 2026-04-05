# Session Handoff

## Resume Prompt

Use this prompt next session:

```text
Resume work on the restaurant owner web presence MVP in /Users/francisho/projects/takeout.

Read these first:
- plan/web_presence_mvp.md
- plan/web_presence_gap_analysis.md
- plan/web_presence_workstreams.md
- plan/owner_activation_next_steps.md
- plan/SESSION_HANDOFF.md

Current state:
- public funnel is reframed around claiming and publishing a restaurant website
- unlisted-owner intake exists
- public restaurant templates hide menu/order/cart UI, but backend ordering support remains
- owner site-profile persistence exists in the API
- private owner workspace exists at /owner/[claimRequestId]
- published owner overrides flow through to the public restaurant page
- next highest-value tranche is to route approved owners into the owner workspace by default and re-scope launch/admin language toward website activation
- there is published test owner-profile data on abc-seafood-restaurant that may need cleanup
- qrcode dependency issue on the launch route was fixed by reinstalling apps/web dependencies and restarting next dev

Then inspect the current diff, verify the app is running, and continue with the next tranche.
```

## Documents To Read First

- `plan/web_presence_mvp.md`
- `plan/web_presence_gap_analysis.md`
- `plan/web_presence_workstreams.md`
- `plan/owner_activation_next_steps.md`

These documents already capture:
- product direction
- MVP scope
- what to preserve for fast-follow ordering
- the next implementation tranche

## Current Implementation State

### Done

- Public discovery and claim funnel is reframed around website ownership and publishing.
- Public restaurant pages behave like website-presence pages instead of ordering pages.
- Menu item UI, carts, and ordering widgets are hidden from the public template surface.
- Unlisted-owner intake exists at `/not-listed`.
- Claim and manual-review infrastructure exists.
- Owner site-profile persistence exists in the API.
- Owner workspace exists at `/owner/[claimRequestId]?access=...`.
- Owner workspace supports draft save and publish.
- Published owner overrides update the public restaurant payload and UI.

### Preserved intentionally

- Ordering/menu backend support
- Launch-related backend support
- Template selection infrastructure
- Claim token/access infrastructure

These are intentionally not deleted because ordering is still a fast-follow path.

## Most Important Next Step

Implement owner activation as the default approved-owner path.

Target flow:

1. owner submits claim
2. admin reviews ownership
3. approved owner gets private owner workspace link
4. owner edits and publishes website details
5. launch/deposit/kickoff remains preserved for future ordering upgrade flow

## Files Most Likely To Matter Next

Backend:
- `apps/api/app/services/claim.py`
- `apps/api/app/routers/claim.py`
- `apps/api/app/schemas/claim.py`

Web:
- `apps/web/src/app/launch/[claimRequestId]/page.tsx`
- `apps/web/src/app/owner/[claimRequestId]/page.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/admin/LaunchQueuePanel.tsx`
- `apps/web/src/lib/claim.ts`

Public rendering:
- `apps/web/src/app/[state]/[city]/[slug]/page.tsx`
- `apps/web/src/components/restaurant-templates/TemplateVisitDetails.tsx`

## Known Residual Issues

- The launch/admin lifecycle is still conceptually oriented around launch/payment instead of website activation.
- Admin review language still needs to be narrowed toward ownership verification.
- There is test published owner-profile data on `abc-seafood-restaurant`.

## Test Data Note

During verification, a sample owner profile was published on:

- restaurant slug: `abc-seafood-restaurant`
- public page: `/ca/los-angeles/abc-seafood-restaurant`

This sample data includes:
- business name override
- short description
- logo URL
- photo URLs
- menu image URL
- template override
- hours override

If the next session needs a clean demo state, clear this test data first.

## Environment Notes

- API was restarted and running on `http://127.0.0.1:8001`
- web app was restarted and running on `http://localhost:3000`
- `qrcode` issue was resolved by running `npm install` in `apps/web`

## Quick Resume Checklist

When resuming:

1. read the plan docs above
2. inspect current git diff/status
3. decide whether to clear the `abc-seafood-restaurant` test profile
4. confirm the app is running
5. implement the owner-activation tranche:
   - approved owners should land in the owner workspace
   - owner notifications should point there
   - visible statuses/admin wording should shift from launch to website activation
