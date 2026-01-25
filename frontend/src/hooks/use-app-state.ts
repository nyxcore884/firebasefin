
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
    mlTuning: 'ML Tuning',
    aiManagement: 'AI Management',
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
    mlTuning: 'ML ტიუნინგი',
    aiManagement: 'AI მართვა',
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
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
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
  selectedCompany: 'SGG-001',
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  selectedPeriod: '2023-11',
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
