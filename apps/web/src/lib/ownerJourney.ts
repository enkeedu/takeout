export const CORE_OWNER_PROMISE =
  "Find your listing, launch direct ordering fast, and keep more of every order.";

export const OWNER_LAUNCH_STEPS = [
  "Find your listing",
  "Claim your listing",
  "Launch your direct-ordering site",
] as const;

export const OWNER_SETUP_REQUIREMENTS = [
  {
    eyebrow: "Access",
    title: "Google, Yelp, and optional domain access",
    detail:
      "We start with your listing data first, then use kickoff to confirm any Google Business Profile, Yelp, or domain access needed to update your links faster.",
  },
  {
    eyebrow: "Content",
    title: "Menu, hours, logo, and photos",
    detail:
      "We confirm your menu scope, business hours, and any branding assets so the site looks finished before it goes live.",
  },
  {
    eyebrow: "Operations",
    title: "POS, printer, and payment details",
    detail:
      "If you already use Stripe, a printer, or a POS workflow, we collect those details during kickoff so launch fits your current setup.",
  },
  {
    eyebrow: "Launch",
    title: "Managed live link first",
    detail:
      "Your first launch uses your managed restaurant URL. Monthly billing starts only after the site goes live, not before.",
  },
] as const;

export const OWNER_SETUP_FAQS = [
  {
    question: "What do I need to get started?",
    answer:
      "We need the basics: the right owner contact, final menu and hours, any logo or photos you want us to use, and optional Google, Yelp, or domain access if you want faster link updates. If you already know your logins, kickoff moves much faster.",
  },
  {
    question: "What happens to my current website?",
    answer:
      "Your current site can stay live while we build. We launch first on your managed restaurant URL, then use kickoff to decide when to update Google, Yelp, social profiles, or any existing website links.",
  },
  {
    question: "Do you take over my POS or payment flow?",
    answer:
      "No. We work around your current workflow. If you already have Stripe, printer, or POS details we should know about, we collect that during kickoff so the launch matches how your restaurant already operates.",
  },
  {
    question: "How fast can you launch?",
    answer:
      "The target is 5-7 days after kickoff is confirmed. Owners who already have their menu, hours, and access details ready usually move through setup the fastest.",
  },
] as const;
