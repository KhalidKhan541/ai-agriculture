import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface Crop {
  id: string;
  name: string;
  variety: string;
  farmId: string;
  fieldId: string;
  plantingDate: string;
  expectedHarvestDate: string;
  status: "planted" | "growing" | "ready" | "harvested" | "failed";
  healthScore: number;
  yieldEstimate: number;
  actualYield?: number;
  notes?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CropFilter {
  status?: Crop["status"][];
  farmId?: string;
  search?: string;
  dateRange?: { start: string; end: string };
  healthScoreMin?: number;
  healthScoreMax?: number;
}

interface CropState {
  crops: Crop[];
  selectedCropId: string | null;
  filter: CropFilter;
  sortBy: keyof Crop;
  sortOrder: "asc" | "desc";
  viewMode: "grid" | "list";
  isLoading: boolean;

  setCrops: (crops: Crop[]) => void;
  addCrop: (crop: Crop) => void;
  updateCrop: (id: string, updates: Partial<Crop>) => void;
  removeCrop: (id: string) => void;
  selectCrop: (id: string | null) => void;
  setFilter: (filter: Partial<CropFilter>) => void;
  clearFilter: () => void;
  setSortBy: (field: keyof Crop, order?: "asc" | "desc") => void;
  setViewMode: (mode: "grid" | "list") => void;
  setLoading: (loading: boolean) => void;

  filteredCrops: () => Crop[];
  getCropById: (id: string) => Crop | undefined;
  getCropsByFarm: (farmId: string) => Crop[];
  getCropsByStatus: (status: Crop["status"]) => Crop[];
}

const defaultFilter: CropFilter = {};

export const useCropStore = create<CropState>()(
  immer((set, get) => ({
    crops: [],
    selectedCropId: null,
    filter: defaultFilter,
    sortBy: "plantingDate",
    sortOrder: "desc",
    viewMode: "grid",
    isLoading: false,

    setCrops: (crops) =>
      set((state) => {
        state.crops = crops;
      }),

    addCrop: (crop) =>
      set((state) => {
        state.crops.unshift(crop);
      }),

    updateCrop: (id, updates) =>
      set((state) => {
        const index = state.crops.findIndex((c) => c.id === id);
        if (index !== -1) {
          Object.assign(state.crops[index], updates, {
            updatedAt: new Date().toISOString(),
          });
        }
      }),

    removeCrop: (id) =>
      set((state) => {
        state.crops = state.crops.filter((c) => c.id !== id);
      }),

    selectCrop: (id) =>
      set((state) => {
        state.selectedCropId = id;
      }),

    setFilter: (filter) =>
      set((state) => {
        Object.assign(state.filter, filter);
      }),

    clearFilter: () =>
      set((state) => {
        state.filter = defaultFilter;
      }),

    setSortBy: (field, order) =>
      set((state) => {
        state.sortBy = field;
        if (order) state.sortOrder = order;
        else state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    filteredCrops: () => {
      const state = get();
      let result = [...state.crops];

      if (state.filter.status?.length) {
        result = result.filter((c) => state.filter.status!.includes(c.status));
      }
      if (state.filter.farmId) {
        result = result.filter((c) => c.farmId === state.filter.farmId);
      }
      if (state.filter.search) {
        const q = state.filter.search.toLowerCase();
        result = result.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.variety.toLowerCase().includes(q)
        );
      }
      if (state.filter.healthScoreMin !== undefined) {
        result = result.filter(
          (c) => c.healthScore >= state.filter.healthScoreMin!
        );
      }
      if (state.filter.healthScoreMax !== undefined) {
        result = result.filter(
          (c) => c.healthScore <= state.filter.healthScoreMax!
        );
      }

      result.sort((a, b) => {
        const aVal = a[state.sortBy];
        const bVal = b[state.sortBy];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return state.sortOrder === "asc" ? cmp : -cmp;
      });

      return result;
    },

    getCropById: (id) => get().crops.find((c) => c.id === id),
    getCropsByFarm: (farmId) => get().crops.filter((c) => c.farmId === farmId),
    getCropsByStatus: (status) =>
      get().crops.filter((c) => c.status === status),
  }))
);
