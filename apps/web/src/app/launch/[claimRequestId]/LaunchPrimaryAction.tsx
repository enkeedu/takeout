"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createClaimDepositCheckout } from "@/lib/claim";

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.detail.trim()) return error.detail.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

type LaunchPrimaryActionProps = {
  claimRequestId: string;
  accessToken: string;
  disabled?: boolean;
};

export function LaunchPrimaryAction({
  claimRequestId,
  accessToken,
  disabled = false,
}: LaunchPrimaryActionProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await createClaimDepositCheckout(claimRequestId, { accessToken });
      window.location.assign(response.checkoutUrl);
    } catch (nextError) {
      setError(
        errorText(
          nextError,
          "We could not start checkout right now. Try again or contact support."
        )
      );
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || busy}
        className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
      >
        {busy ? "Opening Checkout..." : "Pay Setup Deposit"}
      </button>
      {error ? (
        <p className="rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
