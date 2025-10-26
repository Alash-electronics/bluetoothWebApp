export interface MacroConfig {
  id: string;
  label: string;
  command: string;
}

export const DEFAULT_MACROS: MacroConfig[] = [
  { id: 'm1', label: 'M1', command: 'M1' },
  { id: 'm2', label: 'M2', command: 'M2' },
  { id: 'm3', label: 'M3', command: 'M3' },
  { id: 'm4', label: 'M4', command: 'M4' },
  { id: 'm5', label: 'M5', command: 'M5' },
  { id: 'm6', label: 'M6', command: 'M6' },
];

class MacroSettingsService {
  private storageKey = 'macroSettings';

  getMacros(): MacroConfig[] {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing macro settings:', error);
        return DEFAULT_MACROS;
      }
    }
    return DEFAULT_MACROS;
  }

  saveMacros(macros: MacroConfig[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(macros));
  }

  updateMacro(id: string, updates: Partial<MacroConfig>): void {
    const macros = this.getMacros();
    const index = macros.findIndex(m => m.id === id);
    if (index !== -1) {
      macros[index] = { ...macros[index], ...updates };
      this.saveMacros(macros);
    }
  }

  resetToDefaults(): void {
    this.saveMacros(DEFAULT_MACROS);
  }
}

export const macroSettings = new MacroSettingsService();
