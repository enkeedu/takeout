import type { MenuOut } from "./types";
import type { MenuCategory } from "./restaurantDemo";

export function menuFromApi(menu: MenuOut): MenuCategory[] {
  return menu.categories
    .filter((category) => category.is_active)
    .map((category) => ({
      name: category.name,
      items: category.items
        .filter((item) => item.is_active)
        .map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: item.price_cents / 100,
          modifierGroups: item.modifier_groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description || undefined,
            minSelect: group.min_select,
            maxSelect: group.max_select,
            isRequired: group.is_required,
            options: group.options.map((option) => ({
              id: option.id,
              name: option.name,
              price: option.price_cents / 100,
              isDefault: option.is_default,
            })),
          })),
        })),
    }))
    .filter((category) => category.items.length > 0);
}
