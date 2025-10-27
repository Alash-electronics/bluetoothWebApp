import { useState, useEffect } from 'react';
import { localization } from '../services/localization';
import { appSettings } from '../services/appSettings';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { roomSettings, type RoomConfig } from '../services/roomSettings';
import { useFullscreen } from '../hooks/useFullscreen';

interface SmartHomePanelProps {
  connectionStatus: ConnectionStatus;
  deviceName?: string;
  onOpenSettings: () => void;
  onSelectRoom: (roomId: string) => void;
  onBack: () => void;
}

export const SmartHomePanel: React.FC<SmartHomePanelProps> = ({
  connectionStatus: initialConnectionStatus,
  deviceName,
  onOpenSettings,
  onSelectRoom,
  onBack
}) => {
  useFullscreen();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [, forceUpdate] = useState({});
  const [rooms, setRooms] = useState<RoomConfig[]>(roomSettings.getRooms());
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIcon, setNewRoomIcon] = useState('🏠');

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    const unsubscribe = localization.subscribe(() => forceUpdate({}));

    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAddRoom = () => {
    appSettings.vibrate(30);
    if (rooms.length >= 6) {
      alert('Максимум 6 комнат');
      return;
    }
    setShowAddRoom(true);
  };

  const handleSaveNewRoom = () => {
    appSettings.vibrate(30);
    if (!newRoomName.trim()) {
      alert('Введите название комнаты');
      return;
    }

    const newRoom: RoomConfig = {
      id: `room${Date.now()}`,
      name: newRoomName.trim(),
      icon: newRoomIcon,
    };

    roomSettings.addRoom(newRoom);
    setRooms(roomSettings.getRooms());
    setShowAddRoom(false);
    setNewRoomName('');
    setNewRoomIcon('🏠');
  };

  const handleCancelAddRoom = () => {
    appSettings.vibrate(30);
    setShowAddRoom(false);
    setNewRoomName('');
    setNewRoomIcon('🏠');
  };

  const handleRoomClick = (roomId: string) => {
    appSettings.vibrate(30);
    onSelectRoom(roomId);
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
      try {
        await bluetoothService.connect();
      } catch (error) {
        console.error('Connection error:', error);
        appSettings.vibrate([50, 50, 50]);
      }
    }
  };

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
      <div className="flex-1 p-4 space-y-4 overflow-auto pb-20">
        {/* Ваши комнаты */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Rooms</h2>
          <button
            onClick={handleAddRoom}
            disabled={rooms.length >= 6}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              rooms.length >= 6
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            + Add
          </button>
        </div>

        {/* Список комнат */}
        <div className="space-y-3">
          {rooms.map((room, index) => {
            const bgColors = [
              'bg-gradient-to-br from-blue-100 to-blue-200',
              'bg-gradient-to-br from-purple-100 to-purple-200',
              'bg-gradient-to-br from-green-100 to-green-200',
              'bg-gradient-to-br from-orange-100 to-orange-200',
              'bg-gradient-to-br from-pink-100 to-pink-200',
              'bg-gradient-to-br from-yellow-100 to-yellow-200',
            ];
            const bgColor = bgColors[index % bgColors.length];

            return (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                className={`w-full ${bgColor} rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition shadow-sm`}
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  {room.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-gray-800">{room.name}</h3>
                </div>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
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

      {/* Диалог добавления комнаты */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Добавить комнату</h2>

            {/* Название комнаты */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название комнаты
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Введите название..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                maxLength={30}
              />
            </div>

            {/* Иконка */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Выберите иконку
              </label>
              <div className="grid grid-cols-6 gap-2">
                {['🏠', '🛋️', '🛏️', '🍳', '🚿', '🌳', '🎮', '💼', '🏃', '🎵', '📚', '🔧'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewRoomIcon(icon)}
                    className={`w-12 h-12 text-2xl rounded-xl transition ${
                      newRoomIcon === icon
                        ? 'bg-blue-500 scale-110 shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelAddRoom}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveNewRoom}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
