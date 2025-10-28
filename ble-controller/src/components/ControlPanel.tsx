import { useState, useEffect, useCallback } from 'react';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { appSettings } from '../services/appSettings';
import { controlPanelSettings, type ControlButtonConfig } from '../services/controlPanelSettings';
import { Capacitor } from '@capacitor/core';
import { BleDeviceListModal } from './BleDeviceListModal';

interface ControlPanelProps {
  connectionStatus: ConnectionStatus;
  deviceName?: string;
  onOpenSettings: () => void;
  onBack: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ connectionStatus: initialConnectionStatus, deviceName, onOpenSettings, onBack }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [buttonConfigs, setButtonConfigs] = useState<ControlButtonConfig[]>([]);
  const [gamepadButtonStates, setGamepadButtonStates] = useState<boolean[]>(new Array(20).fill(false));
  const [isPortrait, setIsPortrait] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Отслеживание ориентации - блокировка вертикального режима
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortraitNow = height > width && height < 1024;
      console.log('ControlPanel orientation:', { width, height, isPortraitNow });
      setIsPortrait(isPortraitNow);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    const timer = setTimeout(checkOrientation, 100);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      clearTimeout(timer);
    };
  }, []);

  // Вспомогательная функция для получения конфига кнопки
  const getButtonConfig = useCallback((id: string): ControlButtonConfig | undefined => {
    return buttonConfigs.find(b => b.id === id);
  }, [buttonConfigs]);

  const handleButtonPress = useCallback(async (command: string) => {
    if (!isConnected) return;
    appSettings.vibrate(30);
    setLastCommand(command);
    try {
      await bluetoothService.sendData(command);
    } catch (error) {
      console.error('Ошибка отправки команды:', error);
      appSettings.vibrate([50, 50, 50]);
    }
  }, [isConnected]);

  const handleButtonRelease = useCallback(async (command: string) => {
    if (!isConnected) return;
    setLastCommand(command);
    try {
      await bluetoothService.sendData(command);
    } catch (error) {
      console.error('Ошибка отправки команды:', error);
    }
  }, [isConnected]);

  // Загрузка настроек кнопок
  useEffect(() => {
    setButtonConfigs(controlPanelSettings.getButtons());

    // Периодическое обновление настроек
    const interval = setInterval(() => {
      setButtonConfigs(controlPanelSettings.getButtons());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Обработка нажатий клавиатуры
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isConnected) return;

      // Предотвращаем повторные срабатывания при удержании
      if (e.repeat) return;

      let buttonId: string | null = null;
      let config: ControlButtonConfig | undefined = undefined;

      // WASD - левые кнопки
      if (e.key.toLowerCase() === 'w') { buttonId = 'w'; config = getButtonConfig('w'); }
      else if (e.key.toLowerCase() === 'a') { buttonId = 'a'; config = getButtonConfig('a'); }
      else if (e.key.toLowerCase() === 's') { buttonId = 's'; config = getButtonConfig('s'); }
      else if (e.key.toLowerCase() === 'd') { buttonId = 'd'; config = getButtonConfig('d'); }

      // Стрелки - правый джойстик
      else if (e.key === 'ArrowUp') { buttonId = 'forward'; config = getButtonConfig('forward'); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { buttonId = 'left'; config = getButtonConfig('left'); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { buttonId = 'right'; config = getButtonConfig('right'); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { buttonId = 'backward'; config = getButtonConfig('backward'); e.preventDefault(); }

      // Цифры - центральные кнопки
      else if (e.key === '1') { buttonId = 'btn1'; config = getButtonConfig('btn1'); }
      else if (e.key === '2') { buttonId = 'btn2'; config = getButtonConfig('btn2'); }
      else if (e.key === '3') { buttonId = 'btn3'; config = getButtonConfig('btn3'); }

      // Макрокнопки - цифры 4-9
      else if (e.key === '4') { buttonId = 'macro1'; config = getButtonConfig('macro1'); }
      else if (e.key === '5') { buttonId = 'macro2'; config = getButtonConfig('macro2'); }
      else if (e.key === '6') { buttonId = 'macro3'; config = getButtonConfig('macro3'); }
      else if (e.key === '7') { buttonId = 'macro4'; config = getButtonConfig('macro4'); }
      else if (e.key === '8') { buttonId = 'macro5'; config = getButtonConfig('macro5'); }
      else if (e.key === '9') { buttonId = 'macro6'; config = getButtonConfig('macro6'); }

      if (buttonId && config) {
        setPressedButton(buttonId);
        handleButtonPress(config.pressCommand);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isConnected) return;

      let buttonId: string | null = null;
      let config: ControlButtonConfig | undefined = undefined;

      // WASD - левые кнопки
      if (e.key.toLowerCase() === 'w') { buttonId = 'w'; config = getButtonConfig('w'); }
      else if (e.key.toLowerCase() === 'a') { buttonId = 'a'; config = getButtonConfig('a'); }
      else if (e.key.toLowerCase() === 's') { buttonId = 's'; config = getButtonConfig('s'); }
      else if (e.key.toLowerCase() === 'd') { buttonId = 'd'; config = getButtonConfig('d'); }

      // Стрелки - правый джойстик
      else if (e.key === 'ArrowUp') { buttonId = 'forward'; config = getButtonConfig('forward'); }
      else if (e.key === 'ArrowLeft') { buttonId = 'left'; config = getButtonConfig('left'); }
      else if (e.key === 'ArrowRight') { buttonId = 'right'; config = getButtonConfig('right'); }
      else if (e.key === 'ArrowDown') { buttonId = 'backward'; config = getButtonConfig('backward'); }

      // Цифры - центральные кнопки
      else if (e.key === '1') { buttonId = 'btn1'; config = getButtonConfig('btn1'); }
      else if (e.key === '2') { buttonId = 'btn2'; config = getButtonConfig('btn2'); }
      else if (e.key === '3') { buttonId = 'btn3'; config = getButtonConfig('btn3'); }

      // Макрокнопки - цифры 4-9
      else if (e.key === '4') { buttonId = 'macro1'; config = getButtonConfig('macro1'); }
      else if (e.key === '5') { buttonId = 'macro2'; config = getButtonConfig('macro2'); }
      else if (e.key === '6') { buttonId = 'macro3'; config = getButtonConfig('macro3'); }
      else if (e.key === '7') { buttonId = 'macro4'; config = getButtonConfig('macro4'); }
      else if (e.key === '8') { buttonId = 'macro5'; config = getButtonConfig('macro5'); }
      else if (e.key === '9') { buttonId = 'macro6'; config = getButtonConfig('macro6'); }

      if (buttonId && config) {
        setPressedButton(null);
        handleButtonRelease(config.releaseCommand);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, handleButtonPress, handleButtonRelease, getButtonConfig]);

  // Поддержка USB джойстиков (Gamepad API)
  useEffect(() => {
    if (!isConnected) return;

    let animationId: number;

    // Маппинг кнопок геймпада на ID кнопок в приложении
    const gamepadButtonMap: Record<number, string> = {
      // Фигурные кнопки (PlayStation: X/O/Square/Triangle, Xbox: A/B/X/Y)
      0: 's',        // A/X → S (назад)
      1: 'd',        // B/O → D (вправо)
      2: 'a',        // X/Square → A (влево)
      3: 'w',        // Y/Triangle → W (вперед)

      // Бамперы и триггеры (PlayStation: L1/R1/L2/R2, Xbox: LB/RB/LT/RT)
      4: 'btn1',     // LB/L1 → Кнопка 1
      5: 'btn2',     // RB/R1 → Кнопка 2
      6: 'btn3',     // LT/L2 → Кнопка 3
      7: 'macro1',   // RT/R2 → Кнопка 4

      // D-pad (стрелки)
      12: 'forward',  // Вверх
      13: 'backward', // Вниз
      14: 'left',     // Влево
      15: 'right',    // Вправо
    };

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0]; // Используем первый подключенный геймпад

      if (gamepad) {
        const newStates = [...gamepadButtonStates];

        // Проверяем только нужные кнопки
        Object.entries(gamepadButtonMap).forEach(([buttonIndex, buttonId]) => {
          const index = parseInt(buttonIndex);
          const button = gamepad.buttons[index];
          const isPressed = button ? button.pressed : false;
          const wasPressed = gamepadButtonStates[index];

          if (isPressed && !wasPressed) {
            // Кнопка нажата
            const config = getButtonConfig(buttonId);
            if (config) {
              setPressedButton(buttonId);
              handleButtonPress(config.pressCommand);
            }
          } else if (!isPressed && wasPressed) {
            // Кнопка отжата
            const config = getButtonConfig(buttonId);
            if (config) {
              setPressedButton(null);
              handleButtonRelease(config.releaseCommand);
            }
          }

          newStates[index] = isPressed;
        });

        setGamepadButtonStates(newStates);
      }

      animationId = requestAnimationFrame(pollGamepad);
    };

    // Запускаем polling
    animationId = requestAnimationFrame(pollGamepad);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isConnected, gamepadButtonStates, handleButtonPress, handleButtonRelease, getButtonConfig]);

  const handleBackClick = () => {
    appSettings.vibrate();
    onBack();
  };

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


  if (isPortrait) {
    return (
      <>
      <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center p-4 select-none">
        <div className="text-center">
          <svg className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z M12 16h.01" />
          </svg>
          <h2 className="text-white text-2xl font-bold mb-3">Поверните устройство</h2>
          <p className="text-gray-400 text-base">Control Panel доступен только в горизонтальном режиме</p>
        </div>
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
      </>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 to-blue-400 flex flex-col overflow-hidden select-none">
      {/* Верхний бар */}
      <div className="relative flex items-center justify-between pt-12 px-2 pb-2 sm:p-4">
        {/* Кнопка назад */}
        <button
          onClick={handleBackClick}
          className="w-12 h-12 bg-transparent hover:bg-white/10 rounded-lg flex items-center justify-center transition z-10"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Статус подключения */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            onClick={handleBluetoothClick}
            className="bg-black/80 hover:bg-black/90 rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 min-w-[200px] sm:min-w-[250px] transition"
            title={
              connectionStatus === 'connected'
                ? 'Подключен - нажмите для отключения'
                : connectionStatus === 'connecting'
                ? 'Подключение...'
                : 'Отключен - нажмите для подключения'
            }
          >
            <svg
              className={`w-6 sm:w-8 h-6 sm:h-8 text-cyan-400 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
            </svg>
            <div className="flex-1">
              <div className="text-white font-semibold text-xs sm:text-sm">{deviceName || 'BLE'}</div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                }`}></div>
                <span className={`text-[10px] sm:text-xs ${
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
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2 z-10">
          {/* Кнопка GitHub */}
          <button
            onClick={() => {
              appSettings.vibrate(30);
              window.open('https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples', '_blank');
            }}
            className="w-12 h-12 bg-transparent hover:bg-white/10 rounded-lg flex items-center justify-center transition"
            title="Arduino примеры на GitHub"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </button>

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
      </div>

      {/* Основная область с кнопками */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-0 sm:pb-20" style={{ marginBottom: '-70px' }}>
        <div className="w-full max-w-6xl grid grid-cols-3 gap-4 sm:gap-8 items-center justify-items-center">

          {/* Левая часть - Цветные кнопки WASD */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              {/* W - желтая сверху */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('w'); if (cfg) { setPressedButton('w'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('w'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'w') { const cfg = getButtonConfig('w'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('w'); if (cfg) { setPressedButton('w'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('w'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-yellow-400 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'w' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                W
              </button>

              {/* A - синяя слева */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('a'); if (cfg) { setPressedButton('a'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('a'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'a') { const cfg = getButtonConfig('a'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('a'); if (cfg) { setPressedButton('a'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('a'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute top-1/2 left-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-cyan-400 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'a' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                A
              </button>

              {/* D - красная справа */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('d'); if (cfg) { setPressedButton('d'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('d'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'd') { const cfg = getButtonConfig('d'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('d'); if (cfg) { setPressedButton('d'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('d'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute top-1/2 right-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-red-500 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 'd' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                D
              </button>

              {/* S - зеленая снизу */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('s'); if (cfg) { setPressedButton('s'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('s'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 's') { const cfg = getButtonConfig('s'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('s'); if (cfg) { setPressedButton('s'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('s'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-green-400 font-bold text-4xl transition-all duration-150 ${
                  pressedButton === 's' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                S
              </button>
            </div>
          </div>

          {/* Центральная часть - Кнопки 1, 2, 3 */}
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              <button
                onMouseDown={() => { const cfg = getButtonConfig('btn1'); if (cfg) { setPressedButton('btn1'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('btn1'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'btn1') { const cfg = getButtonConfig('btn1'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('btn1'); if (cfg) { setPressedButton('btn1'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('btn1'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'btn1' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                1
              </button>
              <button
                onMouseDown={() => { const cfg = getButtonConfig('btn2'); if (cfg) { setPressedButton('btn2'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('btn2'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'btn2') { const cfg = getButtonConfig('btn2'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('btn2'); if (cfg) { setPressedButton('btn2'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('btn2'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'btn2' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                2
              </button>
              <button
                onMouseDown={() => { const cfg = getButtonConfig('btn3'); if (cfg) { setPressedButton('btn3'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('btn3'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'btn3') { const cfg = getButtonConfig('btn3'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('btn3'); if (cfg) { setPressedButton('btn3'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('btn3'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'btn3' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                3
              </button>
            </div>

            {/* Поле ввода */}
            <div className="text-center">
              <div className="text-white text-xl mb-2">Ввод:</div>
              <div className="bg-white/30 backdrop-blur-sm rounded-lg px-6 py-3 min-w-[100px]">
                <span className="text-white font-mono text-2xl">{lastCommand || '-'}</span>
              </div>
            </div>

            {/* Макрокнопки */}
            <div className="grid grid-cols-6 gap-2 w-full max-w-xl">
              {['macro1', 'macro2', 'macro3', 'macro4', 'macro5', 'macro6'].map((id) => {
                const config = getButtonConfig(id);
                return config ? (
                  <button
                    key={id}
                    onMouseDown={() => { setPressedButton(id); handleButtonPress(config.pressCommand); }}
                    onMouseUp={() => { setPressedButton(null); handleButtonRelease(config.releaseCommand); }}
                    onMouseLeave={() => { if (pressedButton === id) { setPressedButton(null); handleButtonRelease(config.releaseCommand); } }}
                    onTouchStart={() => { setPressedButton(id); handleButtonPress(config.pressCommand); }}
                    onTouchEnd={() => { setPressedButton(null); handleButtonRelease(config.releaseCommand); }}
                    disabled={!isConnected}
                    className={`bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-all duration-150 ${
                      pressedButton === id ? 'scale-95 bg-gray-700' : ''
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {config.label}
                  </button>
                ) : null;
              })}
            </div>
          </div>

          {/* Правая часть - Джойстик */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              {/* Вверх */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('forward'); if (cfg) { setPressedButton('forward'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('forward'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'forward') { const cfg = getButtonConfig('forward'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('forward'); if (cfg) { setPressedButton('forward'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('forward'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'forward' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ∧
              </button>

              {/* Влево */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('left'); if (cfg) { setPressedButton('left'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('left'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'left') { const cfg = getButtonConfig('left'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('left'); if (cfg) { setPressedButton('left'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('left'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute top-1/2 left-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'left' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ＜
              </button>

              {/* Вправо */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('right'); if (cfg) { setPressedButton('right'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('right'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'right') { const cfg = getButtonConfig('right'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('right'); if (cfg) { setPressedButton('right'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('right'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute top-1/2 right-0 -translate-y-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'right' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ＞
              </button>

              {/* Вниз */}
              <button
                onMouseDown={() => { const cfg = getButtonConfig('backward'); if (cfg) { setPressedButton('backward'); handleButtonPress(cfg.pressCommand); } }}
                onMouseUp={() => { const cfg = getButtonConfig('backward'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                onMouseLeave={() => { if (pressedButton === 'backward') { const cfg = getButtonConfig('backward'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } } }}
                onTouchStart={() => { const cfg = getButtonConfig('backward'); if (cfg) { setPressedButton('backward'); handleButtonPress(cfg.pressCommand); } }}
                onTouchEnd={() => { const cfg = getButtonConfig('backward'); if (cfg) { setPressedButton(null); handleButtonRelease(cfg.releaseCommand); } }}
                disabled={!isConnected}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-black text-white font-bold text-3xl transition-all duration-150 ${
                  pressedButton === 'backward' ? 'scale-90 bg-gray-800' : 'hover:scale-105'
                } disabled:opacity-30`}
              >
                ∨
              </button>
            </div>
          </div>
        </div>
      </div>
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
    </>
  );
};
