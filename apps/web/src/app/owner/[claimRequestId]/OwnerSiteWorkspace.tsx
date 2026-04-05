"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  publishOwnerSiteProfileWorkspace,
  type OwnerSiteProfileWorkspaceResponse,
  updateOwnerSiteProfileWorkspace,
} from "@/lib/claim";

type OwnerSiteWorkspaceProps = {
  claimRequestId: string;
  accessToken: string;
  workspace: OwnerSiteProfileWorkspaceResponse;
  previewHref: string;
  listingHref: string;
};

type FormState = {
  businessName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  shortDescription: string;
  logoUrl: string;
  photoUrls: string;
  menuImageUrls: string;
  templateKey: string;
  hoursJson: string;
};

function stringifyHours(value: Record<string, unknown> | null): string {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function buildInitialForm(workspace: OwnerSiteProfileWorkspaceResponse): FormState {
  const { baseline, profile } = workspace;
  return {
    businessName: profile.businessName || "",
    phone: profile.phone || "",
    address1: profile.address1 || "",
    address2: profile.address2 || "",
    city: profile.city || "",
    state: profile.state || "",
    zip: profile.zip || "",
    shortDescription: profile.shortDescription || "",
    logoUrl: profile.logoUrl || "",
    photoUrls: profile.photoUrls.join("\n"),
    menuImageUrls: profile.menuImageUrls.join("\n"),
    templateKey: profile.templateKey || baseline.templateKey || "",
    hoursJson: stringifyHours(profile.hoursJson || baseline.hoursJson),
  };
}

function parseLineList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function baselineLabel(overrideValue: string, baselineValue: string | null | undefined): string {
  if (overrideValue.trim()) {
    return "Override saved";
  }
  if (baselineValue && baselineValue.trim()) {
    return `Using imported value: ${baselineValue}`;
  }
  return "No imported value yet";
}

function FieldHint({
  overrideValue,
  baselineValue,
}: {
  overrideValue: string;
  baselineValue: string | null | undefined;
}) {
  return (
    <p className="text-xs text-[#7d6857]">
      {baselineLabel(overrideValue, baselineValue)}
    </p>
  );
}

export function OwnerSiteWorkspace({
  claimRequestId,
  accessToken,
  workspace,
  previewHref,
  listingHref,
}: OwnerSiteWorkspaceProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialForm(workspace));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(
    workspace.profile.publishedAt
  );

  const publishedLabel = useMemo(() => {
    if (!publishedAt) return null;
    const value = new Date(publishedAt);
    if (Number.isNaN(value.getTime())) return null;
    return value.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [publishedAt]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let hoursJson: Record<string, unknown> | null = null;
      const trimmedHours = form.hoursJson.trim();
      if (trimmedHours) {
        const parsed = JSON.parse(trimmedHours);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Hours JSON must be a JSON object.");
        }
        hoursJson = parsed as Record<string, unknown>;
      }

      const next = await updateOwnerSiteProfileWorkspace(claimRequestId, {
        accessToken,
        businessName: form.businessName.trim() || null,
        phone: form.phone.trim() || null,
        address1: form.address1.trim() || null,
        address2: form.address2.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        shortDescription: form.shortDescription.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        photoUrls: parseLineList(form.photoUrls),
        menuImageUrls: parseLineList(form.menuImageUrls),
        templateKey: form.templateKey.trim() || null,
        hoursJson,
      });

      setForm(buildInitialForm(next));
      setPublishedAt(next.profile.publishedAt);
      setSuccess("Draft saved.");
      startTransition(() => router.refresh());
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We could not save your website draft yet."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await publishOwnerSiteProfileWorkspace(claimRequestId, accessToken);
      setForm(buildInitialForm(next));
      setPublishedAt(next.profile.publishedAt);
      setSuccess("Website details published.");
      startTransition(() => router.refresh());
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We could not publish your website updates yet."
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
              Owner Website Workspace
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
              Confirm and publish your restaurant website
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#665b52]">
              This workspace lets you override imported listing details with website-ready content.
              Save a draft as you go, then publish when the public page looks right.
            </p>
          </div>
          <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] px-4 py-3 text-sm text-[#6b5543]">
            <p className="font-semibold text-[#1f1f1f]">Current status</p>
            <p className="mt-1">
              {workspace.profile.isPublished
                ? publishedLabel
                  ? `Published ${publishedLabel}`
                  : "Published"
                : "Draft only"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={previewHref}
            className="rounded-xl bg-[#c73f2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ad3324]"
          >
            Preview Website
          </Link>
          <Link
            href={listingHref}
            className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
          >
            View Public Page
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Business name
              </span>
              <input
                value={form.businessName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, businessName: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.name}
              />
              <FieldHint
                overrideValue={form.businessName}
                baselineValue={workspace.baseline.name}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Phone
              </span>
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.phone || "Restaurant phone"}
              />
              <FieldHint overrideValue={form.phone} baselineValue={workspace.baseline.phone} />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Template key
              </span>
              <input
                value={form.templateKey}
                onChange={(event) =>
                  setForm((current) => ({ ...current, templateKey: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.templateKey || "local-order"}
              />
              <FieldHint
                overrideValue={form.templateKey}
                baselineValue={workspace.baseline.templateKey}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Short description
              </span>
              <textarea
                value={form.shortDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder="Describe the restaurant in a short, website-ready paragraph."
              />
              <FieldHint overrideValue={form.shortDescription} baselineValue={null} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Logo URL
              </span>
              <input
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, logoUrl: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Address line 1
              </span>
              <input
                value={form.address1}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address1: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.address1}
              />
              <FieldHint overrideValue={form.address1} baselineValue={workspace.baseline.address1} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Address line 2
              </span>
              <input
                value={form.address2}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address2: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.address2 || "Suite, floor, etc."}
              />
              <FieldHint overrideValue={form.address2} baselineValue={workspace.baseline.address2} />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                City
              </span>
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.city}
              />
              <FieldHint overrideValue={form.city} baselineValue={workspace.baseline.city} />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                State
              </span>
              <input
                value={form.state}
                onChange={(event) =>
                  setForm((current) => ({ ...current, state: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.state}
              />
              <FieldHint overrideValue={form.state} baselineValue={workspace.baseline.state} />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                ZIP
              </span>
              <input
                value={form.zip}
                onChange={(event) =>
                  setForm((current) => ({ ...current, zip: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder={workspace.baseline.zip}
              />
              <FieldHint overrideValue={form.zip} baselineValue={workspace.baseline.zip} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Photo URLs
              </span>
              <textarea
                value={form.photoUrls}
                onChange={(event) =>
                  setForm((current) => ({ ...current, photoUrls: event.target.value }))
                }
                rows={4}
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder="One image URL per line"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Menu image URLs
              </span>
              <textarea
                value={form.menuImageUrls}
                onChange={(event) =>
                  setForm((current) => ({ ...current, menuImageUrls: event.target.value }))
                }
                rows={4}
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
                placeholder="One menu image URL per line"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
                Hours JSON
              </span>
              <textarea
                value={form.hoursJson}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hoursJson: event.target.value }))
                }
                rows={8}
                className="w-full rounded-2xl border border-[#ddc7b5] bg-white px-4 py-3 font-mono text-xs text-[#1f1f1f] outline-none transition focus:border-[#c65b39] focus:ring-2 focus:ring-[#f1d3c6]"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-[#f0c4b8] bg-[#fff1ec] px-4 py-3 text-sm text-[#9f3926]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-4 rounded-2xl border border-[#d6e7d7] bg-[#f3fbf3] px-4 py-3 text-sm text-[#2f6b39]">
              {success}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || publishing}
              className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || publishing}
              className="rounded-xl border border-[#ddc7b5] bg-white px-5 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? "Publishing..." : "Publish Website"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b04a2d]">
              Imported Listing
            </p>
            <div className="mt-4 space-y-3 text-sm text-[#1f1f1f]">
              <p>
                <span className="font-semibold">Name:</span> {workspace.baseline.name}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {workspace.baseline.phone || "None"}
              </p>
              <p>
                <span className="font-semibold">Address:</span> {workspace.baseline.address1}
                {workspace.baseline.address2 ? `, ${workspace.baseline.address2}` : ""}
                {`, ${workspace.baseline.city}, ${workspace.baseline.state} ${workspace.baseline.zip}`}
              </p>
              <p>
                <span className="font-semibold">Website:</span>{" "}
                {workspace.baseline.websiteUrl || "None"}
              </p>
              <p>
                <span className="font-semibold">Template:</span>{" "}
                {workspace.baseline.templateKey || "Not set"}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b04a2d]">
              Publish Notes
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#665b52]">
              <li>Saved drafts do not change the public page until you publish.</li>
              <li>Blank fields keep using the imported listing values.</li>
              <li>Photo and menu image lists accept one URL per line.</li>
              <li>Hours stay as raw JSON for now so the API format remains unchanged.</li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
