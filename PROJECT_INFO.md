# BLE Controller - Полная информация о проекте

## Основная информация

**Название:** BLE Controller
**Версия:** 1.0.0
**Автор:** Alash Electronics
**Лицензия:** MIT
**Репозиторий:** https://github.com/Alash-electronics/bluetoothWebApp
**Живая демо:** https://alash-electronics.github.io/bluetoothWebApp/

## Описание проекта

Универсальное веб-приложение для управления Bluetooth устройствами через браузер. Поддерживает HC-06, HC-05, HM-10, ESP32 и другие BLE/Classic Bluetooth модули. Приложение предоставляет несколько режимов управления: терминал, управление RC машинами, джойстик и умный дом.

## Поддерживаемые браузеры

### ✅ Поддерживаются:
- Chrome 56+ (Desktop & Android)
- Edge 79+ (Desktop)
- Opera 43+ (Desktop & Android)

### ❌ НЕ поддерживаются:
- iOS (iPhone, iPad, iPod) - Apple не поддерживает Web Bluetooth API
- Safari (все платформы) - не поддерживает Web Bluetooth API
- Firefox - не поддерживает Web Bluetooth API

**Причина:** Web Bluetooth API не реализован в этих браузерах по соображениям безопасности или политики производителя.

## Поддерживаемое оборудование

### Bluetooth модули:
- **HM-10** - BLE 4.0 (рекомендуется для низкого энергопотребления)
- **HC-06** - Classic Bluetooth 2.0 SPP
- **HC-05** - Classic Bluetooth 2.0 master/slave
- **ESP32** - встроенный BLE и Classic Bluetooth
- **Arduino BLE модули** - BLE Nano, Arduino Nano 33 BLE и т.д.
- **Любые UART-over-Bluetooth модули**

### Микроконтроллеры:
- Arduino Uno, Nano, Mega, Leonardo
- ESP32, ESP8266
- STM32, Raspberry Pi Pico
- Любая плата с поддержкой UART/Serial

### Требования по питанию:
- HC-05/HC-06: 3.6V-6V (5V tolerant)
- HM-10: 3.3V (использовать делитель напряжения на 5V платах)
- ESP32: 3.3V

## Технологический стек

- **Frontend:** React 19 с TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 3
- **Bluetooth:** Web Bluetooth API
- **State Management:** Singleton services с React hooks
- **Storage:** Browser localStorage
- **Deployment:** GitHub Pages

## Структура проекта

```
bluetoothWebApp/
├── README.md                    # Главная документация
├── ABOUT.md                     # Описание проекта
├── LICENSE                      # MIT лицензия
├── CONTRIBUTING.md              # Руководство для контрибьюторов
├── PROJECT_INFO.md              # Этот файл
├── .gitignore                   # Игнорируемые файлы
├── .github-about.txt            # Текст для GitHub About
└── ble-controller/              # Основное приложение
    ├── package.json             # Зависимости и скрипты
    ├── vite.config.ts           # Конфигурация Vite (base: /bluetoothWebApp/)
    ├── tsconfig.json            # Конфигурация TypeScript
    ├── tailwind.config.js       # Конфигурация Tailwind CSS
    ├── CLAUDE.md                # Архитектурная документация
    ├── index.html               # HTML entry point
    ├── public/
    │   ├── logo.png             # Логотип приложения (1000x1000)
    │   └── vite.svg             # Favicon
    ├── src/
    │   ├── main.tsx             # Entry point с ErrorBoundary
    │   ├── App.tsx              # Root компонент с роутингом
    │   ├── index.css            # Глобальные стили
    │   ├── components/          # React UI компоненты
    │   │   ├── SplashScreen.tsx          # Экран загрузки (2 сек)
    │   │   ├── DeviceSelection.tsx       # Выбор типа устройства
    │   │   ├── ControlPanel.tsx          # RC car геймпад интерфейс
    │   │   ├── JoystickPanel.tsx         # PS4-стиль джойстик
    │   │   ├── TerminalPanel.tsx         # Серийный терминал
    │   │   ├── SmartHomePanel.tsx        # Выбор комнаты
    │   │   ├── SmartHomeRoomControl.tsx  # Управление комнатой
    │   │   ├── SettingsPanel.tsx         # Модальные настройки
    │   │   ├── UnsupportedBrowser.tsx    # Сообщение для iOS/Safari
    │   │   ├── ErrorBoundary.tsx         # Отлов ошибок React
    │   │   ├── ConnectionPanel.tsx       # Legacy компонент
    │   │   └── DataPanel.tsx             # Legacy компонент
    │   ├── services/            # Бизнес-логика (singletons)
    │   │   ├── bluetoothService.ts       # Core BLE коммуникация
    │   │   ├── appSettings.ts            # Настройки приложения
    │   │   ├── localization.ts           # Мультиязычность (ru/en/kk)
    │   │   ├── controlPanelSettings.ts   # Настройки кнопок геймпада
    │   │   ├── buttonSettings.ts         # Legacy настройки
    │   │   ├── macroSettings.ts          # Макросы терминала
    │   │   ├── smartHomeSettings.ts      # Настройки умного дома
    │   │   └── roomSettings.ts           # Настройки комнат
    │   └── hooks/               # Custom React hooks
    │       └── useFullscreen.ts          # Fullscreen API hook
    └── arduino-examples/        # Примеры Arduino sketches
        ├── README.md            # Инструкции по подключению
        ├── terminal_basic/      # Эхо-пример
        ├── rc_car_control/      # Управление моторами
        └── smart_home_basic/    # Управление реле/LED
```

## Команды разработки

**ВАЖНО:** Все команды запускать из директории `ble-controller/`

```bash
# Навигация в директорию проекта
cd bluetoothWebApp/ble-controller

# Установка зависимостей
npm install

# Запуск dev сервера с HTTPS (требуется для Web Bluetooth API)
npm run dev
# Открыть: https://localhost:5173/

# Сборка production версии
npm run build

# Проверка кода (ESLint)
npm run lint

# Просмотр production build локально
npm run preview

# Деплой на GitHub Pages
npm run deploy
```

## Архитектура приложения

### Singleton Service Pattern

Приложение использует паттерн singleton services с React hooks:

1. **Services** (singleton классы) управляют состоянием и бизнес-логикой
2. **Components** подписываются на обновления через callbacks
3. **Settings** автоматически сохраняются в localStorage

### Bluetooth Service

**Файл:** `src/services/bluetoothService.ts`

**UUIDs:**
- Service: `0000ffe0-0000-1000-8000-00805f9b34fb`
- Characteristic: `0000ffe1-0000-1000-8000-00805f9b34fb`

**Connection States:**
- `'disconnected'` - не подключено
- `'connecting'` - подключение в процессе
- `'connected'` - подключено

**Основные методы:**
- `connect()` - подключение к BLE устройству
- `disconnect()` - отключение
- `sendData(data: string)` - отправка данных
- `onDataReceived(callback)` - подписка на получение данных
- `onConnectionStatusChange(callback)` - подписка на изменение статуса

### View Routing System

**ViewMode типы:**
```typescript
type ViewMode = 'selection' | 'control' | 'joystick' | 'terminal' | 'smartHome' | 'smartHomeRoom';
```

**Навигация:**
1. SplashScreen (2 сек) → DeviceSelection
2. Выбор типа устройства → соответствующий view
3. Disconnect → автоматический возврат в DeviceSelection

### Режимы ориентации

**TerminalPanel:**
- Работает только в portrait режиме
- Блокирует landscape на мобильных (<1024px)
- Показывает оверлей с предложением повернуть устройство

**ControlPanel & JoystickPanel:**
- Работают только в landscape режиме
- Блокируют portrait на мобильных (<1024px)
- Показывают оверлей с предложением повернуть устройство

**Порог:** 1024px (не 640px) - iPhone 14 Pro Max = 932px

## Протокол коммуникации

### UART over BLE

- **Формат данных:** UTF-8 строки
- **Длина команды:** 1 символ до 20 байт на пакет
- **Baud Rate:** 9600 (Arduino default)

### Примеры команд

**Terminal Mode:**
```
Любая текстовая строка + Enter
```

**RC Car Mode:**
```
'F' - Вперед
'B' - Назад
'L' - Влево
'R' - Вправо
'S' - Стоп
```

**Smart Home Mode:**
```
'L' - LED Вкл
'l' - LED Выкл
'K' - AC Вкл
'k' - AC Выкл
'T24' - Установить температуру 24°C
[Настраиваются в Settings]
```

**Важно:** Все команды умного дома - одиночные символы (A-Z, a-z, 0-9), case-sensitive.

## Мультиязычность

**Поддерживаемые языки:**
- 🇷🇺 Русский (ru)
- 🇬🇧 Английский (en)
- 🇰🇿 Казахский (kk)

**Переключение:** Кнопка с названием языка в правом верхнем углу

**Файл:** `src/services/localization.ts`

## Settings Services

Все настройки сохраняются в localStorage:

- `controlPanelSettings` - настройки кнопок геймпада
- `buttonSettings` - legacy настройки (совместимость)
- `macroSettings` - макросы терминала (12 кнопок)
- `smartHomeSettings` - команды устройств/сенсоров/AC
- `roomSettings` - конфигурация комнат (макс 6)
- `appSettings` - вибрация, тема, язык

## Особенности UI/UX

### Responsive Design

**Tailwind breakpoints:**
- Base: mobile portrait
- `landscape:` - mobile landscape
- `sm:` - desktop (≥640px)
- `sm:landscape:` - desktop landscape

### Vibration Feedback

Вызывается на всех кликах кнопок:
```typescript
appSettings.vibrate(30); // Обычный клик
appSettings.vibrate([50, 50, 50]); // Ошибка
```

### Fullscreen API

- Автоматически запрашивается на мобильных устройствах
- **Скрыт на iOS** (не поддерживается)
- Доступен через кнопку на Android/Desktop
- iOS альтернатива: "Add to Home Screen"

### Orientation Lock

Использует JavaScript (CSS media queries ненадежны):
```typescript
const width = window.innerWidth;
const height = window.innerHeight;
const isLandscape = width > height && width < 1024;
```

## Обработка ошибок

### ErrorBoundary

**Файл:** `src/components/ErrorBoundary.tsx`

Отлавливает все React ошибки и показывает:
- Иконка предупреждения
- Сообщение об ошибке
- Кнопка "Reload Page"
- Ссылка на GitHub Issues

### UnsupportedBrowser

**Файл:** `src/components/UnsupportedBrowser.tsx`

Показывается на iOS/Safari/Firefox:
- Объяснение проблемы
- Список поддерживаемых браузеров
- Рекомендации для iOS пользователей
- Ссылка на GitHub

## Deployment на GitHub Pages

**URL:** https://alash-electronics.github.io/bluetoothWebApp/

**Конфигурация:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/bluetoothWebApp/',
})
```

**Команда деплоя:**
```bash
npm run deploy
```

**Процесс:**
1. Запускает `npm run build` (predeploy script)
2. Компилирует TypeScript + собирает bundle
3. Деплоит папку `dist/` в ветку `gh-pages`
4. GitHub Pages автоматически обновляется (1-2 минуты)

**Branch:** `gh-pages` (создается автоматически пакетом `gh-pages`)

## Arduino примеры

**Директория:** `ble-controller/arduino-examples/`

### terminal_basic
Простой эхо-сервер для тестирования терминала

### rc_car_control
Управление моторами для RC машины (L298N driver)

### smart_home_basic
Управление реле и LED для умного дома

**Общие детали:**
- SoftwareSerial на пинах 10/11 (по умолчанию)
- Baud rate: 9600
- HM-10 RX требует 3.3V (делитель напряжения на 5V Arduino)
- Команды - одиночные символы

## Известные проблемы и решения

### 1. Белый экран на iOS
**Проблема:** iOS не поддерживает Web Bluetooth API
**Решение:** Показывается UnsupportedBrowser компонент с объяснением

### 2. Fullscreen не работает на iOS
**Проблема:** Fullscreen API не поддерживается на iOS
**Решение:** Кнопка автоматически скрывается. Альтернатива: "Add to Home Screen"

### 3. Логотип не отображается
**Проблема:** Неправильные пути с base path
**Решение:** Используется `${import.meta.env.BASE_URL}logo.png`

### 4. Ошибки после splash screen
**Проблема:** Ошибки fullscreen API крашат приложение
**Решение:** Добавлены try-catch блоки и ErrorBoundary

## Коммиты и история изменений

**Последние важные коммиты:**

1. `5bb5bd9` - fix: Hide fullscreen button on iOS devices
2. `ce5cd28` - fix: Add comprehensive error handling for mobile browsers
3. `db1c565` - fix: Add iOS/Safari browser detection and unsupported browser screen
4. `727e538` - Предыдущие изменения

## Полезные ссылки

- **Репозиторий:** https://github.com/Alash-electronics/bluetoothWebApp
- **Живая демо:** https://alash-electronics.github.io/bluetoothWebApp/
- **Issues:** https://github.com/Alash-electronics/bluetoothWebApp/issues
- **Arduino примеры:** https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples

## Web Bluetooth API документация

- **MDN:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **Chrome Platform Status:** https://www.chromestatus.com/feature/5264933985976320
- **Can I Use:** https://caniuse.com/web-bluetooth

## Контакты и поддержка

- **GitHub Issues:** https://github.com/Alash-electronics/bluetoothWebApp/issues
- **Discussions:** https://github.com/Alash-electronics/bluetoothWebApp/discussions
- **Email:** через GitHub профиль

## Contributing

Читайте `CONTRIBUTING.md` для:
- Руководство по code style
- Процесс pull requests
- Тестирование перед коммитом
- Commit message conventions

## Лицензия

MIT License - можно свободно использовать, изменять и распространять.

---

**Последнее обновление:** 27 октября 2025
**Версия документа:** 1.0
**Автор:** Alash Electronics с помощью Claude Code
