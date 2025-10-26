import { useState, useEffect } from 'react';
import { bluetoothService, type BluetoothDevice, type ConnectionStatus } from '../services/bluetoothService';

interface ConnectionPanelProps {
  onConnectionChange: (status: ConnectionStatus, name?: string) => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ onConnectionChange }) => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(bluetoothService.getConnectionStatus());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Подписка на изменение статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        setDevice(null);
      }
      onConnectionChange(status);
    });
  }, [onConnectionChange]);

  const handleConnect = async () => {
    setError(null);

    try {
      if (!bluetoothService.isSupported()) {
        throw new Error(
          'Web Bluetooth API не поддерживается. Используйте Chrome, Edge или Opera на desktop.'
        );
      }

      const connectedDevice = await bluetoothService.connect();
      setDevice(connectedDevice);
      onConnectionChange('connected', connectedDevice.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка подключения:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothService.disconnect();
      setDevice(null);
      onConnectionChange('disconnected');
    } catch (err) {
      console.error('Ошибка отключения:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Подключение к HM-10</h2>

      {!device ? (
        <div>
          <button
            onClick={handleConnect}
            disabled={connectionStatus === 'connecting'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectionStatus === 'connecting' ? 'Подключение...' : 'Подключиться'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold">Ошибка:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Требования:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li>Используйте Chrome, Edge или Opera</li>
              <li>HTTPS соединение (или localhost)</li>
              <li>Bluetooth должен быть включен</li>
              <li>HM-10 должен быть в зоне действия</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">Подключено к устройству</p>
                <p className="text-sm text-green-600 mt-1">
                  {device.name} (ID: {device.id})
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Отключиться
          </button>
        </div>
      )}
    </div>
  );
};
