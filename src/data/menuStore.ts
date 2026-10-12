import { create } from 'zustand';
import { MenuItem } from '../types';
import { api } from '../services/api';

export interface MenuState {
  items: MenuItem[];
  categories: string[];
  isLoading: boolean;
  fetchMenuItems: (branchId?: string) => Promise<void>;
  addItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  updateItem: (id: string, updated: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  addCategory: (category: string) => void;
}

const resolveCategoryName = (cat: unknown): string => {
  if (!cat) return 'Món chính';
  if (typeof cat === 'string') return cat.trim() || 'Món chính';
  if (typeof cat === 'object' && cat !== null && 'name' in cat) {
    const val = (cat as { name?: unknown }).name;
    return typeof val === 'string' && val.trim().length > 0 ? val.trim() : 'Món chính';
  }
  return 'Món chính';
};

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  categories: ['Tất cả'],
  isLoading: false,

  fetchMenuItems: async (branchId?: string) => {
    set({ isLoading: true });
    try {
      const data = await api.getMenuItems(branchId);
      if (data && data.length > 0) {
        const mappedItems: MenuItem[] = data.map((d: any) => ({
          id: String(d.id),
          name: String(d.name || ''),
          category: resolveCategoryName(d.category),
          price: Number(d.price) || 0,
          imageUrl: d.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
          isPopular: true,
          description: d.description,
          modifierGroups: d.modifierGroups,
          prepTimeMinutes: d.prepTimeMinutes,
        }));
        const rawCats = Array.from(new Set(mappedItems.map((i) => i.category))).filter(Boolean);
        const categories = ['Tất cả', ...rawCats];
        set({ items: mappedItems, categories, isLoading: false });
        return;
      }
    } catch (err: unknown) {
      console.warn('[menuStore] fetchMenuItems error:', (err as Error).message);
    }
    set({ isLoading: false });
  },

  addItem: (newItemData) => {
    const newId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const finalCategory = resolveCategoryName(newItemData.category);
    const newItem: MenuItem = {
      ...newItemData,
      category: finalCategory,
      id: newId,
      imageUrl:
        newItemData.imageUrl && newItemData.imageUrl.trim().length > 0
          ? newItemData.imageUrl
          : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
    };

    set((state) => {
      const nextCategories = state.categories.includes(newItem.category)
        ? state.categories
        : [...state.categories, newItem.category];
      return {
        items: [newItem, ...state.items],
        categories: nextCategories,
      };
    });

    return newItem;
  },

  updateItem: (id, updated) => {
    set((state) => {
      const updatedCategory = updated.category ? resolveCategoryName(updated.category) : undefined;
      let updatedCategories = state.categories;
      if (updatedCategory && !state.categories.includes(updatedCategory)) {
        updatedCategories = [...state.categories, updatedCategory];
      }
      return {
        categories: updatedCategories,
        items: state.items.map((item) =>
          item.id === id
            ? { ...item, ...updated, ...(updatedCategory ? { category: updatedCategory } : {}) }
            : item
        ),
      };
    });
  },

  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  addCategory: (category) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.categories.includes(trimmed)) return state;
      return { categories: [...state.categories, trimmed] };
    });
  },
}));
