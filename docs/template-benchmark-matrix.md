# Template Benchmark Matrix

Use this file alongside `docs/benchmark-playbook.md`.

This file is template-specific.
Use `docs/benchmark-playbook.md` for the broader route-to-benchmark stack across homepage, search, claim, launch, and operations.

## The Two Benchmark Layers

### 1. Owner-Facing Product Pages
Use these for:
- homepage strategy
- claim flow
- onboarding expectations
- pricing clarity
- direct-order value framing
- what-happens-next trust copy

Primary references:
- `Owner`: `https://www.owner.com/online-ordering`
- `ChowNow`: `https://get.chownow.com/products/direct-online-ordering/`
- `Square`: `https://squareup.com/help/us/en/article/6861-create-an-ordering-page-for-your-website`
- `Yelp for Business`: `https://biz.yelp.com/support-center/Yelp_Business_Page/Getting_Started/How-do-I-claim-a-business-page/en-US`
- `Google Business Profile`: `https://support.google.com/business/answer/4566671?hl=en`

### 2. Diner-Facing Live Ordering UIs
Use these for:
- menu layout
- category navigation
- search
- cart visibility
- add / remove / edit behavior
- modifier flows
- pickup / delivery state
- best-seller merchandising
- mobile ordering rhythm

Rule:
- if the task is template or ordering UX work, inspect the matching live diner-facing ordering UI first
- use product marketing pages only as secondary support for positioning and owner-facing copy

## Current Takeout Strengths To Protect
- `Local Order` is a strong broad-fit default for Chinese takeout menus.
- The shared ordering engine is a product advantage because improvements carry across templates.
- The product is better than many competitors at guided, concierge-style owner handoff.
- The current site already does a good job of lowering anxiety for low-tech owners.
- Search, cart edit, undo, and customizable-item feedback are already meaningful strengths and should not be removed casually.

## Template Matrix

### `Local Order`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-order`
- Primary live diner benchmarks:
  - `Toast` actual ordering UI: `https://order.toasttab.com/online/toastuptownnyc`
  - `DoorDash Commerce / Order Online` actual ordering flow: `https://order.online/store/tokyo-sushi-hibachi-and-thai-clarksburg-23902617?pickup=true`
- Supporting owner-facing references:
  - `Square`: `https://squareup.com/help/us/en/article/8566-set-up-an-online-ordering-profile`
  - `ChowNow`: `https://get.chownow.com/products/direct-online-ordering/`
- Adapt from benchmarks:
  - sticky category navigation
  - strong menu search visibility
  - clear `$+` modifier cues
  - high cart awareness without clutter
  - simple pickup / delivery / ETA context
- Protect in our implementation:
  - safest broad-fit structure
  - Chinese takeout menu legibility
  - current search, cart edit, undo, and customization wins
  - calm, guided feel that works for less-technical owners

### `Storefront`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-storefront`
- Primary live diner benchmarks:
  - `DoorDash Branded Website` shell: `https://order.online/store/tokyo-sushi-hibachi-and-thai-clarksburg-23902617?pickup=true`
  - `DoorDash Commerce / branded websites` product page: `https://merchants.doordash.com/en-us/products/branded-websites`
- Supporting owner-facing references:
  - `Square`: `https://squareup.com/help/us/en/article/6861-create-an-ordering-page-for-your-website`
  - `Owner`: `https://www.owner.com/online-ordering`
- Adapt from benchmarks:
  - repeated `Order Online` emphasis
  - stronger best-seller merchandising
  - compact proof and utility cues near the top
  - faster handoff from brand story into the menu
- Protect in our implementation:
  - strongest first impression of the public set
  - brand-forward hero feel
  - direct-order positioning without becoming a generic landing page

### `Express`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-express`
- Public status:
  - public owner-facing template
- Primary live diner benchmarks:
  - `Toast` actual ordering UI: `https://order.toasttab.com/online/toastuptownnyc`
  - `DoorDash Commerce / Order Online` actual ordering flow: `https://order.online/store/tokyo-sushi-hibachi-and-thai-clarksburg-23902617?pickup=true`
- Supporting owner-facing references:
  - `Square`: `https://squareup.com/help/us/en/article/8566-set-up-an-online-ordering-profile`
- Adapt from benchmarks:
  - denser mobile-first layout
  - always-visible cart awareness
  - tighter pickup / ETA context
  - stronger `Most Ordered` / fast-pick cues
  - less brochure behavior above the menu
- Protect in our implementation:
  - fastest menu handoff of the public set
  - compact hero
  - phone-first rhythm
  - shared engine consistency with `Local Order`

### `Feast`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-feast`
- Public status:
  - reserve operator lane, not a standard owner-facing chooser
- Primary live diner benchmarks:
  - `Toast` large-order / tray-style ordering flow: `https://order.toasttab.com/online/khaosan-thai-2062-curtner-avenue`
  - additional live tray / platter examples as needed per cuisine and order type
- Supporting operational / owner-facing references:
  - `BentoBox Catering`: `https://www.getbento.com/products/preorder-catering/`
  - `Toast Catering & Events`: `https://pos.toasttab.com/products/catering-and-events`
- Adapt from benchmarks:
  - tray and platter presentation above standard a la carte browsing
  - serving counts, order minimums, and lead-time clarity
  - advance-order framing
  - event notes / pickup timing guidance
  - larger-order package logic
- Protect in our implementation:
  - keep it simple enough for low-tech owners
  - keep it on the shared ordering engine
  - do not let it become just another cosmetic skin
  - keep the public chooser simple by treating it as an operator lane until it clearly earns broader exposure
  - keep it deprioritized while the main public template set is `Local Order`, `Storefront`, and `Express`

## Working Rule For Future Template Sessions
1. Open the local template route first.
2. Open the matching live diner benchmark next.
3. Compare:
   - top-of-page ordering handoff
   - menu density
   - category rail behavior
   - cart awareness
   - modifier flow
   - item-card clarity
   - mobile rhythm
4. Only after that, use owner-facing benchmark pages for supporting positioning or trust copy.
5. Adapt the strongest patterns into our system without cloning branding or copy.
