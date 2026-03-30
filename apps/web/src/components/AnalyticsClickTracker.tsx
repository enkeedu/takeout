"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

function parsePayload(value?: string): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

export function AnalyticsClickTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const element = target.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;
      const eventName = element.dataset.analyticsEvent;
      if (!eventName) return;
      trackEvent(eventName, parsePayload(element.dataset.analyticsPayload));
    };

    const handleSubmit = (event: Event) => {
      const target = event.target as HTMLFormElement | null;
      if (!target) return;
      const eventName = target.dataset.analyticsSubmitEvent;
      if (!eventName) return;
      trackEvent(eventName, parsePayload(target.dataset.analyticsPayload));
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  return null;
}

