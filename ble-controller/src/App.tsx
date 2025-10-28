import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ControlPanel } from './components/ControlPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { DeviceSelection } from './components/DeviceSelection';
import { SplashScreen } from './components/SplashScreen';
import { SmartHomePanel } from './components/SmartHomePanel';
import { SmartHomeRoomControl } from './components/SmartHomeRoomControl';
import { TerminalPanel } from './components/TerminalPanel';
import { JoystickPanel } from './components/JoystickPanel';
import { UnsupportedBrowser } from './components/UnsupportedBrowser';
import { type ConnectionStatus } from './services/bluetoothService';

type ViewMode = 'selection' | 'control' | 'terminal' | 'smartHome' | 'smartHomeRoom' | 'joystick';

function App() {
  // Проверка поддержки Bluetooth (Web Bluetooth API или Capacitor)
  const isBluetoothSupported =
    Capacitor.isNativePlatform() || // Capacitor iOS/Android
    (typeof navigator !== 'undefined' && 'bluetooth' in navigator); // Web Bluetooth

  const [showSplash, setShowSplash] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  const handleConnectionChange = (status: ConnectionStatus, name?: string) => {
    setConnectionStatus(status);
    if (name) setDeviceName(name);
    // Не переключаем автоматически на control - пользователь выберет сам
    if (status === 'disconnected') setViewMode('selection');
  };

  // Если браузер не поддерживает Web Bluetooth - показываем сообщение
  if (!isBluetoothSupported) {
    return <UnsupportedBrowser />;
  }

  // Показываем splash screen при запуске
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Режим выбора устройства - полноэкранный
  if (viewMode === 'selection') {
    return (
      <DeviceSelection
        onDeviceSelected={() => setViewMode('control')}
        onConnectionChange={handleConnectionChange}
        onSelectDeviceType={(deviceType) => {
          if (deviceType === 'terminal') {
            setViewMode('terminal');
          } else if (deviceType === 'smartHome') {
            setViewMode('smartHome');
          } else if (deviceType === 'joystick') {
            setViewMode('joystick');
          }
        }}
      />
    );
  }

  // Режим Terminal - полноэкранный
  if (viewMode === 'terminal') {
    return (
      <>
        <TerminalPanel
          connectionStatus={connectionStatus}
          deviceName={deviceName}
          onBack={() => setViewMode('selection')}
          onOpenSettings={() => setShowSettings(true)}
        />
        {showSettings && (
          <SettingsPanel mode="terminal" onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  // Режим управления - полноэкранный
  if (viewMode === 'control') {
    return (
      <>
        <ControlPanel
          connectionStatus={connectionStatus}
          deviceName={deviceName}
          onBack={() => setViewMode('selection')}
          onOpenSettings={() => setShowSettings(true)}
        />
        {showSettings && (
          <SettingsPanel mode="control" onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  // Режим Joystick - полноэкранный
  if (viewMode === 'joystick') {
    return (
      <>
        <JoystickPanel
          connectionStatus={connectionStatus}
          deviceName={deviceName}
          onBack={() => setViewMode('selection')}
          onOpenSettings={() => setShowSettings(true)}
        />
        {showSettings && (
          <SettingsPanel mode="control" onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  // Режим Smart Home - главная страница
  if (viewMode === 'smartHome') {
    return (
      <>
        <SmartHomePanel
          connectionStatus={connectionStatus}
          deviceName={deviceName}
          onOpenSettings={() => setShowSettings(true)}
          onSelectRoom={(roomId) => {
            setSelectedRoom(roomId);
            setViewMode('smartHomeRoom');
          }}
          onBack={() => setViewMode('selection')}
        />
        {showSettings && (
          <SettingsPanel mode="smartHome" onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  // Режим Smart Home - управление комнатой
  if (viewMode === 'smartHomeRoom') {
    const roomNames: Record<string, string> = {
      living: 'Living Room',
      bedroom: 'Bed Room',
      bathroom: 'Bath Room',
    };
    return (
      <>
        <SmartHomeRoomControl
          roomId={selectedRoom}
          roomName={roomNames[selectedRoom] || 'Room'}
          connectionStatus={connectionStatus}
          deviceName={deviceName}
          onBack={() => setViewMode('smartHome')}
          onOpenSettings={() => setShowSettings(true)}
        />
        {showSettings && (
          <SettingsPanel mode="smartHome" onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  // Fallback - не должно происходить
  return null;
}

export default App;
