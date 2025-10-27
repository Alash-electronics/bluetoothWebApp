class AppSettingsService {
  private vibrationEnabled: boolean = true;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const saved = localStorage.getItem('vibrationEnabled');
    if (saved !== null) {
      this.vibrationEnabled = saved === 'true';
    }
  }

  isVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }

  setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
    localStorage.setItem('vibrationEnabled', enabled.toString());
    this.notifyListeners();
  }

  toggleVibration() {
    this.setVibrationEnabled(!this.vibrationEnabled);
  }

  vibrate(pattern: number | number[] = 50) {
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }
}

export const appSettings = new AppSettingsService();
