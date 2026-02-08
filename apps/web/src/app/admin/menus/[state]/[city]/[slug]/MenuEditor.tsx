"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { MenuOut, MenuUpsert } from "@/lib/types";

type MenuItemDraft = {
  id: string;
  name: string;
  description: string;
  price: string;
  is_active: boolean;
};

type MenuCategoryDraft = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  items: MenuItemDraft[];
};

const EMPTY_ITEM: MenuItemDraft = {
  id: "",
  name: "",
  description: "",
  price: "",
  is_active: true,
};

const EMPTY_CATEGORY: MenuCategoryDraft = {
  id: "",
  name: "",
  description: "",
  is_active: true,
  items: [{ ...EMPTY_ITEM }],
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fromMenu(menu: MenuOut): { name: string; categories: MenuCategoryDraft[] } {
  return {
    name: menu.name,
    categories: menu.categories.map((category) => ({
      id: createId(),
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
      items: category.items.map((item) => ({
        id: createId(),
        name: item.name,
        description: item.description || "",
        price: (item.price_cents / 100).toFixed(2),
        is_active: item.is_active,
      })),
    })),
  };
}

function toPayload(
  name: string,
  categories: MenuCategoryDraft[]
): { payload: MenuUpsert | null; error: string | null } {
  if (!name.trim()) {
    return { payload: null, error: "Menu name is required." };
  }

  let hasInvalidPrice = false;
  const sanitizedCategories = categories
    .map((category, categoryIndex) => {
      const items = category.items
        .filter((item) => item.name.trim())
        .map((item, itemIndex) => {
          const price = Number.parseFloat(item.price);
          if (!Number.isFinite(price) || price <= 0) {
            hasInvalidPrice = true;
            return null;
          }
          return {
            name: item.name.trim(),
            description: item.description.trim() || null,
            price_cents: Math.round(price * 100),
            sort_order: itemIndex,
            is_active: item.is_active,
          };
        })
        .filter(Boolean);

      if (!category.name.trim()) {
        return null;
      }

      if (items.length === 0) {
        return null;
      }

      return {
        name: category.name.trim(),
        description: category.description.trim() || null,
        sort_order: categoryIndex,
        is_active: category.is_active,
        items,
      };
    })
    .filter(Boolean);

  if (hasInvalidPrice) {
    return { payload: null, error: "All item prices must be valid numbers." };
  }

  if (sanitizedCategories.length === 0) {
    return { payload: null, error: "Add at least one category with items." };
  }

  return {
    payload: {
      name: name.trim(),
      is_active: true,
      categories: sanitizedCategories as MenuUpsert["categories"],
    },
    error: null,
  };
}

export function MenuEditor({
  state,
  city,
  slug,
}: {
  state: string;
  city: string;
  slug: string;
}) {
  const [menuName, setMenuName] = useState("Main Menu");
  const [categories, setCategories] = useState<MenuCategoryDraft[]>([
    { ...EMPTY_CATEGORY, id: createId(), items: [{ ...EMPTY_ITEM, id: createId() }] },
  ]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const adminToken = useMemo(
    () => process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
    []
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const menu = await apiFetch<MenuOut>(
          `/admin/menus/${state}/${city}/${slug}`,
          adminToken ? { headers: { "X-Admin-Token": adminToken } } : undefined
        );
        if (!active) return;
        const data = fromMenu(menu);
        setMenuName(data.name);
        setCategories(data.categories);
      } catch {
        if (!active) return;
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [adminToken, city, slug, state]);

  function updateCategory(
    index: number,
    patch: Partial<MenuCategoryDraft>
  ) {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, ...patch } : cat))
    );
  }

  function updateItem(
    categoryIndex: number,
    itemIndex: number,
    patch: Partial<MenuItemDraft>
  ) {
    setCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== categoryIndex) return cat;
        const nextItems = cat.items.map((item, j) =>
          j === itemIndex ? { ...item, ...patch } : item
        );
        return { ...cat, items: nextItems };
      })
    );
  }

  function addCategory() {
    setCategories((prev) => [
      ...prev,
      {
        ...EMPTY_CATEGORY,
        id: createId(),
        items: [{ ...EMPTY_ITEM, id: createId() }],
      },
    ]);
  }

  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem(categoryIndex: number) {
    setCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== categoryIndex) return cat;
        return {
          ...cat,
          items: [...cat.items, { ...EMPTY_ITEM, id: createId() }],
        };
      })
    );
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    setCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== categoryIndex) return cat;
        return { ...cat, items: cat.items.filter((_, j) => j !== itemIndex) };
      })
    );
  }

  async function handleSave() {
    setStatus(null);
    setError(null);
    const { payload, error: payloadError } = toPayload(menuName, categories);
    if (!payload) {
      setError(payloadError);
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch<MenuOut>(`/admin/menus/${state}/${city}/${slug}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: adminToken ? { "X-Admin-Token": adminToken } : undefined,
      });
      setStatus("Menu saved.");
    } catch {
      setError("Unable to save menu. Check inputs and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Menu Editor
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Build the live menu for this restaurant. Prices are in dollars.
        </p>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Menu Name
          </label>
          <input
            value={menuName}
            onChange={(event) => setMenuName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading menu…</p>
      ) : null}

      <div className="space-y-5">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Category {index + 1}
              </h2>
              <button
                type="button"
                onClick={() => removeCategory(index)}
                className="text-xs font-semibold text-red-600"
              >
                Remove category
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={category.name}
                onChange={(event) =>
                  updateCategory(index, { name: event.target.value })
                }
                placeholder="Category name"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={category.description}
                onChange={(event) =>
                  updateCategory(index, { description: event.target.value })
                }
                placeholder="Description (optional)"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-5 space-y-3">
              {category.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      Item {itemIndex + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(index, itemIndex)}
                      className="text-xs font-semibold text-red-600"
                    >
                      Remove item
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <input
                      value={item.name}
                      onChange={(event) =>
                        updateItem(index, itemIndex, {
                          name: event.target.value,
                        })
                      }
                      placeholder="Item name"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={item.price}
                      onChange={(event) =>
                        updateItem(index, itemIndex, {
                          price: event.target.value,
                        })
                      }
                      placeholder="Price (e.g. 12.50)"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, itemIndex, {
                          description: event.target.value,
                        })
                      }
                      placeholder="Description (optional)"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(index)}
                className="text-sm font-semibold text-emerald-700"
              >
                + Add item
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCategory}
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
      >
        + Add category
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {error ? (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        ) : null}
        {status ? (
          <p className="mb-3 text-sm text-emerald-700">{status}</p>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Menu"}
        </button>
      </div>
    </div>
  );
}
