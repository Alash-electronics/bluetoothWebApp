import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { localization } from '../services/localization';
import { appSettings } from '../services/appSettings';
import { BleDeviceListModal } from './BleDeviceListModal';

interface DeviceSelectionProps {
  onDeviceSelected: () => void;
  onConnectionChange: (status: ConnectionStatus, name?: string) => void;
  onSelectDeviceType?: (deviceType: string) => void;
}

export const DeviceSelection: React.FC<DeviceSelectionProps> = ({ onDeviceSelected, onConnectionChange, onSelectDeviceType }) => {
  const [, forceUpdate] = useState({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(bluetoothService.getConnectionStatus());
  const [_isConnecting, setIsConnecting] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pendingDeviceType, setPendingDeviceType] = useState<string | null>(null);
  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    const unsubscribe = localization.subscribe(() => forceUpdate({}));
    const unsubscribe2 = appSettings.subscribe(() => forceUpdate({}));

    // Подписка на изменение статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      onConnectionChange(status);
    });

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, [onConnectionChange]);

  // Универсальная функция подключения (использует кастомный UI на iOS, системный диалог на Web)
  const connectToDevice = async () => {
    appSettings.vibrate();

    if (isNativePlatform) {
      // На нативных платформах показываем кастомный список устройств
      setShowDeviceModal(true);
    } else {
      // На веб-платформах используем системный диалог
      try {
        const device = await bluetoothService.connect();
        onConnectionChange('connected', device.name);
        appSettings.vibrate(100);
      } catch (error) {
        console.error('Connection error:', error);
        appSettings.vibrate([100, 50, 100]);
      }
    }
  };

  const handleConnect = async () => {
    // Если уже подключено - просто отключаемся
    if (bluetoothService.isConnected()) {
      if (confirm(localization.t('disconnectConfirm'))) {
        appSettings.vibrate(30);
        try {
          await bluetoothService.disconnect();
          onConnectionChange('disconnected');
          appSettings.vibrate(100);
        } catch (error) {
          console.error('Disconnect error:', error);
          appSettings.vibrate([50, 50, 50]);
        }
      }
    } else {
      // Если не подключено - показываем диалог подключения
      await connectToDevice();
    }
  };

  // Callbacks для BleDeviceListModal
  const handleDeviceConnected = () => {
    setShowDeviceModal(false);
    setIsConnecting(false);
    appSettings.vibrate(100);

    const device = bluetoothService.getDevice();
    if (device) {
      onConnectionChange('connected', device.name);
    }

    // Переходим к нужному экрану в зависимости от выбранного типа устройства
    if (pendingDeviceType === 'terminal') {
      onSelectDeviceType?.('terminal');
    } else if (pendingDeviceType === 'smartHome') {
      onSelectDeviceType?.('smartHome');
    } else if (pendingDeviceType === 'joystick') {
      onSelectDeviceType?.('joystick');
    } else if (pendingDeviceType === 'rcCar') {
      onDeviceSelected();
    }

    setPendingDeviceType(null);
  };

  const handleDeviceModalCancel = () => {
    setShowDeviceModal(false);
    setIsConnecting(false);
    setPendingDeviceType(null);
  };

  const handleDeviceModalError = (error: string) => {
    console.error('Connection error:', error);
    setConnectionError(error);
    appSettings.vibrate([100, 50, 100]);
    setShowDeviceModal(false);
    setIsConnecting(false);
    setPendingDeviceType(null);

    // Показываем ошибку на 5 секунд
    setTimeout(() => setConnectionError(null), 5000);
  };

  const handleLanguageClick = () => {
    appSettings.vibrate();
    localization.cycleLanguage();
  };

  const handleVibrationClick = () => {
    appSettings.toggleVibration();
    // Вибрация для подтверждения (если включена)
    appSettings.vibrate();
  };

  const handleDeviceTypeClick = async (type: string, isLocked: boolean) => {
    if (isLocked) {
      appSettings.vibrate([50, 50, 50]);
      return;
    }
    appSettings.vibrate();

    // Для Terminal - переходим к Terminal режиму
    if (type === 'terminal') {
      if (!bluetoothService.isConnected()) {
        setIsConnecting(true);
        setPendingDeviceType('terminal');
        if (isNativePlatform) {
          // На нативных платформах показываем кастомный список устройств
          setShowDeviceModal(true);
          // Подключение произойдет в модале, после чего вызовется handleDeviceConnected
        } else {
          // На веб-платформах используем системный диалог
          try {
            const device = await bluetoothService.connect();
            onConnectionChange('connected', device.name);
            appSettings.vibrate(100);
            onSelectDeviceType?.('terminal');
          } catch (error) {
            console.error('Connection error:', error);
            appSettings.vibrate([100, 50, 100]);
            setIsConnecting(false);
            setPendingDeviceType(null);
            return;
          }
          setIsConnecting(false);
          setPendingDeviceType(null);
        }
      } else {
        // Если уже подключено, просто переходим к Terminal
        onSelectDeviceType?.('terminal');
      }
      return;
    }

    // Для Smart Home - переходим к Smart Home режиму
    if (type === 'smartHome') {
      if (!bluetoothService.isConnected()) {
        setIsConnecting(true);
        setPendingDeviceType('smartHome');
        if (isNativePlatform) {
          // На нативных платформах показываем кастомный список устройств
          setShowDeviceModal(true);
        } else {
          // На веб-платформах используем системный диалог
          try {
            const device = await bluetoothService.connect();
            onConnectionChange('connected', device.name);
            appSettings.vibrate(100);
            onSelectDeviceType?.('smartHome');
          } catch (error) {
            console.error('Connection error:', error);
            appSettings.vibrate([100, 50, 100]);
            setIsConnecting(false);
            setPendingDeviceType(null);
            return;
          }
          setIsConnecting(false);
          setPendingDeviceType(null);
        }
      } else {
        // Если уже подключено, просто переходим к Smart Home
        onSelectDeviceType?.('smartHome');
      }
      return;
    }

    // Для RC Car - подключаемся (если не подключено) и переходим к управлению
    if (type === 'rcCar') {
      if (!bluetoothService.isConnected()) {
        setIsConnecting(true);
        setPendingDeviceType('rcCar');
        if (isNativePlatform) {
          // На нативных платформах показываем кастомный список устройств
          setShowDeviceModal(true);
        } else {
          // На веб-платформах используем системный диалог
          try {
            const device = await bluetoothService.connect();
            onConnectionChange('connected', device.name);
            appSettings.vibrate(100);
            onDeviceSelected();
          } catch (error) {
            console.error('Connection error:', error);
            appSettings.vibrate([100, 50, 100]);
            setIsConnecting(false);
            setPendingDeviceType(null);
            return;
          }
          setIsConnecting(false);
          setPendingDeviceType(null);
        }
      } else {
        // Если уже подключено, просто переходим к управлению
        onDeviceSelected();
      }
    }

    // Для Joystick - переходим к Joystick режиму
    if (type === 'joystick') {
      if (!bluetoothService.isConnected()) {
        setIsConnecting(true);
        setPendingDeviceType('joystick');
        if (isNativePlatform) {
          // На нативных платформах показываем кастомный список устройств
          setShowDeviceModal(true);
        } else {
          // На веб-платформах используем системный диалог
          try {
            const device = await bluetoothService.connect();
            onConnectionChange('connected', device.name);
            appSettings.vibrate(100);
            onSelectDeviceType?.('joystick');
          } catch (error) {
            console.error('Connection error:', error);
            appSettings.vibrate([100, 50, 100]);
            setIsConnecting(false);
            setPendingDeviceType(null);
            return;
          }
          setIsConnecting(false);
          setPendingDeviceType(null);
        }
      } else {
        // Если уже подключено, просто переходим к Joystick
        onSelectDeviceType?.('joystick');
      }
      return;
    }
  };

  const deviceTypes = [
    {
      id: 'terminal',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
          <rect x="10" y="20" width="80" height="60" rx="5" fill="none" stroke="currentColor" strokeWidth="4"/>
          <path d="M20 35 L30 45 L20 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="40" y1="52" x2="60" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ),
      titleKey: 'terminal' as const,
      descKey: 'terminalDesc' as const,
      locked: false
    },
    {
      id: 'rcCar',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
          <path d="M25 50h-5c-2.8 0-5-2.2-5-5v-10c0-2.8 2.2-5 5-5h5m50 20h5c2.8 0 5-2.2 5-5v-10c0-2.8-2.2-5-5-5h-5m-42.5 0h35c2.8 0 5 2.2 5 5v25c0 2.8-2.2 5-5 5h-35c-2.8 0-5-2.2-5-5V35c0-2.8 2.2-5 5-5z"/>
          <circle cx="35" cy="70" r="8"/>
          <circle cx="65" cy="70" r="8"/>
        </svg>
      ),
      titleKey: 'rcCar' as const,
      descKey: 'rcCarDesc' as const,
      locked: false
    },
    {
      id: 'smartHome',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 20L20 45v40h25V65h10v20h25V45L50 20z"/>
          <path d="M42 50c0-4.4 3.6-8 8-8s8 3.6 8 8v5H42v-5z" opacity="0.5"/>
        </svg>
      ),
      titleKey: 'smartHome' as const,
      descKey: 'smartHomeDesc' as const,
      locked: false
    },
    {
      id: 'joystick',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="35" r="15"/>
          <rect x="45" y="50" width="10" height="20" rx="2"/>
          <path d="M30 70h40c5.5 0 10 4.5 10 10v5H20v-5c0-5.5 4.5-10 10-10z"/>
          <circle cx="40" cy="78" r="3" fill="white" opacity="0.7"/>
          <circle cx="60" cy="78" r="3" fill="white" opacity="0.7"/>
        </svg>
      ),
      titleKey: 'joystick' as const,
      descKey: 'joystickDesc' as const,
      locked: false
    },
    {
      id: 'robot',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
          <rect x="30" y="40" width="40" height="45" rx="5"/>
          <circle cx="40" cy="55" r="5"/>
          <circle cx="60" cy="55" r="5"/>
          <rect x="35" y="70" width="30" height="5" rx="2"/>
          <circle cx="50" cy="25" r="8"/>
          <rect x="48" y="25" width="4" height="15"/>
        </svg>
      ),
      titleKey: 'robot' as const,
      descKey: 'robotDesc' as const,
      locked: true
    },
    {
      id: 'custom',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="30"/>
          <path d="M50 30v40M30 50h40" stroke="white" strokeWidth="4" fill="none"/>
        </svg>
      ),
      titleKey: 'customDevice' as const,
      descKey: 'customDeviceDesc' as const,
      locked: true
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-300 to-white flex flex-col">
      {/* Верхний бар - компактный для мобилки */}
      <div className="flex items-center justify-between px-2 landscape:px-1 pt-14 pb-2 landscape:pt-1 landscape:pb-1 sm:p-4 sm:landscape:p-4 gap-1 sm:gap-2 sm:landscape:gap-2">
        {/* Placeholder для баланса на десктопе */}
        <div className="w-0 sm:w-12"></div>

        {/* Статус подключения */}
        <div className="flex-1 flex justify-center min-w-0">
          <button
            onClick={handleConnect}
            disabled={connectionStatus === 'connecting'}
            className="bg-gray-900/90 rounded-full px-2 landscape:px-1.5 py-1.5 landscape:py-0.5 sm:px-6 sm:py-3 sm:landscape:px-6 sm:landscape:py-3 flex items-center gap-1.5 landscape:gap-1 sm:gap-3 sm:landscape:gap-3 min-w-0 hover:bg-gray-900 transition disabled:opacity-50"
          >
            <svg className={`w-6 h-6 landscape:w-4 landscape:h-4 sm:w-8 sm:h-8 sm:landscape:w-8 sm:landscape:h-8 text-cyan-400 flex-shrink-0 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
            </svg>
            <div className="flex-1 text-left min-w-0">
              <div className="text-white font-semibold text-xs landscape:text-[10px] sm:text-sm sm:landscape:text-sm flex items-center gap-1 landscape:gap-0.5 sm:gap-2 sm:landscape:gap-2">
                <div className={`w-1.5 h-1.5 landscape:w-1 landscape:h-1 sm:w-2 sm:h-2 sm:landscape:w-2 sm:landscape:h-2 rounded-full flex-shrink-0 ${
                  connectionStatus === 'connected'
                    ? 'bg-green-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                }`}></div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">
                    {connectionStatus === 'connected'
                      ? localization.t('connected')
                      : connectionStatus === 'connecting'
                      ? localization.t('connecting')
                      : localization.t('pressToConnect')}
                  </span>
                  {connectionStatus === 'connected' && (
                    <span className="text-[10px] sm:text-xs text-white/70 font-normal hidden sm:block">
                      {localization.t('clickToUnpair')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <svg className="w-4 h-4 landscape:w-3 landscape:h-3 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        {/* Кнопки справа */}
        <div className="flex gap-1 landscape:gap-0.5 sm:gap-2 sm:landscape:gap-2">
          {/* GitHub */}
          <button
            onClick={() => {
              appSettings.vibrate(30);
              window.open('https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples', '_blank');
            }}
            className="w-9 h-9 landscape:w-6 landscape:h-6 sm:w-12 sm:h-12 sm:landscape:w-12 sm:landscape:h-12 bg-gray-900/90 hover:bg-gray-900 rounded-lg flex items-center justify-center transition flex-shrink-0"
            title="Arduino примеры на GitHub"
          >
            <svg className="w-5 h-5 landscape:w-3 landscape:h-3 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </button>


          {/* Вибрация */}
          <button
            onClick={handleVibrationClick}
            className="w-9 h-9 landscape:w-6 landscape:h-6 sm:w-12 sm:h-12 sm:landscape:w-12 sm:landscape:h-12 bg-gray-900/90 hover:bg-gray-900 rounded-lg flex items-center justify-center transition flex-shrink-0"
          >
            {appSettings.isVibrationEnabled() ? (
              <svg className="w-5 h-5 landscape:w-3 landscape:h-3 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 landscape:w-3 landscape:h-3 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>

          {/* Язык */}
          <button
            onClick={handleLanguageClick}
            className="h-9 landscape:h-6 px-2 landscape:px-1 sm:h-12 sm:px-4 sm:landscape:h-12 sm:landscape:px-4 bg-gray-900/90 hover:bg-gray-900 rounded-lg flex items-center justify-center transition"
          >
            <span className="text-white font-semibold text-xs landscape:text-[10px] sm:text-base sm:landscape:text-base">{localization.getLanguageName()}</span>
          </button>
        </div>
      </div>

      {/* Основная панель выбора устройства */}
      <div className="flex-1 flex items-center justify-center p-2 landscape:p-0.5 sm:p-8 sm:landscape:p-8">
        <div className="w-full max-w-5xl">
          <div className="bg-black/90 rounded-2xl sm:rounded-3xl p-3 landscape:p-1.5 sm:p-8 sm:landscape:p-8">
            {/* Заголовок */}
            <div className="text-center mb-3 landscape:mb-0.5 sm:mb-8 sm:landscape:mb-8">
              <h1 className="text-white text-xl landscape:text-sm sm:text-3xl sm:landscape:text-3xl font-bold mb-1 landscape:mb-0 sm:mb-2 sm:landscape:mb-2">
                {localization.t('selectDeviceType')}
              </h1>
              <p className="text-gray-400 text-xs landscape:hidden sm:block sm:text-base">
                {localization.t('selectDeviceTypeDesc')}
              </p>
            </div>

            {/* Карточки устройств */}
            <div className="grid grid-cols-2 landscape:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 landscape:gap-0.5 sm:gap-4 sm:landscape:gap-4">
              {deviceTypes.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceTypeClick(device.id, device.locked)}
                  className={`relative bg-gray-800 rounded-lg sm:rounded-xl p-3 landscape:p-1 sm:p-6 sm:landscape:p-6 hover:bg-gray-700 transition-all duration-200 ${
                    device.locked ? 'opacity-60' : 'hover:scale-105'
                  } ${!device.locked && 'hover:shadow-xl hover:shadow-cyan-500/20'}`}
                >
                  {/* Иконка замка */}
                  {device.locked && (
                    <div className="absolute top-2 landscape:top-0.5 landscape:right-0.5 right-2 sm:top-4 sm:right-4 sm:landscape:top-4 sm:landscape:right-4">
                      <svg className="w-4 h-4 landscape:w-2.5 landscape:h-2.5 sm:w-6 sm:h-6 sm:landscape:w-6 sm:landscape:h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Иконка устройства */}
                  <div className={`text-cyan-400 mb-2 landscape:mb-0.5 sm:mb-4 sm:landscape:mb-4 flex justify-center ${device.locked && 'opacity-50'}`}>
                    <div className="w-12 h-12 landscape:w-6 landscape:h-6 sm:w-20 sm:h-20 sm:landscape:w-20 sm:landscape:h-20">
                      {device.icon}
                    </div>
                  </div>

                  {/* Название */}
                  <h3 className="text-white font-semibold text-sm landscape:text-[9px] sm:text-lg sm:landscape:text-lg mb-1 landscape:mb-0 sm:mb-2 sm:landscape:mb-2">
                    {localization.t(device.titleKey)}
                  </h3>

                  {/* Описание */}
                  <p className="text-gray-400 text-[10px] landscape:hidden sm:block sm:text-sm leading-tight">
                    {localization.t(device.descKey)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <div className="pb-2 landscape:pb-1 sm:pb-4 px-2 sm:px-4 flex items-center justify-between landscape:hidden sm:flex">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-12 sm:h-20 opacity-70" />
        <p className="text-white/50 text-xs sm:text-sm">{localization.t('version')}</p>
      </div>

      {/* Модальное окно выбора устройства (только для нативных платформ) */}
      {showDeviceModal && (
        <BleDeviceListModal
          onConnected={handleDeviceConnected}
          onCancel={handleDeviceModalCancel}
          onError={handleDeviceModalError}
        />
      )}

      {/* Сообщение об ошибке */}
      {connectionError && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-start gap-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">{localization.t('error')}</p>
            <p className="text-sm mt-1">{connectionError}</p>
          </div>
          <button
            onClick={() => setConnectionError(null)}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
