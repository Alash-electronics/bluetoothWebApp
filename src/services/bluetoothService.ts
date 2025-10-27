// HM-10 BLE Service
// HM-10 обычно использует стандартный UART service UUID
const UART_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const UART_TX_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface BluetoothDevice {
  name: string;
  id: string;
  connected: boolean;
}

class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private onDataReceivedCallback: ((data: string) => void) | null = null;
  private onConnectionStatusCallback: ((status: ConnectionStatus) => void) | null = null;

  // Проверка поддержки Web Bluetooth API
  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Подключение к HM-10
  async connect(): Promise<BluetoothDevice> {
    try {
      if (!this.isSupported()) {
        throw new Error('Web Bluetooth API не поддерживается в этом браузере');
      }

      // Устанавливаем статус "подключение"
      this.connectionStatus = 'connecting';
      this.onConnectionStatusCallback?.('connecting');

      // Запрос устройства
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [UART_SERVICE_UUID] },
          { namePrefix: 'HM' }
        ],
        optionalServices: [UART_SERVICE_UUID]
      });

      if (!device.gatt) {
        throw new Error('GATT не поддерживается устройством');
      }

      // Подключение к GATT серверу
      this.server = await device.gatt.connect();

      // Получение сервиса
      const service = await this.server.getPrimaryService(UART_SERVICE_UUID);

      // Получение характеристики
      this.characteristic = await service.getCharacteristic(UART_TX_CHARACTERISTIC_UUID);

      // Подписка на уведомления
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleDataReceived.bind(this));

      // Обработчик отключения
      device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.device = {
        name: device.name || 'Unknown Device',
        id: device.id,
        connected: true
      };

      this.connectionStatus = 'connected';
      this.onConnectionStatusCallback?.('connected');

      return this.device;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.onConnectionStatusCallback?.('disconnected');
      throw error;
    }
  }

  // Отключение от устройства
  async disconnect(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.connectionStatus = 'disconnected';
    this.onConnectionStatusCallback?.('disconnected');
  }

  // Отправка данных на HM-10
  async sendData(data: string): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Устройство не подключено');
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Отправляем данные (новый формат всегда влезает в один пакет <= 20 байт)
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(dataBuffer);
      } else if (this.characteristic.properties.write) {
        await this.characteristic.writeValueWithResponse(dataBuffer);
      } else {
        throw new Error('Характеристика не поддерживает запись');
      }
    } catch (error) {
      // Ошибка отправки данных - тихо игнорируем для производительности
      throw error;
    }
  }

  // Обработка полученных данных
  private handleDataReceived(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;

    if (value) {
      const decoder = new TextDecoder();
      const text = decoder.decode(value);
      this.onDataReceivedCallback?.(text);
    }
  }

  // Обработка отключения
  private handleDisconnect(): void {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.connectionStatus = 'disconnected';
    this.onConnectionStatusCallback?.('disconnected');
  }

  // Установка callback для получения данных
  onDataReceived(callback: (data: string) => void): void {
    this.onDataReceivedCallback = callback;
  }

  // Установка callback для изменения статуса подключения
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  // Получение текущего устройства
  getDevice(): BluetoothDevice | null {
    return this.device;
  }

  // Проверка подключения
  isConnected(): boolean {
    return this.device?.connected ?? false;
  }

  // Получение текущего статуса подключения
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Отправка AT-команды (некоторые модули требуют \r\n в конце)
  async sendATCommand(command: string): Promise<void> {
    // Если команда уже содержит \r или \n, отправляем как есть
    if (command.includes('\r') || command.includes('\n')) {
      return this.sendData(command);
    }
    // Иначе отправляем без дополнительных символов (HM-10 обычно не требует \r\n)
    return this.sendData(command);
  }
}

// Экспорт синглтона
export const bluetoothService = new BluetoothService();
