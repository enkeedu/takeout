import Link from "next/link";
import { ApiError } from "@/lib/api";
import { buildLaunchStatusHref, getClaimRequestStatus } from "@/lib/claim";
import { MockDepositCheckoutClient } from "./MockDepositCheckoutClient";

type MockCheckoutPageProps = {
  params: Promise<{ claimRequestId?: string }>;
  searchParams: Promise<{ access?: string }>;
};

export default async function MockDepositCheckoutPage({
  params,
  searchParams,
}: MockCheckoutPageProps) {
  const routeParams = await params;
  const query = await searchParams;
  const claimRequestId = (routeParams.claimRequestId || "").trim();
  const accessToken = (query.access || "").trim();

  if (!claimRequestId || !accessToken) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Mock Checkout
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Secure launch link required
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            Re-open the private launch link from your claim flow to test mock checkout.
          </p>
        </section>
      </div>
    );
  }

  try {
    const claim = await getClaimRequestStatus(claimRequestId, accessToken);
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
            Mock Checkout
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
            Test the setup deposit handoff
          </h1>
          <p className="mt-2 text-sm text-[#665b52]">
            This local-only page stands in for Stripe Checkout so we can validate the launch flow
            end to end before live billing is configured.
          </p>
        </section>

        <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Restaurant
              </p>
              <p className="mt-2 text-lg font-semibold text-[#1f1f1f]">
                {claim.restaurant.name}
              </p>
              <p className="mt-1 text-sm text-[#665b52]">
                {claim.restaurant.address1}, {claim.restaurant.city}, {claim.restaurant.state}
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Pricing
              </p>
              <p className="mt-2 text-lg font-semibold text-[#1f1f1f]">
                ${(claim.pricing.setupDepositCents / 100).toFixed(0)} setup deposit
              </p>
              <p className="mt-1 text-sm text-[#665b52]">
                ${(claim.pricing.monthlyPlanCents / 100).toFixed(0)}/month starts after launch
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
            <p className="text-sm font-semibold text-[#1f1f1f]">What this simulates</p>
            <p className="mt-2 text-sm text-[#665b52]">
              A paid result should unlock kickoff scheduling on the launch page. Failed or
              cancelled results should keep the deposit retryable.
            </p>
          </div>

          <div className="mt-6">
            <MockDepositCheckoutClient
              claimRequestId={claimRequestId}
              accessToken={accessToken}
            />
          </div>

          <div className="mt-6">
            <Link
              href={buildLaunchStatusHref(claimRequestId, accessToken)}
              className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              Back to launch status
            </Link>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
              Mock Checkout
            </p>
            <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
              Launch link unavailable
            </h1>
            <p className="mt-2 text-sm text-[#665b52]">
              The secure launch link is missing or expired. Start from the claim flow again.
            </p>
          </section>
        </div>
      );
    }
    throw error;
  }
}
