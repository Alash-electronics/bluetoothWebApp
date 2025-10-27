export interface ButtonConfig {
  id: string;
  label: string;
  command: string;
  icon?: string;
}

export const DEFAULT_BUTTONS: ButtonConfig[] = [
  { id: 'forward', label: 'Вперёд', command: 'F', icon: '↑' },
  { id: 'backward', label: 'Назад', command: 'B', icon: '↓' },
  { id: 'left', label: 'Влево', command: 'L', icon: '←' },
  { id: 'right', label: 'Вправо', command: 'R', icon: '→' },
  { id: 'stop', label: 'Стоп', command: 'S', icon: '■' },
  { id: 'led_on', label: 'LED ON', command: '1', icon: '💡' },
  { id: 'led_off', label: 'LED OFF', command: '0', icon: '🌑' },
  { id: 'custom1', label: 'Кнопка 1', command: 'A', icon: '1' },
  { id: 'custom2', label: 'Кнопка 2', command: 'C', icon: '2' },
];

const STORAGE_KEY = 'hm10-button-settings';

class ButtonSettingsService {
  private buttons: ButtonConfig[] = [];

  constructor() {
    this.loadSettings();
  }

  // Загрузка настроек из localStorage
  loadSettings(): ButtonConfig[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.buttons = JSON.parse(saved);
      } else {
        this.buttons = [...DEFAULT_BUTTONS];
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      this.buttons = [...DEFAULT_BUTTONS];
    }
    return this.buttons;
  }

  // Сохранение настроек в localStorage
  saveSettings(buttons: ButtonConfig[]): void {
    try {
      this.buttons = buttons;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buttons));
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  }

  // Получение всех кнопок
  getButtons(): ButtonConfig[] {
    return [...this.buttons];
  }

  // Обновление кнопки
  updateButton(id: string, updates: Partial<ButtonConfig>): void {
    const index = this.buttons.findIndex(b => b.id === id);
    if (index !== -1) {
      this.buttons[index] = { ...this.buttons[index], ...updates };
      this.saveSettings(this.buttons);
    }
  }

  // Сброс к настройкам по умолчанию
  resetToDefaults(): void {
    this.buttons = [...DEFAULT_BUTTONS];
    this.saveSettings(this.buttons);
  }
}

export const buttonSettingsService = new ButtonSettingsService();
