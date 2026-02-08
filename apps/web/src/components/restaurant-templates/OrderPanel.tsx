"use client";

import { useMemo, useRef, useState } from "react";
import type {
  MenuCategory,
  MenuItem,
  ModifierGroup,
  ModifierOption,
} from "@/lib/restaurantDemo";
import { formatPrice } from "@/lib/restaurantDemo";
import { apiFetch } from "@/lib/api";
import type { OrderOut } from "@/lib/types";
import type { TemplateKey } from "./types";

type OrderPanelProps = {
  restaurantName: string;
  menu: MenuCategory[];
  variant: TemplateKey;
  orderPath: string;
  orderingEnabled: boolean;
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
  description: string;
  basePrice: number;
  quantity: number;
  modifiers: SelectedModifier[];
};

const VARIANT_STYLES: Record<
  TemplateKey,
  {
    panel: string;
    button: string;
    accent: string;
    muted: string;
  }
> = {
  ming: {
    panel: "border-slate-200 bg-white/95 text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "ming-slim": {
    panel: "border-slate-200 bg-white/95 text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "ming-balanced": {
    panel: "border-slate-200 bg-white/95 text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "ming-full": {
    panel: "border-slate-200 bg-white/95 text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "night-market": {
    panel: "border-slate-200 bg-white text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "wok-fire": {
    panel: "border-slate-200 bg-white text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "metro-grid": {
    panel: "border-slate-200 bg-white text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "editorial-column": {
    panel: "border-slate-200 bg-white text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
  "glass-orbit": {
    panel: "border-slate-200 bg-white text-slate-900",
    button:
      "bg-[var(--template-accent)] text-white hover:bg-[var(--template-accent-strong)] hover:text-black",
    accent: "text-[var(--template-accent)]",
    muted: "text-slate-500",
  },
};

function modifierBadge(line: CartLine): string {
  if (!line.modifiers.length) return "Standard";
  return line.modifiers.map((m) => m.modifierOptionName).join(", ");
}

function lineUnitPrice(line: CartLine): number {
  return line.basePrice + line.modifiers.reduce((sum, m) => sum + m.price, 0);
}

function lineSignature(itemId: string, modifiers: SelectedModifier[]): string {
  const sorted = [...modifiers]
    .map((m) => `${m.modifierGroupId}:${m.modifierOptionId}`)
    .sort()
    .join("|");
  return `${itemId}::${sorted}`;
}

function defaultDraftFromItem(item: MenuItem): Record<string, string[]> {
  const draft: Record<string, string[]> = {};
  for (const group of item.modifierGroups ?? []) {
    const defaults = group.options.filter((opt) => opt.isDefault).map((opt) => opt.id);
    draft[group.id] = defaults;
  }
  return draft;
}

function selectedModifiersFromDraft(
  item: MenuItem,
  draftSelections: Record<string, string[]>
): SelectedModifier[] {
  const selected: SelectedModifier[] = [];
  for (const group of item.modifierGroups ?? []) {
    const chosen = new Set(draftSelections[group.id] ?? []);
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

function validateDraft(
  item: MenuItem,
  draftSelections: Record<string, string[]>
): string | null {
  for (const group of item.modifierGroups ?? []) {
    const selectedCount = (draftSelections[group.id] ?? []).length;
    const maxSelect = group.maxSelect > 0 ? group.maxSelect : null;

    if ((group.isRequired || group.minSelect > 0) && selectedCount < group.minSelect) {
      return `${group.name} requires at least ${group.minSelect} selection(s).`;
    }
    if (maxSelect !== null && selectedCount > maxSelect) {
      return `${group.name} allows up to ${maxSelect} selection(s).`;
    }
  }
  return null;
}

function optionPriceLabel(option: ModifierOption): string {
  if (!option.price) return "Included";
  if (option.price > 0) return `+${formatPrice(option.price)}`;
  return formatPrice(option.price);
}

export function OrderPanel({
  restaurantName,
  menu,
  variant,
  orderPath,
  orderingEnabled,
}: OrderPanelProps) {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderOut | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [draftSelections, setDraftSelections] = useState<Record<string, string[]>>({});
  const [customizationError, setCustomizationError] = useState<string | null>(null);
  const lineCounter = useRef(0);
  const styles = VARIANT_STYLES[variant];

  const items = useMemo(() => menu.flatMap((category) => category.items), [menu]);

  const subtotal = cartLines.reduce(
    (sum, line) => sum + line.quantity * lineUnitPrice(line),
    0
  );
  const totalItems = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  const canSubmit = orderingEnabled && totalItems > 0 && !isSubmitting;

  function upsertLine(item: MenuItem, modifiers: SelectedModifier[]) {
    const signature = lineSignature(item.id, modifiers);
    setCartLines((prev) => {
      const existing = prev.find((line) => line.signature === signature);
      if (existing) {
        return prev.map((line) =>
          line.signature === signature
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      lineCounter.current += 1;
      return [
        ...prev,
        {
          id: `${item.id}-${lineCounter.current}`,
          signature,
          itemId: item.id,
          name: item.name,
          description: item.description,
          basePrice: item.price,
          quantity: 1,
          modifiers,
        },
      ];
    });
  }

  function openCustomizer(item: MenuItem) {
    setCustomizingItem(item);
    setCustomizationError(null);
    setDraftSelections(defaultDraftFromItem(item));
  }

  function closeCustomizer() {
    setCustomizingItem(null);
    setCustomizationError(null);
    setDraftSelections({});
  }

  function handleAdd(item: MenuItem) {
    if (!orderingEnabled) return;
    const hasModifierGroups = Boolean(item.modifierGroups?.length);
    if (!hasModifierGroups) {
      upsertLine(item, []);
      return;
    }
    openCustomizer(item);
  }

  function handleRemoveLine(lineId: string) {
    setCartLines((prev) => {
      const line = prev.find((entry) => entry.id === lineId);
      if (!line) return prev;
      if (line.quantity <= 1) {
        return prev.filter((entry) => entry.id !== lineId);
      }
      return prev.map((entry) =>
        entry.id === lineId ? { ...entry, quantity: entry.quantity - 1 } : entry
      );
    });
  }

  function handleIncreaseLine(lineId: string) {
    setCartLines((prev) =>
      prev.map((entry) =>
        entry.id === lineId ? { ...entry, quantity: entry.quantity + 1 } : entry
      )
    );
  }

  function toggleDraftOption(group: ModifierGroup, option: ModifierOption) {
    setDraftSelections((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.includes(option.id);
      const maxSelect = group.maxSelect > 0 ? group.maxSelect : null;
      const singleSelect = maxSelect === 1;

      if (singleSelect) {
        return { ...prev, [group.id]: isSelected ? [] : [option.id] };
      }

      if (isSelected) {
        return { ...prev, [group.id]: current.filter((id) => id !== option.id) };
      }

      if (maxSelect !== null && current.length >= maxSelect) {
        return prev;
      }

      return { ...prev, [group.id]: [...current, option.id] };
    });
  }

  function handleConfirmCustomization() {
    if (!customizingItem) return;
    const validationError = validateDraft(customizingItem, draftSelections);
    if (validationError) {
      setCustomizationError(validationError);
      return;
    }
    const modifiers = selectedModifiersFromDraft(customizingItem, draftSelections);
    upsertLine(customizingItem, modifiers);
    closeCustomizer();
  }

  async function handlePlaceOrder() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setOrderResult(null);

    const payload = {
      customer_name: customerName.trim() || null,
      customer_phone: customerPhone.trim() || null,
      fulfillment_type: fulfillment,
      notes: notes.trim() || null,
      items: cartLines.map((line) => ({
        menu_item_id: line.itemId,
        quantity: line.quantity,
        modifiers: line.modifiers.map((modifier) => ({
          modifier_group_id: modifier.modifierGroupId,
          modifier_option_id: modifier.modifierOptionId,
        })),
      })),
    };

    try {
      const order = await apiFetch<OrderOut>(`/orders${orderPath}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOrderResult(order);
      setCartLines([]);
      setNotes("");
    } catch {
      setErrorMessage("Unable to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className={`rounded-2xl border p-5 shadow-sm ${styles.panel}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold uppercase ${styles.accent}`}>
              Order Online
            </p>
            <h3 className="text-2xl font-semibold">{restaurantName} Pickup</h3>
            <p className={`text-sm ${styles.muted}`}>
              Pay online, track ETA, and earn points.
            </p>
          </div>
          <span
            className={`rounded-full border px-2 py-1 text-xs font-semibold ${styles.accent}`}
          >
            Demo
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <button
            type="button"
            onClick={() => setFulfillment("pickup")}
            className={`rounded-lg border px-3 py-2 font-medium ${
              fulfillment === "pickup"
                ? `${styles.button} border-transparent`
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Pickup
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("delivery")}
            className={`rounded-lg border px-3 py-2 font-medium ${
              fulfillment === "delivery"
                ? `${styles.button} border-transparent`
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Delivery
          </button>
        </div>

        <div className="mt-5 max-h-[460px] space-y-4 overflow-y-auto pr-2">
          {menu.map((category) => (
            <div key={category.name}>
              <h4 className="text-sm font-semibold uppercase text-slate-500">
                {category.name}
              </h4>
              <div className="mt-2 space-y-3">
                {category.items.map((item) => {
                  const hasModifiers = Boolean(item.modifierGroups?.length);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="font-semibold">
                            {formatPrice(item.price)}
                          </span>
                          {item.popular && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                              Popular
                            </span>
                          )}
                          {item.spice ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                              {item.spice === 1 ? "Medium" : "Hot"}
                            </span>
                          ) : null}
                          {hasModifiers ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                              Customizable
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdd(item)}
                        className={`h-8 rounded-full px-3 text-xs font-semibold ${styles.button}`}
                      >
                        {hasModifiers ? "Customize" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-3">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Cart</span>
            <span>{totalItems} items</span>
          </div>
          {cartLines.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Add items to see your order summary.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              {cartLines.map((line) => (
                <div key={line.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{line.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {modifierBadge(line)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatPrice(lineUnitPrice(line))} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="h-6 w-6 rounded-full border border-slate-200 text-xs font-semibold"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleIncreaseLine(line.id)}
                      className="h-6 w-6 rounded-full border border-slate-200 text-xs font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Estimated {fulfillment} time: 20-35 min
        </div>

        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!canSubmit}
          className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold ${styles.button} ${
            !canSubmit ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>

        {!orderingEnabled ? (
          <p className="mt-3 text-xs text-slate-500">
            Ordering is unavailable for this restaurant.
          </p>
        ) : null}

        <div className="mt-4 space-y-3 text-xs text-slate-500">
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Contact
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Name (optional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
            <input
              type="text"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Phone (optional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Special instructions"
              className="min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>
        </div>

        {orderResult ? (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            Order placed. Confirmation: {orderResult.id.slice(0, 8)}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
            {errorMessage}
          </div>
        ) : null}
      </div>

      {customizingItem ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase ${styles.accent}`}>
                  Customize Item
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {customizingItem.name}
                </h3>
                <p className="text-sm text-slate-500">
                  Base price: {formatPrice(customizingItem.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCustomizer}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {(customizingItem.modifierGroups ?? []).map((group) => {
                const selected = new Set(draftSelections[group.id] ?? []);
                const maxSelect = group.maxSelect > 0 ? group.maxSelect : null;
                const singleSelect = maxSelect === 1;
                return (
                  <div
                    key={group.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {group.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.description || "Choose your options."}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-slate-400">
                        {singleSelect
                          ? "Select one"
                          : maxSelect
                          ? `Select up to ${maxSelect}`
                          : "Select any"}
                        {group.minSelect > 0 ? ` • Min ${group.minSelect}` : ""}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const isSelected = selected.has(option.id);
                        return (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-slate-300"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type={singleSelect ? "radio" : "checkbox"}
                                name={`group-${group.id}`}
                                checked={isSelected}
                                onChange={() => toggleDraftOption(group, option)}
                              />
                              <span>{option.name}</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {optionPriceLabel(option)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {customizationError ? (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {customizationError}
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCustomizer}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomization}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${styles.button}`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
