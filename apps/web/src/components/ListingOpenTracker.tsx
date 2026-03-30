"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type ListingOpenTrackerProps = {
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
  templateKey: string | null;
};

export function ListingOpenTracker({
  stateSlug,
  citySlug,
  restaurantSlug,
  templateKey,
}: ListingOpenTrackerProps) {
  useEffect(() => {
    trackEvent("listing_opened", {
      source: "listing_page",
      state_slug: stateSlug,
      city_slug: citySlug,
      restaurant_slug: restaurantSlug,
      template_key: templateKey,
    });
  }, [stateSlug, citySlug, restaurantSlug, templateKey]);

  return null;
}
