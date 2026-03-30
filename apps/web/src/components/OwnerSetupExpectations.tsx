import Link from "next/link";
import {
  OWNER_SETUP_FAQS,
  OWNER_SETUP_REQUIREMENTS,
} from "@/lib/ownerJourney";

export function OwnerSetupExpectations({
  mode = "full",
}: {
  mode?: "full" | "compact";
}) {
  if (mode === "compact") {
    return (
      <div className="mt-4 rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
        <p className="text-sm font-semibold text-[#1f1f1f]">
          What we&apos;ll need after verification
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[#665b52]">
          {OWNER_SETUP_REQUIREMENTS.map((item) => (
            <li key={item.title} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#c73f2f]" />
              <span>
                <span className="font-semibold text-[#1f1f1f]">{item.title}:</span>{" "}
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#665b52]">
          Your current website can stay up while we build. We launch first on your
          managed restaurant URL, then confirm when to update Google, Yelp, and
          social links.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7361]">
          <Link
            href="/terms"
            className="rounded-full border border-[#ddc7b5] bg-white px-3 py-1 hover:bg-[#fff8f2]"
          >
            Terms
          </Link>
          <Link
            href="/refund-policy"
            className="rounded-full border border-[#ddc7b5] bg-white px-3 py-1 hover:bg-[#fff8f2]"
          >
            Refund Policy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[#ead8c6] bg-gradient-to-br from-[#fff8f1] via-[#fffdfb] to-[#fdf0e5] p-6 shadow-sm md:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_360px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
            Owner Setup Expectations
          </p>
          <h2 className="font-[var(--font-display)] mt-1 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-[2.1rem]">
            What we need from you to launch fast
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[#685b4f]">
            The best owner funnels do not hide the handoff. We start with your
            listing data, then use kickoff to confirm access, branding, operations,
            and launch timing without making you rebuild everything from scratch.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {OWNER_SETUP_REQUIREMENTS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[#e7d8cb] bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b73a2f]">
                  {item.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#1f1f1f]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#60554b]">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#f0d3c7] bg-[#fff3ea] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b73a2f]">
            Managed Launch Model
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1f1f1f]">
            Keep your current site up while we build
          </h3>
          <p className="mt-2 text-sm text-[#685b4f]">
            We launch first on your managed restaurant URL. Once the new site is
            approved, we help you update Google Business Profile, Yelp, and social
            links so customers land on the new direct-order page.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-[#5e544c]">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#c73f2f]" />
              <span>$299 deposit starts kickoff now.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#c73f2f]" />
              <span>You review the final build before go-live.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#c73f2f]" />
              <span>$99/month starts only after the site is live.</span>
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/search"
              className="inline-flex rounded-xl bg-[#c73f2f] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ad3324] active:scale-[0.99]"
            >
              Find My Restaurant
            </Link>
            <a
              href="https://wa.me/18183420990"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl border border-[#e0c9b7] bg-white px-4 py-3 text-sm font-semibold text-[#6e5a4c] transition-colors hover:bg-[#fff8f2]"
            >
              Ask a Setup Question
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b73a2f]">
              Common Setup Questions
            </p>
            <h3 className="font-[var(--font-display)] mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f] md:text-[1.9rem]">
              The handoff, without the guesswork
            </h3>
          </div>
          <p className="max-w-2xl text-sm text-[#685b4f]">
            This is the part strong owner funnels explain early. Clear expectations
            make the launch feel real.
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {OWNER_SETUP_FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-[#e7d8cb] bg-white p-5 shadow-sm open:bg-[#fffaf5]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-[#1f1f1f]">
                <span>{item.question}</span>
                <span className="rounded-full border border-[#e3d4c6] bg-[#fff8f2] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7361] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-[#60554b]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
