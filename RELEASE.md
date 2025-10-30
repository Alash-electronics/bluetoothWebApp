# 📱 Создание релиза Alashed BLE Controller v1.7

## APK готов к публикации

**Файл:** `/Users/beksultanajten/bluetoothWebApp/Alashed-BLE-v1.7.apk`
**Размер:** 4.0 MB
**Версия:** v1.7 (versionCode 8)

---

## 🚀 Способ 1: Через Web интерфейс GitHub (Рекомендуется)

### Шаг 1: Создайте новый релиз

1. Перейдите на страницу создания релиза:
   ```
   https://github.com/Alash-electronics/bluetoothWebApp/releases/new
   ```

2. Или через интерфейс:
   - Откройте https://github.com/Alash-electronics/bluetoothWebApp
   - Нажмите **Releases** (справа)
   - Нажмите **Create a new release**

### Шаг 2: Заполните форму

**Choose a tag:**
```
v1.7
```
(нажмите "Create new tag: v1.7 on publish")

**Release title:**
```
Alashed BLE Controller v1.7
```

**Description:** (скопируйте текст ниже)

```markdown
# 🎮 Alashed BLE Controller v1.7

Universal Bluetooth Low Energy controller for Arduino, ESP32, and other BLE modules.

## ✨ Features

### 4 Control Modes
- **🕹️ Joystick Panel** - PS4-style dual joystick control with vectored arcade drive mixing
  - Left joystick Y → throttle (forward/backward)
  - Right joystick X → steering (left/right)
  - Supports physical USB gamepads (PS4, Xbox)
  - Works with touch (mobile) and mouse (desktop)

- **🚗 RC Car Control** - Gamepad-style WASD control with 8 customizable buttons

- **💻 Terminal Mode** - Serial terminal with 10 customizable macro buttons

- **🏠 Smart Home** - Multi-room device control
  - Up to 6 rooms with independent control
  - 6 devices per room (LED, window, music, door, fan, AC)
  - 3 sensors (motion, gas, rain)
  - AC control with modes and temperature (16-30°C)

### Platform Support
- 🌐 **Web App:** https://alash-electronics.github.io/bluetoothWebApp/
- 📱 **Android:** Download APK below
- 🍎 **iOS:** Build from source with `npx cap open ios`

### Hardware Support
- HM-10, HC-05, HC-06 Bluetooth modules
- ESP32 built-in BLE
- Arduino Uno, Nano, Mega
- Custom BLE devices

## 🔧 What's New in v1.7

### Major Fixes
- ✅ **Fixed joystick control on mobile devices**
  - Implemented native touch events with `{ passive: false }`
  - Added synchronous ref updates to prevent ghost movement
  - Robot now stops immediately when joystick released

- ✅ **Added desktop mouse support for joysticks**
  - Joysticks now work with mouse on laptops/desktops
  - Seamless switching between touch and mouse input

### Improvements
- ✅ **Vectored arcade drive control**
  - Left joystick Y for throttle
  - Right joystick X for steering
  - Smooth arcade drive mixing algorithm

- ✅ **AlashMotorControlLite library support**
  - Proper MIN_MOTOR_SPEED = 50 (minimum for movement)
  - MAX_MOTOR_SPEED = 100 (percentage-based control)
  - Automatic speed normalization

### Documentation
- ✅ Comprehensive Arduino examples documentation
- ✅ Detailed joystick protocol specification
- ✅ Motor control library usage guide
- ✅ Troubleshooting sections

## 📥 Installation

### Android
1. Download `Alashed-BLE-v1.7.apk` below
2. Enable "Install from Unknown Sources" in Android settings
3. Open APK and install
4. Grant Bluetooth and Location permissions when prompted

### Web App
Visit https://alash-electronics.github.io/bluetoothWebApp/ in Chrome, Edge, or Opera.

## ⚙️ Requirements

### Android
- Android 7.0+ (API level 24+)
- Bluetooth Low Energy support
- Location permission (required for BLE scanning)

### Web
- Chrome 56+, Edge 79+, or Opera 43+
- HTTPS connection (automatic on GitHub Pages)
- Bluetooth enabled

## 🔌 Arduino Examples

The repository includes ready-to-use Arduino sketches:

### Arduino + HM-10
- **terminal_basic** - Echo terminal example
- **rc_car_control** - WASD RC car control
- **smart_home_basic** - Smart home (Uno, 2 rooms)
- **smart_home_mega** - Smart home (MEGA, 6 rooms)
- **Joystick_control** - Vectored dual-joystick control

### ESP32 (Built-in BLE)
- **esp32_terminal_basic** - BLE terminal
- **esp32_rc_car** - RC car with L298N motor driver
- **esp32_smart_home** - Smart home automation

**Full documentation:** [arduino-examples/README.md](https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples)

## 🤖 Built With
- React 19 + TypeScript
- Capacitor 7.4.4
- @capacitor-community/bluetooth-le 7.2.0
- Tailwind CSS 3
- Vite 7

## 🔗 Links
- **GitHub Repository:** https://github.com/Alash-electronics/bluetoothWebApp
- **Web App:** https://alash-electronics.github.io/bluetoothWebApp/
- **Arduino Examples:** https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples
- **Motor Library:** https://github.com/Alash-electronics/AlashMotorControlLite

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Шаг 3: Загрузите APK

1. В разделе **"Attach binaries by dropping them here or selecting them"**
2. Перетащите файл: `/Users/beksultanajten/bluetoothWebApp/Alashed-BLE-v1.7.apk`
3. Или нажмите кнопку и выберите файл

### Шаг 4: Опубликуйте

1. Убедитесь, что галочка **"Set as the latest release"** установлена
2. Нажмите **"Publish release"**

---

## 🚀 Способ 2: Через GitHub CLI (Альтернатива)

Если у вас установлен GitHub CLI:

```bash
cd /Users/beksultanajten/bluetoothWebApp

gh release create v1.7 \
  Alashed-BLE-v1.7.apk \
  --title "Alashed BLE Controller v1.7" \
  --notes-file RELEASE_NOTES.md
```

### Установка GitHub CLI (если нужно):

```bash
brew install gh
gh auth login
```

---

## ✅ После публикации релиза

APK будет доступен по ссылкам:

- **Latest release:** https://github.com/Alash-electronics/bluetoothWebApp/releases/latest
- **Direct download:** https://github.com/Alash-electronics/bluetoothWebApp/releases/download/v1.7/Alashed-BLE-v1.7.apk
- **All releases:** https://github.com/Alash-electronics/bluetoothWebApp/releases

### Проверьте ссылки в README

Ссылка в README.md уже настроена на:
```
https://github.com/Alash-electronics/bluetoothWebApp/releases/latest
```

Она автоматически будет вести на последний релиз! 🎉

---

## 📝 Changelog для следующих версий

### v1.7 (текущая)
- Fixed joystick touch events on mobile
- Added desktop mouse support for joysticks
- Vectored arcade drive control
- AlashMotorControlLite library support
- Comprehensive documentation updates

### Планы на v1.8
- [ ] Signed release APK
- [ ] Play Store publication
- [ ] More Arduino examples
- [ ] Custom button mapping in UI
- [ ] Bluetooth Classic support (HC-05/HC-06)

---

**Alash Electronics**
https://github.com/Alash-electronics
