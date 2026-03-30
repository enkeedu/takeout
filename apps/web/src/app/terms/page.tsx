import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Terms
        </p>
        <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Chinese Takeout service terms
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#665b52]">
          These terms cover the done-for-you website launch service offered through Chinese
          Takeout. They are written for first paid customers, not enterprise procurement teams.
        </p>
      </section>

      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-5 text-sm leading-7 text-[#4f463f]">
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">What you are buying</h2>
            <p className="mt-2">
              The setup deposit starts a concierge website launch process that includes kickoff,
              menu and hours setup, review, and go-live on the managed Chinese Takeout restaurant
              URL. Monthly billing starts only after the site is marked live.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Owner responsibilities</h2>
            <p className="mt-2">
              You agree to provide accurate business details, confirm that you are authorized to act
              for the restaurant, and share any needed materials or account access for setup.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Launch process</h2>
            <p className="mt-2">
              Chinese Takeout handles the launch as a done-for-you service. The owner gets a private
              launch page, review pass, and live handoff once the build is approved.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Service changes</h2>
            <p className="mt-2">
              We may improve or adjust templates, flows, and operational tooling over time as long
              as the core paid launch service remains materially consistent with what was promised at
              signup.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
