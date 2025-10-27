import { useState, useEffect, useRef } from 'react';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';

interface DataPanelProps {
  connectionStatus: ConnectionStatus;
}

interface Message {
  type: 'sent' | 'received';
  data: string;
  timestamp: Date;
}

export const DataPanel: React.FC<DataPanelProps> = ({ connectionStatus }) => {
  const isConnected = connectionStatus === 'connected';
  const [inputData, setInputData] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Подписка на получение данных
    bluetoothService.onDataReceived((data) => {
      const newMessage: Message = {
        type: 'received',
        data,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newMessage]);
    });
  }, []);

  useEffect(() => {
    // Автоскролл к последнему сообщению
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputData.trim() || !isConnected) return;

    setIsSending(true);
    try {
      await bluetoothService.sendData(inputData);

      const newMessage: Message = {
        type: 'sent',
        data: inputData,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputData('');
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки данных');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Обмен данными</h2>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition duration-200"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Панель сообщений */}
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-4 border border-gray-200">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Нет сообщений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                    message.type === 'sent'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs opacity-75">
                      {message.type === 'sent' ? 'Отправлено' : 'Получено'}
                    </span>
                    <span className="text-xs opacity-75">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="break-words font-mono">{message.data}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Панель ввода */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected || isSending}
          placeholder={isConnected ? 'Введите данные для отправки...' : 'Подключитесь к устройству'}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!isConnected || !inputData.trim() || isSending}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Отправка...' : 'Отправить'}
        </button>
      </div>

      {/* Быстрые команды */}
      {isConnected && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Быстрые команды для HM-10:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInputData('AT')}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition duration-200"
            >
              AT (Проверка)
            </button>
            <button
              onClick={() => setInputData('AT+HELP')}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition duration-200"
            >
              AT+HELP
            </button>
            <button
              onClick={() => setInputData('AT+VERS?')}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition duration-200"
            >
              AT+VERS? (Версия)
            </button>
            <button
              onClick={() => setInputData('AT+NAME?')}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition duration-200"
            >
              AT+NAME? (Имя)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
