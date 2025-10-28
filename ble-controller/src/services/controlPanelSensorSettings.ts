export interface ControlPanelSensorConfig {
  id: string;
  name: string;
}

export const DEFAULT_CONTROL_PANEL_SENSORS: ControlPanelSensorConfig[] = [
  { id: 'sensor1', name: 'Ultrasonic' },
  { id: 'sensor2', name: 'Line Left' },
  { id: 'sensor3', name: 'Line Center' },
  { id: 'sensor4', name: 'Line Right' },
];

class ControlPanelSensorSettingsService {
  private storageKey = 'controlPanelSensorSettings';

  getSensors(): ControlPanelSensorConfig[] {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing control panel sensor settings:', error);
        return DEFAULT_CONTROL_PANEL_SENSORS;
      }
    }
    return DEFAULT_CONTROL_PANEL_SENSORS;
  }

  saveSensors(sensors: ControlPanelSensorConfig[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(sensors));
  }

  updateSensor(id: string, updates: Partial<ControlPanelSensorConfig>): void {
    const sensors = this.getSensors();
    const index = sensors.findIndex(s => s.id === id);
    if (index !== -1) {
      sensors[index] = { ...sensors[index], ...updates };
      this.saveSensors(sensors);
    }
  }

  resetToDefaults(): void {
    this.saveSensors(DEFAULT_CONTROL_PANEL_SENSORS);
  }
}

export const controlPanelSensorSettings = new ControlPanelSensorSettingsService();
