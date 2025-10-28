export type Language = 'ru' | 'en' | 'kk';

interface Translations {
  // Главная страница
  selectDeviceType: string;
  selectDeviceTypeDesc: string;
  terminal: string;
  terminalDesc: string;
  rcCar: string;
  rcCarDesc: string;
  smartHome: string;
  smartHomeDesc: string;
  joystick: string;
  joystickDesc: string;
  robot: string;
  robotDesc: string;
  customDevice: string;
  customDeviceDesc: string;

  // Подключение
  connect: string;
  disconnect: string;
  disconnectConfirm: string;
  connecting: string;
  connected: string;
  disconnected: string;
  pressToConnect: string;
  clickToUnpair: string;

  // Режимы
  controlMode: string;
  terminalMode: string;

  // Управление
  input: string;
  send: string;
  sending: string;

  // Настройки
  settings: string;
  vibration: string;
  language: string;
  buttonSettings: string;
  resetDefaults: string;
  done: string;
  icon: string;
  name: string;
  command: string;

  // Другое
  version: string;
  error: string;
  cancel: string;
  selectDevice: string;
  scanning: string;
  noDevicesFound: string;
  makesSureDeviceIsOn: string;
}

const translations: Record<Language, Translations> = {
  ru: {
    selectDeviceType: 'Выберите Тип Устройства',
    selectDeviceTypeDesc: 'Выберите тип устройства, которым вы хотите управлять',
    terminal: 'Терминал',
    terminalDesc: 'отправка и приём данных',
    rcCar: 'Радиоуправляемая Машина',
    rcCarDesc: 'управление машиной',
    smartHome: 'Умный Дом',
    smartHomeDesc: 'автоматизация дома',
    joystick: 'Джойстик',
    joystickDesc: 'управление джойстиком',
    robot: 'Робот',
    robotDesc: 'программируемый робот',
    customDevice: 'Пользовательское Устройство',
    customDeviceDesc: 'программируемое устройство',

    connect: 'Подключиться',
    disconnect: 'Отключиться',
    disconnectConfirm: 'Отключиться от устройства?',
    connecting: 'Подключение...',
    connected: 'Подключен',
    disconnected: 'Отключен',
    pressToConnect: 'Нажмите, чтобы подключиться',
    clickToUnpair: 'нажмите, чтобы отключиться',

    controlMode: 'Режим управления',
    terminalMode: 'Режим терминала',

    input: 'Ввод:',
    send: 'Отправить',
    sending: 'Отправка...',

    settings: 'Настройки',
    vibration: 'Вибрация',
    language: 'Язык',
    buttonSettings: 'Настройки кнопок управления',
    resetDefaults: 'Сбросить к умолчаниям',
    done: 'Готово',
    icon: 'Иконка',
    name: 'Название',
    command: 'Команда',

    version: 'v1.0.1',
    error: 'Ошибка',
    cancel: 'Отмена',
    selectDevice: 'Выберите Устройство',
    scanning: 'Сканирование',
    noDevicesFound: 'Устройства не найдены',
    makesSureDeviceIsOn: 'Убедитесь, что устройство включено и находится рядом',
  },

  en: {
    selectDeviceType: 'Select Device Type',
    selectDeviceTypeDesc: 'Select the type of device you want to control',
    terminal: 'Terminal',
    terminalDesc: 'send and receive data',
    rcCar: 'RC Car',
    rcCarDesc: 'car control',
    smartHome: 'Smart Home',
    smartHomeDesc: 'home automation',
    joystick: 'Joystick',
    joystickDesc: 'joystick control',
    robot: 'Robot',
    robotDesc: 'programmable robot',
    customDevice: 'Custom Device',
    customDeviceDesc: 'programmable device',

    connect: 'Connect',
    disconnect: 'Disconnect',
    disconnectConfirm: 'Disconnect from device?',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    pressToConnect: 'Press to connect',
    clickToUnpair: 'click to unpair',

    controlMode: 'Control Mode',
    terminalMode: 'Terminal Mode',

    input: 'Input:',
    send: 'Send',
    sending: 'Sending...',

    settings: 'Settings',
    vibration: 'Vibration',
    language: 'Language',
    buttonSettings: 'Button Settings',
    resetDefaults: 'Reset to Defaults',
    done: 'Done',
    icon: 'Icon',
    name: 'Name',
    command: 'Command',

    version: 'v1.0.1',
    error: 'Error',
    cancel: 'Cancel',
    selectDevice: 'Select Device',
    scanning: 'Scanning',
    noDevicesFound: 'No devices found',
    makesSureDeviceIsOn: 'Make sure device is turned on and nearby',
  },

  kk: {
    selectDeviceType: 'Құрылғы Түрін Таңдаңыз',
    selectDeviceTypeDesc: 'Басқарғыңыз келетін құрылғы түрін таңдаңыз',
    terminal: 'Терминал',
    terminalDesc: 'деректерді жіберу және қабылдау',
    rcCar: 'Радиобасқарылатын Машина',
    rcCarDesc: 'машинаны басқару',
    smartHome: 'Ақылды Үй',
    smartHomeDesc: 'үйді автоматтандыру',
    joystick: 'Джойстик',
    joystickDesc: 'джойстикпен басқару',
    robot: 'Робот',
    robotDesc: 'бағдарламаланатын робот',
    customDevice: 'Пайдаланушы Құрылғысы',
    customDeviceDesc: 'бағдарламаланатын құрылғы',

    connect: 'Қосылу',
    disconnect: 'Ажырату',
    disconnectConfirm: 'Құрылғыдан ажырату ма?',
    connecting: 'Қосылуда...',
    connected: 'Қосылған',
    disconnected: 'Ажыратылған',
    pressToConnect: 'Қосылу үшін басыңыз',
    clickToUnpair: 'ажырату үшін басыңыз',

    controlMode: 'Басқару режимі',
    terminalMode: 'Терминал режимі',

    input: 'Енгізу:',
    send: 'Жіберу',
    sending: 'Жіберілуде...',

    settings: 'Баптаулар',
    vibration: 'Дірілдеу',
    language: 'Тіл',
    buttonSettings: 'Түймелер баптаулары',
    resetDefaults: 'Бастапқы баптауларға қайтару',
    done: 'Дайын',
    icon: 'Белгіше',
    name: 'Атауы',
    command: 'Команда',

    version: 'н1.0.1',
    error: 'Қате',
    cancel: 'Болдырмау',
    selectDevice: 'Құрылғыны Таңдаңыз',
    scanning: 'Сканерлеу',
    noDevicesFound: 'Құрылғылар табылмады',
    makesSureDeviceIsOn: 'Құрылғының қосулы және жақын жерде екеніне көз жеткізіңіз',
  },
};

class LocalizationService {
  private currentLanguage: Language = 'ru';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadLanguage();
  }

  private loadLanguage() {
    const saved = localStorage.getItem('language');
    if (saved && (saved === 'ru' || saved === 'en' || saved === 'kk')) {
      this.currentLanguage = saved;
    }
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    this.notifyListeners();
  }

  cycleLanguage() {
    const languages: Language[] = ['ru', 'en', 'kk'];
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    this.setLanguage(languages[nextIndex]);
  }

  getLanguageName(): string {
    switch (this.currentLanguage) {
      case 'ru': return 'Русский';
      case 'en': return 'English';
      case 'kk': return 'Қазақша';
    }
  }

  t(key: keyof Translations): string {
    return translations[this.currentLanguage][key];
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }
}

export const localization = new LocalizationService();
