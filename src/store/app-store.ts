import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

interface AppState {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  } | null;
  notifications: Notification[];
  sidebarOpen: boolean;
  currentPage: string;
  isLoading: boolean;
  searchQuery: string;

  setUser: (user: AppState["user"]) => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    user: null,
    notifications: [],
    sidebarOpen: true,
    currentPage: "dashboard",
    isLoading: false,
    searchQuery: "",

    setUser: (user) =>
      set((state) => {
        state.user = user;
      }),

    addNotification: (notification) =>
      set((state) => {
        state.notifications.unshift({
          ...notification,
          id: Math.random().toString(36).substring(2, 15),
          read: false,
          createdAt: new Date().toISOString(),
        });
      }),

    markNotificationRead: (id) =>
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        if (notif) notif.read = true;
      }),

    clearNotifications: () =>
      set((state) => {
        state.notifications = [];
      }),

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

    setSidebarOpen: (open) =>
      set((state) => {
        state.sidebarOpen = open;
      }),

    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
      }),
  }))
);
