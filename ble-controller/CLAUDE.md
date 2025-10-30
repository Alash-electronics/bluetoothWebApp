# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BLE Controller is a universal React web application for controlling Bluetooth modules via the Web Bluetooth API. Supports HC-06, HC-05, HM-10, ESP32 and other BLE/Classic Bluetooth modules. The app features multiple UI modes (Terminal, RC Car Control, Joystick, Smart Home) with real-time Bluetooth communication, multi-language support (Russian, English, Kazakh), and persistent settings storage.

**Important:** The main application code is in the `ble-controller/` subdirectory. Always run commands from within this directory.

## Development Commands

```bash
# Navigate to project directory first
cd ble-controller

# Start development server with HTTPS (required for Web Bluetooth API)
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Lint code
npm run lint

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

**Note:** The dev server runs with HTTPS enabled via `@vitejs/plugin-basic-ssl` plugin (required for Web Bluetooth API). Access at `https://localhost:5173/` and accept the self-signed certificate warning.

## Tech Stack

- **React 19** with TypeScript and strict mode
- **Vite 7** for build tooling and HMR
- **Capacitor 7.4.4** for native iOS/Android deployment
- **@capacitor-community/bluetooth-le 7.2.0** for native BLE on mobile
- **Tailwind CSS 3** for styling
- **Web Bluetooth API** for BLE communication (web only)
- **localStorage** for persistent settings storage

## Architecture

### Core State Management Pattern

The app uses a **singleton service pattern** with React hooks for state synchronization:

1. **Services** (`src/services/`) are singleton classes that manage state and business logic
2. **Components** subscribe to service updates via callbacks and maintain local state
3. **Settings** persist to localStorage automatically through service methods

**Critical Pattern:** Components must both:
- Accept initial state via props from parent (App.tsx)
- Subscribe to service updates via `useEffect` to handle real-time changes

Example from TerminalPanel.tsx:
```typescript
const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);

// Update from props
useEffect(() => {
  setConnectionStatus(initialConnectionStatus);
}, [initialConnectionStatus]);

// Subscribe to service
useEffect(() => {
  bluetoothService.onConnectionStatusChange((status) => {
    setConnectionStatus(status);
  });
}, []);
```

### Bluetooth Service Architecture

**bluetoothService** (`src/services/bluetoothService.ts`) is the central singleton managing all BLE operations:

- **Connection States:** `'disconnected' | 'connecting' | 'connected'`
- **UUID Constants:**
  - Service: `0000ffe0-0000-1000-8000-00805f9b34fb`
  - Characteristic: `0000ffe1-0000-1000-8000-00805f9b34fb`
- **Callbacks:** Components register callbacks for data reception and status changes
- **State Propagation:** Service notifies all subscribers when connection status changes

### View Routing System

App.tsx manages view routing through a single `viewMode` state:

```
ViewMode = 'selection' | 'control' | 'joystick' | 'terminal' | 'smartHome' | 'smartHomeRoom'
```

- **selection:** DeviceSelection - entry screen with device type cards (auto-fullscreen)
- **control:** ControlPanel - gamepad-style RC control interface (landscape only)
- **joystick:** JoystickPanel - PS4-style dual joystick interface (landscape only)
- **terminal:** TerminalPanel - serial terminal with macro buttons (portrait only)
- **smartHome:** SmartHomePanel - room selection screen
- **smartHomeRoom:** SmartHomeRoomControl - individual room controls (AC, etc.)

Navigation flow:
1. SplashScreen (2 seconds) → DeviceSelection
2. User selects device type → corresponding view
3. Disconnect → automatically returns to DeviceSelection

**Orientation Constraints:**
- TerminalPanel blocks landscape mode on mobile (shows rotation overlay)
- ControlPanel and JoystickPanel block portrait mode on mobile (shows rotation overlay)
- Constraint applies only when screen width/height < 1024px
- Uses JavaScript-based detection with window.innerWidth/innerHeight, not CSS media queries

### Smart Home Architecture

Smart Home mode operates on a room-based hierarchy:

**Data Structure:**
```typescript
// Rooms (max 6)
RoomConfig { id, name, icon }

// Devices (6 default: LED, Window, Music, Door, Fan, AC)
SmartHomeDeviceConfig { id, label, onCommand, offCommand }

// Sensors (3 default: Motion, Gas, Rain)
SmartHomeSensorConfig { id, label, onMessage, offMessage }

// AC Control (centralized config)
SmartHomeACConfig {
  onCommand, offCommand,           // K/L
  heatCommand, coolCommand,         // H/C
  dryCommand, fanCommand,           // Y/N
  tempUpCommand, tempDownCommand,   // Z/V
  tempSetPrefix                     // T (e.g., "T24" for 24°C)
}
```

**Command Protocol:**
- All commands are **single alphanumeric characters** (A-Z, a-z, 0-9)
- Case-sensitive (e.g., 'L' = LED ON, 'l' = LED OFF)
- Sent directly via bluetoothService.sendData(command)
- No delimiters or terminators needed

**State Management:**
- Device states tracked locally in SmartHomeRoomControl (useState)
- Sensor states updated via bluetoothService data callbacks
- Configuration changes polled every 1000ms for live updates
- AC temperature range: 16-30°C with local state

### Settings Services Pattern

Each feature has its own settings service with localStorage persistence:

- **controlPanelSettings:** Control panel button configurations (gamepad-style RC mode)
- **buttonSettings:** Legacy button configurations (kept for compatibility)
- **macroSettings:** Terminal macro button commands
- **smartHomeSettings:** Smart home device/sensor/AC commands (single character per command)
- **roomSettings:** Smart home room configurations (max 6 rooms)
- **appSettings:** App-wide settings (vibration, theme, language)
- **localization:** Multi-language support (ru/en/kk) with observer pattern

All settings services follow this pattern:
```typescript
class SettingsService {
  private storageKey = 'keyName';

  get(): ConfigType[] {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : DEFAULT_VALUES;
  }

  save(config: ConfigType[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(config));
  }

  update(id: string, updates: Partial<ConfigType>): void {
    const items = this.get();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.save(items);
    }
  }
}

export const settingsInstance = new SettingsService();
```

**Important:** Smart home commands must be single characters (1 letter or digit) validated with `/[^a-zA-Z0-9]/g`

### Component Communication Patterns

**Parent → Child:** Props for initial state and callbacks
```typescript
<TerminalPanel
  connectionStatus={connectionStatus}
  onBack={() => setViewMode('selection')}
  onOpenSettings={() => setShowSettings(true)}
/>
```

**Service → Component:** Callbacks registered in useEffect
```typescript
useEffect(() => {
  bluetoothService.onConnectionStatusChange((status) => {
    setConnectionStatus(status);
  });
}, []);
```

**Settings Persistence:** Components poll settings services via intervals for real-time updates
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setDeviceConfigs(smartHomeSettings.getDevices());
    setSensorConfigs(smartHomeSettings.getSensors());
    setAcConfig(smartHomeSettings.getACConfig());
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**Configuration Lookups:** Use helper functions with fallbacks for dynamic labels
```typescript
const getDeviceConfig = (deviceId: string) => {
  return deviceConfigs.find(d => d.id === deviceId);
};

// In JSX
<span>{getDeviceConfig('led')?.label || 'LED'}</span>
```

## Important UI/UX Patterns

### Responsive Design and Mobile Optimization

**Tailwind Breakpoint Strategy:**
- Base styles apply to mobile portrait
- `landscape:` modifier for mobile landscape
- `sm:` modifier for desktop (≥640px)
- `sm:landscape:` for desktop landscape

Example: `className="h-8 landscape:h-3 sm:h-20 sm:landscape:h-20"`

**Mobile-Specific Optimizations:**
- SplashScreen logo reduced significantly on mobile (w-14 portrait, w-12 landscape)
- TerminalPanel header elements reduced by 50% in mobile landscape
- All interactive elements scaled appropriately for touch
- Text selection disabled globally with `select-none` class

### Orientation Lock Pattern

Components enforce orientation constraints using JavaScript (CSS media queries are unreliable):

```typescript
const [isLandscape, setIsLandscape] = useState(false);

useEffect(() => {
  const checkOrientation = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscapeNow = width > height && width < 1024;
    setIsLandscape(isLandscapeNow);
  };

  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  const timer = setTimeout(checkOrientation, 100);

  return () => {
    window.removeEventListener('resize', checkOrientation);
    window.removeEventListener('orientationchange', checkOrientation);
    clearTimeout(timer);
  };
}, []);

if (isLandscape) {
  return (
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center p-4 select-none">
      {/* Rotation overlay UI with back button */}
      <div className="text-center">
        <svg className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce">
          {/* Rotation icon */}
        </svg>
        <h2 className="text-white text-2xl font-bold mb-3">Поверните устройство</h2>
        <p className="text-gray-400 text-base mb-6">Terminal доступен только в вертикальном режиме</p>
        <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
          Вернуться на главную
        </button>
      </div>
    </div>
  );
}
```

**Key Points:**
- Threshold is 1024px (not 640px) - iPhone 14 Pro Max is 932px wide
- Must use both `resize` and `orientationchange` events
- Add 100ms timeout for Safari compatibility
- Use z-[9999] to ensure overlay is always on top
- **Always include a "Back to Home" button** on rotation overlays so users can exit without rotating device

### Connection Status Display

All panels show connection status with consistent visual language:
- 🔴 Red dot + "Отключен" (disconnected)
- 🟡 Yellow dot + "Подключение..." (connecting) with pulse animation
- 🟢 Green dot + "Подключен" (connected)

### Bluetooth Click Behavior

All Bluetooth status buttons are clickable:
- If connected: show confirm dialog to disconnect
- If disconnected: trigger connection flow
- Always provide vibration feedback via `appSettings.vibrate()`

### Modal Settings Panel

SettingsPanel is a full-screen modal overlay that appears over any view:
- Has a `mode` prop to show only relevant settings ('control' | 'terminal' | 'smartHome')
- When mode is specified, hides tabs and shows single settings section
- Settings auto-save on change via onChange handlers - no "Save" button needed
- Smart home settings include device names, sensor names, and single-character commands
- Input validation enforces constraints (e.g., maxLength={1} for command inputs)

### Viewport and Scrolling on Mobile

Components that should NOT scroll (ControlPanel, JoystickPanel, TerminalPanel) use specific patterns:

**For Capacitor (iOS/Android):**
```typescript
const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

useEffect(() => {
  const updateViewport = () => {
    setViewportHeight(window.innerHeight);
  };

  updateViewport();
  window.addEventListener('resize', updateViewport);
  window.addEventListener('orientationchange', updateViewport);

  return () => {
    window.removeEventListener('resize', updateViewport);
    window.removeEventListener('orientationchange', updateViewport);
  };
}, []);

// Container style
<div style={
  Capacitor.isNativePlatform()
    ? { height: `${viewportHeight}px`, width: '100vw', position: 'absolute', top: 0, left: 0 }
    : { height: '100vh', width: '100vw' }
}>
```

**Key Points:**
- JavaScript-calculated height is required for Capacitor (not CSS `100vh`)
- Use `position: absolute` on Capacitor, not `fixed`
- Update viewport height on `resize` and `orientationchange` events
- Set `overflow: hidden` on `document.body` and `document.documentElement` to prevent page scrolling
- Use `flex-shrink-0` on header/footer sections to prevent them from shrinking
- Use `flex-1` with `overflow-y-auto` on scrollable content areas (like TerminalPanel logs)

**TerminalPanel Auto-scroll:**
- Uses `scrollIntoView({ behavior: 'auto' })` for instant scrolling (not 'smooth')
- Has toggle button to enable/disable auto-scroll
- Auto-scroll state managed with `useState` and checked before scrolling

## Critical Implementation Notes

### Fullscreen API Integration

The `useFullscreen` hook (`src/hooks/useFullscreen.ts`) provides fullscreen functionality:

```typescript
const { toggleFullscreen } = useFullscreen();

// Hook automatically requests fullscreen on mobile devices after 500ms delay
// Use toggleFullscreen() to manually enter/exit fullscreen mode
```

**Hook Features:**
- Auto-detects mobile devices via user agent
- Auto-requests fullscreen on mobile after 500ms (allows user interaction first)
- Provides `toggleFullscreen()` function for manual control
- Handles errors gracefully

DeviceSelection automatically enters fullscreen mode on mount. All panels include GitHub and Fullscreen toggle buttons in the top bar.

### Vibration Feedback

Always call `appSettings.vibrate(30)` on button clicks for haptic feedback:
```typescript
const handleClick = () => {
  appSettings.vibrate(30);
  // ... rest of logic
};
```

Error vibration pattern: `appSettings.vibrate([50, 50, 50])`

### Multi-language Support

Use localization service for all user-facing text:
```typescript
import { localization } from '../services/localization';

// In component
<h1>{localization.t('terminal')}</h1>

// Subscribe to language changes
useEffect(() => {
  const unsubscribe = localization.subscribe(() => forceUpdate({}));
  return unsubscribe;
}, []);
```

### Web Bluetooth API Requirements

- Must run on HTTPS (or localhost for development)
- Only works in Chrome, Edge, Opera (NOT Firefox/Safari)
- User must explicitly grant Bluetooth permission via browser dialog
- Filters: `{ services: [UART_SERVICE_UUID] }` and `{ namePrefix: 'HM' }`

## File Organization

```
ble-controller/
├── src/
│   ├── components/          # React UI components
│   │   ├── SplashScreen.tsx          # Initial 2-second loading screen (mobile-optimized)
│   │   ├── DeviceSelection.tsx       # Main menu with device type cards (auto-fullscreen)
│   │   ├── ControlPanel.tsx          # RC car gamepad interface (landscape only)
│   │   ├── JoystickPanel.tsx         # PS4-style dual joystick interface (landscape only)
│   │   ├── TerminalPanel.tsx         # Serial terminal with macro buttons (portrait only)
│   │   ├── SmartHomePanel.tsx        # Room selection screen (up to 6 rooms)
│   │   ├── SmartHomeRoomControl.tsx  # Room device/sensor/AC controls (dynamic labels)
│   │   ├── ConnectionPanel.tsx       # Legacy connection UI
│   │   ├── DataPanel.tsx             # Legacy terminal UI
│   │   └── SettingsPanel.tsx         # Modal settings overlay (mode-aware)
│   ├── services/           # Business logic singletons with localStorage
│   │   ├── bluetoothService.ts      # Core BLE communication (UART over BLE)
│   │   ├── controlPanelSettings.ts  # Control panel button configs (gamepad mode)
│   │   ├── buttonSettings.ts        # Legacy button configs (compatibility)
│   │   ├── macroSettings.ts         # Terminal macro button commands
│   │   ├── smartHomeSettings.ts     # Smart home device/sensor/AC configs
│   │   ├── roomSettings.ts          # Smart home room management
│   │   ├── appSettings.ts           # App-wide settings (vibration, theme)
│   │   └── localization.ts          # i18n with observer pattern (ru/en/kk)
│   ├── hooks/              # React custom hooks
│   │   └── useFullscreen.ts         # Fullscreen API hook with mobile detection
│   └── App.tsx             # Root component with view routing (ViewMode state)
├── arduino-examples/       # Arduino sketch examples for HM-10 module
│   ├── terminal_basic/     # Basic echo example
│   ├── rc_car_control/     # RC car control example
│   ├── smart_home_basic/   # Smart home control example
│   └── README.md           # Hardware setup and wiring instructions
├── vite.config.ts          # Vite config with basicSsl plugin and base path
├── package.json            # Dependencies and scripts (includes gh-pages deploy)
└── CLAUDE.md               # This file
```

## JoystickPanel: Critical Event Handling Pattern

JoystickPanel requires **both native touch events AND React mouse events** to work on all platforms:

### Touch Events (Mobile)

Use **native addEventListener** with `{ passive: false }` to enable `preventDefault()`:

```typescript
// ❌ WRONG: React touch events are passive and can't preventDefault()
<circle onTouchStart={handleTouch} />

// ✅ CORRECT: Native events with passive: false
useEffect(() => {
  const element = elementRef.current;
  if (!element) return;

  const handler = (e: TouchEvent) => {
    e.preventDefault(); // This only works with passive: false
    // ... handle touch
  };

  element.addEventListener('touchstart', handler, { passive: false });
  return () => element.removeEventListener('touchstart', handler);
}, []);
```

**Critical: Synchronous Ref Updates**

When updating joystick position, ALWAYS update refs BEFORE setState:

```typescript
// ✅ CORRECT ORDER
leftJoystickPosRef.current = { x: normalizedX, y: normalizedY };  // 1. Update ref first
setLeftJoystickPos({ x: normalizedX, y: normalizedY });            // 2. Then update state
isDraggingLeftRef.current = true;                                   // 3. Update dragging ref
setIsDraggingLeft(true);                                            // 4. Then dragging state
```

This ensures useEffect reads the latest values synchronously, preventing "ghost movement" bugs where joystick sends old positions after release.

### Mouse Events (Desktop)

Add **React mouse handlers** directly in JSX:

```typescript
// Mouse handlers for desktop
<svg onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
  <circle ref={leftJoystickRef} onMouseDown={(e) => handleMouseDown(e, true)} />
  <circle ref={rightJoystickRef} onMouseDown={(e) => handleMouseDown(e, false)} />
</svg>
```

### Multi-Touch Support

Track touch identifiers to support simultaneous control of both joysticks:

```typescript
const leftTouchIdRef = useRef<number | null>(null);
const rightTouchIdRef = useRef<number | null>(null);

// In touchstart handler:
leftTouchIdRef.current = touch.identifier;

// In global touchend handler:
if (leftTouchIdRef.current === touch.identifier) {
  handleJoystickTouchEnd(true);
}
```

### Stop Command Throttling Prevention

Send stop commands immediately by bypassing the throttling interval:

```typescript
const handleJoystickTouchEnd = (isLeft: boolean) => {
  // Update refs synchronously
  isDraggingLeftRef.current = false;
  leftJoystickPosRef.current = { x: 0, y: 0 };

  // Send stop command immediately (bypasses 50ms throttle)
  const stopCommand = `J:50,50,50,50`;
  bluetoothService.sendData(stopCommand + '\n');
  lastCommandRef.current = stopCommand;
  lastSendTimeRef.current = Date.now();
};
```

## Common Pitfalls

1. **Forgetting to subscribe to service updates** - Components only receive props on mount, must subscribe for real-time updates
2. **Not handling all three connection states** - Always handle 'disconnected', 'connecting', 'connected'
3. **Missing vibration feedback** - Users expect haptic response on all interactions
4. **Hardcoded strings** - Always use localization.t() for user-facing text
5. **Using CSS for orientation locking** - CSS `landscape:` and `portrait:` media queries are unreliable; use JavaScript window.innerWidth/innerHeight detection instead
6. **Wrong orientation threshold** - Use 1024px, not 640px (iPhone 14 Pro Max is 932px wide)
7. **Hardcoded device/sensor labels** - Use `getDeviceConfig(id)?.label` instead of hardcoded strings in SmartHomeRoomControl
8. **Invalid smart home commands** - Commands must be single alphanumeric characters, validated with regex
9. **Missing polling intervals** - Settings changes require polling (1000ms) to reflect in UI
10. **Exceeding room limit** - Smart home supports maximum 6 rooms, enforce in UI
11. **Forgetting text selection disable** - Add `select-none` class to prevent copy/paste on mobile
12. **Using React touch events for joysticks** - React touch events are passive; use native addEventListener with `{ passive: false }` instead
13. **Updating state before refs in joystick handlers** - Always update refs BEFORE setState to ensure synchronous reads in useEffect
14. **Missing mouse events for desktop** - Joysticks need both touch (mobile) and mouse (desktop) event handlers

## Deployment

### Web Deployment (GitHub Pages)

The project deploys to GitHub Pages via the `gh-pages` package:

```bash
npm run deploy
```

This command:
1. Runs `npm run build` (via predeploy script)
2. Deploys the `dist/` folder to the `gh-pages` branch
3. Makes the app available at: **https://alash-electronics.github.io/bluetoothWebApp/**

**Configuration:**
- Base path is set to `/bluetoothWebApp/` in `vite.config.ts`
- Update `base` in `vite.config.ts` if deploying to a different subdirectory

### Mobile Deployment (iOS/Android)

The app uses **Capacitor** to deploy as native iOS and Android applications.

**Capacitor Configuration:**
- App ID: `com.alashelectronics.blecontroller`
- App Name: `Alashed BLE`
- Web directory: `dist`

**Build Commands:**

```bash
# 1. Build web assets for Capacitor (uses base: '/')
CAPACITOR=true npm run build

# 2. Sync with native platforms
npx cap sync              # Sync both iOS and Android
npx cap sync ios          # Sync iOS only
npx cap sync android      # Sync Android only

# 3. Open in native IDEs
npx cap open ios          # Opens Xcode
npx cap open android      # Opens Android Studio
```

**Android APK Build:**

```bash
# Requires Java 21 and Android SDK
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

**iOS Build:**

1. Open project: `npx cap open ios`
2. In Xcode: Product → Clean Build Folder (⇧⌘K)
3. Build: Product → Build (⌘B)
4. Connect iPhone via USB and run: Product → Run (⌘R)

**Important Build Notes:**
- Use `CAPACITOR=true` environment variable when building for mobile to set correct base path
- Service Worker is automatically disabled on Capacitor (checks `window.Capacitor`)
- Always run `npx cap sync` after building web assets to update native projects
- Android requires Java 21 (not 17)
- Version numbers are in `android/app/build.gradle` (versionCode and versionName)

**App Icons:**
- **iOS icons:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (15 sizes from 20pt to 1024pt with @1x, @2x, @3x variants)
- **Android icons:** `android/app/src/main/res/mipmap-*dpi/` (ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png in 5 densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Source icons: `ios/App/App/Assets.xcassets/AppIcon.appiconset/Ios.png` (iOS) and `Android.png` (Android)
- Web icons: `public/icon-192.png`, `public/icon-512.png`, `public/favicon.png`

**Permissions:**
- Android Bluetooth permissions are in `android/app/src/main/AndroidManifest.xml`
- Required: BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
- iOS permissions are auto-handled by Capacitor Bluetooth LE plugin

## Arduino Examples

The `arduino-examples/` directory contains reference implementations for HM-10 modules:

- **terminal_basic/** - Echo example for testing terminal mode
- **rc_car_control/** - Motor control example for RC car mode
- **smart_home_basic/** - Relay/LED control example for smart home mode
- **Joystick_control/** - Vectored dual-joystick control with AlashMotorControlLite library
- **README.md** - Hardware wiring diagrams and setup instructions

**Key Details:**
- Examples use SoftwareSerial (pins 10/11 by default)
- HM-10 RXD requires 3.3V input (use voltage divider on 5V Arduinos)
- Default baud rate: 9600
- Commands are single characters matching the web app's protocol

These examples are useful references when debugging communication issues or implementing new device features.

### Joystick Protocol and Vectored Control

JoystickPanel sends joystick data in the format: `J:LY,LX,RY,RX\n`

**Values:**
- Each axis: 0-100 (50 = center)
- LY = Left joystick Y (0=down, 100=up)
- LX = Left joystick X (0=left, 100=right)
- RY = Right joystick Y (0=down, 100=up)
- RX = Right joystick X (0=left, 100=right)

**Example commands:**
- `J:50,50,50,50` - Both joysticks centered (robot stopped)
- `J:100,50,50,50` - Left joystick pushed up (forward)
- `J:0,50,50,50` - Left joystick pushed down (backward)
- `J:50,50,50,100` - Right joystick pushed right (turn right)

**Throttling:**
- Commands sent every 50ms (20 Hz) when joystick is moving
- Stop command sent immediately when joystick released (bypasses throttle)

**Arduino Implementation (Arcade Drive Mixing):**

The Joystick_control example uses **vectored control** with left joystick for throttle and right joystick X for steering:

```cpp
int throttle = LY - 50;  // -50..50
int steering = RX - 50;  // -50..50

// Apply deadzone (±10)
if (abs(throttle) < 10) throttle = 0;
if (abs(steering) < 10) steering = 0;

// Scale with MIN_MOTOR_SPEED=50, MAX_MOTOR_SPEED=100
// (AlashMotorControlLite library accepts -100..100)

// Arcade drive mixing
float leftSpeed = throttle + steering;
float rightSpeed = throttle - steering;

// Normalize if exceeds range
float maxMagnitude = max(abs(leftSpeed), abs(rightSpeed));
if (maxMagnitude > 100) {
  leftSpeed = leftSpeed / maxMagnitude * 100;
  rightSpeed = rightSpeed / maxMagnitude * 100;
}

// Apply to motors
motorLeft.setSpeed(leftSpeed);   // -100..100
motorRight.setSpeed(rightSpeed); // -100..100
```

**Critical:** AlashMotorControlLite library uses percentage values (-100 to 100), NOT PWM values (0-255). MIN_MOTOR_SPEED=50 is the minimum speed where the robot actually starts moving.

## Browser Compatibility

Web Bluetooth API support:
- ✅ Chrome 56+ (desktop & Android)
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (no Web Bluetooth support)
- ❌ Safari (no Web Bluetooth support)
- ❌ iOS (no Web Bluetooth support)
