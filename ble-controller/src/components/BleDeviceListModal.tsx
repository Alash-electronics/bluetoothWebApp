import { useState, useEffect } from 'react';
import { BleClient, type BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { appSettings } from '../services/appSettings';
import { localization } from '../services/localization';
import { bluetoothService } from '../services/bluetoothService';

interface BleDeviceListModalProps {
  onConnected: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export const BleDeviceListModal = ({ onConnected, onCancel, onError }: BleDeviceListModalProps) => {
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [scanning, setScanning] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = localization.subscribe(() => forceUpdate({}));
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const discoveredDevices = new Map<string, BleDevice>();

    const startScanning = async () => {
      try {
        await BleClient.initialize();

        // Start scanning for BLE devices
        await BleClient.requestLEScan({}, (result) => {
          // Filter: only show devices with known prefixes (BT, HM, ESP, Arduino, etc.)
          // This filters out "Unknown" and random BLE devices
          const name = result.device.name;
          if (name && name !== 'Unknown') {
            // Accept devices that start with common module names
            const validPrefixes = ['BT', 'HM', 'ESP', 'Arduino', 'HC-', 'JDY', 'MLT', 'AT-'];
            const hasValidPrefix = validPrefixes.some(prefix => name.startsWith(prefix));

            // Also accept any device that doesn't look like a system device
            // (e.g., not starting with common iOS/Android device names)
            const isSystemDevice = name.includes('iPhone') || name.includes('iPad') ||
                                   name.includes('MacBook') || name.includes('Apple') ||
                                   name.includes('Flipper');

            if (hasValidPrefix || (!isSystemDevice && name.length > 0)) {
              discoveredDevices.set(result.device.deviceId, result.device);
              // Update UI with new list
              setDevices(Array.from(discoveredDevices.values()));
            }
          }
        });

        // Stop scanning after 10 seconds
        setTimeout(async () => {
          await BleClient.stopLEScan();
          setScanning(false);
        }, 10000);
      } catch (error) {
        console.error('Scanning error:', error);
        setScanning(false);
      }
    };

    startScanning();

    return () => {
      BleClient.stopLEScan().catch(() => {});
    };
  }, []);

  const handleDeviceSelect = async (device: BleDevice) => {
    appSettings.vibrate(30);

    setConnecting(true);
    setScanning(false);

    try {
      // Важно: полностью остановить сканирование перед подключением
      console.log('[BleDeviceListModal] Stopping scan...');
      await BleClient.stopLEScan();

      // Небольшая задержка для полной остановки сканирования
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('[BleDeviceListModal] Connecting to device:', device.name, device.deviceId);
      await bluetoothService.connectToDevice(device.deviceId, device.name);

      console.log('[BleDeviceListModal] Connected successfully!');
      onConnected();
    } catch (error) {
      setConnecting(false);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('[BleDeviceListModal] Connection error:', error);
      onError(errorMessage);
    }
  };

  const handleCancel = () => {
    appSettings.vibrate(30);
    BleClient.stopLEScan().catch(() => {});
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {localization.t('selectDevice')}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanning/Connecting indicator */}
        {(scanning || connecting) && (
          <div className="p-4 bg-blue-900 bg-opacity-50 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="text-white text-sm">
              {connecting ? localization.t('connecting') : `${localization.t('scanning')}...`}
            </span>
          </div>
        )}

        {/* Device list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {devices.length === 0 && !scanning && (
            <div className="text-center text-gray-400 py-8">
              <p>{localization.t('noDevicesFound')}</p>
              <p className="text-sm mt-2">{localization.t('makesSureDeviceIsOn')}</p>
            </div>
          )}

          {devices.map((device) => (
            <button
              key={device.deviceId}
              onClick={() => handleDeviceSelect(device)}
              disabled={connecting}
              className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">{device.name}</p>
                  <p className="text-gray-400 text-sm font-mono">{device.deviceId}</p>
                </div>
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleCancel}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {localization.t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
