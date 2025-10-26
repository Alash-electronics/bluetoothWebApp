import { useState, useEffect } from 'react';
import { buttonSettingsService, type ButtonConfig } from '../services/buttonSettings';
import { macroSettings, type MacroConfig } from '../services/macroSettings';

interface SettingsPanelProps {
  onClose: () => void;
  mode?: 'control' | 'terminal' | 'smartHome';
}

type SettingsTab = 'buttons' | 'macros';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, mode }) => {
  // Определяем начальную вкладку в зависимости от режима
  const initialTab: SettingsTab = mode === 'terminal' ? 'macros' : 'buttons';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [macros, setMacros] = useState<MacroConfig[]>([]);

  // Показывать ли вкладки (если mode не указан, показываем обе вкладки)
  const showTabs = !mode;

  useEffect(() => {
    setButtons(buttonSettingsService.getButtons());
    setMacros(macroSettings.getMacros());
  }, []);

  const handleUpdate = (id: string, field: keyof ButtonConfig, value: string) => {
    const updatedButtons = buttons.map(btn =>
      btn.id === id ? { ...btn, [field]: value } : btn
    );
    setButtons(updatedButtons);
    buttonSettingsService.updateButton(id, { [field]: value });
  };

  const handleMacroUpdate = (id: string, field: keyof MacroConfig, value: string) => {
    const updatedMacros = macros.map(macro =>
      macro.id === id ? { ...macro, [field]: value } : macro
    );
    setMacros(updatedMacros);
    macroSettings.updateMacro(id, { [field]: value });
  };

  const handleReset = () => {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      if (activeTab === 'buttons') {
        buttonSettingsService.resetToDefaults();
        setButtons(buttonSettingsService.getButtons());
      } else {
        macroSettings.resetToDefaults();
        setMacros(macroSettings.getMacros());
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {mode === 'terminal' ? 'Настройки макросов' : mode === 'control' ? 'Настройки кнопок' : 'Настройки'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2 text-sm">
            {mode === 'terminal'
              ? 'Настройте макрокнопки M1-M6 для быстрого доступа к командам'
              : mode === 'control'
              ? 'Настройте кнопки управления RC Car'
              : 'Настройте команды для кнопок управления и макросов терминала'
            }
          </p>
        </div>

        {/* Вкладки - показываем только если mode не указан */}
        {showTabs && (
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('buttons')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition ${
                activeTab === 'buttons'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Кнопки управления
            </button>
            <button
              onClick={() => setActiveTab('macros')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition ${
                activeTab === 'macros'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Макросы терминала
            </button>
          </div>
        )}

        {/* Содержимое */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === 'buttons' ? (
            <div className="space-y-3">
              {buttons.map((button) => (
                <div
                  key={button.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Иконка */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Иконка
                      </label>
                      <input
                        type="text"
                        value={button.icon || ''}
                        onChange={(e) => handleUpdate(button.id, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl"
                        maxLength={2}
                      />
                    </div>

                    {/* Название */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название
                      </label>
                      <input
                        type="text"
                        value={button.label}
                        onChange={(e) => handleUpdate(button.id, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={20}
                      />
                    </div>

                    {/* Команда */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Команда
                      </label>
                      <input
                        type="text"
                        value={button.command}
                        onChange={(e) => handleUpdate(button.id, 'command', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {macros.map((macro) => (
                <div
                  key={macro.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Название */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название кнопки
                      </label>
                      <input
                        type="text"
                        value={macro.label}
                        onChange={(e) => handleMacroUpdate(macro.id, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        maxLength={10}
                      />
                    </div>

                    {/* Команда */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Команда для отправки
                      </label>
                      <input
                        type="text"
                        value={macro.command}
                        onChange={(e) => handleMacroUpdate(macro.id, 'command', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Информация */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Подсказка:</strong> {activeTab === 'buttons'
                ? 'Настройте иконки, названия и команды для кнопок управления RC Car.'
                : 'Настройте названия и команды для макрокнопок M1-M6 в терминале.'}
              {' '}Все настройки сохраняются автоматически в браузере.
            </p>
          </div>
        </div>

        {/* Футер */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition duration-200"
          >
            Сбросить к умолчаниям
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
