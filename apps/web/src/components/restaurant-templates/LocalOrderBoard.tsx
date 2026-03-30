"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MenuCategory,
  MenuItem,
  ModifierGroup,
  ModifierOption,
} from "@/lib/restaurantDemo";
import { formatPrice } from "@/lib/restaurantDemo";
import { apiFetch } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import type { OrderOut } from "@/lib/types";
import type { OrderingTemplateKey } from "./types";

type Props = {
  restaurantName: string;
  menu: MenuCategory[];
  orderPath: string;
  orderingEnabled: boolean;
  variant: OrderingTemplateKey;
};

type Entry = MenuItem & {
  sourceCategory: string;
  imageUrl: string;
  isVegetarian: boolean;
};

type Section = {
  id: string;
  label: string;
  description: string;
  items: Entry[];
};

type SelectedModifier = {
  modifierGroupId: string;
  modifierGroupName: string;
  modifierOptionId: string;
  modifierOptionName: string;
  price: number;
};

type CartLine = {
  id: string;
  signature: string;
  itemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: SelectedModifier[];
  specialInstructions: string;
};

type CartToast = {
  id: number;
  message: string;
};

type UndoRemoval = {
  id: number;
  line: CartLine;
};

type AddSource = "quick_add" | "customizer" | "suggestion";

const IMAGE_POOL = [
  "/templates/ming/menu-1.webp",
  "/templates/ming/menu-2.webp",
  "/templates/ming/menu-3.webp",
  "/templates/ming/menu-4.webp",
] as const;

const SECTION_META = [
  ["popular", "Most Popular", "Top reorders in local Chinese takeout."],
  ["lunch-specials", "Lunch Specials", "Quick lunch plates and combos."],
  ["dinner-specials", "Dinner Specials", "Dinner-size portions for evening rush."],
  ["appetizers", "Appetizers", "Rolls, dumplings, and small plates."],
  ["chicken", "Chicken", "Classic Chinese chicken dishes."],
  ["beef", "Beef", "Wok beef favorites and steak-style entrees."],
  ["seafood", "Seafood", "Shrimp and seafood specialties."],
  ["noodles-rice", "Noodles & Fried Rice", "Lo mein, chow fun, and rice staples."],
  ["soups", "Soups", "Comfort soups for every order."],
  ["drinks", "Drinks", "Tea, soda, and cold refreshers."],
] as const;

const SECTION_ORDER = SECTION_META.map((meta) => meta[0]);

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function lineUnitPrice(line: CartLine): number {
  return line.basePrice + line.modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
}

function lineSignature(itemId: string, modifiers: SelectedModifier[]): string {
  const sorted = [...modifiers]
    .map((modifier) => `${modifier.modifierGroupId}:${modifier.modifierOptionId}`)
    .sort()
    .join("|");
  return `${itemId}::${sorted}`;
}

function lineSignatureWithNote(
  itemId: string,
  modifiers: SelectedModifier[],
  specialInstructions: string
): string {
  const note = specialInstructions.trim().toLowerCase();
  return `${lineSignature(itemId, modifiers)}::${note}`;
}

function buildOrderNotes(globalNotes: string, cartLines: CartLine[]): string | null {
  const topNote = globalNotes.trim();
  const lineNotes = cartLines
    .filter((line) => line.specialInstructions.trim())
    .map((line) => `${line.quantity}x ${line.name}: ${line.specialInstructions.trim()}`);

  const blocks = [topNote, lineNotes.length ? `Item instructions:\n${lineNotes.join("\n")}` : ""]
    .map((value) => value.trim())
    .filter(Boolean);

  if (!blocks.length) return null;
  return blocks.join("\n\n");
}

function defaultDraftFromItem(item: Entry): Record<string, string[]> {
  const draft: Record<string, string[]> = {};
  for (const group of item.modifierGroups ?? []) {
    draft[group.id] = group.options.filter((option) => option.isDefault).map((option) => option.id);
  }
  return draft;
}

function draftFromLine(item: Entry, line: CartLine): Record<string, string[]> {
  const draft: Record<string, string[]> = {};
  for (const group of item.modifierGroups ?? []) {
    draft[group.id] = line.modifiers
      .filter((modifier) => modifier.modifierGroupId === group.id)
      .map((modifier) => modifier.modifierOptionId);
  }
  return draft;
}

function selectedModifiers(item: Entry, draft: Record<string, string[]>): SelectedModifier[] {
  const selected: SelectedModifier[] = [];
  for (const group of item.modifierGroups ?? []) {
    const chosen = new Set(draft[group.id] ?? []);
    for (const option of group.options) {
      if (!chosen.has(option.id)) continue;
      selected.push({
        modifierGroupId: group.id,
        modifierGroupName: group.name,
        modifierOptionId: option.id,
        modifierOptionName: option.name,
        price: option.price,
      });
    }
  }
  return selected;
}

function validateDraft(item: Entry, draft: Record<string, string[]>): string | null {
  for (const group of item.modifierGroups ?? []) {
    const selectedCount = (draft[group.id] ?? []).length;
    const minimum = Math.max(group.isRequired ? 1 : 0, group.minSelect);
    const max = group.maxSelect > 0 ? group.maxSelect : null;
    if (minimum > 0 && selectedCount < minimum) {
      return `${group.name} requires at least ${minimum} selection(s).`;
    }
    if (max !== null && selectedCount > max) {
      return `${group.name} allows up to ${max} selection(s).`;
    }
  }
  return null;
}

function toggleOption(
  group: ModifierGroup,
  option: ModifierOption,
  draft: Record<string, string[]>
): Record<string, string[]> {
  const current = draft[group.id] ?? [];
  const isSelected = current.includes(option.id);
  const max = group.maxSelect > 0 ? group.maxSelect : null;
  const singleSelect = max === 1;

  if (singleSelect) {
    if (isSelected) {
      if (group.isRequired || group.minSelect > 0) return draft;
      return { ...draft, [group.id]: [] };
    }
    return { ...draft, [group.id]: [option.id] };
  }
  if (isSelected) return { ...draft, [group.id]: current.filter((id) => id !== option.id) };
  if (max !== null && current.length >= max) return draft;
  return { ...draft, [group.id]: [...current, option.id] };
}

function optionPriceLabel(option: ModifierOption): string {
  if (!option.price) return "Included";
  return option.price > 0 ? `+${formatPrice(option.price)}` : formatPrice(option.price);
}

function hasRequiredModifiers(item: Entry): boolean {
  return (item.modifierGroups ?? []).some((group) => group.isRequired || group.minSelect > 0);
}

function hasModifierGroups(item: Entry): boolean {
  return Boolean(item.modifierGroups?.length);
}

function canQuickAddItem(item: Entry): boolean {
  return !hasRequiredModifiers(item);
}

function itemPriceLabel(item: Entry): string {
  return hasModifierGroups(item) ? `${formatPrice(item.price)}+` : formatPrice(item.price);
}

function itemOptionCue(item: Entry): string | null {
  if (hasRequiredModifiers(item)) return "Required options";
  if (hasModifierGroups(item)) return "Optional add-ons";
  return null;
}

function groupProgressText(group: ModifierGroup, draft: Record<string, string[]>): string {
  const selectedCount = (draft[group.id] ?? []).length;
  const minimum = Math.max(group.isRequired ? 1 : 0, group.minSelect);
  const max = group.maxSelect > 0 ? group.maxSelect : null;

  if (minimum > 0) return selectedCount >= minimum ? "Ready" : `${selectedCount} of ${minimum} selected`;
  if (max) return `${selectedCount} selected`;
  return selectedCount ? `${selectedCount} selected` : "Nothing selected yet";
}

function groupSelectionRuleText(group: ModifierGroup): string {
  const minimum = Math.max(group.isRequired ? 1 : 0, group.minSelect);
  const max = group.maxSelect > 0 ? group.maxSelect : null;

  if (minimum > 0 && max && minimum === max) return `Select ${minimum}`;
  if (minimum > 0 && max) return `Select ${minimum}-${max}`;
  if (minimum > 0) return `Select at least ${minimum}`;
  if (max === 1) return "Choose up to 1";
  if (max) return `Choose up to ${max}`;
  return "Any extras";
}

function classifySection(entry: Entry): string {
  const text = `${entry.name} ${entry.description} ${entry.sourceCategory}`.toLowerCase();
  if (includesAny(text, ["lunch"])) return "lunch-specials";
  if (includesAny(text, ["appetizer", "egg roll", "roll", "dumpling", "wonton", "starter"])) return "appetizers";
  if (includesAny(text, ["soup", "egg drop", "hot & sour", "wonton soup"])) return "soups";
  if (includesAny(text, ["noodle", "lo mein", "chow", "fried rice", "rice", "mei fun", "ho fun", "pad thai"])) return "noodles-rice";
  if (includesAny(text, ["chicken"])) return "chicken";
  if (includesAny(text, ["beef", "steak"])) return "beef";
  if (includesAny(text, ["shrimp", "fish", "salmon", "crab", "scallop", "seafood"])) return "seafood";
  if (includesAny(text, ["drink", "tea", "soda", "boba", "bubble", "juice"])) return "drinks";
  return "dinner-specials";
}

function buildPopularItems(allItems: Entry[]): Entry[] {
  const curated: Entry[] = [];
  const seenIds = new Set<string>();
  const seenSections = new Set<string>();
  const preferred = allItems.filter((item) => item.popular);

  for (const candidate of preferred) {
    const sectionId = classifySection(candidate);
    if (seenSections.has(sectionId)) continue;
    curated.push(candidate);
    seenIds.add(candidate.id);
    seenSections.add(sectionId);
    if (curated.length === 4) return curated;
  }

  for (const candidate of [...preferred, ...allItems]) {
    if (seenIds.has(candidate.id)) continue;
    curated.push(candidate);
    seenIds.add(candidate.id);
    if (curated.length === 4) break;
  }

  return curated;
}

function buildSections(menu: MenuCategory[]): Section[] {
  const allItems: Entry[] = menu.flatMap((category) =>
    category.items.map((item) => {
      const sourceCategory = category.name;
      const seed = hashString(`${sourceCategory}-${item.id}`);
      const lowered = `${item.name} ${item.description} ${sourceCategory}`.toLowerCase();
      return {
        ...item,
        sourceCategory,
        imageUrl: IMAGE_POOL[seed % IMAGE_POOL.length],
        isVegetarian: includesAny(lowered, ["vegetable", "veggie", "tofu", "eggplant", "mushroom"]),
      };
    })
  );

  const buckets: Record<string, Entry[]> = {};
  for (const sectionId of SECTION_ORDER) buckets[sectionId] = [];
  for (const entry of allItems) buckets[classifySection(entry)].push(entry);
  buckets.popular = buildPopularItems(allItems);

  const sections: Section[] = [];
  for (const [id, label, description] of SECTION_META) {
    if (!buckets[id]?.length) continue;
    sections.push({ id, label, description, items: buckets[id] });
  }
  return sections;
}

function suggestionReasonLabel(item: Entry, latestAddedEntry: Entry | null): string {
  const itemSection = classifySection(item);
  const latestSection = latestAddedEntry ? classifySection(latestAddedEntry) : null;

  if (latestSection && itemSection === latestSection && item.popular) {
    return "Popular with this order";
  }
  if (latestSection && itemSection === latestSection) {
    return "Pairs well next";
  }
  if (item.popular) {
    return "Top reorder";
  }
  if (itemSection === "drinks") {
    return "Easy add-on";
  }
  return "House favorite";
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function LocalOrderBoard({
  restaurantName,
  menu,
  orderPath,
  orderingEnabled,
  variant,
}: Props) {
  const isStorefront = variant === "local-storefront";
  const isExpress = variant === "local-express";
  const isFeast = variant === "local-feast";
  const theme =
    isStorefront
      ? {
          shell: "border-[#d6cabf] bg-[#f8f4ef]",
          sticky: "border-[#ddd2c7] bg-[#f2ece4]",
          activePill: "border-[#202020] bg-[#202020] text-white shadow-sm",
          inactivePill: "border-[#d5c8bd] bg-white text-[#6d6157] hover:bg-[#fbf6f1]",
          primaryButton: "bg-[#202020] text-white hover:bg-[#111111]",
          darkButton: "bg-[#3c2a20] text-white hover:bg-[#251912]",
          floatingBar: "border-[#dcc8ba] bg-[#1f1915] text-white",
          floatingMeta: "text-[#e8ccb9]",
          toast: "border-[#d8c1b0] bg-[#1f1915] text-white",
          toastDot: "bg-[#e6b18f]",
          successButton: "bg-[#2f7a3f] text-white",
        }
      : isExpress
        ? {
            shell: "border-[#d8dfd4] bg-[#fbfcf8]",
            sticky: "border-[#dee6d9] bg-[#f4f8f1]",
            activePill: "border-[#161b18] bg-[#161b18] text-white shadow-sm",
            inactivePill: "border-[#dbe3d7] bg-white text-[#5f675f] hover:bg-[#f8fbf5]",
            primaryButton: "bg-[#e8662b] text-white hover:bg-[#cf551f]",
            darkButton: "bg-[#1c2620] text-white hover:bg-[#101712]",
            floatingBar: "border-[#efceb9] bg-[#16201a] text-white",
            floatingMeta: "text-[#ffd4bf]",
            toast: "border-[#efceb9] bg-[#16201a] text-white",
            toastDot: "bg-[#ffb48e]",
            successButton: "bg-[#27865d] text-white",
          }
        : isFeast
          ? {
              shell: "border-[#e0d1c3] bg-[#fbf6f0]",
              sticky: "border-[#e4d8ce] bg-[#f9f1e8]",
              activePill: "border-[#6d2414] bg-[#6d2414] text-white shadow-sm",
              inactivePill: "border-[#e1d5ca] bg-white text-[#705f52] hover:bg-[#fff9f3]",
              primaryButton: "bg-[#a5421f] text-white hover:bg-[#8d3517]",
              darkButton: "bg-[#3b2218] text-white hover:bg-[#25150f]",
              floatingBar: "border-[#ebc8b6] bg-[#351d15] text-white",
              floatingMeta: "text-[#ffd2ba]",
              toast: "border-[#efc8b6] bg-[#351d15] text-white",
              toastDot: "bg-[#ffbd99]",
              successButton: "bg-[#2f7a3f] text-white",
            }
      : {
          shell: "border-[#ded1c4] bg-[#fbf8f4]",
          sticky: "border-[#e5d9cc] bg-[#f7f1e8]",
          activePill: "border-[#b3342d] bg-[#b3342d] text-white shadow-sm",
          inactivePill: "border-[#d8c9ba] bg-white text-[#7a6a58] hover:bg-[#fff7f2]",
          primaryButton: "bg-[#b3342d] text-white hover:bg-[#9c2a23]",
          darkButton: "bg-[#2f241d] text-white hover:bg-[#1b140f]",
          floatingBar: "border-[#e8d3c5] bg-[#2b2018] text-white",
          floatingMeta: "text-[#ffccb8]",
          toast: "border-[#efc2b6] bg-[#2b2018] text-white",
          toastDot: "bg-[#ffb19a]",
          successButton: "bg-[#2f7a3f] text-white",
        };
  const stickyWrapClass = isExpress
    ? "sticky top-[68px] z-20 border-b px-4 py-2.5 md:px-5"
    : "sticky top-[72px] z-20 border-b px-4 py-2.5 md:px-6";
  const stickySearchWidthClass = isExpress ? "relative block w-full lg:max-w-sm" : "relative block w-full lg:max-w-md";
  const searchInputClass = isExpress
    ? "w-full rounded-full border border-[#d8ded3] bg-white px-4 py-2 text-sm text-[#243029] shadow-sm transition-all placeholder:text-[#879087] focus:border-[#e8662b] focus:outline-none focus:ring-2 focus:ring-[#f7d9ca]"
    : "w-full rounded-full border border-[#dbcfc3] bg-white px-4 py-2.5 text-sm text-[#2f241d] shadow-sm transition-all placeholder:text-[#8d8074] focus:border-[#c53d30] focus:outline-none focus:ring-2 focus:ring-[#f5d7ce]";
  const stickyMetaClass = isExpress
    ? "text-[11px] font-semibold text-[#647068]"
    : "text-xs font-semibold uppercase tracking-[0.14em] text-[#856f5b]";
  const stickyCartButtonClass = isExpress
    ? `hidden rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm transition-all md:inline-flex md:items-center md:gap-2 ${theme.primaryButton}`
    : `hidden rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] shadow-sm transition-all md:inline-flex md:items-center md:gap-2 ${theme.primaryButton}`;
  const stickyFulfillmentWrapClass = isExpress
    ? "flex flex-col gap-2 rounded-[22px] border border-[#dfe6da] bg-white/92 p-2.5 shadow-sm md:flex-row md:items-center md:justify-between"
    : isFeast
      ? "flex flex-col gap-2 rounded-[24px] border border-[#e4d7cc] bg-white/92 p-3 shadow-sm md:flex-row md:items-center md:justify-between"
      : "flex flex-col gap-2 rounded-2xl border border-[#e4d8cc] bg-white/92 p-3 shadow-sm md:flex-row md:items-center md:justify-between";
  const stickyFulfillmentLabelClass = isExpress
    ? "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#617067]"
    : "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]";
  const stickyFulfillmentNoteClass = isExpress
    ? "text-xs text-[#66736b]"
    : "text-xs text-[#78695c]";
  const stickyFulfillmentEtaClass = isExpress
    ? "rounded-full border border-[#f0d9cd] bg-[#fff4ec] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#cb5520]"
    : isFeast
      ? "rounded-full border border-[#efd7c8] bg-[#fff4ec] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a5421f]"
      : "rounded-full border border-[#edd8cc] bg-[#fff4ee] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b3342d]";
  const getStickyFulfillmentButtonClass = (active: boolean) =>
    `${active ? cartModeActiveClass : cartModeInactiveClass} rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors`;
  const railClass = isExpress
    ? "flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5"
    : "flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5";
  const getRailButtonClass = (active: boolean) =>
    `${active ? theme.activePill : theme.inactivePill} rounded-full border ${
      isExpress
        ? "px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em]"
        : "px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
    } transition-all`;
  const boardGridClass = isExpress
    ? "grid gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_340px]"
    : "grid gap-5 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_350px]";
  const sectionClass = isExpress ? "scroll-mt-[208px] space-y-3" : "scroll-mt-[226px] space-y-3";
  const sectionHeaderClass = isExpress
    ? "rounded-[24px] border border-[#dfe7db] bg-white p-3.5"
    : "rounded-[24px] border border-[#e1d5c8] bg-white p-3.5";
  const sectionEyebrowClass = isExpress
    ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cb5520]"
    : "text-xs font-semibold uppercase tracking-[0.2em] text-[#b2342d]";
  const sectionTitleClass = isExpress
    ? "mt-1 text-[1.65rem] font-semibold leading-tight text-[#223029]"
    : "mt-1 text-[1.85rem] font-semibold leading-tight text-[#2d2219]";
  const sectionDescriptionClass = isExpress
    ? "mt-1 text-sm text-[#67736c]"
    : "mt-1 text-[13px] text-[#6f6256]";
  const menuGridClass = isExpress
    ? "grid gap-3 md:grid-cols-2 2xl:grid-cols-3"
    : "grid gap-3 md:grid-cols-2 2xl:grid-cols-3";
  const cardClass = isExpress
    ? "group flex flex-col rounded-[24px] border border-[#dfe6da] bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cbd7ca] hover:shadow-[0_18px_46px_rgba(41,53,38,0.08)]"
    : "group flex flex-col rounded-[24px] border border-[#ddcebf] bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d1bba8] hover:shadow-[0_18px_48px_rgba(71,34,11,0.08)]";
  const cardTitleClass = isExpress
    ? "line-clamp-2 text-[1.35rem] font-semibold leading-tight text-[#223029]"
    : "line-clamp-2 text-[1.45rem] font-semibold leading-tight text-[#2a2018]";
  const cardPriceClass = isExpress
    ? "mt-1 text-sm font-semibold text-[#cb5520]"
    : "mt-1 text-sm font-semibold text-[#b2342d]";
  const cardDescriptionClass = isExpress
    ? "mt-2 line-clamp-3 text-sm text-[#627069]"
    : "mt-2 line-clamp-3 text-sm text-[#66594d]";
  const cardTagClass = isExpress
    ? "mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
    : "mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]";
  const cardImageClass = isExpress
    ? "h-24 w-24 shrink-0 rounded-[20px] border border-[#e2e8de] bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
    : "h-24 w-24 shrink-0 rounded-[20px] border border-[#e7dccf] bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]";
  const cardActionsClass = isExpress
    ? "mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-2"
    : "mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] gap-2";
  const emptyStateClass = isExpress
    ? "rounded-[24px] border border-dashed border-[#dfe6da] bg-white px-5 py-8 text-center shadow-sm"
    : "rounded-[28px] border border-dashed border-[#ddcdbe] bg-white px-5 py-8 text-center shadow-sm";
  const cartEyebrowClass = isExpress
    ? "text-xs font-semibold uppercase tracking-[0.2em] text-[#cb5520]"
    : "text-xs font-semibold uppercase tracking-[0.2em] text-[#b2342d]";
  const cartHelperClass = isExpress ? "mt-1 text-sm text-[#67736b]" : "mt-1 text-sm text-[#6f6256]";
  const cartCountChipClass = isExpress
    ? "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
    : "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]";
  const cartModeActiveClass = isExpress
    ? "border-[#e8662b] bg-[#e8662b] text-white"
    : "border-[#b3342d] bg-[#b3342d] text-white";
  const cartModeInactiveClass = isExpress
    ? "border-[#dbe3d7] bg-white text-[#5f675f] hover:bg-[#f8fbf5]"
    : "border-[#ddd1c4] bg-white text-[#6f6356] hover:bg-[#fff8f2]";
  const cartShellClass = isExpress
    ? "rounded-[22px] border border-[#e2e8de] bg-[#fcfdfb] p-4"
    : "rounded-2xl border border-[#e2d7cc] bg-[#fffdfa] p-4";
  const cartTitleClass = isExpress ? "text-sm font-semibold text-[#223029]" : "text-sm font-semibold text-[#2e241c]";
  const cartTextClass = isExpress ? "text-xs text-[#6b776f]" : "text-xs text-[#726658]";
  const cartSubtotalChipClass = isExpress
    ? "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
    : "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]";
  const cartEmptyStateBoxClass = isExpress
    ? "mt-4 rounded-[20px] border border-dashed border-[#e1e7dc] bg-white px-4 py-5"
    : "mt-4 rounded-2xl border border-dashed border-[#eadccf] bg-white px-4 py-5";
  const cartEmptyTitleClass = isExpress ? "text-sm font-semibold text-[#223029]" : "text-sm font-semibold text-[#2f241d]";
  const cartEmptyTextClass = isExpress ? "mt-1 text-xs text-[#6b776f]" : "mt-1 text-xs text-[#726658]";
  const cartCheckoutCardClass = isExpress
    ? "rounded-[22px] border border-[#e2e8de] bg-white p-4 shadow-sm"
    : isFeast
      ? "rounded-[24px] border border-[#ead8cc] bg-white p-4 shadow-sm"
      : "rounded-[22px] border border-[#eadccf] bg-white p-4 shadow-sm";
  const cartCheckoutLabelClass = isExpress
    ? "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cb5520]"
    : isFeast
      ? "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a5421f]"
      : "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab3128]";
  const cartCheckoutBodyClass = isExpress ? "mt-1 text-sm text-[#67736b]" : "mt-1 text-sm text-[#6f6256]";
  const cartCheckoutSubtotalClass = isExpress
    ? "rounded-full bg-[#f4f8f1] px-3 py-1.5 text-sm font-semibold text-[#223029]"
    : isFeast
      ? "rounded-full bg-[#faf1ea] px-3 py-1.5 text-sm font-semibold text-[#3b2218]"
      : "rounded-full bg-[#f8f2ec] px-3 py-1.5 text-sm font-semibold text-[#2e241c]";
  const mobileCartDialogClass = isExpress
    ? "absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[30px] border border-[#dfe6da] bg-[#fbfcf8] shadow-2xl"
    : "absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[30px] border border-[#ddcdbe] bg-[#fbf8f4] shadow-2xl";
  const mobileCartHeaderClass = isExpress
    ? "flex items-center justify-between border-b border-[#dfe6da] px-4 py-3"
    : "flex items-center justify-between border-b border-[#e5d9cc] px-4 py-3";
  const mobileCartHandleClass = isExpress ? "mx-auto h-1.5 w-14 rounded-full bg-[#d7ddd3]" : "mx-auto h-1.5 w-14 rounded-full bg-[#dfd3c7]";
  const mobileCartCloseClass = isExpress
    ? "rounded-full border border-[#d8dfd4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#65716a]"
    : "rounded-full border border-[#dccdbe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#73675b]";
  const sections = useMemo(() => buildSections(menu), [menu]);
  const allEntries = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const entryById = useMemo(
    () => new Map(allEntries.map((entry) => [entry.id, entry])),
    [allEntries]
  );
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderOut | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCheckoutDetails, setShowCheckoutDetails] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [quickAddPendingItemId, setQuickAddPendingItemId] = useState<string | null>(null);
  const [quickAddSuccessItemId, setQuickAddSuccessItemId] = useState<string | null>(null);
  const [customizeBusy, setCustomizeBusy] = useState(false);
  const [customizeSuccess, setCustomizeSuccess] = useState(false);
  const [cartToast, setCartToast] = useState<CartToast | null>(null);
  const [undoRemoval, setUndoRemoval] = useState<UndoRemoval | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [cartPulseActive, setCartPulseActive] = useState(false);
  const [highlightedLineIds, setHighlightedLineIds] = useState<string[]>([]);
  const [removingLineIds, setRemovingLineIds] = useState<string[]>([]);
  const [lastAddedMeta, setLastAddedMeta] = useState<{ itemId: string; sourceCategory: string } | null>(null);
  const [customizingItem, setCustomizingItem] = useState<Entry | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [draftSelections, setDraftSelections] = useState<Record<string, string[]>>({});
  const [draftQty, setDraftQty] = useState(1);
  const [draftSpecialInstructions, setDraftSpecialInstructions] = useState("");
  const [customizeError, setCustomizeError] = useState<string | null>(null);

  const lineCounter = useRef(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const desktopCartRef = useRef<HTMLElement>(null);
  const customizerDialogRef = useRef<HTMLDivElement>(null);
  const mobileCartDialogRef = useRef<HTMLDivElement>(null);
  const checkoutFieldsRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  const totalItems = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.quantity * lineUnitPrice(line), 0);
  const canBeginCheckout = orderingEnabled && totalItems > 0 && !isSubmitting;
  const canSubmit = canBeginCheckout && showCheckoutDetails;
  const normalizedMenuSearch = menuSearch.trim().toLowerCase();
  const visibleSections = useMemo(() => {
    if (!normalizedMenuSearch) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${item.name} ${item.description} ${item.sourceCategory} ${section.label}`
            .toLowerCase()
            .includes(normalizedMenuSearch)
        ),
      }))
      .filter((section) => section.items.length);
  }, [normalizedMenuSearch, sections]);
  const visibleItemCount = useMemo(
    () => visibleSections.reduce((sum, section) => sum + section.items.length, 0),
    [visibleSections]
  );
  const editingCartLine = useMemo(
    () => (editingLineId ? cartLines.find((line) => line.id === editingLineId) ?? null : null),
    [cartLines, editingLineId]
  );
  const selectedDraftModifiers = customizingItem
    ? selectedModifiers(customizingItem, draftSelections)
    : [];
  const draftPrice =
    customizingItem
      ? (customizingItem.price + selectedDraftModifiers.reduce((sum, modifier) => sum + modifier.price, 0)) * draftQty
      : 0;
  const highlightedLineIdSet = useMemo(() => new Set(highlightedLineIds), [highlightedLineIds]);
  const removingLineIdSet = useMemo(() => new Set(removingLineIds), [removingLineIds]);
  const serviceModeSummary = fulfillment === "delivery" ? "Delivery 30-40 min" : "Pickup 15-25 min";
  const stickyStatusLabel = normalizedMenuSearch
    ? `${serviceModeSummary} | ${visibleItemCount} match${visibleItemCount === 1 ? "" : "es"}`
    : isExpress
      ? `${serviceModeSummary} | ${sections.length} section${sections.length === 1 ? "" : "s"}`
      : isFeast
        ? `${serviceModeSummary} | tray picks + ${sections.length} sections`
      : `${sections.length} menu section${sections.length === 1 ? "" : "s"}`;
  const desktopCartClass = isExpress
    ? `hidden h-fit rounded-[24px] border border-[#dfe6da] bg-white p-4 shadow-sm xl:sticky xl:top-[132px] xl:block ${
        cartPulseActive
          ? "ring-2 ring-[#f2d2bf] shadow-[0_20px_50px_rgba(232,102,43,0.15)]"
          : ""
      }`
    : isFeast
      ? `hidden h-fit rounded-[28px] border border-[#e3d7cc] bg-white p-4 shadow-sm xl:sticky xl:top-[146px] xl:block ${
          cartPulseActive
            ? "ring-2 ring-[#f0cabc] shadow-[0_20px_50px_rgba(165,66,31,0.16)]"
            : ""
        }`
    : `hidden h-fit rounded-[28px] border border-[#ddcdbe] bg-white p-4 shadow-sm xl:sticky xl:top-[146px] xl:block ${
        cartPulseActive
          ? "ring-2 ring-[#efc2b6] shadow-[0_20px_50px_rgba(177,52,45,0.16)]"
          : ""
      }`;
  const cartLabel = isFeast ? "Large-order cart" : "Direct order cart";
  const cartLiveHint = isFeast
    ? "Use notes for guest count, timing, or tray details."
    : "Your order updates instantly here.";
  const cartEmptyHint = isFeast
    ? "Start with tray-friendly favorites, then use notes for pickup timing, guest count, or event details."
    : "Tap an add button for a fast order, or open details to customize first.";
  const notesPlaceholder = isFeast
    ? "Guest count, pickup window, event notes, or tray requests (optional)"
    : "Order notes (optional)";
  const suggestionHeading = isFeast ? "Round Out The Table" : "Need Anything Else?";
  const suggestionDetail = isFeast
    ? "Add rice, appetizers, or extra favorites to complete the larger order."
    : "Quick add-ons local diners often pick next.";
  const latestAddedEntry = useMemo(() => {
    if (!lastAddedMeta) return null;
    return (
      allEntries.find(
        (entry) =>
          entry.id === lastAddedMeta.itemId &&
          entry.sourceCategory === lastAddedMeta.sourceCategory
      ) ??
      allEntries.find((entry) => entry.id === lastAddedMeta.itemId) ??
      null
    );
  }, [allEntries, lastAddedMeta]);
  const requiredSelectionProgress = useMemo(() => {
    if (!customizingItem) return { complete: 0, total: 0 };

    return (customizingItem.modifierGroups ?? []).reduce(
      (summary, group) => {
        if (!group.isRequired && group.minSelect <= 0) return summary;

        const selectedCount = (draftSelections[group.id] ?? []).length;
        const minimum = Math.max(group.isRequired ? 1 : 0, group.minSelect);
        return {
          total: summary.total + 1,
          complete: summary.complete + (selectedCount >= minimum ? 1 : 0),
        };
      },
      { complete: 0, total: 0 }
    );
  }, [customizingItem, draftSelections]);
  const draftValidationError = customizingItem ? validateDraft(customizingItem, draftSelections) : null;
  const canSubmitCustomizedItem = !customizeBusy && !draftValidationError;
  const suggestedItems = useMemo(() => {
    if (!latestAddedEntry || !totalItems) return [];

    const cartItemIds = new Set(cartLines.map((line) => line.itemId));
    const pickedIds = new Set<string>();
    const suggestions: Entry[] = [];
    const sameCategory = allEntries.filter(
      (entry) =>
        entry.id !== latestAddedEntry.id &&
        entry.sourceCategory === latestAddedEntry.sourceCategory &&
        !cartItemIds.has(entry.id)
    );
    const popularFallback = allEntries.filter(
      (entry) =>
        entry.id !== latestAddedEntry.id &&
        entry.popular &&
        !cartItemIds.has(entry.id)
    );

    for (const candidate of [...sameCategory, ...popularFallback, ...allEntries]) {
      if (candidate.id === latestAddedEntry.id || cartItemIds.has(candidate.id)) continue;
      if (pickedIds.has(candidate.id)) continue;
      pickedIds.add(candidate.id);
      suggestions.push(candidate);
      if (suggestions.length === 3) break;
    }

    return suggestions;
  }, [allEntries, cartLines, latestAddedEntry, totalItems]);
  const serviceModeEtaLabel = fulfillment === "delivery" ? "ETA 30-40 min" : "Ready in 15-25 min";
  const serviceModeHelperText = orderingEnabled
    ? "Change anytime before checkout."
    : "Ordering actions are disabled on this preview.";

  function queueTimeout(callback: () => void, delay: number) {
    const timeoutId = window.setTimeout(() => {
      callback();
      timeoutsRef.current = timeoutsRef.current.filter((entry) => entry !== timeoutId);
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (!visibleSections.find((section) => section.id === activeSectionId)) {
      setActiveSectionId(visibleSections[0]?.id ?? "");
    }
  }, [visibleSections, activeSectionId]);

  useEffect(() => {
    const nodes = visibleSections
      .map((section) => sectionRefs.current[section.id])
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (!visible) return;
        const sectionId = (visible.target as HTMLElement).dataset.sectionId;
        if (sectionId) setActiveSectionId(sectionId);
      },
      {
        root: null,
        rootMargin: "-180px 0px -55% 0px",
        threshold: [0.1, 0.3, 0.6],
      }
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [visibleSections]);

  useEffect(() => {
    if (totalItems > 0) return;
    setShowCheckoutDetails(false);
    setMobileCartOpen(false);
  }, [totalItems]);

  useEffect(() => {
    if (!showCheckoutDetails) return;
    queueTimeout(() => {
      checkoutFieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [showCheckoutDetails]);

  useEffect(() => {
    const lockScroll = Boolean(customizingItem) || mobileCartOpen;
    if (!lockScroll) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [customizingItem, mobileCartOpen]);

  useEffect(() => {
    const dialog = customizingItem
      ? customizerDialogRef.current
      : mobileCartOpen
      ? mobileCartDialogRef.current
      : null;
    if (!dialog) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    queueTimeout(() => {
      const [firstFocusable] = getFocusableElements(dialog);
      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (customizingItem) {
          closeCustomizer();
        } else {
          setMobileCartOpen(false);
        }
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [customizingItem, mobileCartOpen]);

  function announce(message: string) {
    setLiveMessage("");
    queueTimeout(() => setLiveMessage(message), 20);
  }

  function showToast(message: string) {
    const toastId = Date.now();
    setCartToast({ id: toastId, message });
    announce(message);
    queueTimeout(() => {
      setCartToast((current) => (current?.id === toastId ? null : current));
    }, 2400);
  }

  function pulseCart() {
    setCartPulseActive(true);
    queueTimeout(() => setCartPulseActive(false), 650);
  }

  function flashLine(lineId: string) {
    setHighlightedLineIds((prev) => (prev.includes(lineId) ? prev : [...prev, lineId]));
    queueTimeout(() => {
      setHighlightedLineIds((prev) => prev.filter((entry) => entry !== lineId));
    }, 760);
  }

  function markQuickAddSuccess(itemId: string) {
    setQuickAddSuccessItemId(itemId);
    queueTimeout(() => {
      setQuickAddSuccessItemId((current) => (current === itemId ? null : current));
    }, 900);
  }

  function upsertLine(
    item: Entry,
    modifiers: SelectedModifier[],
    quantity = 1,
    specialInstructions = ""
  ) {
    const signature = lineSignatureWithNote(item.id, modifiers, specialInstructions);
    let affectedLineId = "";

    setCartLines((prev) => {
      const existing = prev.find((line) => line.signature === signature);
      if (existing) {
        affectedLineId = existing.id;
        return prev.map((line) =>
          line.signature === signature ? { ...line, quantity: line.quantity + quantity } : line
        );
      }

      lineCounter.current += 1;
      affectedLineId = `${item.id}-${lineCounter.current}`;
      return [
        ...prev,
        {
          id: affectedLineId,
          signature,
          itemId: item.id,
          name: item.name,
          basePrice: item.price,
          quantity,
          modifiers,
          specialInstructions: specialInstructions.trim(),
        },
      ];
    });

    return affectedLineId;
  }

  function addItemToCart({
    item,
    modifiers,
    quantity = 1,
    specialInstructions = "",
    source,
  }: {
    item: Entry;
    modifiers: SelectedModifier[];
    quantity?: number;
    specialInstructions?: string;
    source: AddSource;
  }) {
    const affectedLineId = upsertLine(item, modifiers, quantity, specialInstructions);
    setLastAddedMeta({ itemId: item.id, sourceCategory: item.sourceCategory });
    pulseCart();
    if (affectedLineId) flashLine(affectedLineId);

    const message =
      quantity > 1
        ? `Added ${quantity} ${item.name} to your cart.`
        : `Added ${item.name} to your cart.`;
    showToast(message);

    trackEvent("local_order_added", {
      template: variant,
      source,
      item_id: item.id,
      item_name: item.name,
      quantity,
      fulfillment,
    });

    if (source === "quick_add") {
      trackEvent("local_order_quick_add", {
        template: variant,
        item_id: item.id,
        fulfillment,
      });
    }

    if (source === "suggestion") {
      trackEvent("local_order_suggestion_added", {
        template: variant,
        item_id: item.id,
        fulfillment,
      });
    }
  }

  function openCustomizer(
    item: Entry,
    source: "card" | "details" | "suggestion" | "cart" = "card"
  ) {
    if (!orderingEnabled) return;
    setCustomizingItem(item);
    setEditingLineId(null);
    setDraftSelections(defaultDraftFromItem(item));
    setDraftQty(1);
    setDraftSpecialInstructions("");
    setCustomizeError(null);
    setCustomizeSuccess(false);
    setCustomizeBusy(false);
    setMobileCartOpen(false);
    trackEvent("local_order_customizer_opened", {
      template: variant,
      item_id: item.id,
      item_name: item.name,
      source,
      fulfillment,
    });
  }

  function openCartLineEditor(line: CartLine) {
    if (!orderingEnabled) return;

    const item = entryById.get(line.itemId);
    if (!item) return;

    setCustomizingItem(item);
    setEditingLineId(line.id);
    setDraftSelections(draftFromLine(item, line));
    setDraftQty(line.quantity);
    setDraftSpecialInstructions(line.specialInstructions);
    setCustomizeError(null);
    setCustomizeSuccess(false);
    setCustomizeBusy(false);
    setMobileCartOpen(false);

    trackEvent("local_order_line_edit_opened", {
      template: variant,
      item_id: line.itemId,
      quantity: line.quantity,
      fulfillment,
    });
  }

  function closeCustomizer() {
    setCustomizingItem(null);
    setEditingLineId(null);
    setDraftSelections({});
    setDraftQty(1);
    setDraftSpecialInstructions("");
    setCustomizeError(null);
    setCustomizeSuccess(false);
    setCustomizeBusy(false);
  }

  function scrollToSection(sectionId: string) {
    setActiveSectionId(sectionId);
    const node = sectionRefs.current[sectionId];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openCartFromStickyHeader() {
    if (!totalItems) {
      const firstVisibleSectionId = visibleSections[0]?.id ?? sections[0]?.id;
      if (firstVisibleSectionId) {
        scrollToSection(firstVisibleSectionId);
      }
      return;
    }

    trackEvent("local_order_cart_opened", {
      template: variant,
      source: "sticky_header",
      item_count: totalItems,
    });

    if (window.innerWidth >= 1280) {
      const target = showCheckoutDetails ? checkoutFieldsRef.current : desktopCartRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      pulseCart();
      return;
    }

    setMobileCartOpen(true);
  }

  async function handleQuickAdd(item: Entry, source: AddSource = "quick_add") {
    if (!orderingEnabled) return;
    if (!canQuickAddItem(item)) {
      openCustomizer(item, source === "suggestion" ? "suggestion" : "details");
      return;
    }
    if (quickAddPendingItemId) return;

    setQuickAddPendingItemId(item.id);
    setOrderResult(null);
    setErrorMessage(null);

    try {
      await sleep(160);
      addItemToCart({
        item,
        modifiers: selectedModifiers(item, defaultDraftFromItem(item)),
        source,
      });
      markQuickAddSuccess(item.id);
    } finally {
      setQuickAddPendingItemId(null);
    }
  }

  function beginCheckout(source: "desktop" | "mobile") {
    if (!canBeginCheckout) return;
    if (!showCheckoutDetails) {
      setShowCheckoutDetails(true);
      trackEvent("local_order_checkout_started", {
        template: variant,
        source,
        fulfillment,
        item_count: totalItems,
      });
    }
    if (source === "mobile") {
      setMobileCartOpen(true);
    }
  }

  function removeLine(line: CartLine, source: "remove_button" | "quantity_stepper" = "remove_button") {
    setRemovingLineIds((prev) => (prev.includes(line.id) ? prev : [...prev, line.id]));
    queueTimeout(() => {
      const removalId = Date.now();
      setCartLines((prev) => prev.filter((entry) => entry.id !== line.id));
      setRemovingLineIds((prev) => prev.filter((entry) => entry !== line.id));
      setUndoRemoval({ id: removalId, line });
      announce(`Removed ${line.name} from your cart.`);
      queueTimeout(() => {
        setUndoRemoval((current) => (current?.id === removalId ? null : current));
      }, 4200);
      trackEvent("local_order_line_removed", {
        template: variant,
        item_id: line.itemId,
        quantity: line.quantity,
        source,
      });
    }, 220);
  }

  function restoreRemovedLine(line: CartLine) {
    let restoredLineId = line.id;

    setCartLines((prev) => {
      const existing = prev.find((entry) => entry.signature === line.signature);
      if (existing) {
        restoredLineId = existing.id;
        return prev.map((entry) =>
          entry.signature === line.signature
            ? { ...entry, quantity: entry.quantity + line.quantity }
            : entry
        );
      }

      return [...prev, line];
    });

    setUndoRemoval(null);
    flashLine(restoredLineId);
    pulseCart();
    showToast(`Restored ${line.name} to your cart.`);
    trackEvent("local_order_line_restored", {
      template: variant,
      item_id: line.itemId,
      quantity: line.quantity,
    });
  }

  function updateLineQuantity(line: CartLine, nextQuantity: number) {
    if (nextQuantity <= 0) {
      removeLine(line, "quantity_stepper");
      return;
    }

    setCartLines((prev) =>
      prev.map((entry) => (entry.id === line.id ? { ...entry, quantity: nextQuantity } : entry))
    );
    flashLine(line.id);
    pulseCart();
    trackEvent("local_order_quantity_changed", {
      template: variant,
      item_id: line.itemId,
      quantity: nextQuantity,
      action: nextQuantity > line.quantity ? "increase" : "decrease",
    });
  }

  async function handleAddCustomizedItem() {
    if (!customizingItem || customizeBusy) return;
    const error = validateDraft(customizingItem, draftSelections);
    if (error) {
      setCustomizeError(error);
      return;
    }

    setCustomizeBusy(true);
    setCustomizeError(null);

    try {
      await sleep(180);
      const modifiers = selectedModifiers(customizingItem, draftSelections);
      const specialInstructions = draftSpecialInstructions.trim();

      if (editingLineId) {
        let affectedLineId = editingLineId;
        let mergedIntoExisting = false;
        const nextSignature = lineSignatureWithNote(
          customizingItem.id,
          modifiers,
          specialInstructions
        );

        setCartLines((prev) => {
          const existing = prev.find(
            (entry) => entry.id !== editingLineId && entry.signature === nextSignature
          );

          if (existing) {
            affectedLineId = existing.id;
            mergedIntoExisting = true;
            return prev
              .map((entry) =>
                entry.id === existing.id
                  ? { ...entry, quantity: entry.quantity + draftQty }
                  : entry
              )
              .filter((entry) => entry.id !== editingLineId);
          }

          return prev.map((entry) =>
            entry.id === editingLineId
              ? {
                  ...entry,
                  signature: nextSignature,
                  itemId: customizingItem.id,
                  name: customizingItem.name,
                  basePrice: customizingItem.price,
                  quantity: draftQty,
                  modifiers,
                  specialInstructions,
                }
              : entry
          );
        });

        setLastAddedMeta({ itemId: customizingItem.id, sourceCategory: customizingItem.sourceCategory });
        pulseCart();
        flashLine(affectedLineId);
        showToast(`Updated ${customizingItem.name} in your cart.`);
        trackEvent("local_order_line_edited", {
          template: variant,
          item_id: customizingItem.id,
          quantity: draftQty,
          modifier_count: modifiers.length,
          merged: mergedIntoExisting,
          fulfillment,
        });
      } else {
        addItemToCart({
          item: customizingItem,
          modifiers,
          quantity: draftQty,
          specialInstructions,
          source: "customizer",
        });
      }

      setCustomizeSuccess(true);
      queueTimeout(() => {
        closeCustomizer();
      }, 180);
    } finally {
      setCustomizeBusy(false);
    }
  }

  async function placeOrder() {
    if (!canSubmit) return;
    trackEvent("order_place_attempt", {
      template: variant,
      item_count: totalItems,
      fulfillment,
    });
    setIsSubmitting(true);
    setOrderResult(null);
    setErrorMessage(null);

    try {
      const order = await apiFetch<OrderOut>(`/orders${orderPath}`, {
        method: "POST",
        body: JSON.stringify({
          customer_name: name.trim() || null,
          customer_phone: phone.trim() || null,
          fulfillment_type: fulfillment,
          notes: buildOrderNotes(notes, cartLines),
          items: cartLines.map((line) => ({
            menu_item_id: line.itemId,
            quantity: line.quantity,
            modifiers: line.modifiers.map((modifier) => ({
              modifier_group_id: modifier.modifierGroupId,
              modifier_option_id: modifier.modifierOptionId,
            })),
          })),
        }),
      });
      setOrderResult(order);
      setCartLines([]);
      setNotes("");
      setName("");
      setPhone("");
      setShowCheckoutDetails(false);
      setMobileCartOpen(false);
      showToast("Order placed successfully.");
      trackEvent("order_place_success", {
        template: variant,
        order_id: order.id,
        item_count: totalItems,
      });
    } catch {
      setErrorMessage("Unable to place order. Please try again.");
      trackEvent("order_place_error", { template: variant });
    } finally {
      setIsSubmitting(false);
    }
  }

  const suggestionCards =
    orderingEnabled && suggestedItems.length ? (
      <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf5] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ab3128]">
              {suggestionHeading}
            </p>
            <p className="mt-1 text-sm text-[#6f6256]">{suggestionDetail}</p>
          </div>
          {latestAddedEntry ? (
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a6656]">
              After {latestAddedEntry.name}
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2">
          {suggestedItems.map((item) => {
            const canQuickAdd = canQuickAddItem(item);
            const suggestionReason = suggestionReasonLabel(item, latestAddedEntry);
            return (
              <div
                key={`suggestion-${item.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadccf] bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="h-14 w-14 shrink-0 rounded-2xl border border-[#eadccf] bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#fff4ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ab5b2f]">
                        {suggestionReason}
                      </span>
                      <span className="rounded-full bg-[#f7f1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#786757]">
                        {item.sourceCategory}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-[#2f241d]">{item.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#73675b]">
                      <span>{itemPriceLabel(item)}</span>
                      {itemOptionCue(item) ? <span>{itemOptionCue(item)}</span> : null}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    canQuickAdd ? handleQuickAdd(item, "suggestion") : openCustomizer(item, "suggestion")
                  }
                  disabled={!orderingEnabled || quickAddPendingItemId === item.id}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                    canQuickAdd
                      ? `${theme.primaryButton} disabled:opacity-60`
                      : "border border-[#decfbd] bg-white text-[#6f5a49] hover:bg-[#fff8f2]"
                  }`}
                >
                  {quickAddPendingItemId === item.id ? "Adding..." : canQuickAdd ? "Quick Add" : "Customize"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  function renderCartContent(mode: "desktop" | "mobile") {
    const isMobile = mode === "mobile";

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cartEyebrowClass}>
              {restaurantName}
            </p>
            <p className={cartHelperClass}>{cartLabel}</p>
          </div>
          <span
            className={`${cartCountChipClass} ${
              isExpress
                ? cartPulseActive
                  ? "bg-[#fff0e7] text-[#cb5520]"
                  : "bg-[#f2f6ef] text-[#66746c]"
                : isFeast
                  ? cartPulseActive
                    ? "bg-[#fff0e8] text-[#a5421f]"
                    : "bg-[#f8f1ea] text-[#7b6a5c]"
                : cartPulseActive
                  ? "bg-[#ffe7df] text-[#ad3328]"
                  : "bg-[#f5f2ec] text-[#756759]"
            }`}
          >
            {totalItems} item{totalItems === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <button
            type="button"
            onClick={() => setFulfillment("pickup")}
            className={`rounded-xl border px-3 py-2 font-semibold transition-all ${
              fulfillment === "pickup"
                ? cartModeActiveClass
                : cartModeInactiveClass
            }`}
          >
            Pickup
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("delivery")}
            className={`rounded-xl border px-3 py-2 font-semibold transition-all ${
              fulfillment === "delivery"
                ? cartModeActiveClass
                : cartModeInactiveClass
            }`}
          >
            Delivery
          </button>
        </div>

        <div className={cartShellClass}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={cartTitleClass}>Cart</p>
              <p className={cartTextClass}>
                {totalItems ? cartLiveHint : "Start with a favorite dish and your order will appear here."}
              </p>
            </div>
            <span
              className={`${cartSubtotalChipClass} ${
                isExpress
                  ? cartPulseActive
                    ? "bg-[#fff0e7] text-[#cb5520]"
                    : "bg-[#eef4eb] text-[#66746c]"
                  : isFeast
                    ? cartPulseActive
                      ? "bg-[#fff0e8] text-[#a5421f]"
                      : "bg-[#f8f1ea] text-[#7b6a5c]"
                  : cartPulseActive
                    ? "bg-[#ffe8e1] text-[#ab3328]"
                    : "bg-[#f5f2ec] text-[#756759]"
              }`}
            >
              {formatPrice(subtotal)}
            </span>
          </div>

          {cartLines.length === 0 ? (
            <div className={cartEmptyStateBoxClass}>
              <p className={cartEmptyTitleClass}>Your cart is empty.</p>
              <p className={cartEmptyTextClass}>{cartEmptyHint}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {cartLines.map((line) => {
                const isHighlighted = highlightedLineIdSet.has(line.id);
                const isRemoving = removingLineIdSet.has(line.id);
                const editableEntry = entryById.get(line.itemId);
                const canEditLine = Boolean(
                  editableEntry && (hasModifierGroups(editableEntry) || line.specialInstructions)
                );
                const lineTotal = lineUnitPrice(line) * line.quantity;
                return (
                  <div
                    key={line.id}
                    className={`rounded-2xl border px-3 py-3 transition-all duration-300 ${
                      isRemoving
                        ? "translate-x-3 opacity-0"
                        : isHighlighted
                        ? "scale-[1.01] border-[#efcabc] bg-[#fff6f1] shadow-sm"
                        : "border-[#ece2d8] bg-white opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {canEditLine ? (
                          <button
                            type="button"
                            onClick={() => openCartLineEditor(line)}
                            className="w-full rounded-xl p-1 text-left transition-colors hover:bg-[#fff9f5]"
                            aria-label={`Edit ${line.name}`}
                          >
                            <p className="truncate text-sm font-semibold text-[#2e241c]">{line.name}</p>
                            <p className="mt-1 truncate text-xs text-[#726658]">
                              {line.modifiers.length
                                ? line.modifiers.map((modifier) => modifier.modifierOptionName).join(", ")
                                : "Standard prep"}
                            </p>
                            {line.specialInstructions ? (
                              <p className="mt-1 truncate text-xs text-[#8a4a42]">
                                Note: {line.specialInstructions}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-[#b2342d]">
                                {formatPrice(lineTotal)} total
                              </span>
                              {line.quantity > 1 ? (
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a7a6d]">
                                  {formatPrice(lineUnitPrice(line))} each
                                </span>
                              ) : null}
                              <span className="rounded-full bg-[#fff3ed] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a5948]">
                                Tap details to edit
                              </span>
                            </div>
                          </button>
                        ) : (
                          <>
                            <p className="truncate text-sm font-semibold text-[#2e241c]">{line.name}</p>
                            <p className="mt-1 truncate text-xs text-[#726658]">
                              {line.modifiers.length
                                ? line.modifiers.map((modifier) => modifier.modifierOptionName).join(", ")
                                : "Standard prep"}
                            </p>
                            {line.specialInstructions ? (
                              <p className="mt-1 truncate text-xs text-[#8a4a42]">
                                Note: {line.specialInstructions}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-[#b2342d]">
                                {formatPrice(lineTotal)} total
                              </span>
                              {line.quantity > 1 ? (
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a7a6d]">
                                  {formatPrice(lineUnitPrice(line))} each
                                </span>
                              ) : null}
                            </div>
                          </>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => removeLine(line)}
                            className="inline-flex text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a4a42] transition-colors hover:text-[#b3342d]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line, line.quantity - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfd3c7] bg-white text-sm font-semibold text-[#675a4e] transition-colors hover:bg-[#fff7f2]"
                        >
                          -
                        </button>
                        <span className="min-w-[20px] text-center text-sm font-semibold text-[#2f241d]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line, line.quantity + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfd3c7] bg-white text-sm font-semibold text-[#675a4e] transition-colors hover:bg-[#fff7f2]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between border-t border-[#ece2d8] pt-2 text-sm font-semibold text-[#2e241c]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>
          )}
        </div>

        {cartLines.length > 0 ? (
          showCheckoutDetails ? (
            <div ref={checkoutFieldsRef} className="rounded-2xl border border-[#eadccf] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ab3128]">
                    Checkout Details
                  </p>
                  <p className="mt-1 text-sm text-[#6f6256]">
                    Add any optional details, then place your {fulfillment} order.
                  </p>
                </div>
                {!isMobile ? (
                  <button
                    type="button"
                    onClick={() => setShowCheckoutDetails(false)}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b6859]"
                  >
                    Back to Cart
                  </button>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-[#eee2d6] bg-[#fcf7f1] p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6e6155]">
                    {fulfillment === "pickup" ? "Pickup" : "Delivery"}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6e6155]">
                    {serviceModeEtaLabel}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6e6155]">
                    {totalItems} item{totalItems === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2e241c]">
                      {fulfillment === "pickup" ? "Order summary" : "Delivery summary"}
                    </p>
                    <p className="mt-1 text-xs text-[#75685c]">
                      Contact details stay optional. They help only if the restaurant needs to confirm timing or a special request.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a5a46]">
                      Total
                    </p>
                    <p className="text-lg font-semibold text-[#2f241d]">{formatPrice(subtotal)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6e62]">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Name (optional)"
                    className="w-full rounded-xl border border-[#e2d7cc] px-3 py-2 text-sm text-[#2f251d] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f5d7ce]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6e62]">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Phone (optional)"
                    className="w-full rounded-xl border border-[#e2d7cc] px-3 py-2 text-sm text-[#2f251d] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f5d7ce]"
                  />
                  <p className="mt-1 text-[11px] text-[#8d8074]">
                    Helpful if the restaurant needs to clarify timing or a substitution.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6e62]">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={notesPlaceholder}
                    className="min-h-[84px] w-full rounded-xl border border-[#e2d7cc] px-3 py-2 text-sm text-[#2f251d] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f5d7ce]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={placeOrder}
                disabled={!canSubmit}
                className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  canSubmit
                    ? "bg-[#b3342d] text-white hover:bg-[#9c2a23]"
                    : "cursor-not-allowed bg-[#e9dfd5] text-[#8a7d70]"
                }`}
              >
                {isSubmitting
                  ? "Placing Order..."
                  : `Place ${fulfillment === "pickup" ? "Pickup" : "Delivery"} Order - ${formatPrice(subtotal)}`}
              </button>
            </div>
          ) : (
            <div className={cartCheckoutCardClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={cartCheckoutLabelClass}>Ready to check out?</p>
                  <p className={cartCheckoutBodyClass}>
                    {fulfillment === "pickup" ? "Pickup order" : "Delivery order"} for {totalItems} item
                    {totalItems === 1 ? "" : "s"}.
                  </p>
                </div>
                <span className={cartCheckoutSubtotalClass}>{formatPrice(subtotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => beginCheckout(mode)}
                disabled={!canBeginCheckout}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  canBeginCheckout
                    ? theme.primaryButton
                    : "cursor-not-allowed bg-[#e9dfd5] text-[#8a7d70]"
                }`}
              >
                Continue to Checkout
              </button>
            </div>
          )
        ) : null}

        {!showCheckoutDetails ? suggestionCards : null}
        {!orderingEnabled ? (
          <p className="rounded-2xl border border-[#eadccf] bg-white px-4 py-3 text-xs text-[#887a6b]">
            Ordering is not enabled for this listing yet.
          </p>
        ) : null}

        {orderResult ? (
          <p className="rounded-xl bg-[#edf7ef] px-3 py-2 text-xs text-[#2f7a3f]">
            Order created: {orderResult.id.slice(0, 8)}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-xl bg-[#fff2f1] px-3 py-2 text-xs text-[#be3127]">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section
      id="menu"
      className={`relative rounded-3xl border shadow-sm ${theme.shell}`}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <div className={`${stickyWrapClass} ${theme.sticky}`}>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className={stickySearchWidthClass}>
              <span className="sr-only">Search the menu</span>
              <input
                type="search"
                value={menuSearch}
                onChange={(event) => setMenuSearch(event.target.value)}
                placeholder="Search the menu"
                className={searchInputClass}
              />
            </label>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className={stickyMetaClass}>
                {normalizedMenuSearch && !isExpress
                  ? `${visibleItemCount} matching dish${visibleItemCount === 1 ? "" : "es"}`
                  : stickyStatusLabel}
              </p>
              {orderingEnabled ? (
                <button
                  type="button"
                  onClick={openCartFromStickyHeader}
                  className={`${stickyCartButtonClass} ${cartPulseActive ? "scale-[1.01] ring-2 ring-[#f7d9ca]" : ""}`}
                >
                  <span>{totalItems ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "Start order"}</span>
                  <span aria-hidden="true">&bull;</span>
                  <span>{totalItems ? formatPrice(subtotal) : serviceModeEtaLabel}</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className={stickyFulfillmentWrapClass}>
            {orderingEnabled ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={stickyFulfillmentLabelClass}>How to get it</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillment("pickup")}
                      aria-pressed={fulfillment === "pickup"}
                      className={getStickyFulfillmentButtonClass(fulfillment === "pickup")}
                    >
                      Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillment("delivery")}
                      aria-pressed={fulfillment === "delivery"}
                      className={getStickyFulfillmentButtonClass(fulfillment === "delivery")}
                    >
                      Delivery
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={stickyFulfillmentEtaClass}>{serviceModeEtaLabel}</span>
                  <span className={stickyFulfillmentNoteClass}>{serviceModeHelperText}</span>
                </div>
              </>
            ) : (
              <>
                <span className={stickyFulfillmentLabelClass}>Menu preview only</span>
                <span className={stickyFulfillmentNoteClass}>{serviceModeHelperText}</span>
              </>
            )}
          </div>

          <div className={railClass}>
            {visibleSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={getRailButtonClass(activeSectionId === section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={boardGridClass}>
        <div className="space-y-6">
          {visibleSections.length ? (
            visibleSections.map((section) => (
              <section
                key={section.id}
                id={`menu-${section.id}`}
                data-section-id={section.id}
                ref={(node) => {
                  sectionRefs.current[section.id] = node;
                }}
                className={sectionClass}
              >
                <header className={sectionHeaderClass}>
                  <p className={sectionEyebrowClass}>
                    {section.label}
                  </p>
                  <h3 className={sectionTitleClass}>{section.label}</h3>
                  <p className={sectionDescriptionClass}>{section.description}</p>
                </header>
                <div className={menuGridClass}>
                  {section.items.map((item) => {
                    const canQuickAdd = canQuickAddItem(item);
                    const detailLabel = hasModifierGroups(item) ? "Customize" : "Details";
                    const primaryLabel = !orderingEnabled
                      ? "Unavailable"
                      : canQuickAdd
                      ? quickAddPendingItemId === item.id
                        ? "Adding..."
                        : quickAddSuccessItemId === item.id
                        ? "Added"
                        : "Add to Cart"
                      : "Choose Options";

                    return (
                      <article
                        key={`${section.id}-${item.id}`}
                        className={cardClass}
                      >
                        <button
                          type="button"
                          onClick={() => openCustomizer(item, "card")}
                          disabled={!orderingEnabled}
                          className={`flex flex-1 gap-3 text-left ${orderingEnabled ? "" : "cursor-default"}`}
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className={cardTitleClass}>
                              {item.name}
                            </h4>
                            <p className={cardPriceClass}>
                              {itemPriceLabel(item)}
                            </p>
                            <p className={cardDescriptionClass}>
                              {item.description}
                            </p>
                            <div className={cardTagClass}>
                              {item.popular ? (
                                <span className="rounded-full bg-[#fdf0e6] px-2.5 py-1 text-[#a2511c]">
                                  Popular
                                </span>
                              ) : null}
                              {item.spice ? (
                                <span className="rounded-full bg-[#fff0ef] px-2.5 py-1 text-[#bb3128]">
                                  {item.spice === 1 ? "Medium Heat" : "Spicy"}
                                </span>
                              ) : null}
                              {item.isVegetarian ? (
                                <span className="rounded-full bg-[#edf7ed] px-2.5 py-1 text-[#3d6e39]">
                                  Vegetarian
                                </span>
                              ) : null}
                              {itemOptionCue(item) ? (
                                <span className="rounded-full bg-[#f2f0fb] px-2.5 py-1 text-[#6557a1]">
                                  {itemOptionCue(item)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div
                            className={cardImageClass}
                            style={{ backgroundImage: `url(${item.imageUrl})` }}
                          />
                        </button>

                        <div className={cardActionsClass}>
                          <button
                            type="button"
                            onClick={() => openCustomizer(item, "details")}
                            disabled={!orderingEnabled}
                            className="rounded-full border border-[#decfbd] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f5a49] transition-all hover:bg-[#fff8f2] disabled:opacity-60"
                          >
                            {detailLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              canQuickAdd
                                ? handleQuickAdd(item, "quick_add")
                                : openCustomizer(item, "details")
                            }
                            disabled={!orderingEnabled || (canQuickAdd && quickAddPendingItemId === item.id)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all active:scale-[0.98] ${
                              orderingEnabled
                                ? canQuickAdd
                                  ? quickAddSuccessItemId === item.id
                                    ? theme.successButton
                                    : theme.primaryButton
                                  : theme.darkButton
                                : "cursor-not-allowed bg-[#e9dfd5] text-[#8a7d70]"
                            }`}
                          >
                            {primaryLabel}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className={emptyStateClass}>
              <p className="text-sm font-semibold text-[#2f241d]">No dishes match that search yet.</p>
              <p className="mt-1 text-sm text-[#6f6256]">
                Try a dish name, ingredient, or category like noodles, lunch, or shrimp.
              </p>
              <button
                type="button"
                onClick={() => setMenuSearch("")}
                className={`mt-4 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${theme.primaryButton}`}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        <aside
          ref={desktopCartRef}
          className={desktopCartClass}
        >
          {renderCartContent("desktop")}
        </aside>
      </div>

      {cartToast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 xl:bottom-8">
          <div
            role="status"
            className={`sticky-rise inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold shadow-[0_20px_50px_rgba(33,17,8,0.28)] ${theme.toast}`}
          >
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${theme.toastDot}`} />
            <span>{cartToast.message}</span>
          </div>
        </div>
      ) : null}

      {undoRemoval ? (
        <div className="fixed inset-x-0 bottom-10 z-40 flex justify-center px-4 xl:bottom-24">
          <div className="pointer-events-auto inline-flex max-w-[92vw] items-center gap-3 rounded-full border border-[#efc6ba] bg-white px-4 py-3 text-sm shadow-[0_20px_50px_rgba(33,17,8,0.18)]">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#2f241d]">
                Removed {undoRemoval.line.name}
              </p>
              <p className="text-xs text-[#7c6d5d]">Undo if you still want it in this order.</p>
            </div>
            <button
              type="button"
              onClick={() => restoreRemovedLine(undoRemoval.line)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${theme.primaryButton}`}
            >
              Undo
            </button>
          </div>
        </div>
      ) : null}

      {totalItems > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] xl:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileCartOpen(true);
              trackEvent("local_order_cart_opened", {
                template: variant,
                source: "mobile_sticky_bar",
                item_count: totalItems,
              });
            }}
            className={`pointer-events-auto sticky-rise flex w-full items-center justify-between rounded-full border px-4 py-3 text-left shadow-[0_24px_60px_rgba(26,14,6,0.32)] transition-all ${theme.floatingBar} ${
              cartPulseActive ? "scale-[1.01] shadow-[0_24px_70px_rgba(179,52,45,0.3)]" : ""
            }`}
          >
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.floatingMeta}`}>
                {serviceModeSummary}
              </p>
              <p className="text-sm font-semibold">{totalItems} item{totalItems === 1 ? "" : "s"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatPrice(subtotal)}</p>
              <p className={`text-[11px] uppercase tracking-[0.14em] ${theme.floatingMeta}`}>View Cart</p>
            </div>
          </button>
        </div>
      ) : null}

      {mobileCartOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setMobileCartOpen(false)}
            className="absolute inset-0 bg-[#1b120c]/44 backdrop-blur-[1px]"
          />
          <div
            ref={mobileCartDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your order cart"
            className={mobileCartDialogClass}
          >
            <div className={mobileCartHeaderClass}>
              <div className={mobileCartHandleClass} />
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                className={mobileCartCloseClass}
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(86vh-56px)] overflow-y-auto p-4">
              {renderCartContent("mobile")}
            </div>
          </div>
        </div>
      ) : null}

      {customizingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b120c]/38 p-4 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close customization"
            onClick={closeCustomizer}
            className="absolute inset-0"
          />
          <div
            ref={customizerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${editingCartLine ? "Edit" : "Customize"} ${customizingItem.name}`}
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-[#d8cabd] bg-white shadow-2xl"
          >
            <div className="shrink-0 border-b border-[#eadfd4] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b2342d]">
                    {editingCartLine ? "Edit Cart Item" : "Customize Dish"}
                  </p>
                  <h3 className="text-2xl font-semibold text-[#2e241c]">{customizingItem.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-[#6f6256]">
                    {customizingItem.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCustomizer}
                  className="rounded-full border border-[#dccdbe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#73675b]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
                <div className="space-y-4">
                  <div
                    className="min-h-[280px] rounded-[26px] border border-[#e7dbcf] bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                    style={{ backgroundImage: `url(${customizingItem.imageUrl})` }}
                  />
                  <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ab3128]">
                      Ordering Summary
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#2e241c]">
                      {fulfillment === "pickup" ? "Pickup order" : "Delivery order"}
                    </p>
                    <p className="mt-1 text-xs text-[#73675b]">
                      {editingCartLine
                        ? "Adjust quantity, modifiers, or notes without rebuilding the cart from scratch."
                        : "Build the item first, then we will keep the cart moving fast."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6f6256]">
                        Current total {formatPrice(draftPrice)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6f6256]">
                        {draftQty} item{draftQty === 1 ? "" : "s"}
                      </span>
                      {selectedDraftModifiers.length ? (
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6f6256]">
                          {selectedDraftModifiers.length} option{selectedDraftModifiers.length === 1 ? "" : "s"} picked
                        </span>
                      ) : null}
                    </div>
                    {(customizingItem.modifierGroups ?? []).length ? (
                      <p
                        className={`mt-3 text-xs font-semibold uppercase tracking-[0.12em] ${
                          draftValidationError ? "text-[#b2342d]" : "text-[#8a5a46]"
                        }`}
                      >
                        {draftValidationError
                          ? "Select required options to continue"
                          : requiredSelectionProgress.total
                            ? `${requiredSelectionProgress.complete} of ${requiredSelectionProgress.total} required groups ready`
                          : "Optional add-ons available"}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  {(customizingItem.modifierGroups ?? []).length ? (
                    (customizingItem.modifierGroups ?? []).map((group) => {
                      const selected = new Set(draftSelections[group.id] ?? []);
                      const max = group.maxSelect > 0 ? group.maxSelect : null;
                      const single = max === 1;
                      const isRequiredGroup = group.isRequired || group.minSelect > 0;
                      const isGroupReady =
                        (draftSelections[group.id] ?? []).length >= Math.max(group.isRequired ? 1 : 0, group.minSelect);
                      return (
                        <section key={group.id} className="rounded-2xl border border-[#e3d7cc] p-4">
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-lg font-semibold text-[#2e241c]">{group.name}</h4>
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${
                                  isRequiredGroup
                                    ? "bg-[#fff1f0] text-[#b93228]"
                                    : "bg-[#f3f1ed] text-[#73665a]"
                                }`}
                              >
                                {isRequiredGroup ? "Required" : "Optional"}
                              </span>
                            </div>
                            <p className="text-xs text-[#7b6f63]">{group.description || "Choose your options."}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#f7f1ea] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b6f63]">
                                {groupSelectionRuleText(group)}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                                  isGroupReady
                                    ? "bg-[#eef8ef] text-[#2f7a39]"
                                    : isRequiredGroup
                                      ? "bg-[#fff1f0] text-[#b93228]"
                                      : "bg-[#f7f1ea] text-[#7b6f63]"
                                }`}
                              >
                                {groupProgressText(group, draftSelections)}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {group.options.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setDraftSelections((prev) => toggleOption(group, option, prev))}
                                className={`rounded-xl border px-3 py-3 text-left transition-all ${
                                  selected.has(option.id)
                                    ? "border-[#ba3228] bg-[#fff5f4] shadow-sm"
                                    : "border-[#e2d6ca] bg-white hover:bg-[#fff9f5]"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border ${
                                      single ? "rounded-full" : "rounded-[6px]"
                                    } ${
                                      selected.has(option.id)
                                        ? "border-[#ba3228] bg-[#fff1ef]"
                                        : "border-[#d7c9bb] bg-white"
                                    }`}
                                  >
                                    {selected.has(option.id) ? (
                                      <span
                                        className={`block bg-[#ba3228] ${
                                          single ? "h-2.5 w-2.5 rounded-full" : "h-2.5 w-2.5 rounded-[2px]"
                                        }`}
                                      />
                                    ) : null}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm font-semibold text-[#2f241d]">{option.name}</p>
                                      <p className="shrink-0 text-xs font-semibold text-[#796d61]">
                                        {optionPriceLabel(option)}
                                      </p>
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a5a46]">
                                      {selected.has(option.id) ? "Selected" : single ? "Tap to choose" : "Tap to add"}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-[#e4d8cd] bg-[#faf7f3] p-4 text-sm text-[#6d6054]">
                      No customizations required for this item.
                    </div>
                  )}

                  <section className="rounded-2xl border border-[#e3d7cc] p-4">
                    <h4 className="text-lg font-semibold text-[#2e241c]">Special Instructions</h4>
                    <p className="text-xs text-[#7b6f63]">Optional notes for this item only.</p>
                    <textarea
                      value={draftSpecialInstructions}
                      onChange={(event) => setDraftSpecialInstructions(event.target.value)}
                      maxLength={160}
                      placeholder="Example: light sauce, no onion, extra crispy."
                      className="mt-2 min-h-[88px] w-full rounded-xl border border-[#e2d6ca] px-3 py-2 text-sm text-[#2f251d] focus:border-[#c73f2f] focus:outline-none focus:ring-2 focus:ring-[#f5d7ce]"
                    />
                    <p className="mt-1 text-right text-[11px] text-[#8d8074]">
                      {draftSpecialInstructions.length}/160
                    </p>
                  </section>

                  {draftValidationError && !customizeError ? (
                    <p className="rounded-xl bg-[#fff7ec] px-3 py-2 text-xs text-[#9a5a24]">
                      {draftValidationError}
                    </p>
                  ) : null}

                  {customizeError ? (
                    <p className="rounded-xl bg-[#fff2f1] px-3 py-2 text-xs text-[#bf3027]">
                      {customizeError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#e9dfd4] bg-[#faf7f2] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftQty((qty) => Math.max(1, qty - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cabd] bg-white text-lg text-[#2f251d]"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{draftQty}</span>
                  <button
                    type="button"
                    onClick={() => setDraftQty((qty) => qty + 1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cabd] bg-white text-lg text-[#2f251d]"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomizedItem}
                  disabled={!canSubmitCustomizedItem}
                  className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition-all ${
                    customizeSuccess ? theme.successButton : theme.primaryButton
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {customizeBusy
                    ? editingCartLine
                      ? "Updating..."
                      : "Adding..."
                    : customizeSuccess
                    ? editingCartLine
                      ? "Updated"
                      : "Added"
                    : draftValidationError
                    ? "Select Required Options"
                    : `${editingCartLine ? "Update Item" : "Add to Cart"} - ${formatPrice(draftPrice)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
