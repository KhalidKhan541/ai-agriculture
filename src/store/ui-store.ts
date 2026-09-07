import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type Theme = "light" | "dark" | "system";
export type SidebarVariant = "default" | "compact" | "collapsed";

interface ModalState {
  id: string;
  isOpen: boolean;
  data?: unknown;
}

interface UIState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  sidebarVariant: SidebarVariant;
  sidebarCollapsed: boolean;
  modals: ModalState[];
  toasts: Toast[];
  commandOpen: boolean;
  searchOpen: boolean;
  isFullscreen: boolean;
  locale: string;
  density: "compact" | "default" | "comfortable";

  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: "light" | "dark") => void;
  setSidebarVariant: (variant: SidebarVariant) => void;
  toggleSidebarCollapsed: () => void;
  openModal: (id: string, data?: unknown) => void;
  closeModal: (id: string) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  setSearchOpen: (open: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setLocale: (locale: string) => void;
  setDensity: (density: UIState["density"]) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: <T = unknown>(id: string) => T | undefined;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    theme: "system",
    resolvedTheme: "light",
    sidebarVariant: "default",
    sidebarCollapsed: false,
    modals: [],
    toasts: [],
    commandOpen: false,
    searchOpen: false,
    isFullscreen: false,
    locale: "en-US",
    density: "default",

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),

    setResolvedTheme: (theme) =>
      set((state) => {
        state.resolvedTheme = theme;
      }),

    setSidebarVariant: (variant) =>
      set((state) => {
        state.sidebarVariant = variant;
      }),

    toggleSidebarCollapsed: () =>
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

    openModal: (id, data) =>
      set((state) => {
        const existing = state.modals.find((m) => m.id === id);
        if (existing) {
          existing.isOpen = true;
          existing.data = data;
        } else {
          state.modals.push({ id, isOpen: true, data });
        }
      }),

    closeModal: (id) =>
      set((state) => {
        const modal = state.modals.find((m) => m.id === id);
        if (modal) modal.isOpen = false;
      }),

    addToast: (toast) =>
      set((state) => {
        state.toasts.push({
          ...toast,
          id: Math.random().toString(36).substring(2, 15),
        });
      }),

    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      }),

    clearToasts: () =>
      set((state) => {
        state.toasts = [];
      }),

    setCommandOpen: (open) =>
      set((state) => {
        state.commandOpen = open;
      }),

    toggleCommand: () =>
      set((state) => {
        state.commandOpen = !state.commandOpen;
      }),

    setSearchOpen: (open) =>
      set((state) => {
        state.searchOpen = open;
      }),

    setFullscreen: (fullscreen) =>
      set((state) => {
        state.isFullscreen = fullscreen;
      }),

    setLocale: (locale) =>
      set((state) => {
        state.locale = locale;
      }),

    setDensity: (density) =>
      set((state) => {
        state.density = density;
      }),

    isModalOpen: (id) => {
      const modal = get().modals.find((m) => m.id === id);
      return modal?.isOpen ?? false;
    },

    getModalData: <T = unknown>(id: string): T | undefined => {
      const modal = get().modals.find((m) => m.id === id);
      return modal?.data as T | undefined;
    },
  }))
);
