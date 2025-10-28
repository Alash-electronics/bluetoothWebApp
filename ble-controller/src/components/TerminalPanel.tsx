import { useState, useEffect, useRef } from 'react';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { appSettings } from '../services/appSettings';
import { macroSettings, type MacroConfig } from '../services/macroSettings';
import { Capacitor } from '@capacitor/core';
import { BleDeviceListModal } from './BleDeviceListModal';

interface TerminalPanelProps {
  connectionStatus: ConnectionStatus;
  deviceName?: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'status' | 'sent' | 'received' | 'error';
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  connectionStatus: initialConnectionStatus,
  onBack,
  onOpenSettings
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [macros, setMacros] = useState<MacroConfig[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Отслеживание ориентации
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscapeNow = width > height && width < 1024;
      console.log('Orientation check:', { width, height, isLandscapeNow });
      setIsLandscape(isLandscapeNow);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Также проверяем через небольшой таймаут
    const timer = setTimeout(checkOrientation, 100);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      clearTimeout(timer);
    };
  }, []);

  const addLog = (message: string, type: LogEntry['type']) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    // Загружаем макросы из настроек
    setMacros(macroSettings.getMacros());

    // Подписываемся на получение данных
    bluetoothService.onDataReceived((data) => {
      addLog(data, 'received');
    });

    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      const statusText = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected';
      addLog(statusText, 'status');
    });

    // Периодически обновляем макросы (на случай если пользователь изменил их в настройках)
    const interval = setInterval(() => {
      setMacros(macroSettings.getMacros());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Автоскролл к концу логов
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSend = async () => {
    if (!inputValue.trim() || !isConnected) return;

    appSettings.vibrate(30);
    addLog(inputValue, 'sent');

    try {
      await bluetoothService.sendData(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Error sending data:', error);
      addLog('Error sending data', 'error');
      appSettings.vibrate([50, 50, 50]);
    }
  };

  const handleMacroClick = async (macro: MacroConfig) => {
    if (!isConnected) return;

    appSettings.vibrate(30);
    addLog(macro.command, 'sent');

    try {
      await bluetoothService.sendData(macro.command);
    } catch (error) {
      console.error('Error sending macro:', error);
      addLog('Error sending macro', 'error');
      appSettings.vibrate([50, 50, 50]);
    }
  };

  const handleClearLogs = () => {
    appSettings.vibrate(30);
    setLogs([]);
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
          addLog('Disconnected', 'status');
        } catch (error) {
          console.error('Error disconnecting:', error);
          addLog('Error disconnecting', 'error');
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
          const device = await bluetoothService.connect();
          addLog(`Connecting to ${device.name}...`, 'status');
        } catch (error) {
          console.error('Connection error:', error);
          addLog('Connection failed', 'error');
          appSettings.vibrate([50, 50, 50]);
        }
      }
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'status': return 'text-yellow-400';
      case 'sent': return 'text-blue-400';
      case 'received': return 'text-green-400';
      case 'error': return 'text-red-400';
    }
  };

  if (isLandscape) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center p-4 select-none">
        <div className="text-center">
          <svg className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h2 className="text-white text-2xl font-bold mb-3">Поверните устройство</h2>
          <p className="text-gray-400 text-base">Terminal доступен только в вертикальном режиме</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 flex flex-col relative select-none">
      {/* Верхний бар - синий */}
      <div className="bg-blue-600 pt-12 px-2 pb-2 landscape:p-0.5 sm:p-4 sm:landscape:p-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Кнопка назад */}
          <button
            onClick={handleBackClick}
            className="text-white hover:bg-blue-700 p-1 landscape:p-0 sm:p-2 sm:landscape:p-2 rounded transition"
          >
            <svg className="w-4 h-4 landscape:w-2 landscape:h-2 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Заголовок с логотипом */}
          <div className="flex-1 flex items-center justify-center gap-1.5 landscape:gap-0.5 sm:gap-3 sm:landscape:gap-3">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-8 landscape:h-3 sm:h-20 sm:landscape:h-20 opacity-90" />
            <h1 className="text-white text-sm landscape:text-[8px] sm:text-2xl sm:landscape:text-2xl font-semibold">Terminal</h1>
          </div>

          {/* Иконки справа */}
          <div className="flex items-center gap-1 landscape:gap-0 sm:gap-2 sm:landscape:gap-2">
            {/* Статус подключения - кликабельная */}
            <button
              onClick={handleBluetoothClick}
              className="text-white p-1 landscape:p-0 sm:p-2 sm:landscape:p-2 hover:bg-blue-700 rounded transition flex items-center gap-1 landscape:gap-0 sm:gap-2 sm:landscape:gap-2"
              title={
                connectionStatus === 'connected'
                  ? 'Подключен - нажмите для отключения'
                  : connectionStatus === 'connecting'
                  ? 'Подключение...'
                  : 'Отключен - нажмите для подключения'
              }
            >
              <svg
                className={`w-4 h-4 landscape:w-2 landscape:h-2 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6 ${connectionStatus === 'disconnected' ? 'opacity-50' : ''} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
              </svg>
              <div className={`w-1.5 h-1.5 landscape:w-0.5 landscape:h-0.5 sm:w-2 sm:h-2 sm:landscape:w-2 sm:landscape:h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400'
              }`}></div>
              <span className="text-[10px] landscape:text-[6px] sm:text-xs sm:landscape:text-xs">
                {connectionStatus === 'connected'
                  ? 'Подключен'
                  : connectionStatus === 'connecting'
                  ? 'Подключение...'
                  : 'Отключен'}
              </span>
            </button>

            {/* GitHub */}
            <button
              onClick={() => {
                appSettings.vibrate(30);
                window.open('https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples', '_blank');
              }}
              className="text-white hover:bg-blue-700 p-1 landscape:p-0 sm:p-2 sm:landscape:p-2 rounded transition"
              title="Arduino примеры на GitHub"
            >
              <svg className="w-4 h-4 landscape:w-2 landscape:h-2 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </button>

            {/* Очистить лог */}
            <button
              onClick={handleClearLogs}
              className="text-white hover:bg-blue-700 p-1 landscape:p-0 sm:p-2 sm:landscape:p-2 rounded transition"
            >
              <svg className="w-4 h-4 landscape:w-2 landscape:h-2 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Настройки */}
            <button
              onClick={handleSettingsClick}
              className="text-white hover:bg-blue-700 p-1 landscape:p-0 sm:p-2 sm:landscape:p-2 rounded transition"
            >
              <svg className="w-4 h-4 landscape:w-2 landscape:h-2 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Область логов */}
      <div className="flex-1 overflow-y-auto p-4 landscape:p-2 sm:p-4 sm:landscape:p-4 bg-gray-800 font-mono text-sm landscape:text-xs sm:text-sm sm:landscape:text-sm">
        {logs.length === 0 && (
          <div className="text-gray-500 text-center mt-8 landscape:mt-2 sm:mt-8 sm:landscape:mt-8">No messages yet...</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="mb-1 landscape:mb-0.5 sm:mb-1 sm:landscape:mb-1">
            <span className="text-gray-500">{log.timestamp} </span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Кнопки макросов */}
      <div className="bg-gray-900 p-3 landscape:p-1.5 sm:p-3 sm:landscape:p-3 grid grid-cols-6 gap-2 landscape:gap-1 sm:gap-2 sm:landscape:gap-2">
        {macros.map((macro) => (
          <button
            key={macro.id}
            onClick={() => handleMacroClick(macro)}
            disabled={!isConnected}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 landscape:py-1.5 landscape:text-xs sm:py-3 sm:text-base sm:landscape:py-3 sm:landscape:text-base rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* Поле ввода */}
      <div className="bg-gray-900 p-4 landscape:p-2 sm:p-4 sm:landscape:p-4 border-t border-gray-700">
        <div className="flex gap-2 landscape:gap-1 sm:gap-2 sm:landscape:gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isConnected ? "Enter command..." : "Not connected"}
            disabled={!isConnected}
            className="flex-1 bg-gray-800 text-white px-4 landscape:px-2 py-3 landscape:py-1.5 landscape:text-xs sm:px-4 sm:py-3 sm:text-base sm:landscape:px-4 sm:landscape:py-3 sm:landscape:text-base rounded border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 landscape:px-3 py-3 landscape:py-1.5 sm:px-6 sm:py-3 sm:landscape:px-6 sm:landscape:py-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            <svg className="w-6 h-6 landscape:w-4 landscape:h-4 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    {/* Device selection modal */}
    {showDeviceModal && (
      <BleDeviceListModal
        onConnected={() => {
          setShowDeviceModal(false);
          addLog('Connected', 'status');
        }}
        onCancel={() => setShowDeviceModal(false)}
        onError={(error) => {
          setShowDeviceModal(false);
          addLog(`Connection error: ${error}`, 'error');
          appSettings.vibrate([50, 50, 50]);
        }}
      />
    )}
    </>
  );
};
