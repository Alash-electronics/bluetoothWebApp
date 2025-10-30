# 🎮 Alashed BLE Controller

<div align="center">

**Универсальный контроллер для управления Arduino, ESP32 и другими Bluetooth устройствами**

[![Web App](https://img.shields.io/badge/Web%20App-Live-success?style=for-the-badge&logo=google-chrome)](https://alash-electronics.github.io/bluetoothWebApp/)
[![GitHub Release](https://img.shields.io/badge/Android-Download%20APK-blue?style=for-the-badge&logo=android)](https://github.com/Alash-electronics/bluetoothWebApp/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[🌐 Открыть WebApp](#-установка) • [📱 Скачать Android](#-установка) • [📖 Документация](#-режимы-управления) • [🔌 Arduino примеры](arduino-examples/)

</div>

---

## 📥 Установка

### 🌐 Web приложение (Рекомендуется)

**Ссылка:** https://alash-electronics.github.io/bluetoothWebApp/

**Поддерживаемые браузеры:**
- ✅ **Android:** Chrome, Edge, Opera
- ✅ **Desktop:** Chrome, Edge, Opera (Windows, macOS, Linux)
- ✅ **iOS:** [Bluefy Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) (поддержка Web Bluetooth)

> **Примечание для iOS:** Safari не поддерживает Web Bluetooth API. Используйте бесплатный браузер [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) для работы с BLE на iPhone/iPad.

### 📱 Android приложение

**[⬇️ Скачать Alashed-BLE-v1.7.apk](https://github.com/Alash-electronics/bluetoothWebApp/releases/latest)**

- Размер: 4.0 MB
- Минимальная версия: Android 7.0 (API 24+)
- Нативная поддержка BLE без ограничений браузера

**Установка:**
1. Скачайте APK по ссылке выше
2. Разрешите установку из неизвестных источников (если попросит)
3. Установите приложение
4. Предоставьте разрешения на Bluetooth и Геолокацию

### 🍎 iOS (нативное приложение)

> Нативное приложение для iOS будет выпущено позже.
> На данный момент используйте **Web приложение через [Bluefy Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** — работает отлично! 🎉

---

## 🎮 Режимы управления

### 🕹️ Joystick Panel — PS4-стиль

<div align="center">

**Двойные аналоговые джойстики с векторным управлением**

</div>

**Возможности:**
- 🎯 **Левый джойстик Y** → газ (вперед/назад)
- 🎯 **Правый джойстик X** → руль (влево/вправо)
- 🎮 Поддержка физических USB геймпадов (PS4, Xbox, и др.)
- 🔘 Все кнопки контроллера: △ ○ ✕ □, L1/R1, L2/R2, D-Pad, L3/R3
- 📱 Работает на **touch** (мобильные) и **mouse** (десктоп)

**Особенности:**
- Векторное управление с arcade drive mixing
- Deadzone ±10 для предотвращения дрейфа
- Мгновенная остановка при отпускании джойстика
- Частота обновления: 20 Hz (50ms интервал)

**Протокол:**
```
J:LY,LX,RY,RX\n
```
Где каждое значение 0-100 (50 = центр)

**Примеры команд:**
- `J:50,50,50,50` — стоп (джойстики в центре)
- `J:100,50,50,50` — вперед (левый джойстик вверх)
- `J:0,50,50,50` — назад (левый джойстик вниз)
- `J:50,50,50,100` — поворот направо (правый джойстик вправо)

---

### 🚗 RC Car Control — Геймпад

<div align="center">

**Управление в стиле WASD с настраиваемыми кнопками**

</div>

**Возможности:**
- ⬆️⬇️⬅️➡️ Направленное управление (WASD)
- ⏹️ Кнопка STOP для экстренной остановки
- 🔘 8 дополнительных настраиваемых кнопок
- ⚙️ Изменение команд и иконок для каждой кнопки
- 📳 Вибрация при нажатии (на мобильных)

**Команды:** Каждая кнопка отправляет один символ (A-Z, 0-9)

---

### 💻 Terminal Mode — Терминал

<div align="center">

**Полнофункциональный последовательный терминал**

</div>

**Возможности:**
- 📨 Отправка любых команд и данных
- 📥 Прием данных в реальном времени
- 🔧 10 настраиваемых макро-кнопок
- 📜 История сообщений с временными метками
- 🗑️ Очистка лога
- 🔄 Автопрокрутка (можно отключить)

**Идеально для:**
- Отладки AT-команд (HM-10, HC-05, HC-06)
- Тестирования Arduino Serial
- Мониторинга сенсоров
- Отправки конфигурационных команд

---

### 🏠 Smart Home — Умный дом

<div align="center">

**Мультикомнатное управление устройствами**

</div>

**Возможности:**
- 🏘️ До **6 комнат** с независимым управлением
- 💡 **6 устройств** на комнату:
  - 💡 LED (освещение)
  - 🪟 Окно (шторы)
  - 🎵 Музыка
  - 🚪 Дверь (замок)
  - 🌀 Вентилятор
  - ❄️ Кондиционер
- 📡 **3 датчика** (отображаются в реальном времени):
  - 🚶 Датчик движения
  - ☁️ Датчик газа
  - 🌧️ Датчик дождя
- ❄️ **Управление кондиционером:**
  - Режимы: Обогрев, Охлаждение, Осушение, Вентиляция
  - Температура: 16-30°C
  - Включение/выключение

**Команды:** Все команды — **один символ** (настраиваются в Settings)

**Примеры:**
- `L` / `l` — LED вкл/выкл
- `K` / `k` — Кондиционер вкл/выкл
- `H` — Режим обогрева
- `C` — Режим охлаждения
- `T24` — Установить температуру 24°C

---

## ✨ Общие возможности

### 🌍 Многоязычность
- 🇷🇺 Русский
- 🇬🇧 English
- 🇰🇿 Қазақша (Казахский)

Переключение языка в настройках приложения.

### 💾 Автосохранение
Все настройки сохраняются автоматически в браузере/приложении:
- Команды кнопок
- Макросы терминала
- Конфигурация умного дома
- Названия комнат и устройств
- Язык интерфейса

### 🔄 Автопереподключение
При потере связи с Bluetooth устройством приложение автоматически пытается переподключиться.

### 🎨 Современный дизайн
- Темная тема с градиентами
- Адаптивный интерфейс (работает на всех экранах)
- Плавные анимации
- Интуитивное управление

### 📳 Тактильная обратная связь
Вибрация при нажатии кнопок (на устройствах с поддержкой).

---

## 🔌 Поддерживаемые устройства

### Bluetooth модули
- ✅ **HM-10** (Bluetooth Low Energy)
- ✅ **HC-05** (Bluetooth Classic)
- ✅ **HC-06** (Bluetooth Classic)
- ✅ **BT05** (BLE)
- ✅ **ESP32** (встроенный BLE)
- ✅ Любые BLE устройства с UART сервисом

### Arduino платы
- ✅ Arduino Uno
- ✅ Arduino Nano
- ✅ Arduino Mega 2560
- ✅ ESP32 (без внешнего модуля!)
- ✅ ESP8266 (через SoftwareSerial)

### UUID для подключения
```
Service UUID:        0000ffe0-0000-1000-8000-00805f9b34fb
Characteristic UUID: 0000ffe1-0000-1000-8000-00805f9b34fb
```

---

## 🛠️ Arduino примеры

В папке **`arduino-examples/`** находятся готовые скетчи для быстрого старта:

### 📂 Arduino + HM-10

| Пример | Описание | Для платы |
|--------|----------|-----------|
| **terminal_basic/** | Базовый эхо-терминал | Uno, Nano |
| **rc_car_control/** | Управление RC машинкой (WASD) | Uno, Nano |
| **smart_home_basic/** | Умный дом (2 комнаты) | Uno |
| **smart_home_mega/** | Умный дом (6 комнат) | MEGA 2560 |
| **Joystick_control/** | Векторное управление джойстиками | Uno, Nano |

### 📂 ESP32 (встроенный BLE)

| Пример | Описание |
|--------|----------|
| **esp32_terminal_basic/** | BLE терминал |
| **esp32_rc_car/** | RC машинка с L298N |
| **esp32_smart_home/** | Умный дом для ESP32 |

**📖 Подробная документация:** [arduino-examples/README.md](arduino-examples/README.md)

### 🔧 Библиотека моторов

Примеры с управлением моторами используют **AlashMotorControlLite**:

```bash
# Установка через Arduino Library Manager
https://github.com/Alash-electronics/AlashMotorControlLite
```

**Особенности:**
- Принимает значения `-100..100` (проценты, **НЕ** PWM 0-255!)
- `MIN_MOTOR_SPEED = 50` — минимум для старта моторов
- `MAX_MOTOR_SPEED = 100` — полная скорость
- Автоматическое управление направлением

**Пример использования:**
```cpp
#include <AlashMotorControlLite.h>

AlashMotorControlLite motorLeft(5, 6);   // IN1, IN2
AlashMotorControlLite motorRight(9, 10); // IN3, IN4

void loop() {
  motorLeft.setSpeed(75);    // 75% вперед
  motorRight.setSpeed(-50);  // 50% назад
  delay(1000);

  motorLeft.stop();
  motorRight.stop();
  delay(1000);
}
```

---

## 🚀 Технологии

### Frontend
- **React 19** — UI библиотека
- **TypeScript** — типизация
- **Vite 7** — сборщик и dev сервер
- **Tailwind CSS 3** — стилизация

### Mobile (Capacitor)
- **Capacitor 7.4.4** — нативные iOS/Android приложения
- **@capacitor-community/bluetooth-le 7.2.0** — BLE на мобильных

### Web APIs
- **Web Bluetooth API** — BLE в браузере (Chrome, Edge, Opera)
- **Gamepad API** — поддержка физических геймпадов
- **Vibration API** — тактильная обратная связь

---

## ⚙️ Требования

### Для Web приложения

**Браузер:**
- ✅ Chrome 56+ (Windows, macOS, Linux, Android)
- ✅ Edge 79+ (Windows, macOS)
- ✅ Opera 43+ (Windows, macOS, Linux, Android)
- ✅ Bluefy Browser (iOS — единственный вариант!)
- ❌ Firefox (нет Web Bluetooth)
- ❌ Safari (нет Web Bluetooth)

**Система:**
- HTTPS соединение (автоматически на GitHub Pages)
- Bluetooth включен
- Bluetooth Low Energy (BLE) поддержка

### Для Android приложения

- Android 7.0+ (API level 24+)
- Bluetooth Low Energy
- Разрешения:
  - Bluetooth
  - Location (нужно для BLE сканирования на Android)

### Для iOS (через Bluefy)

- iOS 12.0+
- Bluefy Browser из App Store
- Bluetooth включен

---

## 📖 Как использовать

### 1️⃣ Подготовка Arduino

1. Загрузите один из примеров из `arduino-examples/`
2. Подключите HM-10 к Arduino:
   ```
   HM-10 VCC → Arduino 5V
   HM-10 GND → Arduino GND
   HM-10 TXD → Arduino Pin 10 (RX)
   HM-10 RXD → Arduino Pin 11 (TX через делитель напряжения!)
   ```
3. Загрузите скетч на Arduino

> ⚠️ **Важно:** HM-10 работает на 3.3V! Используйте делитель напряжения (резисторы 1kΩ + 2kΩ) на линии RXD при подключении к 5V Arduino.

### 2️⃣ Подключение к устройству

1. Откройте приложение (Web или Android)
2. Выберите тип устройства на главном экране
3. Нажмите на иконку Bluetooth (сверху)
4. Выберите ваше устройство из списка (имя начинается с "HM", "BT", или "ESP32")
5. Дождитесь подключения (зеленая точка)

### 3️⃣ Управление

**Joystick Panel:**
- Двигайте джойстики пальцами (touch) или мышью
- Или подключите USB геймпад

**RC Car:**
- Нажимайте стрелки или используйте клавиши WASD

**Terminal:**
- Используйте макро-кнопки или вводите команды вручную

**Smart Home:**
- Выберите комнату
- Управляйте устройствами кнопками

### 4️⃣ Настройка

1. Нажмите иконку ⚙️ (Settings) в правом верхнем углу
2. Измените команды, иконки, названия
3. Настройки сохраняются автоматически

---

## 🔧 Устранение неполадок

### Не могу найти устройство

**Решения:**
- ✅ Убедитесь что Bluetooth включен на телефоне/компьютере
- ✅ HM-10/ESP32 должен быть включен и в режиме advertising
- ✅ На Android: дайте разрешение на Геолокацию (нужно для BLE)
- ✅ Имя устройства должно начинаться с "HM", "BT" или содержать "ESP32"
- ✅ Попробуйте перезагрузить модуль

### Ошибка подключения

**Решения:**
- ✅ Используйте поддерживаемый браузер (Chrome, Edge, Opera)
- ✅ Для iOS: используйте Bluefy Browser
- ✅ Убедитесь что устройство не подключено к другому приложению
- ✅ Попробуйте выключить и включить Bluetooth
- ✅ Обновите страницу (F5)

### Не работает на iOS

**Решение:**
- ✅ Safari **НЕ ПОДДЕРЖИВАЕТ** Web Bluetooth
- ✅ Скачайте **[Bluefy Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** из App Store
- ✅ Откройте приложение в Bluefy — работает отлично!

### Робот не двигается (Joystick)

**Решения:**
- ✅ Проверьте `MIN_MOTOR_SPEED = 50` в Arduino коде
- ✅ Убедитесь что моторы подключены к внешнему питанию (не от Arduino!)
- ✅ Проверьте драйвер моторов (L298N, AlashMotorControlLite)
- ✅ Откройте Serial Monitor (115200 baud) для отладки

### Робот не останавливается

**Решения:**
- ✅ Увеличьте deadzone в Arduino (default ±10)
- ✅ Проверьте что приходит команда `J:50,50,50,50` (Serial Monitor)
- ✅ Убедитесь что моторы останавливаются в коде при `throttle==0 && steering==0`

### Джойстик дрейфует сам по себе

**Решения:**
- ✅ Увеличьте deadzone в Arduino (например, до ±15)
- ✅ Для USB геймпада: откалибруйте его в настройках ОС
- ✅ Проверьте что джойстики в центре показывают `J:50,50,50,50`

---

## 🏗️ Разработка

### Клонирование репозитория

```bash
git clone https://github.com/Alash-electronics/bluetoothWebApp.git
cd bluetoothWebApp/ble-controller
```

### Установка зависимостей

```bash
npm install
```

### Запуск dev сервера

```bash
npm run dev
```

Откройте https://localhost:5173/bluetoothWebApp/

> Dev сервер работает на HTTPS (требование Web Bluetooth API). Примите self-signed сертификат.

### Сборка для продакшена

```bash
# Web приложение
npm run build

# Android/iOS
CAPACITOR=true npm run build
npx cap sync
```

### Деплой на GitHub Pages

```bash
npm run deploy
```

### Открыть в нативных IDE

```bash
# Android Studio
npx cap open android

# Xcode
npx cap open ios
```

---

## 📁 Структура проекта

```
ble-controller/
├── src/
│   ├── components/              # React компоненты
│   │   ├── SplashScreen.tsx     # Splash экран (2 сек)
│   │   ├── DeviceSelection.tsx  # Главное меню
│   │   ├── JoystickPanel.tsx    # PS4 джойстики ⭐
│   │   ├── ControlPanel.tsx     # RC геймпад
│   │   ├── TerminalPanel.tsx    # Терминал
│   │   ├── SmartHomePanel.tsx   # Выбор комнаты
│   │   ├── SmartHomeRoomControl.tsx  # Управление комнатой
│   │   └── SettingsPanel.tsx    # Настройки
│   ├── services/                # Бизнес-логика
│   │   ├── bluetoothService.ts  # BLE коммуникация ⭐
│   │   ├── appSettings.ts       # Глобальные настройки
│   │   ├── localization.ts      # Переводы (ru/en/kk)
│   │   └── ...                  # Другие сервисы настроек
│   ├── hooks/
│   │   └── useFullscreen.ts     # Fullscreen для мобильных
│   └── App.tsx                  # Главный компонент
├── arduino-examples/            # Arduino скетчи ⭐
│   ├── Arduino UNO/             # Примеры для Uno/Nano
│   ├── ESP32_Not_checked/       # Примеры для ESP32
│   └── README.md                # Документация по примерам
├── android/                     # Capacitor Android
├── ios/                         # Capacitor iOS
├── public/                      # Статические файлы
├── vite.config.ts              # Конфигурация Vite
├── capacitor.config.ts         # Конфигурация Capacitor
├── package.json
├── CLAUDE.md                   # Документация для разработчиков ⭐
├── RELEASE.md                  # Инструкции по релизу
└── README.md                   # Этот файл
```

---

## 🤝 Вклад в проект

Мы приветствуем ваш вклад! Если вы хотите:
- 🐛 Сообщить об ошибке
- 💡 Предложить новую функцию
- 📝 Улучшить документацию
- 🔧 Добавить Arduino пример

Создавайте **Issue** или **Pull Request** на GitHub!

---

## 📄 Лицензия

MIT License - используйте свободно в личных и коммерческих проектах.

---

## 👨‍💻 Авторы

**Alash Electronics**
- GitHub: [@Alash-electronics](https://github.com/Alash-electronics)
- Библиотека моторов: [AlashMotorControlLite](https://github.com/Alash-electronics/AlashMotorControlLite)

Создано с помощью [Claude Code](https://claude.com/claude-code) 🤖

---

## 🔗 Полезные ссылки

- 🌐 **Web App:** https://alash-electronics.github.io/bluetoothWebApp/
- 📦 **Releases:** https://github.com/Alash-electronics/bluetoothWebApp/releases
- 📚 **Документация:** [CLAUDE.md](CLAUDE.md)
- 🔌 **Arduino примеры:** [arduino-examples/](arduino-examples/)
- 📱 **Bluefy (iOS):** https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055

---

<div align="center">

**⭐ Если проект вам понравился, поставьте звезду на GitHub! ⭐**

Made with ❤️ by Alash Electronics

</div>
