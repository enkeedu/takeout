import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Refund Policy
        </p>
        <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Setup deposit and monthly billing policy
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#665b52]">
          The setup deposit is meant to start real launch work. Monthly billing begins only after
          the site is live.
        </p>
      </section>

      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-5 text-sm leading-7 text-[#4f463f]">
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Before kickoff</h2>
            <p className="mt-2">
              If the owner pays the setup deposit and support has not started kickoff yet, refund
              requests can be reviewed case by case.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">After kickoff starts</h2>
            <p className="mt-2">
              Once kickoff, build work, or launch preparation has started, the setup deposit is
              generally non-refundable because real launch work has already begun.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Monthly billing</h2>
            <p className="mt-2">
              The monthly plan starts only after the site is launched. Monthly billing details and
              automation are handled separately from the initial setup deposit.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Need help?</h2>
            <p className="mt-2">
              If a claim, payment, or launch timeline needs to be reviewed, contact support before
              the next billing period begins.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
