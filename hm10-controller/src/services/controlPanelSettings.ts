export interface ControlButtonConfig {
  id: string;
  label: string;
  pressCommand: string;   // Команда при нажатии
  releaseCommand: string; // Команда при отжатии
}

export const DEFAULT_CONTROL_BUTTONS: ControlButtonConfig[] = [
  // WASD - левые кнопки
  { id: 'w', label: 'W', pressCommand: 'W', releaseCommand: 'w' },
  { id: 'a', label: 'A', pressCommand: 'A', releaseCommand: 'a' },
  { id: 's', label: 'S', pressCommand: 'S', releaseCommand: 's' },
  { id: 'd', label: 'D', pressCommand: 'D', releaseCommand: 'd' },

  // Стрелки - правый джойстик
  { id: 'forward', label: '↑ (Вперёд)', pressCommand: 'F', releaseCommand: 'f' },
  { id: 'left', label: '← (Влево)', pressCommand: 'L', releaseCommand: 'l' },
  { id: 'right', label: '→ (Вправо)', pressCommand: 'R', releaseCommand: 'r' },
  { id: 'backward', label: '↓ (Назад)', pressCommand: 'B', releaseCommand: 'b' },

  // Цифры - центральные кнопки
  { id: 'btn1', label: 'Кнопка 1', pressCommand: '1', releaseCommand: '!' },
  { id: 'btn2', label: 'Кнопка 2', pressCommand: '2', releaseCommand: '@' },
  { id: 'btn3', label: 'Кнопка 3', pressCommand: '3', releaseCommand: '#' },

  // Макрокнопки
  { id: 'macro1', label: '4', pressCommand: '4', releaseCommand: '$' },
  { id: 'macro2', label: '5', pressCommand: '5', releaseCommand: '%' },
  { id: 'macro3', label: '6', pressCommand: '6', releaseCommand: '^' },
  { id: 'macro4', label: '7', pressCommand: '7', releaseCommand: '&' },
  { id: 'macro5', label: '8', pressCommand: '8', releaseCommand: '*' },
  { id: 'macro6', label: '9', pressCommand: '9', releaseCommand: '(' },
];

class ControlPanelSettingsService {
  private storageKey = 'controlPanelSettings';

  getButtons(): ControlButtonConfig[] {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Проверяем, что у нас есть все 17 кнопок (включая 6 макросов)
        if (parsed.length < 17) {
          console.log('Migrating settings: old version detected (less than 17 buttons), resetting to defaults');
          this.saveButtons(DEFAULT_CONTROL_BUTTONS);
          return DEFAULT_CONTROL_BUTTONS;
        }
        // Проверяем, что макрокнопки имеют новый формат (цифры 4-9, а не M1-M6)
        const firstMacro = parsed.find((b: ControlButtonConfig) => b.id === 'macro1');
        if (firstMacro && firstMacro.label === 'M1') {
          console.log('Migrating settings: old macro format detected (M1-M6), resetting to defaults');
          this.saveButtons(DEFAULT_CONTROL_BUTTONS);
          return DEFAULT_CONTROL_BUTTONS;
        }
        return parsed;
      } catch (error) {
        console.error('Error parsing control panel settings:', error);
        return DEFAULT_CONTROL_BUTTONS;
      }
    }
    return DEFAULT_CONTROL_BUTTONS;
  }

  saveButtons(buttons: ControlButtonConfig[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(buttons));
  }

  updateButton(id: string, updates: Partial<ControlButtonConfig>): void {
    const buttons = this.getButtons();
    const index = buttons.findIndex(b => b.id === id);
    if (index !== -1) {
      buttons[index] = { ...buttons[index], ...updates };
      this.saveButtons(buttons);
    }
  }

  resetToDefaults(): void {
    this.saveButtons(DEFAULT_CONTROL_BUTTONS);
  }

  getButton(id: string): ControlButtonConfig | undefined {
    return this.getButtons().find(b => b.id === id);
  }
}

export const controlPanelSettings = new ControlPanelSettingsService();
