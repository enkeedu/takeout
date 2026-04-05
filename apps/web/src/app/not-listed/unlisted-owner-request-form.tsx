"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";

type PreferredContactMethod = "call" | "text" | "whatsapp" | "email";

type SubmissionResponse = {
  requestId: string;
  status: string;
  detail: string;
};

type FormState = {
  restaurantName: string;
  city: string;
  state: string;
  restaurantPhone: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  preferredContactMethod: PreferredContactMethod;
  websiteUrl: string;
  googleMapsUrl: string;
  yelpUrl: string;
  notes: string;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-[#3f342b]">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#1f1f1f] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f6d7cf]"
      />
    </label>
  );
}

export function UnlistedOwnerRequestForm() {
  const searchParams = useSearchParams();
  const initialState = useMemo<FormState>(
    () => ({
      restaurantName: searchParams.get("name") || "",
      city: searchParams.get("city") || "",
      state: searchParams.get("state") || "",
      restaurantPhone: searchParams.get("phone") || "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      preferredContactMethod: "call",
      websiteUrl: "",
      googleMapsUrl: "",
      yelpUrl: "",
      notes: "",
    }),
    [searchParams]
  );
  const [form, setForm] = useState<FormState>(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmissionResponse | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const canSubmit =
    form.restaurantName.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.ownerName.trim() &&
    form.ownerPhone.trim() &&
    form.ownerEmail.trim();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch<SubmissionResponse>("/claim/unlisted-request", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          sourcePath:
            typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}`
              : "/not-listed",
        }),
      });
      setSubmitted(response);
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.detail);
      } else {
        setError("We could not save this request right now. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#d9e9d8] bg-[#f6fcf5] p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f6b39]">
            Request Saved
          </p>
          <h1 className="font-[var(--font-display)] mt-2 text-4xl font-bold tracking-tight text-[#1f1f1f]">
            We saved your restaurant details
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#4c5d4d] md:text-base">
            We will review the restaurant information manually and use your contact details
            for follow-up.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/search"
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324]"
            >
              Back to Search
            </Link>
            <a
              href="tel:+18183420990"
              className="rounded-xl border border-[#d7c5b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
            >
              Talk to a Human
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#ead8c6] bg-gradient-to-br from-[#fff8f1] via-white to-[#fff3ea] p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b64a30]">
          Restaurant Not Listed
        </p>
        <h1 className="font-[var(--font-display)] mt-2 max-w-3xl text-4xl font-bold tracking-tight text-[#1f1f1f] md:text-5xl">
          We can still create the website entry path manually
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[#5f5851] md:text-base">
          If your restaurant is not in the directory yet, send the basics here. We will
          review the request, add the listing, and help you move into the website flow.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-3xl border border-[#e4d5c6] bg-white p-6 shadow-sm md:grid-cols-2 md:p-8"
      >
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
            Restaurant Details
          </p>
        </div>
        <Field
          label="Restaurant Name"
          value={form.restaurantName}
          onChange={(value) => setField("restaurantName", value)}
          placeholder="ABC Seafood Restaurant"
          required
        />
        <Field
          label="Restaurant Phone"
          value={form.restaurantPhone}
          onChange={(value) => setField("restaurantPhone", value)}
          placeholder="(213) 680-2887"
        />
        <Field
          label="City"
          value={form.city}
          onChange={(value) => setField("city", value)}
          placeholder="Los Angeles"
          required
        />
        <Field
          label="State"
          value={form.state}
          onChange={(value) => setField("state", value)}
          placeholder="CA"
          required
        />

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
            Owner Contact
          </p>
        </div>
        <Field
          label="Owner Name"
          value={form.ownerName}
          onChange={(value) => setField("ownerName", value)}
          placeholder="Owner or manager name"
          required
        />
        <Field
          label="Owner Phone"
          value={form.ownerPhone}
          onChange={(value) => setField("ownerPhone", value)}
          placeholder="Best number for follow-up"
          required
        />
        <div className="md:col-span-2">
          <Field
            label="Owner Email"
            value={form.ownerEmail}
            onChange={(value) => setField("ownerEmail", value)}
            placeholder="owner@restaurant.com"
            type="email"
            required
          />
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#3f342b]">Preferred Contact</span>
          <select
            value={form.preferredContactMethod}
            onChange={(event) =>
              setField("preferredContactMethod", event.target.value as PreferredContactMethod)
            }
            className="w-full rounded-xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#1f1f1f] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f6d7cf]"
          >
            <option value="call">Call</option>
            <option value="text">Text</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>
        </label>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b64a30]">
            Optional Links
          </p>
        </div>
        <Field
          label="Current Website"
          value={form.websiteUrl}
          onChange={(value) => setField("websiteUrl", value)}
          placeholder="https://..."
          type="url"
        />
        <Field
          label="Google Maps URL"
          value={form.googleMapsUrl}
          onChange={(value) => setField("googleMapsUrl", value)}
          placeholder="https://maps.google.com/..."
          type="url"
        />
        <div className="md:col-span-2">
          <Field
            label="Yelp URL"
            value={form.yelpUrl}
            onChange={(value) => setField("yelpUrl", value)}
            placeholder="https://www.yelp.com/..."
            type="url"
          />
        </div>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-[#3f342b]">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
            rows={4}
            placeholder="Anything helpful about the listing, the restaurant name, duplicate locations, or how you want us to follow up."
            className="w-full rounded-xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#1f1f1f] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f6d7cf]"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-[#f2d1c8] bg-[#fff4ef] px-4 py-3 text-sm text-[#9e3f28] md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3324] disabled:opacity-60"
          >
            {busy ? "Saving..." : "Send Restaurant Details"}
          </button>
          <Link
            href="/search"
            className="rounded-xl border border-[#d7c5b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
          >
            Back to Search
          </Link>
        </div>
      </form>
    </div>
  );
}
