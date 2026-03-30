import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Privacy
        </p>
        <h1 className="font-[var(--font-display)] mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          How launch and owner data is used
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#665b52]">
          Chinese Takeout uses owner and restaurant information to verify ownership, deliver the
          launch service, take payment, and keep the restaurant informed about kickoff, review, and
          go-live updates.
        </p>
      </section>

      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-5 text-sm leading-7 text-[#4f463f]">
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">What we collect</h2>
            <p className="mt-2">
              This can include owner contact information, claim verification details, launch-status
              notes, website review requests, and setup intake data like hours, logo availability,
              and Google, Yelp, or domain readiness.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">How we use it</h2>
            <p className="mt-2">
              We use the information to verify restaurant ownership, collect the setup deposit,
              coordinate kickoff, build and launch the website, and send operational launch emails.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Payment and email providers</h2>
            <p className="mt-2">
              Payments and transactional email may be handled by third-party providers used to run
              the service. Those providers receive the minimum information needed to process payment
              or deliver launch updates.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Questions</h2>
            <p className="mt-2">
              If something looks wrong or you want launch data corrected, contact support and we can
              update the claim record or owner details.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
