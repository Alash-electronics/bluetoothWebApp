import { useState, useEffect } from 'react';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { buttonSettingsService, type ButtonConfig } from '../services/buttonSettings';
import { appSettings } from '../services/appSettings';

interface ControlPanelProps {
  connectionStatus: ConnectionStatus;
  deviceName?: string;
  onOpenSettings: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ connectionStatus: initialConnectionStatus, deviceName, onOpenSettings }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('');

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    setButtons(buttonSettingsService.getButtons());

    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
  }, []);

  // Обновление кнопок при открытии настроек
  useEffect(() => {
    const interval = setInterval(() => {
      setButtons(buttonSettingsService.getButtons());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = async (button: ButtonConfig) => {
    if (!isConnected) return;

    // Вибрация при нажатии
    appSettings.vibrate(30);

    setPressedButton(button.id);
    setLastCommand(button.command);
    try {
      await bluetoothService.sendData(button.command);
    } catch (error) {
      console.error('Ошибка отправки команды:', error);
      // Вибрация при ошибке
      appSettings.vibrate([50, 50, 50]);
    } finally {
      setTimeout(() => setPressedButton(null), 150);
    }
  };

  const getButton = (id: string) => buttons.find(b => b.id === id);

  const handleSettingsClick = () => {
    appSettings.vibrate();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 to-blue-400 flex flex-col">
      {/* Верхний бар */}
      <div className="flex items-center justify-between p-4">
        {/* Кнопка назад */}
        <button className="w-12 h-12 bg-transparent hover:bg-white/10 rounded-lg flex items-center justify-center transition">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Статус подключения */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={handleBluetoothClick}
            className="bg-black/80 hover:bg-black/90 rounded-full px-6 py-3 flex items-center gap-3 min-w-[250px] transition"
            title={
              connectionStatus === 'connected'
                ? 'Подключен - нажмите для отключения'
                : connectionStatus === 'connecting'
                ? 'Подключение...'
                : 'Отключен - нажмите для подключения'
            }
          >
            <svg
              className={`w-8 h-8 text-cyan-400 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
            </svg>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">{deviceName || 'HM-10'}</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                }`}></div>
                <span className={`text-xs ${
                  connectionStatus === 'connected'
                    ? 'text-green-400'
                    : connectionStatus === 'connecting'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {connectionStatus === 'connected'
                    ? 'Подключен'
                    : connectionStatus === 'connecting'
                    ? 'Подключение...'
                    : 'Отключен'}
                </span>
              </div>
            </div>
            {connectionStatus === 'connected' && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Кнопка настроек */}
        <button
          onClick={handleSettingsClick}
          className="w-12 h-12 bg-transparent hover:bg-white/10 rounded-lg flex items-center justify-center transition"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Основная область с кнопками */}
      <div className="flex-1 flex items-center justify-center px-8 pb-20">
        <div className="w-full max-w-6xl grid grid-cols-3 gap-8 items-center">

          {/* Левая часть - Джойстик */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              {/* Вверх */}
              <button
                onClick={() => handleButtonClick(getButton('forward')!)}
                disabled={!isConnected}
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'forward' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ∧
              </button>

              {/* Влево */}
              <button
                onClick={() => handleButtonClick(getButton('left')!)}
                disabled={!isConnected}
                className={`absolute top-1/2 left-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'left' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ＜
              </button>

              {/* Вправо */}
              <button
                onClick={() => handleButtonClick(getButton('right')!)}
                disabled={!isConnected}
                className={`absolute top-1/2 right-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'right' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ＞
              </button>

              {/* Вниз */}
              <button
                onClick={() => handleButtonClick(getButton('backward')!)}
                disabled={!isConnected}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'backward' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ∨
              </button>
            </div>
          </div>

          {/* Центральная часть - Кнопки 1, 2, 3 */}
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              {['custom1', 'custom2', 'stop'].map((id, index) => {
                const button = getButton(id);
                return (
                  <button
                    key={id}
                    onClick={() => handleButtonClick(button!)}
                    disabled={!isConnected}
                    className={`w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                      pressedButton === id ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                    } disabled:opacity-30`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Поле ввода */}
            <div className="text-center">
              <div className="text-white text-xl mb-2">Ввод:</div>
              <div className="bg-white/30 backdrop-blur-sm rounded-lg px-6 py-3 min-w-[100px]">
                <span className="text-white font-mono text-2xl">{lastCommand || '-'}</span>
              </div>
            </div>
          </div>

          {/* Правая часть - Цветные кнопки YXBA */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              {/* Y - желтая сверху */}
              <button
                onClick={() => handleButtonClick(getButton('led_on')!)}
                disabled={!isConnected}
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-yellow-400 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'led_on' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                Y
              </button>

              {/* X - синяя слева */}
              <button
                onClick={() => handleButtonClick(getButton('led_off')!)}
                disabled={!isConnected}
                className={`absolute top-1/2 left-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-cyan-400 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'led_off' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                X
              </button>

              {/* B - красная справа */}
              <button
                onClick={() => handleButtonClick(buttons.find(b => b.id === 'custom2')!)}
                disabled={!isConnected}
                className={`absolute top-1/2 right-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-red-500 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'custom2' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                B
              </button>

              {/* A - зеленая снизу */}
              <button
                onClick={() => handleButtonClick(buttons.find(b => b.id === 'custom1')!)}
                disabled={!isConnected}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-green-400 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'custom1' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                A
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <div className="pb-4 px-4 flex items-center justify-between">
        <img src="/logo.png" alt="Logo" className="h-12 opacity-70" />
        <p className="text-white/50 text-sm">v1.0.1</p>
      </div>
    </div>
  );
};
