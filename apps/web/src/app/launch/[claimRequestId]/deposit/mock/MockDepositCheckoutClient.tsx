"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  buildLaunchStatusHref,
  completeMockClaimDeposit,
  type MockDepositOutcome,
} from "@/lib/claim";

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.detail.trim()) return error.detail.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

type MockDepositCheckoutClientProps = {
  claimRequestId: string;
  accessToken: string;
};

export function MockDepositCheckoutClient({
  claimRequestId,
  accessToken,
}: MockDepositCheckoutClientProps) {
  const router = useRouter();
  const [busyOutcome, setBusyOutcome] = useState<MockDepositOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOutcome(outcome: MockDepositOutcome) {
    setBusyOutcome(outcome);
    setError(null);
    try {
      await completeMockClaimDeposit(claimRequestId, { accessToken, outcome });
      router.push(
        buildLaunchStatusHref(claimRequestId, accessToken, {
          payment:
            outcome === "paid"
              ? "paid"
              : outcome === "failed"
              ? "failed"
              : "cancelled",
        })
      );
    } catch (nextError) {
      setError(
        errorText(
          nextError,
          "We could not update the mock checkout right now. Try again."
        )
      );
      setBusyOutcome(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleOutcome("paid")}
          disabled={Boolean(busyOutcome)}
          className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:opacity-60"
        >
          {busyOutcome === "paid" ? "Completing..." : "Complete Mock Payment"}
        </button>
        <button
          type="button"
          onClick={() => handleOutcome("failed")}
          disabled={Boolean(busyOutcome)}
          className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2] disabled:opacity-60"
        >
          {busyOutcome === "failed" ? "Updating..." : "Simulate Failure"}
        </button>
        <button
          type="button"
          onClick={() => handleOutcome("cancelled")}
          disabled={Boolean(busyOutcome)}
          className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2] disabled:opacity-60"
        >
          {busyOutcome === "cancelled" ? "Updating..." : "Cancel"}
        </button>
      </div>
      {error ? (
        <p className="rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
