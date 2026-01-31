import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  animateBackground: boolean;
  setAnimateBackground: (animate: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  animateBackground: true,
  setAnimateBackground: (animate) => set({ animateBackground: animate }),
}));
