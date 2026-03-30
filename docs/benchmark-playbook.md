# Benchmark Playbook

Use this file to keep benchmark research disciplined.

The goal is not to collect lots of competitor links.
The goal is to know:
- which companies matter for this project
- which exact pages are worth inspecting
- which local route or task each page should inform

## Working Rule

Before major product or UI work:
1. inspect the matching local route first
2. inspect the exact benchmark pages for that route or task
3. compare structure, CTA hierarchy, trust language, and interaction behavior
4. adapt the winning pattern into our own system without cloning copy or branding

For template or ordering work:
- inspect live diner-facing ordering UIs first
- use marketing/product pages only as secondary support

For owner funnel work:
- inspect owner-facing product pages first
- use live diner ordering UIs only when the page is promising a specific end-user experience

## Core Benchmark Stack

### Owner
- Why:
  - strongest owner-facing direct-ordering positioning
  - strong done-for-you framing
  - clear explanation of outcomes, onboarding, and support
- Primary pages:
  - `https://www.owner.com/online-ordering`
  - `https://www.owner.com/how-owner-works`
  - `https://www.owner.com/pricing`
- Best for:
  - homepage hero and proof
  - owner trust copy
  - launch expectations
  - pricing confidence
  - post-claim "what happens next"

### ChowNow
- Why:
  - strong independent-restaurant direct-order framing
  - useful support and launch language
- Primary pages:
  - `https://get.chownow.com/products/direct-online-ordering/`
- Best for:
  - owner-facing direct-order value framing
  - owner support language
  - launch messaging for restaurants that do not want a complex setup

### Square
- Why:
  - best simplicity benchmark
  - strongest practical guidance for setup, ordering page behavior, and distribution
- Primary pages:
  - `https://squareup.com/help/us/en/article/6861-create-an-ordering-page-for-your-website`
  - `https://squareup.com/help/us/en/article/8566-set-up-an-online-ordering-profile`
  - `https://squareup.com/us/en/online-ordering/qr-code-ordering`
- Best for:
  - simple ordering-page setup
  - post-launch owner actions
  - QR/share logic
  - practical fulfillment and ordering profile behavior

### Toast
- Why:
  - strongest live diner-facing ordering UI benchmark for our shared ordering engine
  - best reference for menu density, category nav, modifiers, and app-like flow
- Primary pages:
  - `https://pos.toasttab.com/products/online-ordering/`
  - `https://order.toasttab.com/online/toastuptownnyc`
  - `https://order.toasttab.com/online/toastuptownnyc/item-toast-beef-burger_f50aa372-fef8-4c15-9b47-7168beb08b0c`
- Best for:
  - `Local Order`
  - `Express`
  - shared menu/cart/customizer behavior

### DoorDash Commerce / order.online
- Why:
  - strongest benchmark for the branded storefront shell plus real diner checkout flow
  - best live example of a branded ordering site that still feels operationally standardized
- Primary pages:
  - `https://merchants.doordash.com/en-us/products/branded-websites`
  - `https://merchants.doordash.com/en-us/products/online-ordering`
  - `https://order.online/store/tokyo-sushi-hibachi-and-thai-clarksburg-23902617?pickup=true`
- Best for:
  - `Storefront`
  - checkout structure and handoff
  - branded direct-order shell patterns

### Yelp for Business
- Why:
  - strongest low-friction claim benchmark
  - useful fallback logic when phone or ownership is messy
- Primary pages:
  - `https://biz.yelp.com/support-center/Yelp_Business_Page/Getting_Started/How-do-I-claim-a-business-page/en-US`
  - `https://biz.yelp.com/support-center/Yelp_Business_Page/Getting_Started/What-is-a-claimed-business/en-US`
- Best for:
  - claim-flow simplicity
  - manual-review fallback language
  - explaining what a claim unlocks

### Google Business Profile
- Why:
  - strongest verification and ownership-transfer reference
  - best for expectation-setting when verification is imperfect
- Primary pages:
  - `https://support.google.com/business/answer/6300665?hl=en`
  - `https://support.google.com/business/answer/4566671?hl=en`
- Best for:
  - verification logic
  - fallback ownership states
  - claim trust language

### BentoBox
- Why:
  - useful reserve benchmark for premium merchandising and future large-order work
  - not a core benchmark for the next main product decisions
- Primary pages:
  - `https://www.getbento.com/`
  - `https://www.getbento.com/products/preorder-catering/`
- Best for:
  - future catering / large-order lane work
  - premium merchandising patterns

## Route And Task Matrix

### Homepage `/`
- Local goal:
  - make owners trust the product fast
  - explain the offer clearly
  - push owners into listing search with minimal friction
- Inspect first:
  - `https://www.owner.com/online-ordering`
  - `https://www.owner.com/how-owner-works`
  - `https://get.chownow.com/products/direct-online-ordering/`
- Focus on:
  - hero promise
  - trust and proof
  - pricing clarity
  - support language
  - how much operational detail is explained before contact

### Search `/search`
- Local goal:
  - help owners find the correct listing quickly and confidently
- Inspect first:
  - `https://biz.yelp.com/support-center/Yelp_Business_Page/Getting_Started/How-do-I-claim-a-business-page/en-US`
  - `https://support.google.com/business/answer/4566671?hl=en`
- Focus on:
  - first-step simplicity
  - low-friction entry
  - fallback help
  - what the user needs to know before claiming

### Claim `/claim?...`
- Local goal:
  - help owners preview, trust the website, verify ownership, and understand what unlocks next
- Inspect first:
  - `https://biz.yelp.com/support-center/Yelp_Business_Page/Getting_Started/How-do-I-claim-a-business-page/en-US`
  - `https://biz.yelp.com/support-center/Yelp_Business_Page/Getting_Started/What-is-a-claimed-business/en-US`
  - `https://support.google.com/business/answer/6300665?hl=en`
  - `https://support.google.com/business/answer/4566671?hl=en`
  - `https://www.owner.com/how-owner-works`
- Focus on:
  - what claim means
  - verification fallback
  - expectation-setting
  - what happens after successful verification

### `Local Order`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-order`
- Inspect first:
  - `https://order.toasttab.com/online/toastuptownnyc`
  - `https://order.toasttab.com/online/toastuptownnyc/item-toast-beef-burger_f50aa372-fef8-4c15-9b47-7168beb08b0c`
- Support with:
  - `https://squareup.com/help/us/en/article/8566-set-up-an-online-ordering-profile`
- Focus on:
  - category rail
  - menu density
  - customizer flow
  - cart visibility
  - pickup/delivery state
  - mobile scan speed

### `Storefront`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-storefront`
- Inspect first:
  - `https://order.online/store/tokyo-sushi-hibachi-and-thai-clarksburg-23902617?pickup=true`
  - `https://merchants.doordash.com/en-us/products/branded-websites`
- Support with:
  - `https://squareup.com/help/us/en/article/6861-create-an-ordering-page-for-your-website`
- Focus on:
  - top-of-page branding
  - repeated order CTA rhythm
  - proof and utility cues
  - how fast the page hands into the menu

### `Express`
- Local route:
  - `/ca/los-angeles/a-w-seafood-restaurant?preview=1&template=local-express`
- Inspect first:
  - `https://order.toasttab.com/online/toastuptownnyc`
  - `https://order.toasttab.com/online/toastuptownnyc/item-toast-beef-burger_f50aa372-fef8-4c15-9b47-7168beb08b0c`
- Support with:
  - `https://squareup.com/help/us/en/article/8566-set-up-an-online-ordering-profile`
- Focus on:
  - tighter phone-first density
  - faster menu handoff
  - stronger cart awareness
  - less brochure behavior above the menu

### Shared Cart / Checkout Work
- Local routes:
  - any template preview using the shared board
- Inspect first:
  - `https://order.online/store/tokyo-sushi-hibachi-and-thai-clarksburg-23902617?pickup=true`
  - then continue through cart and checkout in the live flow
  - `https://order.toasttab.com/online/toastuptownnyc`
  - then inspect the item/customizer/cart behavior in the live flow
- Focus on:
  - cart prominence
  - summary hierarchy
  - editing customized items
  - timing and fulfillment visibility
  - last-step trust before submit

### Launch / Post-Claim Handoff
- Local routes:
  - paid launch page
  - live launch page
- Inspect first:
  - `https://www.owner.com/how-owner-works`
  - `https://squareup.com/us/en/online-ordering/qr-code-ordering`
- Focus on:
  - what the owner gets next
  - launch confidence
  - simple owner actions after launch
  - link sharing, QR, and rollout clarity

## What To Avoid Researching

These are usually low-value for current work:
- generic company homepages with no product depth
- careers pages
- investor pages
- random blog posts without a workflow we are actively building
- expired direct checkout tokens
- PDF assets unless the task specifically needs them

## How To Use MCP / Browser Tools

For every meaningful task:
1. open the matching local route
2. open the exact benchmark pages from this file
3. inspect desktop first
4. inspect mobile if the task touches templates or ordering flow
5. write down:
   - what the benchmark does better
   - what our local route already does well
   - what should be protected
   - the smallest high-impact gap
6. only then implement changes

## Current Strategic Reading Of The Product

Right now:
- `Local Order`, `Storefront`, and `Express` are strong enough as the public template set
- template work should now be driven by selective benchmark passes, not endless aesthetic iteration
- the bigger product bottlenecks are increasingly operational:
  - SMTP / owner email delivery
  - recurring billing
  - production go-live readiness

That means this playbook should help future sessions choose whether the next move is:
- template/UI polish
- owner funnel polish
- or operational readiness work
