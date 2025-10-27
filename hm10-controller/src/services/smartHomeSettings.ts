export interface SmartHomeDeviceConfig {
  id: string;
  label: string;
  onCommand: string;
  offCommand: string;
}

export interface SmartHomeSensorConfig {
  id: string;
  label: string;
  onMessage: string;
  offMessage: string;
}

export interface SmartHomeACConfig {
  onCommand: string;
  offCommand: string;
  heatCommand: string;
  coolCommand: string;
  dryCommand: string;
  fanCommand: string;
  tempUpCommand: string;
  tempDownCommand: string;
  tempSetPrefix: string; // Префикс для команды установки температуры, например "T" -> "T24"
}

export const DEFAULT_DEVICES: SmartHomeDeviceConfig[] = [
  { id: 'led', label: 'LED', onCommand: 'L', offCommand: 'l' },
  { id: 'window', label: 'Window', onCommand: 'W', offCommand: 'w' },
  { id: 'music', label: 'Music', onCommand: 'M', offCommand: 'm' },
  { id: 'door', label: 'Door', onCommand: 'D', offCommand: 'd' },
  { id: 'fan', label: 'Fan', onCommand: 'F', offCommand: 'f' },
  { id: 'ac', label: 'Air Condition', onCommand: 'A', offCommand: 'a' },
];

export const DEFAULT_SENSORS: SmartHomeSensorConfig[] = [
  { id: 'motion', label: 'Motion Sensor', onMessage: 'P', offMessage: 'p' },
  { id: 'gas', label: 'Gas Sensor', onMessage: 'G', offMessage: 'g' },
  { id: 'rain', label: 'Rain Sensor', onMessage: 'R', offMessage: 'r' },
];

export const DEFAULT_AC_CONFIG: SmartHomeACConfig = {
  onCommand: 'K',
  offCommand: 'L',
  heatCommand: 'H',
  coolCommand: 'C',
  dryCommand: 'Y',
  fanCommand: 'N',
  tempUpCommand: 'Z',
  tempDownCommand: 'V',
  tempSetPrefix: 'T',
};

class SmartHomeSettingsService {
  private devicesStorageKey = 'smartHomeDevices';
  private sensorsStorageKey = 'smartHomeSensors';
  private acStorageKey = 'smartHomeAC';

  getDevices(): SmartHomeDeviceConfig[] {
    const saved = localStorage.getItem(this.devicesStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing smart home devices settings:', error);
        return DEFAULT_DEVICES;
      }
    }
    return DEFAULT_DEVICES;
  }

  saveDevices(devices: SmartHomeDeviceConfig[]): void {
    localStorage.setItem(this.devicesStorageKey, JSON.stringify(devices));
  }

  updateDevice(id: string, updates: Partial<SmartHomeDeviceConfig>): void {
    const devices = this.getDevices();
    const index = devices.findIndex(d => d.id === id);
    if (index !== -1) {
      devices[index] = { ...devices[index], ...updates };
      this.saveDevices(devices);
    }
  }

  getDevice(id: string): SmartHomeDeviceConfig | undefined {
    return this.getDevices().find(d => d.id === id);
  }

  getSensors(): SmartHomeSensorConfig[] {
    const saved = localStorage.getItem(this.sensorsStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing smart home sensors settings:', error);
        return DEFAULT_SENSORS;
      }
    }
    return DEFAULT_SENSORS;
  }

  saveSensors(sensors: SmartHomeSensorConfig[]): void {
    localStorage.setItem(this.sensorsStorageKey, JSON.stringify(sensors));
  }

  updateSensor(id: string, updates: Partial<SmartHomeSensorConfig>): void {
    const sensors = this.getSensors();
    const index = sensors.findIndex(s => s.id === id);
    if (index !== -1) {
      sensors[index] = { ...sensors[index], ...updates };
      this.saveSensors(sensors);
    }
  }

  getSensor(id: string): SmartHomeSensorConfig | undefined {
    return this.getSensors().find(s => s.id === id);
  }

  getACConfig(): SmartHomeACConfig {
    const saved = localStorage.getItem(this.acStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing smart home AC settings:', error);
        return DEFAULT_AC_CONFIG;
      }
    }
    return DEFAULT_AC_CONFIG;
  }

  saveACConfig(config: SmartHomeACConfig): void {
    localStorage.setItem(this.acStorageKey, JSON.stringify(config));
  }

  updateACConfig(updates: Partial<SmartHomeACConfig>): void {
    const config = this.getACConfig();
    const updated = { ...config, ...updates };
    this.saveACConfig(updated);
  }

  resetToDefaults(): void {
    this.saveDevices(DEFAULT_DEVICES);
    this.saveSensors(DEFAULT_SENSORS);
    this.saveACConfig(DEFAULT_AC_CONFIG);
  }
}

export const smartHomeSettings = new SmartHomeSettingsService();
