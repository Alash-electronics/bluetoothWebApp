import { useState, useEffect } from 'react';
import { appSettings } from '../services/appSettings';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';

interface SmartHomeRoomControlProps {
  roomId: string;
  roomName: string;
  connectionStatus: ConnectionStatus;
  deviceName?: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

type ACMode = 'heat' | 'cool' | 'dry' | 'fan';

export const SmartHomeRoomControl: React.FC<SmartHomeRoomControlProps> = ({
  roomId,
  roomName,
  connectionStatus: initialConnectionStatus,
  deviceName,
  onBack,
  onOpenSettings
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [acEnabled, setAcEnabled] = useState(true);
  const [acMode, setAcMode] = useState<ACMode>('heat');
  const [temperature, setTemperature] = useState(24);

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
  }, []);

  const handleBackClick = () => {
    appSettings.vibrate(30);
    onBack();
  };

  const handleSettingsClick = () => {
    appSettings.vibrate(30);
    onOpenSettings();
  };

  const handleBluetoothClick = async () => {
    appSettings.vibrate(30);

    if (isConnected) {
      // Если подключено - предлагаем отключиться
      if (confirm('Отключиться от устройства?')) {
        try {
          await bluetoothService.disconnect();
        } catch (error) {
          console.error('Error disconnecting:', error);
          appSettings.vibrate([50, 50, 50]);
        }
      }
    } else {
      // Если не подключено - предлагаем подключиться
      try {
        await bluetoothService.connect();
      } catch (error) {
        console.error('Connection error:', error);
        appSettings.vibrate([50, 50, 50]);
      }
    }
  };

  const handleACToggle = async () => {
    appSettings.vibrate(30);
    setAcEnabled(!acEnabled);
    try {
      if (isConnected) {
        await bluetoothService.sendData(acEnabled ? 'AC_OFF' : 'AC_ON');
      }
    } catch (error) {
      console.error('Error sending AC command:', error);
      appSettings.vibrate([50, 50, 50]);
    }
  };

  const handleModeChange = async (mode: ACMode) => {
    appSettings.vibrate(30);
    setAcMode(mode);
    try {
      if (isConnected) {
        await bluetoothService.sendData(`MODE_${mode.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error sending mode command:', error);
      appSettings.vibrate([50, 50, 50]);
    }
  };

  const handleTempChange = async (delta: number) => {
    appSettings.vibrate(30);
    const newTemp = Math.max(16, Math.min(30, temperature + delta));
    setTemperature(newTemp);
    try {
      if (isConnected) {
        await bluetoothService.sendData(`TEMP_${newTemp}`);
      }
    } catch (error) {
      console.error('Error sending temperature command:', error);
      appSettings.vibrate([50, 50, 50]);
    }
  };

  const modeConfig = {
    heat: { icon: '☀️', label: 'Heat', color: 'bg-blue-500 text-white' },
    cool: { icon: '❄️', label: 'Cool', color: 'bg-gray-200 text-gray-600' },
    dry: { icon: '💧', label: 'Dry', color: 'bg-gray-200 text-gray-600' },
    fan: { icon: '🌀', label: 'Fan', color: 'bg-gray-200 text-gray-600' },
  };

  // Расчет процента для круга (0-100)
  const tempPercentage = ((temperature - 16) / (30 - 16)) * 100;
  const strokeDasharray = 2 * Math.PI * 90; // радиус 90
  const strokeDashoffset = strokeDasharray - (strokeDasharray * tempPercentage) / 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Верхний бар */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Кнопка назад */}
          <button
            onClick={handleBackClick}
            className="w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Статус подключения */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={handleBluetoothClick}
              className="bg-blue-500 hover:bg-blue-600 rounded-full px-6 py-3 flex items-center gap-3 transition"
              title={
                connectionStatus === 'connected'
                  ? 'Подключен - нажмите для отключения'
                  : connectionStatus === 'connecting'
                  ? 'Подключение...'
                  : 'Отключен - нажмите для подключения'
              }
            >
              <div className={`w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}>
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{deviceName || 'HC-05'}</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-400'
                      : connectionStatus === 'connecting'
                      ? 'bg-yellow-400 animate-pulse'
                      : 'bg-red-400'
                  }`}></div>
                  <span className="text-white/80 text-xs">
                    {connectionStatus === 'connected'
                      ? 'Подключен'
                      : connectionStatus === 'connecting'
                      ? 'Подключение...'
                      : 'Отключен'}
                  </span>
                </div>
              </div>
              <svg className="w-6 h-6 text-white ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </button>
          </div>

          {/* Кнопка настроек */}
          <button
            onClick={handleSettingsClick}
            className="w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 p-6 space-y-6 overflow-auto pb-24">
        {/* Заголовок Air Condition */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Air Condition</h1>
          <button
            onClick={handleACToggle}
            className={`w-14 h-8 rounded-full transition-colors ${
              acEnabled ? 'bg-blue-500' : 'bg-gray-300'
            } relative`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              acEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}></div>
          </button>
        </div>

        {/* Кнопки режимов */}
        <div className="flex gap-4">
          {(Object.keys(modeConfig) as ACMode[]).map((mode) => {
            const config = modeConfig[mode];
            const isActive = acMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={!acEnabled}
                className={`flex-1 py-4 rounded-2xl font-semibold transition ${
                  isActive ? config.color : 'bg-gray-100 text-gray-400'
                } ${!acEnabled && 'opacity-50'}`}
              >
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="text-sm">{config.label}</div>
              </button>
            );
          })}
        </div>

        {/* Круговой термостат */}
        <div className="flex flex-col items-center py-8">
          <div className="text-sm text-gray-500 mb-2">30%</div>
          <div className="relative w-64 h-64">
            {/* SVG круг */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Фон круга */}
              <circle
                cx="128"
                cy="128"
                r="90"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="20"
              />
              {/* Прогресс круга */}
              <circle
                cx="128"
                cy="128"
                r="90"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>

            {/* Центральное значение температуры */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-lg">
                <div className="text-5xl font-bold text-gray-800">{temperature}°C</div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => handleTempChange(-1)}
                    disabled={!acEnabled || temperature <= 16}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-30"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleTempChange(1)}
                    disabled={!acEnabled || temperature >= 30}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-30"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Метки процентов */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-sm text-gray-400">15%</div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-sm text-gray-400">45%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button className="bg-blue-500 text-white px-8 py-3 rounded-full flex items-center gap-2 shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <span className="font-semibold">Control Panel</span>
          </button>
          <button className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
        <div className="h-1 bg-black rounded-full w-32 mx-auto mt-2"></div>
      </div>

      {/* Лого внизу слева */}
      <div className="fixed bottom-20 left-4">
        <img src="/logo.png" alt="Logo" className="h-12 opacity-70" />
      </div>
    </div>
  );
};
