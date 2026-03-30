"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type DiscoveryRouteEventProps = {
  eventName: string;
  payload: Record<string, unknown>;
  focusTargetId?: string;
  liveMessage?: string;
};

export function DiscoveryRouteEvent({
  eventName,
  payload,
  focusTargetId,
  liveMessage,
}: DiscoveryRouteEventProps) {
  useEffect(() => {
    trackEvent(eventName, payload);
    if (!focusTargetId) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(focusTargetId)?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [eventName, focusTargetId, payload]);

  if (!liveMessage) return null;

  return (
    <p aria-live="polite" className="sr-only">
      {liveMessage}
    </p>
  );
}
