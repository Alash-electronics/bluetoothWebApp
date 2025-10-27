import { useState, useEffect, useRef } from 'react';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { appSettings } from '../services/appSettings';
import { macroSettings, type MacroConfig } from '../services/macroSettings';
import { useFullscreen } from '../hooks/useFullscreen';

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
  useFullscreen();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [macros, setMacros] = useState<MacroConfig[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
      try {
        const device = await bluetoothService.connect();
        addLog(`Connecting to ${device.name}...`, 'status');
      } catch (error) {
        console.error('Connection error:', error);
        addLog('Connection failed', 'error');
        appSettings.vibrate([50, 50, 50]);
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Верхний бар - синий */}
      <div className="bg-blue-600 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Кнопка назад */}
          <button
            onClick={handleBackClick}
            className="text-white hover:bg-blue-700 p-2 rounded transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Заголовок с логотипом */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-20 opacity-90" />
            <h1 className="text-white text-2xl font-semibold">Terminal</h1>
          </div>

          {/* Иконки справа */}
          <div className="flex items-center gap-2">
            {/* Статус подключения - кликабельная */}
            <button
              onClick={handleBluetoothClick}
              className="text-white p-2 hover:bg-blue-700 rounded transition flex items-center gap-2"
              title={
                connectionStatus === 'connected'
                  ? 'Подключен - нажмите для отключения'
                  : connectionStatus === 'connecting'
                  ? 'Подключение...'
                  : 'Отключен - нажмите для подключения'
              }
            >
              <svg
                className={`w-6 h-6 ${connectionStatus === 'disconnected' ? 'opacity-50' : ''} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
              </svg>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400'
              }`}></div>
              <span className="text-xs">
                {connectionStatus === 'connected'
                  ? 'Подключен'
                  : connectionStatus === 'connecting'
                  ? 'Подключение...'
                  : 'Отключен'}
              </span>
            </button>

            {/* Очистить лог */}
            <button
              onClick={handleClearLogs}
              className="text-white hover:bg-blue-700 p-2 rounded transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Настройки */}
            <button
              onClick={handleSettingsClick}
              className="text-white hover:bg-blue-700 p-2 rounded transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Область логов */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-800 font-mono text-sm">
        {logs.length === 0 && (
          <div className="text-gray-500 text-center mt-8">No messages yet...</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-500">{log.timestamp} </span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Кнопки макросов */}
      <div className="bg-gray-900 p-3 grid grid-cols-6 gap-2">
        {macros.map((macro) => (
          <button
            key={macro.id}
            onClick={() => handleMacroClick(macro)}
            disabled={!isConnected}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* Поле ввода */}
      <div className="bg-gray-900 p-4 border-t border-gray-700">
        <div className="flex gap-2">
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
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
