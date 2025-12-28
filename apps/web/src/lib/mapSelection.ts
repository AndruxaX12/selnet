"use client";
import { create } from "zustand";

type SelState = {
  id: string | null;
  setId: (id: string | null) => void;
};

export const useMapSelection = create<SelState>((set) => ({
  id: null,
  setId: (id) => set({ id })
}));
