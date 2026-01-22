
import { create } from 'zustand';

export const translations = {
  en: {
    language: 'Language',
    currency: 'Currency',
    dashboard: 'Dashboard',
    analysis: 'Analysis',
    prognostics: 'Prognostics',
    reports: 'Reports',
    queries: 'Queries',
    dataHub: 'Data Hub',
    mlTuning: 'ML Tuning',
    settings: 'Settings',
    upload: 'Upload',
    presentation: 'Presentation',
  },
  ka: {
    language: 'ენა',
    currency: 'ვალუტა',
    dashboard: 'დაფა',
    analysis: 'ანალიზი',
    prognostics: 'პროგნოზები',
    reports: 'ანგარიშები',
    queries: 'მოთხოვნები',
    dataHub: 'მონაცემთა ბაზა',
    mlTuning: 'ML ტიუნინგი',
    settings: 'პარამეტრები',
    upload: 'ატვირთვა',
    presentation: 'პრეზენტაცია',
  },
};

type Theme = 'light' | 'dark';
type Language = 'en' | 'ka';
type Currency = 'USD' | 'GEL';

interface AppState {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  animateBackground: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarPinned: boolean;
  toggleSidebarPinned: () => void;

  // Financial Context (The Core Spine)
  selectedCompany: string; // e.g., 'SGG-001'
  setSelectedCompany: (company: string) => void;
  selectedPeriod: string; // e.g., '2023-11'
  setSelectedPeriod: (period: string) => void;
  selectedDepartment: string; // e.g., 'Technical'
  setSelectedDepartment: (dept: string) => void;
}

export const useAppState = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  language: 'en',
  setLanguage: (language) => set({ language }),
  currency: 'USD',
  setCurrency: (currency) => set({ currency }),
  animateBackground: true,
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  isSidebarPinned: true,
  toggleSidebarPinned: () => set((state) => ({ isSidebarPinned: !state.isSidebarPinned })),

  // Initial Financial Context
  selectedCompany: 'SGG-001',
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  selectedPeriod: '2023-11',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  selectedDepartment: 'All',
  setSelectedDepartment: (dept) => set({ selectedDepartment: dept }),
}));
