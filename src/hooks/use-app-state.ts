
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
    settings: 'Settings',
    upload: 'Upload',
    presentation: 'Presentation',
    smartCanvas: 'Smart Canvas',
    mlTuning: 'Reasoning Control',
    aiManagement: 'Deterministic AI',
    systemsHub: 'Systems Hub',
    knowledgeBase: 'Knowledge Base',
    statutoryReports: 'Statutory Reports',
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
    settings: 'პარამეტრები',
    upload: 'ატვირთვა',
    presentation: 'პრეზენტაცია',
    smartCanvas: 'ჭკვიანი ტილო',
    mlTuning: 'ლოგიკის მართვა',
    aiManagement: 'დეტერმინისტული AI',
    systemsHub: 'სისტემების ჰაბი',
    knowledgeBase: 'ცოდნის ბაზა',
    statutoryReports: 'ფინანსური ანგარიშგება',
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
  scope: 'Single' | 'All' | 'Group';
  setScope: (scope: 'Single' | 'All' | 'Group') => void;
  selectedCompany: string; // "All" if scope is All
  setSelectedCompany: (company: string) => void;
  selectedSubsidiaries: string[]; // For Group view
  toggleSubsidiary: (sub: string) => void;
  selectedPeriod: string | null;
  setSelectedPeriod: (period: string | null) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;

  // AI Intelligence
  dynamicTranslate: (text: string) => Promise<string>;
}

export const useAppState = create<AppState>((set, get) => ({
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
  scope: 'Single',
  setScope: (scope) => set({ scope }),
  selectedCompany: 'SGG-001',
  setSelectedCompany: (company) => set({ selectedCompany: company, scope: company === 'All' ? 'All' : 'Single' }),
  selectedSubsidiaries: [],
  toggleSubsidiary: (sub) => set((state) => {
    const exists = state.selectedSubsidiaries.includes(sub);
    return {
      selectedSubsidiaries: exists
        ? state.selectedSubsidiaries.filter(s => s !== sub)
        : [...state.selectedSubsidiaries, sub]
    };
  }),
  selectedPeriod: null,
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  selectedDepartment: 'All',
  setSelectedDepartment: (dept) => set({ selectedDepartment: dept }),

  dynamicTranslate: async (text: string) => {
    if (get().language === 'en') return text;
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', text, target_lang: 'ka' })
      });
      const data = await res.json();
      return data.translation || text;
    } catch (e) {
      return text;
    }
  }
}));
