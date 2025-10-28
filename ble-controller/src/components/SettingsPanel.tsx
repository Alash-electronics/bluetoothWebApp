import { useState, useEffect } from 'react';
import { controlPanelSettings, type ControlButtonConfig } from '../services/controlPanelSettings';
import { controlPanelSensorSettings, type ControlPanelSensorConfig } from '../services/controlPanelSensorSettings';
import { macroSettings, type MacroConfig } from '../services/macroSettings';
import { smartHomeSettings, type SmartHomeDeviceConfig, type SmartHomeSensorConfig, type SmartHomeACConfig } from '../services/smartHomeSettings';

interface SettingsPanelProps {
  onClose: () => void;
  mode?: 'control' | 'terminal' | 'smartHome';
}

type SettingsTab = 'buttons' | 'macros';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, mode }) => {
  // Определяем начальную вкладку в зависимости от режима
  const initialTab: SettingsTab = mode === 'terminal' ? 'macros' : 'buttons';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [buttons, setButtons] = useState<ControlButtonConfig[]>([]);
  const [macros, setMacros] = useState<MacroConfig[]>([]);
  const [devices, setDevices] = useState<SmartHomeDeviceConfig[]>([]);
  const [sensors, setSensors] = useState<SmartHomeSensorConfig[]>([]);
  const [acConfig, setAcConfig] = useState<SmartHomeACConfig | null>(null);
  const [controlPanelSensors, setControlPanelSensors] = useState<ControlPanelSensorConfig[]>([]);

  // Показывать ли вкладки (если mode не указан, показываем обе вкладки)
  const showTabs = !mode;

  useEffect(() => {
    setButtons(controlPanelSettings.getButtons());
    setMacros(macroSettings.getMacros());
    setDevices(smartHomeSettings.getDevices());
    setSensors(smartHomeSettings.getSensors());
    setAcConfig(smartHomeSettings.getACConfig());
    setControlPanelSensors(controlPanelSensorSettings.getSensors());
  }, []);

  const handleUpdate = (id: string, field: keyof ControlButtonConfig, value: string) => {
    const updatedButtons = buttons.map(btn =>
      btn.id === id ? { ...btn, [field]: value } : btn
    );
    setButtons(updatedButtons);
    controlPanelSettings.updateButton(id, { [field]: value });
  };

  const handleMacroUpdate = (id: string, field: keyof MacroConfig, value: string) => {
    const updatedMacros = macros.map(macro =>
      macro.id === id ? { ...macro, [field]: value } : macro
    );
    setMacros(updatedMacros);
    macroSettings.updateMacro(id, { [field]: value });
  };

  const handleDeviceUpdate = (id: string, field: keyof SmartHomeDeviceConfig, value: string) => {
    const updatedDevices = devices.map(device =>
      device.id === id ? { ...device, [field]: value } : device
    );
    setDevices(updatedDevices);
    smartHomeSettings.updateDevice(id, { [field]: value });
  };

  const handleSensorUpdate = (id: string, field: keyof SmartHomeSensorConfig, value: string) => {
    const updatedSensors = sensors.map(sensor =>
      sensor.id === id ? { ...sensor, [field]: value } : sensor
    );
    setSensors(updatedSensors);
    smartHomeSettings.updateSensor(id, { [field]: value });
  };

  const handleACUpdate = (field: keyof SmartHomeACConfig, value: string) => {
    if (!acConfig) return;
    const updatedConfig = { ...acConfig, [field]: value };
    setAcConfig(updatedConfig);
    smartHomeSettings.updateACConfig({ [field]: value });
  };

  const handleControlPanelSensorUpdate = (id: string, field: keyof ControlPanelSensorConfig, value: string) => {
    const updatedSensors = controlPanelSensors.map(sensor =>
      sensor.id === id ? { ...sensor, [field]: value } : sensor
    );
    setControlPanelSensors(updatedSensors);
    controlPanelSensorSettings.updateSensor(id, { [field]: value });
  };

  const handleReset = () => {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      if (mode === 'smartHome') {
        smartHomeSettings.resetToDefaults();
        setDevices(smartHomeSettings.getDevices());
        setSensors(smartHomeSettings.getSensors());
        setAcConfig(smartHomeSettings.getACConfig());
      } else if (activeTab === 'buttons' || mode === 'control') {
        controlPanelSettings.resetToDefaults();
        controlPanelSensorSettings.resetToDefaults();
        setButtons(controlPanelSettings.getButtons());
        setControlPanelSensors(controlPanelSensorSettings.getSensors());
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
              {mode === 'terminal' ? 'Настройки макросов' : mode === 'control' ? 'Настройки кнопок' : mode === 'smartHome' ? 'Настройки Smart Home' : 'Настройки'}
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
              : mode === 'smartHome'
              ? 'Настройте команды для устройств и датчиков умного дома'
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
          {mode === 'smartHome' ? (
            <div className="space-y-6">
              {/* Устройства */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Устройства</h3>
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Название устройства */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Устройство
                          </label>
                          <input
                            type="text"
                            value={device.label}
                            onChange={(e) => handleDeviceUpdate(device.id, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                            maxLength={20}
                          />
                        </div>

                        {/* Команда ON */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Команда ON (1 символ)
                          </label>
                          <input
                            type="text"
                            value={device.onCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleDeviceUpdate(device.id, 'onCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="A"
                          />
                        </div>

                        {/* Команда OFF */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Команда OFF (1 символ)
                          </label>
                          <input
                            type="text"
                            value={device.offCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleDeviceUpdate(device.id, 'offCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="B"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Датчики */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Датчики</h3>
                <div className="space-y-3">
                  {sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Название датчика */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Датчик
                          </label>
                          <input
                            type="text"
                            value={sensor.label}
                            onChange={(e) => handleSensorUpdate(sensor.id, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                            maxLength={20}
                          />
                        </div>

                        {/* Сообщение ON */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Сообщение ON (1 символ)
                          </label>
                          <input
                            type="text"
                            value={sensor.onMessage}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleSensorUpdate(sensor.id, 'onMessage', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="S"
                          />
                        </div>

                        {/* Сообщение OFF */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Сообщение OFF (1 символ)
                          </label>
                          <input
                            type="text"
                            value={sensor.offMessage}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleSensorUpdate(sensor.id, 'offMessage', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="s"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Air Condition */}
              {acConfig && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Air Condition</h3>
                  <div className="space-y-4">
                    {/* ON/OFF команды */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Включение/Выключение</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Команда ON (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.onCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('onCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="K"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Команда OFF (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.offCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('offCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="L"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Режимы работы */}
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Режимы работы</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ☀️ Heat (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.heatCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('heatCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="M"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ❄️ Cool (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.coolCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('coolCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="N"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            💧 Dry (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.dryCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('dryCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="O"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            🌀 Fan (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.fanCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('fanCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="P"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Управление температурой */}
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Управление температурой</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            + Увеличение (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.tempUpCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('tempUpCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="Q"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            - Уменьшение (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.tempDownCommand}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('tempDownCommand', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="R"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Префикс установки (1 символ)
                          </label>
                          <input
                            type="text"
                            value={acConfig.tempSetPrefix}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
                              handleACUpdate('tempSetPrefix', val);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg"
                            maxLength={1}
                            placeholder="T"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Пример: {acConfig.tempSetPrefix}24
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Подсказка */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Подсказка:</strong> Настройте команды для управления устройствами, датчиков и кондиционера. Все настройки сохраняются автоматически в браузере.
                </p>
              </div>
            </div>
          ) : activeTab === 'buttons' ? (
            <div className="space-y-6">
              {/* Основные кнопки управления */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Основные кнопки управления</h3>
                <div className="space-y-3">
                  {buttons.filter(b => !b.id.startsWith('macro')).map((button) => (
                    <div
                      key={button.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Название */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Кнопка
                          </label>
                          <input
                            type="text"
                            value={button.label}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                            readOnly
                          />
                        </div>

                        {/* Команда при нажатии */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Нажатие
                          </label>
                          <input
                            type="text"
                            value={button.pressCommand}
                            onChange={(e) => handleUpdate(button.id, 'pressCommand', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            maxLength={50}
                            placeholder="Команда нажатия"
                          />
                        </div>

                        {/* Команда при отжатии */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Отжатие
                          </label>
                          <input
                            type="text"
                            value={button.releaseCommand}
                            onChange={(e) => handleUpdate(button.id, 'releaseCommand', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            maxLength={50}
                            placeholder="Команда отжатия"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Макрокнопки */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Макрокнопки (4-9)</h3>
                <div className="space-y-3">
                  {buttons.filter(b => b.id.startsWith('macro')).map((button) => (
                    <div
                      key={button.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Название */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Кнопка
                          </label>
                          <input
                            type="text"
                            value={button.label}
                            onChange={(e) => handleUpdate(button.id, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                            maxLength={10}
                            placeholder="Название"
                          />
                        </div>

                        {/* Команда при нажатии */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Нажатие
                          </label>
                          <input
                            type="text"
                            value={button.pressCommand}
                            onChange={(e) => handleUpdate(button.id, 'pressCommand', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            maxLength={50}
                            placeholder="Команда нажатия"
                          />
                        </div>

                        {/* Команда при отжатии */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Отжатие
                          </label>
                          <input
                            type="text"
                            value={button.releaseCommand}
                            onChange={(e) => handleUpdate(button.id, 'releaseCommand', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            maxLength={50}
                            placeholder="Команда отжатия"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Датчики Control Panel */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Датчики (Sensor Display)</h3>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Настройте названия датчиков, которые отображаются на экране управления. Arduino должен передавать данные в формате: S1:value, S2:value, S3:value, S4:value
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {controlPanelSensors.map((sensor, index) => (
                      <div
                        key={sensor.id}
                        className="bg-white rounded-lg p-3 border border-cyan-200"
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Датчик {index + 1} (S{index + 1})
                        </label>
                        <input
                          type="text"
                          value={sensor.name}
                          onChange={(e) => handleControlPanelSensorUpdate(sensor.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                          maxLength={15}
                          placeholder={`Sensor ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Маппинг USB геймпада */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🎮 USB Геймпад (Gamepad API)</h3>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Фигурные кнопки */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">Фигурные</span>
                        WASD (левый джойстик)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-purple-600">B0 (A/X)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">S (назад)</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-purple-600">B1 (B/O)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">D (вправо)</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-purple-600">B2 (X/Square)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">A (влево)</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-purple-600">B3 (Y/Triangle)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">W (вперед)</span>
                        </div>
                      </div>
                    </div>

                    {/* Бамперы и триггеры */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Бамперы</span>
                        Цифровые кнопки
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-green-600">B4 (LB/L1)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Кнопка 1</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-green-600">B5 (RB/R1)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Кнопка 2</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-green-600">B6 (LT/L2)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Кнопка 3</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-green-600">B7 (RT/R2)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Кнопка 4</span>
                        </div>
                      </div>
                    </div>

                    {/* D-pad */}
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">D-pad</span>
                        Стрелки (правый джойстик)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-blue-600">B12 (↑)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Forward</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-blue-600">B13 (↓)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Backward</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-blue-600">B14 (←)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Left</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="font-mono text-blue-600">B15 (→)</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold">Right</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-600">
                      <strong>💡 Совет:</strong> Подключите USB геймпад и нажмите любую кнопку для активации. Индикатор "Gamepad" появится внизу экрана.
                    </p>
                  </div>
                </div>
              </div>
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
                ? 'Настройте команды для кнопок управления и макрокнопок. "Нажатие" - команда при нажатии кнопки, "Отжатие" - команда при отпускании. Все кнопки работают с клавиатурой (WASD, стрелки, цифры 1-9), мышью/тачем и USB геймпадом (фигурные кнопки + D-pad).'
                : 'Настройте названия и команды для макрокнопок в терминале.'}
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
