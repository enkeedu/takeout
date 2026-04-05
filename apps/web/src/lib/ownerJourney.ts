export const CORE_OWNER_PROMISE =
  "Find your listing, claim your restaurant website, and build a stronger web presence.";

export const OWNER_LAUNCH_STEPS = [
  "Find your listing",
  "Claim your listing",
  "Publish your website",
] as const;

export const OWNER_SETUP_REQUIREMENTS = [
  {
    eyebrow: "Access",
    title: "Business profile links and optional domain access",
    detail:
      "We start with your listing data first, then confirm any Google Business Profile, Yelp, social, or domain access you want us to reference later.",
  },
  {
    eyebrow: "Content",
    title: "Hours, logo, photos, and website details",
    detail:
      "We confirm your business information, hours, branding assets, and any website details so the site looks finished before it goes live.",
  },
  {
    eyebrow: "Presence",
    title: "Website details and optional menu images",
    detail:
      "If you have menu images, preferred descriptions, or existing website assets, we collect those details so the site reflects the real business.",
  },
  {
    eyebrow: "Publish",
    title: "Managed website first",
    detail:
      "Your first website can live on your managed restaurant URL. Later, you can connect more advanced features once the web presence is in place.",
  },
] as const;

export const OWNER_SETUP_FAQS = [
  {
    question: "What do I need to get started?",
    answer:
      "We need the basics: the right owner contact, confirmed business information, any logo or photos you want us to use, and optional Google, Yelp, or domain access if you want faster link updates later.",
  },
  {
    question: "What happens to my current website?",
    answer:
      "Your current site can stay live while we build. We publish first on your managed restaurant URL, then decide when to update Google, Yelp, social profiles, or any existing website links.",
  },
  {
    question: "Can I update my website details later?",
    answer:
      "Yes. The goal of the MVP is to make it easy to confirm and update core website details like business information, hours, branding, and photos without rebuilding everything from scratch.",
  },
  {
    question: "How fast can my website go live?",
    answer:
      "The target is 5-7 days after the ownership review and setup details are confirmed. Owners who already have their business info, hours, logo, and photos ready usually move through setup the fastest.",
  },
] as const;
