# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HM-10 Bluetooth Controller is a React web application for controlling HM-10 Bluetooth Low Energy modules via the Web Bluetooth API. The app features multiple UI modes (Terminal, RC Car Control, Smart Home) with real-time Bluetooth communication, multi-language support (Russian, English, Kazakh), and persistent settings storage.

## Development Commands

```bash
# Start development server (http://localhost:5173/)
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Lint code
npm run lint

# Preview production build locally
npm run preview
```

## Tech Stack

- **React 19** with TypeScript and strict mode
- **Vite 7** for build tooling and HMR
- **Tailwind CSS 3** for styling
- **Web Bluetooth API** for BLE communication
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
ViewMode = 'selection' | 'control' | 'terminal' | 'smartHome' | 'smartHomeRoom'
```

- **selection:** DeviceSelection - entry screen with device type cards
- **control:** ControlPanel - gamepad-style RC control interface
- **terminal:** TerminalPanel - serial terminal with macro buttons
- **smartHome:** SmartHomePanel - room selection screen
- **smartHomeRoom:** SmartHomeRoomControl - individual room controls (AC, etc.)

Navigation flow:
1. SplashScreen (2 seconds) → DeviceSelection
2. User selects device type → corresponding view
3. Disconnect → automatically returns to DeviceSelection

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

- **buttonSettingsService:** Control panel button configurations (RC car mode)
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

## Critical Implementation Notes

### DO NOT modify TerminalPanel.tsx

TerminalPanel has been fully implemented and tested. It includes:
- Logo in top bar (h-16)
- Back arrow and settings gear icons
- Bluetooth status with real-time updates
- Macro buttons with customizable commands
- Log display with color-coded message types
- No bottom logo (removed to avoid text overlap)

When working on other views, avoid touching TerminalPanel.tsx.

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
src/
├── components/          # React UI components
│   ├── SplashScreen.tsx          # Initial 2-second loading screen
│   ├── DeviceSelection.tsx       # Main menu with device type cards (Terminal/RC/Smart Home)
│   ├── ControlPanel.tsx          # RC car gamepad interface
│   ├── TerminalPanel.tsx         # Serial terminal with macro buttons (DO NOT MODIFY)
│   ├── SmartHomePanel.tsx        # Room selection screen (up to 6 rooms)
│   ├── SmartHomeRoomControl.tsx  # Room device/sensor/AC controls (dynamic labels)
│   ├── ConnectionPanel.tsx       # Legacy connection UI
│   ├── DataPanel.tsx             # Legacy terminal UI
│   └── SettingsPanel.tsx         # Modal settings overlay (mode-aware)
├── services/           # Business logic singletons with localStorage
│   ├── bluetoothService.ts      # Core BLE communication (HM-10 UART)
│   ├── buttonSettings.ts        # Control panel button configs
│   ├── macroSettings.ts         # Terminal macro button commands
│   ├── smartHomeSettings.ts     # Smart home device/sensor/AC configs
│   ├── roomSettings.ts          # Smart home room management
│   ├── appSettings.ts           # App-wide settings (vibration, theme)
│   └── localization.ts          # i18n with observer pattern (ru/en/kk)
└── App.tsx             # Root component with view routing (ViewMode state)
```

## Common Pitfalls

1. **Forgetting to subscribe to service updates** - Components only receive props on mount, must subscribe for real-time updates
2. **Not handling all three connection states** - Always handle 'disconnected', 'connecting', 'connected'
3. **Missing vibration feedback** - Users expect haptic response on all interactions
4. **Hardcoded strings** - Always use localization.t() for user-facing text
5. **Modifying TerminalPanel** - This component is complete and should not be changed
6. **Hardcoded device/sensor labels** - Use `getDeviceConfig(id)?.label` instead of hardcoded strings in SmartHomeRoomControl
7. **Invalid smart home commands** - Commands must be single alphanumeric characters, validated with regex
8. **Missing polling intervals** - Settings changes require polling (1000ms) to reflect in UI
9. **Exceeding room limit** - Smart home supports maximum 6 rooms, enforce in UI

## Browser Compatibility

Web Bluetooth API support:
- ✅ Chrome 56+ (desktop & Android)
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (no Web Bluetooth support)
- ❌ Safari (no Web Bluetooth support)
- ❌ iOS (no Web Bluetooth support)
