import { useState } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { DataPanel } from './components/DataPanel';
import { ControlPanel } from './components/ControlPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { DeviceSelection } from './components/DeviceSelection';
import { SplashScreen } from './components/SplashScreen';
import { SmartHomePanel } from './components/SmartHomePanel';
import { SmartHomeRoomControl } from './components/SmartHomeRoomControl';
import { TerminalPanel } from './components/TerminalPanel';
import { JoystickPanel } from './components/JoystickPanel';
import { type ConnectionStatus } from './services/bluetoothService';

type ViewMode = 'selection' | 'control' | 'terminal' | 'connection' | 'smartHome' | 'smartHomeRoom' | 'joystick';

function App() {
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

  // Остальные режимы - с обычным интерфейсом
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            HM-10 Bluetooth Controller
          </h1>
          <p className="text-gray-600">
            Веб-приложение для управления модулем HM-10 через Web Bluetooth API
          </p>
        </div>

        {/* Основной контент */}
        <div className="max-w-4xl mx-auto space-y-4">
          <ConnectionPanel onConnectionChange={handleConnectionChange} />

          {/* Переключатель режимов */}
          {connectionStatus === 'connected' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('control')}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold transition duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  🎮 Режим управления
                </button>
                <button
                  onClick={() => setViewMode('terminal')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition duration-200 ${
                    viewMode === 'terminal'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💻 Режим терминала
                </button>
              </div>
            </div>
          )}

          {/* Отображение терминала */}
          {viewMode === 'terminal' && <DataPanel connectionStatus={connectionStatus} />}
        </div>

        {/* Футер */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Разработано с использованием React + TypeScript + Tailwind CSS + Web Bluetooth API
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
