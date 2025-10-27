/**
 * Bluetooth Service - Singleton wrapper for Bluetooth operations
 *
 * This service uses the bluetoothAdapter to automatically support both:
 * - Web Bluetooth API (for browsers on Desktop/Android)
 * - Capacitor Bluetooth LE (for native iOS/Android apps)
 */

import { createBluetoothAdapter, type IBluetoothAdapter } from './bluetoothAdapter';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface BluetoothDevice {
  name: string;
  id: string;
  connected: boolean;
}

class BluetoothService {
  private adapter: IBluetoothAdapter;

  constructor() {
    // Create appropriate adapter based on platform
    this.adapter = createBluetoothAdapter();
  }

  // Проверка поддержки Bluetooth
  isSupported(): boolean {
    return this.adapter.isSupported();
  }

  // Подключение к устройству
  async connect(): Promise<BluetoothDevice> {
    return this.adapter.connect();
  }

  // Отключение от устройства
  async disconnect(): Promise<void> {
    return this.adapter.disconnect();
  }

  // Отправка данных
  async sendData(data: string): Promise<void> {
    return this.adapter.sendData(data);
  }

  // Установка callback для получения данных
  onDataReceived(callback: (data: string) => void): void {
    this.adapter.onDataReceived(callback);
  }

  // Установка callback для изменения статуса подключения
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.adapter.onConnectionStatusChange(callback);
  }

  // Получение текущего устройства
  getDevice(): BluetoothDevice | null {
    return this.adapter.getDevice();
  }

  // Проверка подключения
  isConnected(): boolean {
    return this.adapter.isConnected();
  }

  // Получение текущего статуса подключения
  getConnectionStatus(): ConnectionStatus {
    return this.adapter.getConnectionStatus();
  }

  // Отправка AT-команды
  async sendATCommand(command: string): Promise<void> {
    return this.adapter.sendATCommand(command);
  }
}

// Экспорт синглтона
export const bluetoothService = new BluetoothService();
