import { useState, useEffect } from 'react';
import { appSettings } from '../services/appSettings';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { smartHomeSettings, type SmartHomeACConfig, type SmartHomeDeviceConfig } from '../services/smartHomeSettings';
import { Capacitor } from '@capacitor/core';
import { BleDeviceListModal } from './BleDeviceListModal';

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
  roomId: _roomId,
  roomName: _roomName,
  connectionStatus: initialConnectionStatus,
  deviceName: _deviceName,
  onBack,
  onOpenSettings
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [acEnabled, setAcEnabled] = useState(true);
  const [acMode, setAcMode] = useState<ACMode>('heat');
  const [temperature, setTemperature] = useState(24);

  // Состояния для устройств
  const [ledEnabled, setLedEnabled] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [doorLocked, setDoorLocked] = useState(true);
  const [fanEnabled, setFanEnabled] = useState(false);

  // Состояния датчиков
  const [motionDetected, setMotionDetected] = useState(false);
  const [gasDetected, setGasDetected] = useState(false);
  const [rainDetected, setRainDetected] = useState(false);

  // Конфигурация AC из настроек
  const [acConfig, setAcConfig] = useState<SmartHomeACConfig>(smartHomeSettings.getACConfig());

  // Конфигурация устройств из настроек
  const [deviceConfigs, setDeviceConfigs] = useState<SmartHomeDeviceConfig[]>(smartHomeSettings.getDevices());
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Конфигурация датчиков из настроек
  const [sensorConfigs, setSensorConfigs] = useState(smartHomeSettings.getSensors());

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Подписываемся на получение данных от датчиков
    bluetoothService.onDataReceived((data) => {
      const message = data.trim().toUpperCase();

      // Обработка данных датчиков
      if (message.includes('MOTION_ON')) setMotionDetected(true);
      else if (message.includes('MOTION_OFF')) setMotionDetected(false);

      if (message.includes('GAS_ON')) setGasDetected(true);
      else if (message.includes('GAS_OFF')) setGasDetected(false);

      if (message.includes('RAIN_ON')) setRainDetected(true);
      else if (message.includes('RAIN_OFF')) setRainDetected(false);
    });

    // Периодически обновляем конфигурацию AC, устройств и датчиков (на случай если пользователь изменил их в настройках)
    const interval = setInterval(() => {
      setAcConfig(smartHomeSettings.getACConfig());
      setDeviceConfigs(smartHomeSettings.getDevices());
      setSensorConfigs(smartHomeSettings.getSensors());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Вспомогательная функция для получения конфигурации устройства
  const getDeviceConfig = (deviceId: string) => {
    return deviceConfigs.find(d => d.id === deviceId);
  };

  // Вспомогательная функция для получения конфигурации датчика
  const getSensorConfig = (sensorId: string) => {
    return sensorConfigs.find(s => s.id === sensorId);
  };

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
      if (Capacitor.isNativePlatform()) {
        // На iOS/Android показываем кастомный список устройств
        setShowDeviceModal(true);
      } else {
        // В браузере используем системный диалог
        try {
          await bluetoothService.connect();
        } catch (error) {
          console.error('Connection error:', error);
          appSettings.vibrate([50, 50, 50]);
        }
      }
    }
  };

  const handleACToggle = async () => {
    appSettings.vibrate(30);
    setAcEnabled(!acEnabled);
    try {
      if (isConnected) {
        await bluetoothService.sendData(acEnabled ? acConfig.offCommand : acConfig.onCommand);
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
        const commandMap = {
          heat: acConfig.heatCommand,
          cool: acConfig.coolCommand,
          dry: acConfig.dryCommand,
          fan: acConfig.fanCommand,
        };
        await bluetoothService.sendData(commandMap[mode]);
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
        // Отправляем команду с префиксом + температура, например "TEMP_24"
        await bluetoothService.sendData(`${acConfig.tempSetPrefix}${newTemp}`);
        // Также можно отправить TEMP_UP или TEMP_DOWN
        // await bluetoothService.sendData(delta > 0 ? acConfig.tempUpCommand : acConfig.tempDownCommand);
      }
    } catch (error) {
      console.error('Error sending temperature command:', error);
      appSettings.vibrate([50, 50, 50]);
    }
  };

  // Обработчики для новых устройств
  const handleLEDToggle = async () => {
    appSettings.vibrate(30);
    setLedEnabled(!ledEnabled);
    try {
      if (isConnected) {
        const config = getDeviceConfig('led');
        if (config) {
          await bluetoothService.sendData(ledEnabled ? config.offCommand : config.onCommand);
        }
      }
    } catch (error) {
      console.error('Error sending LED command:', error);
    }
  };

  const handleWindowToggle = async () => {
    appSettings.vibrate(30);
    setWindowOpen(!windowOpen);
    try {
      if (isConnected) {
        const config = getDeviceConfig('window');
        if (config) {
          await bluetoothService.sendData(windowOpen ? config.offCommand : config.onCommand);
        }
      }
    } catch (error) {
      console.error('Error sending Window command:', error);
    }
  };

  const handleMusicToggle = async () => {
    appSettings.vibrate(30);
    setMusicPlaying(!musicPlaying);
    try {
      if (isConnected) {
        const config = getDeviceConfig('music');
        if (config) {
          await bluetoothService.sendData(musicPlaying ? config.offCommand : config.onCommand);
        }
      }
    } catch (error) {
      console.error('Error sending Music command:', error);
    }
  };

  const handleDoorToggle = async () => {
    appSettings.vibrate(30);
    setDoorLocked(!doorLocked);
    try {
      if (isConnected) {
        const config = getDeviceConfig('door');
        if (config) {
          await bluetoothService.sendData(doorLocked ? config.offCommand : config.onCommand);
        }
      }
    } catch (error) {
      console.error('Error sending Door command:', error);
    }
  };

  const handleFanToggle = async () => {
    appSettings.vibrate(30);
    setFanEnabled(!fanEnabled);
    try {
      if (isConnected) {
        const config = getDeviceConfig('fan');
        if (config) {
          await bluetoothService.sendData(fanEnabled ? config.offCommand : config.onCommand);
        }
      }
    } catch (error) {
      console.error('Error sending Fan command:', error);
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
      <div className="bg-white pt-12 px-4 pb-4 shadow-sm">
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
                <div className="text-white font-semibold text-sm">{_deviceName || 'HC-05'}</div>
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

        {/* Кнопки управления устройствами */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Devices</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* LED */}
            <button
              onClick={handleLEDToggle}
              disabled={!isConnected}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                ledEnabled ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white text-gray-700 shadow'
              } disabled:opacity-50`}
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
              </svg>
              <span className="font-semibold text-sm">{getDeviceConfig('led')?.label || 'LED'}</span>
              <span className="text-xs">{ledEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Window */}
            <button
              onClick={handleWindowToggle}
              disabled={!isConnected}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                windowOpen ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 shadow'
              } disabled:opacity-50`}
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM19 7H5v10h14V7zm-2 8H7V9h10v6z"/>
              </svg>
              <span className="font-semibold text-sm">{getDeviceConfig('window')?.label || 'Window'}</span>
              <span className="text-xs">{windowOpen ? 'OPEN' : 'CLOSE'}</span>
            </button>

            {/* Music */}
            <button
              onClick={handleMusicToggle}
              disabled={!isConnected}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                musicPlaying ? 'bg-purple-500 text-white shadow-lg' : 'bg-white text-gray-700 shadow'
              } disabled:opacity-50`}
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <span className="font-semibold text-sm">{getDeviceConfig('music')?.label || 'Music'}</span>
              <span className="text-xs">{musicPlaying ? 'PLAY' : 'STOP'}</span>
            </button>

            {/* Door */}
            <button
              onClick={handleDoorToggle}
              disabled={!isConnected}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                doorLocked ? 'bg-red-500 text-white shadow-lg' : 'bg-green-500 text-white shadow-lg'
              } disabled:opacity-50`}
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                {doorLocked ? (
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                ) : (
                  <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
                )}
              </svg>
              <span className="font-semibold text-sm">{getDeviceConfig('door')?.label || 'Door'}</span>
              <span className="text-xs">{doorLocked ? 'LOCKED' : 'UNLOCKED'}</span>
            </button>

            {/* Fan */}
            <button
              onClick={handleFanToggle}
              disabled={!isConnected}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                fanEnabled ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white text-gray-700 shadow'
              } disabled:opacity-50`}
            >
              <svg className={`w-12 h-12 ${fanEnabled ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 0c.55 0 1-.45 1-1 0-2.52 1.82-4.63 4.25-4.96-.49.79-1.15 1.58-1.73 2.18-1.55 1.61-1.68 2.37-1.52 2.78.24.63.92 1.12 1.64 1.13l-.01.01c.48.15 1.07-.03 1.66-.62.37-.38.81-.91 1.21-1.52.4.61.84 1.14 1.21 1.52.59.59 1.18.77 1.66.62l-.01-.01c.72-.01 1.4-.5 1.64-1.13.16-.41.03-1.17-1.52-2.78-.58-.6-1.24-1.39-1.73-2.18C17.18 5.37 19 7.48 19 10c0 .55.45 1 1 1s1-.45 1-1c0-3.87-3.13-7-7-7-1.63 0-3.13.56-4.32 1.5.69.46 1.39.95 2.04 1.5.45-.41.99-.77 1.55-1.06C10.66 3.31 10 2.19 10 1c0-.55-.45-1-1-1s-1 .45-1 1c0 1.19-.66 2.31-2.27 3.94.56.29 1.1.65 1.55 1.06.65-.55 1.35-1.04 2.04-1.5C8.13 5.56 6.63 6.13 5 8c-2.21 2.51-2 4.5-2 5 0 .55.45 1 1 1zm12 2c-.55 0-1 .45-1 1 0 2.52-1.82 4.63-4.25 4.96.49-.79 1.15-1.58 1.73-2.18 1.55-1.61 1.68-2.37 1.52-2.78-.24-.63-.92-1.12-1.64-1.13l.01-.01c-.48-.15-1.07.03-1.66.62-.37.38-.81.91-1.21 1.52-.4-.61-.84-1.14-1.21-1.52-.59-.59-1.18-.77-1.66-.62l.01.01c-.72.01-1.4.5-1.64 1.13-.16.41-.03 1.17 1.52 2.78.58.6 1.24 1.39 1.73 2.18C6.82 18.63 5 16.52 5 14c0-.55-.45-1-1-1s-1 .45-1 1c0 3.87 3.13 7 7 7 1.63 0 3.13-.56 4.32-1.5-.69-.46-1.39-.95-2.04-1.5-.45.41-.99.77-1.55 1.06C13.34 20.69 14 21.81 14 23c0 .55.45 1 1 1s1-.45 1-1c0-1.19.66-2.31 2.27-3.94-.56-.29-1.1-.65-1.55-1.06-.65.55-1.35 1.04-2.04 1.5C15.87 18.44 17.37 17.87 19 16c2.21-2.51 2-4.5 2-5 0-.55-.45-1-1-1z"/>
              </svg>
              <span className="font-semibold text-sm">{getDeviceConfig('fan')?.label || 'Fan'}</span>
              <span className="text-xs">{fanEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Датчики */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sensors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Датчик движения */}
            <div className={`p-6 rounded-2xl flex items-center gap-4 ${
              motionDetected ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-gray-700 shadow'
            }`}>
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-lg">{getSensorConfig('motion')?.label || 'Motion'}</div>
                <div className="text-sm opacity-80">{motionDetected ? 'Detected' : 'No Motion'}</div>
              </div>
              <div className={`w-4 h-4 rounded-full ${motionDetected ? 'bg-white' : 'bg-gray-300'}`}></div>
            </div>

            {/* Датчик газа */}
            <div className={`p-6 rounded-2xl flex items-center gap-4 ${
              gasDetected ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-white text-gray-700 shadow'
            }`}>
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-lg">{getSensorConfig('gas')?.label || 'Gas'}</div>
                <div className="text-sm opacity-80">{gasDetected ? '⚠️ ALERT!' : 'Normal'}</div>
              </div>
              <div className={`w-4 h-4 rounded-full ${gasDetected ? 'bg-white' : 'bg-gray-300'}`}></div>
            </div>

            {/* Датчик дождя */}
            <div className={`p-6 rounded-2xl flex items-center gap-4 ${
              rainDetected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 shadow'
            }`}>
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3.77L11.25 4.5C10.89 4.84 10.5 5.18 10.13 5.5C8.5 6.94 6 9.42 6 12.5C6 16.09 8.91 19 12.5 19C16.09 19 19 16.09 19 12.5C19 9.42 16.5 6.94 14.87 5.5C14.5 5.18 14.11 4.84 13.75 4.5L13 3.77L12 2.77L11 3.77L12 3.77M12 17C9.79 17 8 15.21 8 13C8 11.25 9.5 9.42 11.13 8.06C11.5 7.74 11.89 7.4 12.25 7.08L13 7.77C13.11 7.88 13.25 8 13.38 8.13C15 9.5 16 11.34 16 13C16 15.21 14.21 17 12 17Z"/>
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-lg">{getSensorConfig('rain')?.label || 'Rain'}</div>
                <div className="text-sm opacity-80">{rainDetected ? 'Raining' : 'Dry'}</div>
              </div>
              <div className={`w-4 h-4 rounded-full ${rainDetected ? 'bg-white' : 'bg-gray-300'}`}></div>
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
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-20 opacity-70" />
      </div>

      {/* Device selection modal */}
      {showDeviceModal && (
        <BleDeviceListModal
          onConnected={() => setShowDeviceModal(false)}
          onCancel={() => setShowDeviceModal(false)}
          onError={(error) => {
            setShowDeviceModal(false);
            console.error('Connection error:', error);
            appSettings.vibrate([50, 50, 50]);
          }}
        />
      )}
    </div>
  );
};
