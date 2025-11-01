/**
 * Bluetooth Adapter - Universal interface for Web Bluetooth API and Capacitor Bluetooth LE
 *
 * This adapter automatically detects the platform (web browser or native app)
 * and uses the appropriate Bluetooth API:
 * - Web Bluetooth API for browsers (Chrome, Edge, Opera on Desktop/Android)
 * - Capacitor Bluetooth LE for native apps (iOS, Android via Capacitor)
 */

import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';
import type { BleDevice } from '@capacitor-community/bluetooth-le';
import type { ConnectionStatus, BluetoothDevice } from './bluetoothService';

// HM-10 UART service UUIDs
const UART_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const UART_TX_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export interface IBluetoothAdapter {
  isSupported(): boolean;
  connect(): Promise<BluetoothDevice>;
  connectToDevice(deviceId: string, deviceName?: string): Promise<BluetoothDevice>;
  disconnect(): Promise<void>;
  sendData(data: string): Promise<void>;
  onDataReceived(callback: (data: string) => void): void;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void;
  getDevice(): BluetoothDevice | null;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;
  sendATCommand(command: string): Promise<void>;
}

/**
 * Web Bluetooth API Adapter (for browsers)
 */
class WebBluetoothAdapter implements IBluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private nativeDevice: globalThis.BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private onDataReceivedCallback: ((data: string) => void) | null = null;
  private onConnectionStatusCallback: ((status: ConnectionStatus) => void) | null = null;
  private receiveBuffer: string = '';
  private textDecoder: TextDecoder = new TextDecoder('utf-8', { fatal: false });

  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  async connect(): Promise<BluetoothDevice> {
    try {
      if (!this.isSupported()) {
        throw new Error('Web Bluetooth API not supported in this browser');
      }

      this.connectionStatus = 'connecting';
      this.onConnectionStatusCallback?.('connecting');

      // Request device
      this.nativeDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [UART_SERVICE_UUID] },
          { namePrefix: 'HM' }
        ],
        optionalServices: [UART_SERVICE_UUID]
      });

      if (!this.nativeDevice.gatt) {
        throw new Error('GATT not supported by device');
      }

      // Connect to GATT server
      this.server = await this.nativeDevice.gatt.connect();

      // Get service
      const service = await this.server.getPrimaryService(UART_SERVICE_UUID);

      // Get characteristic
      this.characteristic = await service.getCharacteristic(UART_TX_CHARACTERISTIC_UUID);

      // Subscribe to notifications
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleDataReceived.bind(this));

      // Handle disconnect
      this.nativeDevice.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.device = {
        name: this.nativeDevice.name || 'Unknown Device',
        id: this.nativeDevice.id,
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

  async connectToDevice(_deviceId: string, _deviceName?: string): Promise<BluetoothDevice> {
    // Web Bluetooth doesn't support connecting by deviceId directly
    // Fall back to normal connect() which shows the device picker
    return this.connect();
  }

  async disconnect(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.nativeDevice = null;
    this.server = null;
    this.characteristic = null;
    this.receiveBuffer = '';
    this.connectionStatus = 'disconnected';
    this.onConnectionStatusCallback?.('disconnected');
  }

  async sendData(data: string): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    if (this.characteristic.properties.writeWithoutResponse) {
      await this.characteristic.writeValueWithoutResponse(dataBuffer);
    } else if (this.characteristic.properties.write) {
      await this.characteristic.writeValueWithResponse(dataBuffer);
    } else {
      throw new Error('Characteristic does not support write');
    }
  }

  private handleDataReceived(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;

    if (value) {
      // Use streaming decoder to handle multi-byte UTF-8 characters split across chunks
      const chunk = this.textDecoder.decode(value, { stream: true });

      // Accumulate data in buffer
      this.receiveBuffer += chunk;

      // Check for newline and process complete messages
      const lines = this.receiveBuffer.split('\n');

      // If we have at least one newline, process complete lines
      if (lines.length > 1) {
        // Process all complete lines (all except the last incomplete one)
        for (let i = 0; i < lines.length - 1; i++) {
          this.onDataReceivedCallback?.(lines[i]);
        }
        // Keep the incomplete line in the buffer
        this.receiveBuffer = lines[lines.length - 1];
      }
    }
  }

  private handleDisconnect(): void {
    this.device = null;
    this.nativeDevice = null;
    this.server = null;
    this.characteristic = null;
    this.receiveBuffer = '';
    this.connectionStatus = 'disconnected';
    this.onConnectionStatusCallback?.('disconnected');
  }

  onDataReceived(callback: (data: string) => void): void {
    this.onDataReceivedCallback = callback;
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  getDevice(): BluetoothDevice | null {
    return this.device;
  }

  isConnected(): boolean {
    return this.device?.connected ?? false;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  async sendATCommand(command: string): Promise<void> {
    if (command.includes('\r') || command.includes('\n')) {
      return this.sendData(command);
    }
    return this.sendData(command);
  }
}

/**
 * Capacitor Bluetooth LE Adapter (for native iOS/Android apps)
 */
class CapacitorBluetoothAdapter implements IBluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private bleDevice: BleDevice | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private onDataReceivedCallback: ((data: string) => void) | null = null;
  private onConnectionStatusCallback: ((status: ConnectionStatus) => void) | null = null;
  private receiveBuffer: string = '';
  private textDecoder: TextDecoder = new TextDecoder('utf-8', { fatal: false });

  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  private processBufferedData(value: DataView): void {
    // Use streaming decoder to handle multi-byte UTF-8 characters split across chunks
    const chunk = this.textDecoder.decode(value, { stream: true });

    // Accumulate data in buffer
    this.receiveBuffer += chunk;

    // Check for newline and process complete messages
    const lines = this.receiveBuffer.split('\n');

    // If we have at least one newline, process complete lines
    if (lines.length > 1) {
      // Process all complete lines (all except the last incomplete one)
      for (let i = 0; i < lines.length - 1; i++) {
        this.onDataReceivedCallback?.(lines[i]);
      }
      // Keep the incomplete line in the buffer
      this.receiveBuffer = lines[lines.length - 1];
    }
  }

  async connect(): Promise<BluetoothDevice> {
    try {
      if (!this.isSupported()) {
        throw new Error('Capacitor not available on this platform');
      }

      this.connectionStatus = 'connecting';
      this.onConnectionStatusCallback?.('connecting');

      // Initialize BLE
      await BleClient.initialize();

      // Request device
      // Note: iOS will show all BLE devices in range
      // User should select their module (e.g., BT05, HM-10, HC-05, ESP32)
      console.log('[Capacitor BLE] Opening device selection dialog...');
      this.bleDevice = await BleClient.requestDevice();

      // Connect to device
      await BleClient.connect(this.bleDevice.deviceId, () => {
        // Disconnect callback
        this.handleDisconnect();
      });

      // Start notifications
      await BleClient.startNotifications(
        this.bleDevice.deviceId,
        UART_SERVICE_UUID,
        UART_TX_CHARACTERISTIC_UUID,
        (value) => {
          // Data received callback
          this.processBufferedData(value);
        }
      );

      this.device = {
        name: this.bleDevice.name || 'Unknown Device',
        id: this.bleDevice.deviceId,
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

  async connectToDevice(deviceId: string, deviceName?: string): Promise<BluetoothDevice> {
    try {
      if (!this.isSupported()) {
        throw new Error('Capacitor not available on this platform');
      }

      console.log('[CapacitorAdapter] Starting connection to:', deviceId, deviceName);

      this.connectionStatus = 'connecting';
      this.onConnectionStatusCallback?.('connecting');

      // BLE уже инициализирован в сканировании, не вызываем повторно
      // await BleClient.initialize(); // УБРАЛИ

      // Connect directly to the device by deviceId (from custom scan)
      console.log('[CapacitorAdapter] Calling BleClient.connect...');
      await BleClient.connect(
        deviceId,
        () => {
          // Disconnect callback
          console.log('[CapacitorAdapter] Device disconnected');
          this.handleDisconnect();
        }
      );

      console.log('[CapacitorAdapter] Connected, starting notifications...');

      // Start notifications
      await BleClient.startNotifications(
        deviceId,
        UART_SERVICE_UUID,
        UART_TX_CHARACTERISTIC_UUID,
        (value) => {
          // Data received callback
          this.processBufferedData(value);
        }
      );

      // Важно: даем время характеристике полностью инициализироваться перед первой записью
      console.log('[CapacitorAdapter] Waiting for characteristic to be ready...');
      await new Promise(resolve => setTimeout(resolve, 500));

      this.bleDevice = {
        deviceId: deviceId,
        name: deviceName || 'BLE Device'
      };

      this.device = {
        name: deviceName || 'BLE Device',
        id: deviceId,
        connected: true
      };

      this.connectionStatus = 'connected';
      this.onConnectionStatusCallback?.('connected');

      console.log('[CapacitorAdapter] Connection complete!');
      return this.device;
    } catch (error) {
      console.error('[CapacitorAdapter] Connection failed:', error);
      this.connectionStatus = 'disconnected';
      this.onConnectionStatusCallback?.('disconnected');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.bleDevice) {
      try {
        await BleClient.disconnect(this.bleDevice.deviceId);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    this.device = null;
    this.bleDevice = null;
    this.receiveBuffer = '';
    this.connectionStatus = 'disconnected';
    this.onConnectionStatusCallback?.('disconnected');
  }

  async sendData(data: string): Promise<void> {
    if (!this.bleDevice) {
      throw new Error('Device not connected');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const dataView = new DataView(dataBuffer.buffer);

    // BT05/HM-10 модули используют writeWithoutResponse (не требуют подтверждения)
    await BleClient.writeWithoutResponse(
      this.bleDevice.deviceId,
      UART_SERVICE_UUID,
      UART_TX_CHARACTERISTIC_UUID,
      dataView
    );
  }

  private handleDisconnect(): void {
    this.device = null;
    this.bleDevice = null;
    this.receiveBuffer = '';
    this.connectionStatus = 'disconnected';
    this.onConnectionStatusCallback?.('disconnected');
  }

  onDataReceived(callback: (data: string) => void): void {
    this.onDataReceivedCallback = callback;
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  getDevice(): BluetoothDevice | null {
    return this.device;
  }

  isConnected(): boolean {
    return this.device?.connected ?? false;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  async sendATCommand(command: string): Promise<void> {
    if (command.includes('\r') || command.includes('\n')) {
      return this.sendData(command);
    }
    return this.sendData(command);
  }
}

/**
 * Factory function to create the appropriate adapter based on platform
 */
export function createBluetoothAdapter(): IBluetoothAdapter {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    console.log('[BluetoothAdapter] Using Capacitor Bluetooth LE (native platform)');
    return new CapacitorBluetoothAdapter();
  } else {
    console.log('[BluetoothAdapter] Using Web Bluetooth API (web platform)');
    return new WebBluetoothAdapter();
  }
}
